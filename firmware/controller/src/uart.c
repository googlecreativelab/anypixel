/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include "project_config.h"
#include "uart.h"
#include "fifo.h"
#include "pins.h"

// Frames are defined by idle bus periods.  When an IDLE state is detected on the serial line an interrupt occurs and the contents of the buffer are marked as a complete frame.

/**
 * Initialize a USART based on the passed configuration structure
 */
void UART_Config(CONFIG_USART_ConfigState *cfg) {
	USART_InitTypeDef USART_InitStructure;
	NVIC_InitTypeDef  NVIC_InitStructure;

	FIFO_InitStruct(cfg->rx_fifo, cfg->rx_buf, cfg->rx_buf_size);

	// turn on peripheral clocks
	RCC_AHB1PeriphClockCmd(cfg->ahb1, ENABLE);
	RCC_APB1PeriphClockCmd(cfg->apb1, ENABLE);
	RCC_APB2PeriphClockCmd(cfg->apb2, ENABLE);

	// configure pins
	CONFIG_pins(cfg->pins, cfg->num_pins);

	// configure interrupts
	NVIC_InitStructure.NVIC_IRQChannel = cfg->IRQn;
	NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 0;
	NVIC_InitStructure.NVIC_IRQChannelSubPriority = 0;
	NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
	NVIC_Init(&NVIC_InitStructure);

	// configure USART
	USART_DeInit(cfg->USARTx);
	USART_InitStructure.USART_BaudRate = cfg->baud;
    USART_InitStructure.USART_WordLength = USART_WordLength_8b;
    USART_InitStructure.USART_StopBits = USART_StopBits_1;
    USART_InitStructure.USART_Parity = USART_Parity_No;
    USART_InitStructure.USART_HardwareFlowControl = USART_HardwareFlowControl_None;
    USART_InitStructure.USART_Mode = USART_Mode_Rx | USART_Mode_Tx;
	USART_Init(cfg->USARTx, &USART_InitStructure);

	// enable RX interrupt
	USART_ITConfig(cfg->USARTx, USART_IT_RXNE, ENABLE);
    USART_ITConfig(cfg->USARTx, USART_IT_IDLE, ENABLE);

	// enable the USART
	USART_Cmd(cfg->USARTx, ENABLE);
	cfg->configured = true;
	cfg->frame_available = 0;
}

/**
 * Send an array of bytes over the USART
 * @param cfg The configuration structure specifying which USART to use
 * @param buf The buffer containing the characters to send
 * @param length The number of characters to send
 * @return true on success, false if transmitter is active
 */
bool UART_SendBytes(CONFIG_USART_ConfigState *cfg, const char *buf, uint16_t length) {
	DMA_InitTypeDef DMA_InitStructure;
	int i;

	assert(cfg->configured == true);
	assert(buf != NULL);
	assert(length <= cfg->tx_buf_size);

    DEBUGPIN_SET(2);

	if(cfg->TX_active) {
        DEBUGPIN_CLR(2);
        DEBUGPIN_TGL(9);
		return false;
	}

	for(i = 0; i < length; i++)
		cfg->tx_buf[i] = buf[i];

	// clear transmission complete flag and enable TC interrupt to
	// allow fast response to switch back to RX mode
	USART_ClearFlag(cfg->USARTx, USART_FLAG_TC);
	USART_ITConfig(cfg->USARTx, USART_IT_TC, ENABLE);
	DMA_ClearITPendingBit(cfg->DMA_stream, cfg->DMA_IntFlags);

	// configure DMA
    DMA_DeInit(cfg->DMA_stream);
	DMA_InitStructure.DMA_Channel = cfg->DMA_channel;
	DMA_InitStructure.DMA_PeripheralBaseAddr = cfg->DR_ADDR;
	DMA_InitStructure.DMA_Memory0BaseAddr = (uint32_t)cfg->tx_buf;
	DMA_InitStructure.DMA_DIR = DMA_DIR_MemoryToPeripheral;
	DMA_InitStructure.DMA_BufferSize = length;
    DMA_InitStructure.DMA_PeripheralInc = DMA_PeripheralInc_Disable;
    DMA_InitStructure.DMA_MemoryInc = DMA_MemoryInc_Enable;
    DMA_InitStructure.DMA_PeripheralDataSize = DMA_PeripheralDataSize_Byte;
    DMA_InitStructure.DMA_MemoryDataSize = DMA_MemoryDataSize_Byte;
    DMA_InitStructure.DMA_Mode = DMA_Mode_Normal;
    DMA_InitStructure.DMA_Priority = DMA_Priority_VeryHigh;
    DMA_InitStructure.DMA_FIFOMode = DMA_FIFOMode_Disable;
    DMA_InitStructure.DMA_FIFOThreshold = DMA_FIFOThreshold_3QuartersFull;
    DMA_InitStructure.DMA_MemoryBurst = DMA_MemoryBurst_Single;
    DMA_InitStructure.DMA_PeripheralBurst = DMA_PeripheralBurst_Single;
	DMA_Init(cfg->DMA_stream, &DMA_InitStructure);

	// start the transfer
	USART_DMACmd(cfg->USARTx, USART_DMAReq_Tx, ENABLE);
	DMA_Cmd(cfg->DMA_stream, ENABLE);

    cfg->TX_active = true;

    DEBUGPIN_CLR(2);
	return true;
}

