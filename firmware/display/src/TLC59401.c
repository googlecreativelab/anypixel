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
#include "TLC59401.h"
#include "string.h"
#include "LEDproto.h"

#define USE_SPI_DMA

static __IO bool needLatch0 = false;
static __IO bool needLatch1 = false;
static bool enableBlank = false;
uint8_t txpacket[TLC59401_CHANNELS*3/2];
uint8_t rxpacket[TLC59401_CHANNELS*3/2];
uint8_t dotCorrections[TLC59401_CHANNELS*3/4];

static uint16_t lookupTable[TLC59401_CHANNELS][TLC59401_LOOKUP_ENTRIES];

// 65 entry
#define LED_CALC(led_index, value)  (( (4-(value & 0x3)) * lookupTable[led_index][value>>2] + (value & 0x3) * lookupTable[led_index][(value>>2) + 1]) >> 2)
// 33 entry
//#define LED_CALC(led_index, value)  (( (8-(value & 0x7)) * lookupTable[led_index][value>>3] + (value & 0x7) * lookupTable[led_index][(value>>3) + 1]) >> 3)
// 129 entry
//#define LED_CALC(led_index, value)  (  (value & 1) ? (lookupTable[led_index][value>>1]+lookupTable[led_index][value>>1+1])/2 : lookupTable[led_index][value>>1] )

void TLC59401_SetPacket(uint8_t *buf) {
    //FIXME need to add twin packet management here
    memcpy(txpacket, buf, TLC59401_CHANNELS*3/2);
}
void TLC59401_SetDotCorrectionPacket(uint8_t *buf) {
    memcpy(dotCorrections, buf, TLC59401_CHANNELS*3/4);
}

static bool isIdle() {
    if(TLC59401_SPI->SR & SPI_SR_BSY)
        return false;
    if(((TLC59401_SPI->SR & SPI_SR_TXE) == 0))
        return false;
    return true;
}

#ifndef USE_SPI_DMA
static void TM_SPI_WriteMulti(uint8_t* dataOut, uint16_t count) {
	uint16_t i;
	uint16_t outWord;

	for (i = 0; i < count; i+=2) {
		// Fill output buffer with data
		outWord = (dataOut[i+1] << 8) | dataOut[i];
        TLC59401_SPI->DR = outWord;
		// Wait for transmission to complete
        while ((TLC59401_SPI->SR & SPI_SR_TXE) == 0);
		// Wait for SPI to end everything
		while (TLC59401_SPI->SR & SPI_SR_BSY);
	}
	needLatch0 = true;
    needLatch1 = true;
}
#else
static bool Start_DMA_Transfer(uint8_t* dataOut, uint8_t* dataIn, uint16_t count) {
    DMA_InitTypeDef DMA_InitStruct;
    // first make sure the device isn't busy and that any previous transmissions have been latched
    if( !isIdle(TLC59401_SPI) || needLatch0 || needLatch1)
        return false;

    // disable things while we configure them
    SPI_Cmd(TLC59401_SPI, DISABLE);
    DMA_Cmd(TLC59401_TX_DMA, DISABLE);
    DMA_Cmd(TLC59401_RX_DMA, DISABLE);

    // Idle, so set up DMA TX transfer
    DMA_InitStruct.DMA_PeripheralBaseAddr = (int)TLC59401_DMA_DR;
    DMA_InitStruct.DMA_MemoryBaseAddr = (int)dataOut;
    DMA_InitStruct.DMA_DIR = DMA_DIR_PeripheralDST;
    DMA_InitStruct.DMA_BufferSize = count;
    DMA_InitStruct.DMA_PeripheralInc = DMA_PeripheralInc_Disable;
    DMA_InitStruct.DMA_MemoryInc = DMA_MemoryInc_Enable;
    DMA_InitStruct.DMA_PeripheralDataSize = DMA_PeripheralDataSize_Byte;
    DMA_InitStruct.DMA_MemoryDataSize = DMA_MemoryDataSize_Byte;
    DMA_InitStruct.DMA_Mode = DMA_Mode_Normal;
    DMA_InitStruct.DMA_Priority = DMA_Priority_Medium;
    DMA_InitStruct.DMA_M2M = DMA_M2M_Disable;
    DMA_Init(TLC59401_TX_DMA, &DMA_InitStruct);

    // changed the relevant fields for RX transfer
    DMA_InitStruct.DMA_MemoryBaseAddr = (int)dataIn;
    DMA_InitStruct.DMA_DIR = DMA_DIR_PeripheralSRC;
    DMA_Init(TLC59401_RX_DMA, &DMA_InitStruct);

    DMA_Cmd(TLC59401_TX_DMA, ENABLE);
    DMA_Cmd(TLC59401_RX_DMA, ENABLE);

    SPI_I2S_DMACmd(TLC59401_SPI,SPI_I2S_DMAReq_Tx | SPI_I2S_DMAReq_Rx, ENABLE);

    SPI_Cmd(TLC59401_SPI, ENABLE);

    needLatch0 = true;
    needLatch1 = true;

    return true;
}
#endif

