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

#ifdef REV1
	#warning "Building for Rev 1 PCB"
	const CONFIG_Pin_TypeDef pin_led_matrix[] = {
        { GPIOA, GPIO_Pin_8, GPIO_Speed_25MHz, GPIO_Mode_AF, GPIO_OType_OD, GPIO_PuPd_DOWN, GPIO_PinSource8, GPIO_AF_USART1 },
        { GPIOA, GPIO_Pin_9, GPIO_Speed_25MHz, GPIO_Mode_AF, GPIO_OType_OD, GPIO_PuPd_NOPULL, GPIO_PinSource9, GPIO_AF_USART1 },
        { GPIOA, GPIO_Pin_11, GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_OD, GPIO_PuPd_NOPULL, GPIO_PinSource11, GPIO_AF_USART1 } };

	const CONFIG_Pin_TypeDef pin_buttons[] = {
        { GPIOD, GPIO_Pin_14, GPIO_Speed_2MHz, GPIO_Mode_IN, GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource14, 0 },
        { GPIOD, GPIO_Pin_13, GPIO_Speed_2MHz, GPIO_Mode_IN, GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource13, 0 },
        { GPIOD, GPIO_Pin_12, GPIO_Speed_2MHz, GPIO_Mode_IN, GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource12, 0 },
        { GPIOD, GPIO_Pin_15, GPIO_Speed_2MHz, GPIO_Mode_IN, GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource15, 0 },
        { GPIOD, GPIO_Pin_10, GPIO_Speed_2MHz, GPIO_Mode_IN, GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource10, 0 },
        { GPIOD, GPIO_Pin_9,  GPIO_Speed_2MHz, GPIO_Mode_IN, GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource9,  0 },
        { GPIOD, GPIO_Pin_8,  GPIO_Speed_2MHz, GPIO_Mode_IN, GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource8,  0 },
        { GPIOD, GPIO_Pin_11, GPIO_Speed_2MHz, GPIO_Mode_IN, GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource11, 0 } };
    const CONFIG_Pin_TypeDef pins_debug[] = {
        { GPIOE, GPIO_Pin_7,  GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource7,  0 },    // J2.1
        { GPIOE, GPIO_Pin_8,  GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource8,  0 },    // J2.2
        { GPIOE, GPIO_Pin_9,  GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource9,  0 },    // J2.3
        { GPIOE, GPIO_Pin_10, GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource10, 0 },    // J2.5
        { GPIOE, GPIO_Pin_11, GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource11, 0 },    // J2.6
        { GPIOE, GPIO_Pin_12, GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource12, 0 },    // J2.7
        { GPIOE, GPIO_Pin_6,  GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource6,  0 },    // J2.9
        { GPIOE, GPIO_Pin_5,  GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource5,  0 },    // J2.10
        { GPIOE, GPIO_Pin_4,  GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource4,  0 },    // J2.11
        { GPIOE, GPIO_Pin_3,  GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource3,  0 },    // J2.12
        { GPIOE, GPIO_Pin_2,  GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource2,  0 },    // J2.13
        { GPIOE, GPIO_Pin_1,  GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource1,  0 },    // J2.14
        { GPIOE, GPIO_Pin_0,  GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource0,  0 }};   // J2.15

// top to right 1,3 to top
    const CONFIG_Pin_TypeDef pins_powerctrl[] = {
        { GPIOB, GPIO_Pin_5,  GPIO_Speed_25MHz, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource5,  0 },    // 24V 4 - r0 c0: 1=power good
        { GPIOB, GPIO_Pin_4,  GPIO_Speed_25MHz, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource4,  0 },    // 24V 5 - r1 c0: 1=power good
        { GPIOD, GPIO_Pin_7,  GPIO_Speed_25MHz, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource7,  0 },    // 24V 6 - r2 c0: 1=power good
        { GPIOA, GPIO_Pin_8,  GPIO_Speed_25MHz, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource8,  0 },    // 24V 1 - r0 c1: 1=power good
        { GPIOC, GPIO_Pin_9,  GPIO_Speed_25MHz, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource9,  0 },    // 24V 2 - r1 c1: 1=power good
        { GPIOC, GPIO_Pin_8,  GPIO_Speed_25MHz, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource8,  0 },    // 24V 3 - r2 c1: 1=power good
        { GPIOA, GPIO_Pin_9,  GPIO_Speed_25MHz, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource9,  0 },    // AC MON 1   - c0: 0=power on, 1=power off
        { GPIOB, GPIO_Pin_9,  GPIO_Speed_25MHz, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource9,  0 },    // AC MON 2   - c1: 0=power on, 1=power off
        { GPIOA, GPIO_Pin_10, GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource10, 0 },    // AC Relay 1 - c0: 1=enable AC power
        { GPIOC, GPIO_Pin_13, GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource13, 0 }};   // AC Relay 2 - c1: 1=enable AC power