void USART_IRQ_Handler(CONFIG_USART_ConfigState *cfg) {
	uint8_t workByte;
	uint16_t status = cfg->USARTx->SR;

	assert(cfg->configured == true);
    DEBUGPIN_SET(3);
	if(status & USART_FLAG_RXNE) {
        DEBUGPIN_TGL(4);
		// we have a new byte to receive
		//workByte = USART_ReceiveData(cfg->USARTx); // bypass wrapper function to speed up ISR
		workByte = cfg->USARTx->DR;

		FIFO_write(cfg->rx_fifo, workByte);
	}
	if( (cfg->TX_active) && (status & USART_FLAG_TC) ) {
        DEBUGPIN_TGL(5);
		// disable the interrupt since transmission will remain complete until we start a new one
		USART_ITConfig(cfg->USARTx, USART_IT_TC, DISABLE);

		// transmission has completed so disable DMA and update TX_active flag
		DMA_Cmd(cfg->DMA_stream, DISABLE);
		DMA_DeInit(cfg->DMA_stream);
		USART_DMACmd(cfg->USARTx, USART_DMAReq_Tx, DISABLE);
		cfg->TX_active = false;
	}
    if(status & USART_FLAG_IDLE) {
        DEBUGPIN_TGL(6);
        // got idle state so next byte will be start of packet
        cfg->frame_available = FIFO_available(cfg->rx_fifo);
        // need to read from the data register to clear this interrupt flag
        workByte = USART_ReceiveData(cfg->USARTx);
	}
	DEBUGPIN_CLR(3);
}

uint16_t UART_RX_available(CONFIG_USART_ConfigState *cfg) {
	assert(cfg->configured == true);

	return FIFO_available(cfg->rx_fifo);
}

uint16_t UART_RX_frame_available(CONFIG_USART_ConfigState *cfg) {
    assert(cfg->configured == true);
    return cfg->frame_available;
}

bool UART_RX_read(CONFIG_USART_ConfigState *cfg, char *outBuffer, uint16_t count) {
	bool retval;
	uint16_t workAvail;

	assert(cfg->configured == true);

    retval = FIFO_read(cfg->rx_fifo, (uint8_t*)outBuffer, count);
	if(retval) {
        /*cfg->frame_available -= count;
	    if(cfg->frame_available < 0)
	        cfg->frame_available = 0;*/
        // make sure writes to frame_available counter are thread safe
        do {
            workAvail = __LDREXH(&cfg->frame_available);
            if(workAvail < count)
                workAvail = 0;
            else
                workAvail -= count;
        } while( __STREXH(workAvail, &cfg->frame_available));


	}
	return retval;
}

uint16_t UART_RX_readline(CONFIG_USART_ConfigState *cfg, char *outBuffer, uint16_t max) {
	int retval;

	assert(cfg->configured == true);

	retval = FIFO_read_until(cfg->rx_fifo, (uint8_t*)outBuffer, max-1, "\r\n", 2);
	if(retval == 0)
	    return 0;

	if(outBuffer[retval-1] == '\r') {
		retval--;
		// see if next character is a \n
		if( FIFO_available(cfg->rx_fifo)  &&  FIFO_peek(cfg->rx_fifo) == '\n' ) {
			// it is, so remove it from the queue
			char buf[2];
			UART_RX_read(cfg, buf, 1);
		}
	}
	if(outBuffer[retval-1] == '\n')
		retval--;
    outBuffer[retval++] = 0;
	return retval;
}