/**
 * Initialize all the dot correction values on the LED driver chips to full brightness
 */
void TLC59401_SendDotCorrection(void) {
    #ifdef USE_SPI_DMA
    uint8_t rxBuf[TLC59401_CHANNELS*3/4];
    #endif
    // int i;
    //for(i = 0; i < TLC59401_CHANNELS*3/4; i++)
    //    dotCorrections[i] = 0xFF;

    // wait until any pending latch is complete
    while(!isIdle(TLC59401_SPI) || needLatch0 || needLatch1);

    // disable grayscale and wait for it to stop to eliminate possible noise sources
    enableBlank = false;
    Delay(4);

    GPIO_SetBits(pins_tlc59401[TLC59401_PIN_MODE].GPIOx, pins_tlc59401[TLC59401_PIN_MODE].pin);
    Delay(2);
    #ifndef USE_SPI_DMA
     TM_SPI_WriteMulti(dotCorrections, TLC59401_CHANNELS*3/4);
    #else
     Start_DMA_Transfer(dotCorrections, rxBuf, TLC59401_CHANNELS*3/4);
    #endif

    // need to have at least 3ms delay to guarantee values have been latched before releasing mode line
    while(needLatch0 || needLatch1);

    GPIO_ResetBits(pins_tlc59401[TLC59401_PIN_MODE].GPIOx, pins_tlc59401[TLC59401_PIN_MODE].pin);

    enableBlank = true;
}

/**
 * Set a pixel value in the packet structure
 * @param index The index of the LED channel to set
 * @param value The value to be used for the indexed LED channel
 */
void TLC59401_SetValue(int index, int value) {
    int addr = (index * 3) / 2;
    if(index & 1) {
        // odd so first 4 msb in first byte, 8 bits in second
        txpacket[addr] &= 0xF0;   // erase the low 4 bits we are writing to
        txpacket[addr] |= ((value >> 8) & 0x0F);  // store the 4 msb of the input in the low 4 bits of the first packet byte
        txpacket[addr+1] = value & 0xFF;
    } else {
        txpacket[addr] = (value >> 4) & 0xFF;
        txpacket[addr+1] &= 0x0F; // erase the high 4 bits we are writing to
        txpacket[addr+1] |= (value << 4) & 0xF0;
    }
}
void TLC59401_Set8bitCalValue(uint8_t index, uint8_t value) {
    TLC59401_SetValue(index, LED_CALC(index, value) );
}

/**
 * Set a pixel doc correction in the packet structure
 * @param index The index of the LED channel to set
 * @param value The value to be used for the indexed LED channel's dot correction
 */
inline void TLC59401_SetDotCorrection(int index, uint8_t inVal) {
    pack6bit(dotCorrections,index, inVal);
}

int debugArray[16];
int debugIndex = 0;
void TLC59401_SetCalibration(uint8_t index, uint8_t *values) {
    int i;
    if(index < TLC59401_LOOKUP_ENTRIES) {
        for(i = 0; i < TLC59401_CHANNELS; i++)
            lookupTable[i][index] = unpack12bit(values,i);
    }
}

