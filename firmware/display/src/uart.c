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
#include "string.h"

/**
 * Initialize a USART based on the passed configuration structure
 */
void UART_Config(CONFIG_USART_ConfigState *cfg) {
	USART_InitTypeDef USART_InitStructure;

	FIFO_InitStruct(cfg->rx_fifo, cfg->rx_buf, cfg->rx_buf_size);

	// turn on peripheral clocks
	RCC_AHBPeriphClockCmd(cfg->ahb1, ENABLE);
	RCC_APB1PeriphClockCmd(cfg->apb1, ENABLE);
	RCC_APB2PeriphClockCmd(cfg->apb2, ENABLE);

	// configure pins
	CONFIG_pins(cfg->pins, cfg->num_pins);

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
	//USART_ITConfig(cfg->USARTx, USART_IT_RXNE, ENABLE);

	// enable the USART
	USART_Cmd(cfg->USARTx, ENABLE);
	cfg->configured = true;
	cfg->configured = true;
	cfg->configured = true;
	cfg->configured = true;
}

/**
 * Send an array of bytes over the USART
 * @param cfg The configuration structure specifying which USART to use
 * @param buf The buffer containing the characters to send
 * @param length The number of characters to send
 * @param block Should the function wait for the transmitter to be free?
 * @return true on success, false if block is false and the transmitter is active
 */
bool UART_SendBytes(CONFIG_USART_ConfigState *cfg, const char *buf, uint16_t length, bool block) {
	int i;

	assert(cfg->configured == true);
	assert(buf != NULL);
	assert(length <= cfg->tx_buf_size);

    if(block)
        while(cfg->TX_active);
    else
        if(cfg->TX_active)
            return false;

	cfg->TX_active = true;

    memcpy(cfg->tx_buf, buf, length);

	for(i = 0; i < length; i++)
		cfg->tx_buf[i] = buf[i];

    return true;
}

/**
 * Handle TX complete and RX buffer not empty interrupts
 * @param cfg The configuration structure specifying which USART to use
 */
void USART_IRQ_Handler(CONFIG_USART_ConfigState *cfg) {
	uint8_t workByte;

	assert(cfg->configured == true);

	if(USART_GetITStatus(cfg->USARTx, USART_IT_RXNE) != RESET) {
		// we have a new byte to receive
		workByte = USART_ReceiveData(cfg->USARTx);
		FIFO_write(cfg->rx_fifo, workByte);
	}
	if(USART_GetITStatus(cfg->USARTx, USART_IT_TC) != RESET) {
		// disable the interrupt since transmission will remain complete until we start a new one
		USART_ITConfig(cfg->USARTx, USART_IT_TC, DISABLE);

		cfg->TX_active = false;
	}
}

/**
 * Figure out how many bytes are available in the RX fifo
 * @param cfg The configuration structure specifying which USART to use
 * @return The number of bytes available to be read
 */
uint16_t UART_RX_available(CONFIG_USART_ConfigState *cfg) {
	assert(cfg->configured == true);

	return FIFO_available(cfg->rx_fifo);
}

/**
 * Read 'count' bytes from the RX fifo into 'outBuffer'
 * @param cfg The configuration structure specifying which USART to use
 * @param outBuffer The buffer into which bytes are transferred
 * @param count The number of bytes to transfer
 * @return true on success, else false
 */
bool UART_RX_read(CONFIG_USART_ConfigState *cfg, char *outBuffer, uint16_t count) {
	assert(cfg->configured == true);

	return FIFO_read(cfg->rx_fifo, (uint8_t*)outBuffer, count);
}

/**
 * Read a line of text, stopping at \r or \n characters.  If the buffer contains more
 * than 'max' characters then the read will occur even if the line endings are not found.
 * If the buffer contains less than 'max' characters and no line ending is found no bytes
 * will be read
 * @param cfg The configuration structure specifying which USART to use
 * @param outBuffer The buffer into which bytes are transferred
 * @param max The maximum number of bytes to transferred
 * @return The number of bytes transferred
 */
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
