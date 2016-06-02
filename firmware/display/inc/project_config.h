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

#ifndef __PROJECT_CONFIG_H
#define __PROJECT_CONFIG_H

#include "stm32f0xx_conf.h"
#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>
#include <assert.h>
#include <core_cm0.h>
#include "fifo.h"

#define REV2

#ifdef REV1
	#ifdef HAVE_REV
        #error "Multiple board revisions defined"
    #endif
    /////////////////////////////////////////////////
    //////////////////// TLC59401 ///////////////////
    /////////////////////////////////////////////////
    #define TLC59401_NUM_PINS   (8)
    #define TLC59401_PIN_GSCLK  (0)
    #define TLC59401_PIN_SCK    (1)
    #define TLC59401_PIN_MOSI   (2)
    #define TLC59401_PIN_MODE   (3)
    #define TLC59401_PIN_XLAT0  (4)
    #define TLC59401_PIN_BLANK0 (5)
    #define TLC59401_PIN_MISO   (6)
    #define TLC59401_PIN_BLANK1 (7)

	#define HAVE_REV
#endif // REV1

#ifdef REV2
    #ifdef HAVE_REV
        #error "Multiple board revisions defined"
    #endif
	/////////////////////////////////////////////////
    //////////////////// TLC59401 ///////////////////
    /////////////////////////////////////////////////
    #define TLC59401_NUM_PINS   (9)
    #define TLC59401_PIN_GSCLK  (0)
    #define TLC59401_PIN_SCK    (1)
    #define TLC59401_PIN_MOSI   (2)
    #define TLC59401_PIN_MODE   (3)
    #define TLC59401_PIN_XLAT0  (4)
    #define TLC59401_PIN_BLANK0 (5)
    #define TLC59401_PIN_MISO   (6)
    #define TLC59401_PIN_BLANK1 (7)
    #define TLC59401_PIN_XLAT1  (8)

    //FIXME need to add sync pin, although configuration is address dependent since one will have to drive the signal

    #define EEPROM_HALFBIT_DELAY (5)
    #define EEPROM_AHB (RCC_AHBPeriph_GPIOB)
    #define EEPROM_PIN_CONF { GPIOB, GPIO_Pin_8, GPIO_Speed_Level_1, GPIO_Mode_OUT, GPIO_OType_OD, GPIO_PuPd_UP, GPIO_PinSource8, 0 }


	#define HAVE_REV
#endif // REV2

typedef struct {
	GPIO_TypeDef* GPIOx;
	uint16_t pin;
	GPIOSpeed_TypeDef speed;
	GPIOMode_TypeDef mode;
	GPIOOType_TypeDef otype;
	GPIOPuPd_TypeDef PuPd;
	uint8_t pinsource;
	uint8_t af;
} CONFIG_Pin_TypeDef;

typedef struct {
	ADC_TypeDef* ADCx;
	uint8_t channel;
	uint8_t rank;
	uint8_t sampleTime;
} CONFIG_ADC_TypeDef;

typedef struct {
    uint32_t channel_num;
    DMA_Channel_TypeDef * channel;
    uint32_t flag;
} CONFIG_DMA_Channel;

typedef struct {
    // buffers and fifo
    const uint32_t tx_buf_size;
    const uint32_t rx_buf_size;
    uint8_t *tx_buf;
    uint8_t *rx_buf;
    FIFO_Data_TypeDef *rx_fifo;
    // pins
    const CONFIG_Pin_TypeDef *pins;
    const uint32_t num_pins;
    // hardware initialization
    const uint32_t ahb1;
    const uint32_t apb1;
    const uint32_t apb2;
    const uint32_t IRQn;
    DMA_TypeDef *DMAx;
    const uint32_t DMA_IntFlags;
    const uint32_t RDR_ADDR; // RX data register address for DMA transfer
    const uint32_t DMA_rx_channel_num;
    DMA_Channel_TypeDef *DMA_rx_channel;
    const uint32_t TDR_ADDR; // TX data register address for DMA transfer
    const uint32_t DMA_tx_channel_num;
    DMA_Channel_TypeDef *DMA_tx_channel;
    USART_TypeDef * USARTx;
    // state
    uint32_t baud;
    bool TX_active;
    bool configured;
} CONFIG_USART_ConfigState;