void TLC59401_GetCalibration(uint8_t index, uint8_t *values) {
    int i;
    if(index < TLC59401_LOOKUP_ENTRIES) {
        for(i = 0; i < TLC59401_CHANNELS; i++)
            pack12bit(values, i, lookupTable[i][index]);
    }
}

/**
 * Blocking command to send a data packet
 */
void TLC59401_Send(void) {
    #ifndef USE_SPI_DMA
     TM_SPI_WriteMulti(txpacket, TLC59401_CHANNELS*3/2);
    #else
     Start_DMA_Transfer(txpacket, rxpacket, TLC59401_CHANNELS*3/2);
    #endif
}

/**
 * Useful to call before Send to make sure the shift registers don't get into some undesired
 * state by beginning to send new data into the shift register and latching mid way through
 * @return True if previously sent data is still unlatched
 */
bool TLC59401_SendPending(void) {
    return needLatch0 | needLatch1;
}

/**
 * Called by the 1ms timer interrupt handler.  This is used to synchronize the sending of blanking pulses
 * to the LED drivers, and also synchronizing the latching of new values during the blanking pulse to
 * ensure predictable behavior
 */
void TLC59401_Update(void) {
    bool doLatch0 = false;
    bool doLatch1 = false;
    static int callCount = 0;

    if( isIdle() ) {
        doLatch0 = needLatch0;
        doLatch1 = needLatch1;
    }

    if((callCount++ & 1) == 0) {
        if(enableBlank) {
            pins_tlc59401[TLC59401_PIN_BLANK0].GPIOx->BSRR = pins_tlc59401[TLC59401_PIN_BLANK0].pin;
        }
        //GPIO_WriteBit(pins_tlc59401[TLC59401_PIN_BLANK].GPIOx, pins_tlc59401[TLC59401_PIN_BLANK].pin, 1);
        if(doLatch0) {
            pins_tlc59401[TLC59401_PIN_XLAT0].GPIOx->BSRR = pins_tlc59401[TLC59401_PIN_XLAT0].pin;
            //GPIO_WriteBit(pins_tlc59401[TLC59401_PIN_XLAT].GPIOx, pins_tlc59401[TLC59401_PIN_XLAT].pin, 1);
        }
        // FIXME may need a short delay in here for high speed processors to meet 20ns minimum pulse duration
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
        if(doLatch0) {
            pins_tlc59401[TLC59401_PIN_XLAT0].GPIOx->BRR = pins_tlc59401[TLC59401_PIN_XLAT0].pin;
            //GPIO_WriteBit(pins_tlc59401[TLC59401_PIN_XLAT].GPIOx, pins_tlc59401[TLC59401_PIN_XLAT].pin, 0);
            needLatch0 = false;
        }
        if(enableBlank) {
            pins_tlc59401[TLC59401_PIN_BLANK0].GPIOx->BRR = pins_tlc59401[TLC59401_PIN_BLANK0].pin;
        }
        //GPIO_WriteBit(pins_tlc59401[TLC59401_PIN_BLANK].GPIOx, pins_tlc59401[TLC59401_PIN_BLANK].pin, 0);
    } else {
        if(enableBlank) {
            pins_tlc59401[TLC59401_PIN_BLANK1].GPIOx->BSRR = pins_tlc59401[TLC59401_PIN_BLANK1].pin;
        }
        if(doLatch1) {
            pins_tlc59401[TLC59401_PIN_XLAT1].GPIOx->BSRR = pins_tlc59401[TLC59401_PIN_XLAT1].pin;
        }
        // FIXME may need a short delay in here for high speed processors to meet 20ns minimum pulse duration
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
        if(doLatch1) {
            pins_tlc59401[TLC59401_PIN_XLAT1].GPIOx->BRR = pins_tlc59401[TLC59401_PIN_XLAT1].pin;
            needLatch1 = false;
        }
        if(enableBlank) {
            pins_tlc59401[TLC59401_PIN_BLANK1].GPIOx->BRR = pins_tlc59401[TLC59401_PIN_BLANK1].pin;
        }
    }

}