//FIXME set up LED to be red if any 24V supply is off
//#define GRN_LED_DISABLE		(GPIOE->ODR |= GPIO_ODR_ODR_13)       //PE13
//#define GRN_LED_ENABLE		(GPIOE->ODR &= ~GPIO_ODR_ODR_13)      //PE13
//#define RED_LED_DISABLE		(GPIOE->ODR |= GPIO_ODR_ODR_14)       //PE14
//#define RED_LED_ENABLE		(GPIOE->ODR &= ~GPIO_ODR_ODR_14)      //PE14

    const CONFIG_DMA_Channel dma_led_matrix_tx = {
        DMA_Channel_4, DMA2_Stream7, DMA_FLAG_TCIF7};

	const CONFIG_Pin_TypeDef pin_spi_shift_reg[] = {
        { GPIOB, GPIO_Pin_10, GPIO_Speed_25MHz, GPIO_Mode_AF, GPIO_OType_PP, GPIO_PuPd_DOWN, GPIO_PinSource10, GPIO_AF_SPI2 },
        { GPIOB, GPIO_Pin_14, GPIO_Speed_25MHz, GPIO_Mode_AF, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource14, GPIO_AF_SPI2 },
        { GPIOB, GPIO_Pin_15, GPIO_Speed_25MHz, GPIO_Mode_AF, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource15, GPIO_AF_SPI2 },
        { GPIOD, GPIO_Pin_0, GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource0, GPIO_AF_SPI2 },
        { GPIOD, GPIO_Pin_1, GPIO_Speed_25MHz, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource1, GPIO_AF_SPI2 }  };

    const CONFIG_DMA_Channel dma_spi_shift_tx = {
        DMA_Channel_0, DMA1_Stream4, DMA_FLAG_TCIF4};
    const CONFIG_DMA_Channel dma_spi_shift_rx = {
        DMA_Channel_0, DMA1_Stream3, DMA_FLAG_TCIF3};

	const CONFIG_Pin_TypeDef pin_i2c_scl = {
		GPIOB, GPIO_Pin_6, GPIO_Speed_2MHz, GPIO_Mode_AF, GPIO_OType_OD, GPIO_PinSource6, GPIO_AF_I2C1 };
	const CONFIG_Pin_TypeDef pin_i2c_sda = {
		GPIOB, GPIO_Pin_7, GPIO_Speed_2MHz, GPIO_Mode_AF, GPIO_OType_OD, GPIO_PinSource7, GPIO_AF_I2C1 };

/////////////////////////////////////////////////
//////////////////// USARTS /////////////////////
/////////////////////////////////////////////////
static uint8_t us_txbuf0[1024];
static uint8_t us_rxbuf0[1024];
static uint8_t us_txbuf1[1024];
static uint8_t us_rxbuf1[1024];
static uint8_t us_txbuf2[1024];
static uint8_t us_rxbuf2[1024];
static uint8_t us_txbuf3[1024];
static uint8_t us_rxbuf3[1024];
static FIFO_Data_TypeDef us_fifo0;
static FIFO_Data_TypeDef us_fifo1;
static FIFO_Data_TypeDef us_fifo2;
static FIFO_Data_TypeDef us_fifo3;

static CONFIG_Pin_TypeDef us0_pins[] = { //6
    { GPIOC, GPIO_Pin_6,  GPIO_Speed_2MHz, GPIO_Mode_AF, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource6,  GPIO_AF_USART6 },
    { GPIOC, GPIO_Pin_7,  GPIO_Speed_2MHz, GPIO_Mode_AF, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource7,  GPIO_AF_USART6 }  };
static CONFIG_Pin_TypeDef us1_pins[] = { //4
    { GPIOC, GPIO_Pin_10, GPIO_Speed_2MHz, GPIO_Mode_AF, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource10, GPIO_AF_UART4 },
    { GPIOC, GPIO_Pin_11, GPIO_Speed_2MHz, GPIO_Mode_AF, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource11, GPIO_AF_UART4 }  }   ;
static CONFIG_Pin_TypeDef us2_pins[] = { //5
    { GPIOC, GPIO_Pin_12, GPIO_Speed_2MHz, GPIO_Mode_AF, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource12, GPIO_AF_UART5 },
    { GPIOD, GPIO_Pin_2,  GPIO_Speed_2MHz, GPIO_Mode_AF, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource2,  GPIO_AF_UART5 }  };
static CONFIG_Pin_TypeDef us3_pins[] = { //2
    { GPIOD, GPIO_Pin_5,  GPIO_Speed_2MHz, GPIO_Mode_AF, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource5,  GPIO_AF_USART2 },
    { GPIOD, GPIO_Pin_6,  GPIO_Speed_2MHz, GPIO_Mode_AF, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource6,  GPIO_AF_USART2 }  };