void CONFIG_Setup(void);
void CONFIG_pins(const CONFIG_Pin_TypeDef *pins, int num_pins);
void Delay(uint32_t nCount);
void usleep(uint32_t nCount);
void stopwatch_reset(void);
uint32_t stopwatch_getticks();

uint32_t CONFIG_get_addr(void);

#define SYSTEMTICK_PERIOD_MS  1

////////////////////////// BUTTONS ///////////////////////////
#define BUTTONS_POWER_AHB  (RCC_AHBPeriph_GPIOB | RCC_AHBPeriph_GPIOF)
#define BUTTONS_POLARITY 0x3FF
extern const CONFIG_Pin_TypeDef pins_buttons[];
#define BUTTONS_NUM (10)

////////////////////////// THERMISTORS ////////////////////////
#define ADC_POWER_AHB (RCC_AHBPeriph_GPIOA | RCC_AHBPeriph_GPIOB | RCC_AHBPeriph_DMA1)
#define ADC_POWER_APB1 (0)
#define ADC_POWER_APB2 (RCC_APB2Periph_ADC1)
extern const CONFIG_Pin_TypeDef pins_adc[];
#define ADC_PINS_NUM (10)
#define ADC_DMA_ADDR (&(ADC1->DR))

////////////////////////// UARTS //////////////////////////////
#define USART_TX (0)
#define USART_RX (1)
extern CONFIG_USART_ConfigState usarts[];
#define USART_NUM (1)

/////////////////////////// DEBUG PINS ////////////////////////
#define DEBUGPIN_POWER_AHB (RCC_AHBPeriph_GPIOA | RCC_AHBPeriph_GPIOB | RCC_AHBPeriph_GPIOC)
extern const CONFIG_Pin_TypeDef pins_debug[];
#define DEBUGPIN_NUM (0)

#define ADDRPIN_POWER_AHB (RCC_AHBPeriph_GPIOC)
#define ADDRPIN_NUM (2)
extern const CONFIG_Pin_TypeDef pins_addrPD[];
extern const CONFIG_Pin_TypeDef pins_addrPU[];

/////////////////////////// TLC59401 //////////
#define TLC59401_POWER_AHB  (RCC_AHBPeriph_GPIOA | RCC_AHBPeriph_GPIOB | RCC_AHBPeriph_GPIOF | RCC_AHBPeriph_DMA1)
#define TLC59401_POWER_APB1  (RCC_APB1Periph_SPI2)
#define TLC59401_POWER_APB2  (RCC_APB2Periph_TIM1)
#define TLC59401_TMR        TIM1
#define TLC59401_GSCLK_CCR  TIM1->CCR4
#define TLC59401_GSCLK_INIT TIM_OC4Init

#define TLC59401_SPI        SPI2
#define TLC59401_TX_DMA     DMA1_Channel5
#define TLC59401_RX_DMA     DMA1_Channel4
#define TLC59401_DMA_DR     (&(SPI2->DR))

extern const CONFIG_Pin_TypeDef pins_tlc59401[];


#define FAN_POWER_AHB (RCC_AHBPeriph_GPIOB)
#define FAN_POWER_APB1 (RCC_APB1Periph_TIM3)
#define FAN_POWER_APB2 (RCC_APB2Periph_TIM16)
#define PWM_PINS_NUM (2)
extern const CONFIG_Pin_TypeDef pins_pwm[];

#define TLC59401_CHANNELS (32)
#define TLC59401_LOOKUP_ENTRIES     (65)

#endif // __PROJECT_CONFIG_H