void TLC59401_Config(void) {
    int i, j;

    TIM_TimeBaseInitTypeDef  TIM_TimeBaseStructure;
	TIM_OCInitTypeDef  TIM_OCInitStructure;
	SPI_InitTypeDef SPI_InitStruct;

    for(i = 0; i < TLC59401_LOOKUP_ENTRIES; i++) {
        for(j=0; j < TLC59401_CHANNELS; j++) {
            lookupTable[j][i] = (4000*i)/64;
        }
    }

    // Enable clocks
    RCC_AHBPeriphClockCmd(TLC59401_POWER_AHB, ENABLE);
    RCC_APB1PeriphClockCmd(TLC59401_POWER_APB1, ENABLE);
	RCC_APB2PeriphClockCmd(TLC59401_POWER_APB2, ENABLE);

    // FIXME need to move the numerical constants in here to project_config.h

    // Set up GSCLK timer
	TIM_TimeBaseStructure.TIM_Prescaler = 0;
    TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up;
    TIM_TimeBaseStructure.TIM_Period = 1;
    TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1;
    TIM_TimeBaseStructure.TIM_RepetitionCounter = 0;
    TIM_TimeBaseInit(TLC59401_TMR, &TIM_TimeBaseStructure);

    // Set up GSCLK compare unit
    TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1;
    TIM_OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;
    TIM_OCInitStructure.TIM_OutputNState = TIM_OutputNState_Disable;
    TIM_OCInitStructure.TIM_Pulse = 0;
    TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High;
    TIM_OCInitStructure.TIM_OCNPolarity = TIM_OCNPolarity_High;
    TIM_OCInitStructure.TIM_OCIdleState = TIM_OCIdleState_Reset;
    TIM_OCInitStructure.TIM_OCNIdleState = TIM_OCIdleState_Reset;
    TLC59401_GSCLK_INIT(TLC59401_TMR, &TIM_OCInitStructure);

    TLC59401_GSCLK_CCR = (TIM_TimeBaseStructure.TIM_Period + 1)/2;

    CONFIG_pins(pins_tlc59401, TLC59401_NUM_PINS);

    // set up SPI
	SPI_InitStruct.SPI_DataSize = SPI_DataSize_8b;
    SPI_InitStruct.SPI_BaudRatePrescaler = SPI_BaudRatePrescaler_64;
	SPI_InitStruct.SPI_Direction = SPI_Direction_2Lines_FullDuplex;
	SPI_InitStruct.SPI_FirstBit = SPI_FirstBit_MSB;
	SPI_InitStruct.SPI_Mode = SPI_Mode_Master;
	SPI_InitStruct.SPI_CPOL = SPI_CPOL_Low;
	SPI_InitStruct.SPI_CPHA = SPI_CPHA_1Edge;
	SPI_InitStruct.SPI_NSS = SPI_NSS_Soft;

    SPI_I2S_DeInit(TLC59401_SPI);
	/* Disable first */
	TLC59401_SPI->CR1 &= ~SPI_CR1_SPE;

	/* Init SPI */
	SPI_Init(TLC59401_SPI, &SPI_InitStruct);

	/* Enable SPI */
	TLC59401_SPI->CR1 |= SPI_CR1_SPE;

    for(i = 0; i < 5; i++) {
        // indices are reversed so chip output 16 is index 0
		TLC59401_SetDotCorrection(i*3+1, 31); // R
		TLC59401_SetDotCorrection(i*3+2, 63); // G
		TLC59401_SetDotCorrection(i*3+3, 31); // B
        TLC59401_SetDotCorrection(i*3+17, 31); // R
		TLC59401_SetDotCorrection(i*3+18, 63); // G
		TLC59401_SetDotCorrection(i*3+19, 31); // B
	}

    // Set all dot correction values to max
    TLC59401_SendDotCorrection();

    // Zero out all PWM values so display starts dark initially
    for(i = 0; i < TLC59401_CHANNELS; i++)
        TLC59401_SetValue(i,0);
    TLC59401_Send();
    Delay(10);

    // finally enable the grayscale clock to start display
    TIM_Cmd(TLC59401_TMR, ENABLE);
    TIM_CtrlPWMOutputs(TLC59401_TMR, ENABLE);

    enableBlank = true;
}
