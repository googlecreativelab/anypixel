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

#include "stm32f4xx.h"
#include "core_cm4.h"
#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>
#include <assert.h>
#include "fifo.h"

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
    uint32_t channel;
    DMA_Stream_TypeDef * stream;
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
    CONFIG_Pin_TypeDef *pins;
    const uint32_t num_pins;
    // hardware initialization
    const uint32_t ahb1;
    const uint32_t apb1;
    const uint32_t apb2;
    const uint32_t IRQn;
    const uint32_t DR_ADDR; // TX data register address for DMA transfer
    const uint32_t DMA_channel;
    DMA_Stream_TypeDef *DMA_stream;
    DMA_TypeDef *DMAx;
    USART_TypeDef * USARTx;
    const uint32_t DMA_IntFlags;
    // state
    uint32_t baud;
    bool TX_active;
    bool configured;
    uint16_t frame_available;    // used to keep track of how many bytes were available at the start of the most recent idle bus condition
} CONFIG_USART_ConfigState;

void CONFIG_Setup(void);
void CONFIG_pins(const CONFIG_Pin_TypeDef *pins, int num_pins);

#define DISABLE_SLEEP 0
#define ENABLE_SLEEP_DEBUG 1

//////////////// ITEMS NOT DEPENDENT ON BOARD LAYOUT ////////////


//////////////////////////////////////////////////////////////////////////////
//////////////////// REV 1 ///////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

#ifdef REV1
	#ifdef REV_SELECTED
		#error Already selected a board revision
	#else
		#define REV_SELECTED
	#endif

	////////////////////////// LED_MATRIX ///////////////////////////////
	#define LED_MATRIX_PINS (3)
	#define LED_MATRIX_USARTx (USART1)
	#define LED_MATRIX_AHB1 (RCC_AHB1Periph_DMA2 | RCC_AHB1Periph_GPIOA)
	#define LED_MATRIX_APB1 (0)
	#define LED_MATRIX_APB2 (RCC_APB2Periph_USART1)
	#define LED_MATRIX_BAUD 1000000
	#define LED_MATRIX_TX_BUFFER_SIZE 3
	#define LED_MATRIX_NVIC_CHAN USART1_IRQn
	#define LED_MATRIX_IRQ_HANDLER LEDmatrix_handler
	extern const CONFIG_Pin_TypeDef pin_led_matrix[];
    // this is the index into the pins array for the latching line
	#define LED_MATRIX_PIN_LATCH 2
	extern const CONFIG_DMA_Channel dma_led_matrix_tx;

	//////////////////////////// BUTTONS //////////////////////////////////
	// actually hex switch
	#define BUTTONS_POWER_AHB1  (RCC_AHB1Periph_GPIOD)
	#define BUTTONS_NUM 8
	#define BUTTONS_POLARITY 0
	extern const CONFIG_Pin_TypeDef pin_buttons[];

	/////////////////////////// DEBUG PINS ////////////////////////
    #define DEBUGPIN_POWER_AHB1 (RCC_AHB1Periph_GPIOE)
    extern const CONFIG_Pin_TypeDef pins_debug[];
    #define DEBUGPIN_NUM 13


	////////////////////////// SPI_SHIFT_REG //////////////////////////////
	#define SPI_SHIFT_REG_PINS (5)
	#define SPI_SHIFT_REG_SPIx (SPI2)
	#define SPI_SHIFT_REG_BITS 192
	#define SPI_SHIFT_REG_CHANS 128
	#define SPI_SHIFT_REG_BUFSIZE 32
	#define SPI_SHIFT_REG_AHB1  (RCC_AHB1Periph_DMA1 | RCC_AHB1Periph_GPIOB | RCC_AHB1Periph_GPIOD)
	#define SPI_SHIFT_REG_APB1 (RCC_APB1Periph_SPI2)
	#define SPI_SHIFT_REG_APB2 (0)
	extern const CONFIG_Pin_TypeDef pin_spi_shift_reg[];
	#define SPI_SHIFT_REG_PIN_CS 3
	#define SPI_SHIFT_REG_PIN_RST 4
	extern const CONFIG_DMA_Channel dma_spi_shift_tx;
	extern const CONFIG_DMA_Channel dma_spi_shift_rx;

	///////////////////////// I2C /////////////////////////////////
	#define I2CDEV_POWER_APB1 (RCC_APB1Periph_I2C1)
	#define I2CDEV_POWER_APB2 (RCC_APB2Periph_GPIOB)
	#define I2CDEV_ADDRESS (0x00)
	#define I2CDEV_CLOCK (400000)
	#define I2CDEV_SHORT_TIMEOUT (0x2000)
	#define I2CDEV_START_TIMEOUT (10*I2CDEV_SHORT_TIMEOUT)
	#define I2CDEV_I2Cx (I2C1)
	extern const CONFIG_Pin_TypeDef pin_i2c_scl;
	extern const CONFIG_Pin_TypeDef pin_i2c_sda;

	uint32_t I2CDEV_TIMEOUT_Callback(void);	// defined in main.c

	//////////////////////// MMA8652 //////////////////////////////
	#define MMA8652_POWER_AHB
	#define MMA8652_POWER_APB2 (RCC_APB2Periph_GPIOA | RCC_APB2Periph_AFIO)
	#define MMA8652_IRQ1_PORT_SOURCE GPIO_PortSourceGPIOB
	#define MMA8652_IRQ1_PIN_SOURCE GPIO_PinSource10
	#define MMA8652_IRQ2_PORT_SOURCE GPIO_PortSourceGPIOB
	#define MMA8652_IRQ2_PIN_SOURCE GPIO_PinSource11
	#define MMA8652_I2C_ADDR (0x3A)
	#define MMA8652_EXTI_LINE EXTI_Line0
	#define MMA8652_NVIC_IRQChannel EXTI0_IRQn
	//FIXME extern const CONFIG_Pin_TypeDef[] pin_mma7660_int;
	//FIXME #define MMA8652_IRQ_HANDLER EXTI0_IRQHandler
	//FIXME void EXTI0_IRQHandler(void);
	#define MMA8652_NUM_INT (2)
	extern const CONFIG_Pin_TypeDef pin_mma8652_int[];

    ////////////////////////// UARTS //////////////////////////////
    #define USART_TX 0
    #define USART_RX 1
    extern CONFIG_USART_ConfigState usarts[];
    #define USART_NUM 4

    /////////////////////// POWER CONTROL /////////////////////////
    extern const CONFIG_Pin_TypeDef pins_powerctrl[];
    #define PWRCTRL_NUM_PINS (10)
    #define PWR_MON_0_0 (0)
    #define PWR_MON_0_1 (1)
    #define PWR_MON_0_2 (2)
    #define PWR_MON_1_0 (3)
    #define PWR_MON_1_1 (4)
    #define PWR_MON_1_2 (5)
    #define PWR_MON_AC_0 (6)
    #define PWR_MON_AC_1 (7)
    #define PWR_CTRL_AC_0 (8)
    #define PWR_CTRL_AC_1 (9)

    #define PIN_POWER_AHB1 (RCC_AHB1Periph_GPIOA | RCC_AHB1Periph_GPIOB | RCC_AHB1Periph_GPIOC | RCC_AHB1Periph_GPIOD)

#endif // REV1

#ifndef REV_SELECTED
    #error Must select a board revision
#endif

#endif // __PROJECT_CONFIG_H