CONFIG_USART_ConfigState usarts[] = {
    {
        // buffers
        .tx_buf_size=1024, .rx_buf_size=1024, .tx_buf=us_txbuf0, .rx_buf=us_rxbuf0, .rx_fifo=&us_fifo0,
        // pins
        .pins=us0_pins, .num_pins=2,
        // power
        .ahb1=(RCC_AHB1Periph_GPIOC | RCC_AHB1Periph_DMA2), .apb1=(0), .apb2=(RCC_APB2Periph_USART6),
        // hardware addresses
        .IRQn=USART6_IRQn, .DR_ADDR=(USART6_BASE+0x04), .DMA_channel=DMA_Channel_5, .DMA_stream=DMA2_Stream6, .DMAx=DMA2, .USARTx=USART6,
        .DMA_IntFlags=(DMA_IT_FEIF6 | DMA_IT_TCIF6 | DMA_IT_HTIF6),
        // state
        .baud=1000000, .TX_active=false, .configured=false
    },{
        // buffers
        .tx_buf_size=1024, .rx_buf_size=1024, .tx_buf=us_txbuf1, .rx_buf=us_rxbuf1, .rx_fifo=&us_fifo1,
        // pins
        .pins=us1_pins, .num_pins=2,
        // power
        .ahb1=(RCC_AHB1Periph_GPIOC | RCC_AHB1Periph_DMA1), .apb1=(RCC_APB1Periph_UART4), .apb2=(0),
        // hardware addresses
        .IRQn=UART4_IRQn, .DR_ADDR=(UART4_BASE+0x04), .DMA_channel=DMA_Channel_4, .DMA_stream=DMA1_Stream4, .DMAx=DMA1, .USARTx=UART4,
        .DMA_IntFlags=(DMA_IT_FEIF4 | DMA_IT_TCIF4 | DMA_IT_HTIF4),
        // state
        .baud=1000000, .TX_active=false, .configured=false
    },{
        // buffers
        .tx_buf_size=1024, .rx_buf_size=1024, .tx_buf=us_txbuf2, .rx_buf=us_rxbuf2, .rx_fifo=&us_fifo2,
        // pins
        .pins=us2_pins, .num_pins=2,
        // power
        .ahb1=(RCC_AHB1Periph_GPIOC | RCC_AHB1Periph_GPIOD | RCC_AHB1Periph_DMA1), .apb1=(RCC_APB1Periph_UART5), .apb2=(0),
        // hardware addresses
        .IRQn=UART5_IRQn, .DR_ADDR=(UART5_BASE+0x04), .DMA_channel=DMA_Channel_4, .DMA_stream=DMA1_Stream7, .DMAx=DMA1, .USARTx=UART5,
        .DMA_IntFlags=(DMA_IT_FEIF5 | DMA_IT_TCIF5 | DMA_IT_HTIF5),
        // state
        .baud=1000000, .TX_active=false, .configured=false
    },{
        // buffers
        .tx_buf_size=1024, .rx_buf_size=1024, .tx_buf=us_txbuf3, .rx_buf=us_rxbuf3, .rx_fifo=&us_fifo3,
        // pins
        .pins=us3_pins, .num_pins=2,
        // power
        .ahb1=(RCC_AHB1Periph_GPIOD | RCC_AHB1Periph_DMA1), .apb1=(RCC_APB1Periph_USART2), .apb2=(0),
        // hardware addresses
        .IRQn=USART2_IRQn, .DR_ADDR=(USART2_BASE+0x04), .DMA_channel=DMA_Channel_4, .DMA_stream=DMA1_Stream6, .DMAx=DMA1, .USARTx=USART2,
        .DMA_IntFlags=(DMA_IT_FEIF2 | DMA_IT_TCIF2 | DMA_IT_HTIF2),
        // state
        .baud=1000000, .TX_active=false, .configured=false
    }
};


	void CONFIG_Setup(void) {

	}

	void CONFIG_pins(const CONFIG_Pin_TypeDef *pins, int num_pins ) {
	    GPIO_InitTypeDef  GPIO_InitStructure;
	    int i;

	    for(i = 0; i < num_pins; i++) {
            GPIO_InitStructure.GPIO_Pin = pins[i].pin;
            GPIO_InitStructure.GPIO_Mode = pins[i].mode;
            GPIO_InitStructure.GPIO_OType = pins[i].otype;
            GPIO_InitStructure.GPIO_PuPd = pins[i].PuPd;
            GPIO_InitStructure.GPIO_Speed = pins[i].speed;
            GPIO_Init(pins[i].GPIOx, &GPIO_InitStructure);
            if(pins[i].mode == GPIO_Mode_AF)
                GPIO_PinAFConfig(pins[i].GPIOx, pins[i].pinsource, pins[i].af);
        }
	}

	void USART6_IRQHandler(void) {
        USART_IRQ_Handler(&usarts[0]);
    }
    void UART4_IRQHandler(void) {
        USART_IRQ_Handler(&usarts[1]);
    }
    void UART5_IRQHandler(void) {
        USART_IRQ_Handler(&usarts[2]);
    }
    void USART2_IRQHandler(void) {
        USART_IRQ_Handler(&usarts[3]);
    }
#endif
