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
    /////////////////////////////////////////////////
    //////////////////// TLC59401 ///////////////////
    /////////////////////////////////////////////////
    const CONFIG_Pin_TypeDef pins_tlc59401[] = {
        { GPIOA, GPIO_Pin_11, GPIO_Speed_Level_2, GPIO_Mode_AF,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource11, GPIO_AF_2 },  // GSCLK TIM1.4
        { GPIOB, GPIO_Pin_13, GPIO_Speed_Level_1, GPIO_Mode_AF,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource13, GPIO_AF_0 },  // SCK   SPI2
        { GPIOB, GPIO_Pin_15, GPIO_Speed_Level_1, GPIO_Mode_AF,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource15, GPIO_AF_0 },  // MOSI  SPI2
        { GPIOB, GPIO_Pin_12, GPIO_Speed_Level_1, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource12, 0 },  // MODE
        { GPIOA, GPIO_Pin_8,  GPIO_Speed_Level_1, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource8,  0 },  // XLAT
        { GPIOA, GPIO_Pin_12, GPIO_Speed_Level_1, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource12, 0 },  // BLANK0
        { GPIOB, GPIO_Pin_14, GPIO_Speed_Level_1, GPIO_Mode_AF,  GPIO_OType_PP, GPIO_PuPd_UP,     GPIO_PinSource14, GPIO_AF_0 },   // MISO  SPI2
        { GPIOF, GPIO_Pin_1,  GPIO_Speed_Level_1, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource1,  0 },  // BLANK1
    };
#endif // REV1

#ifdef REV2
    #warning "Building for Rev 2 PCB"
    /////////////////////////////////////////////////
    //////////////////// TLC59401 ///////////////////
    /////////////////////////////////////////////////
    const CONFIG_Pin_TypeDef pins_tlc59401[] = {
        { GPIOA, GPIO_Pin_11, GPIO_Speed_Level_2, GPIO_Mode_AF,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource11, GPIO_AF_2 },  // GSCLK TIM1.4
        { GPIOB, GPIO_Pin_13, GPIO_Speed_Level_1, GPIO_Mode_AF,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource13, GPIO_AF_0 },  // SCK   SPI2
        { GPIOB, GPIO_Pin_15, GPIO_Speed_Level_1, GPIO_Mode_AF,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource15, GPIO_AF_0 },  // MOSI  SPI2
        { GPIOB, GPIO_Pin_12, GPIO_Speed_Level_1, GPIO_Mode_OUT, GPIO_OType_OD, GPIO_PuPd_NOPULL, GPIO_PinSource12, 0 },  // MODE
        { GPIOA, GPIO_Pin_8,  GPIO_Speed_Level_1, GPIO_Mode_OUT, GPIO_OType_OD, GPIO_PuPd_NOPULL, GPIO_PinSource8,  0 },  // XLAT0
        { GPIOA, GPIO_Pin_12, GPIO_Speed_Level_1, GPIO_Mode_OUT, GPIO_OType_OD, GPIO_PuPd_NOPULL, GPIO_PinSource12, 0 },  // BLANK0
        { GPIOB, GPIO_Pin_14, GPIO_Speed_Level_1, GPIO_Mode_AF,  GPIO_OType_PP, GPIO_PuPd_UP,     GPIO_PinSource14, GPIO_AF_0 },   // MISO  SPI2
        { GPIOF, GPIO_Pin_1,  GPIO_Speed_Level_1, GPIO_Mode_OUT, GPIO_OType_OD, GPIO_PuPd_NOPULL, GPIO_PinSource1,  0 },  // BLANK1
        { GPIOF, GPIO_Pin_6,  GPIO_Speed_Level_1, GPIO_Mode_OUT, GPIO_OType_OD, GPIO_PuPd_NOPULL, GPIO_PinSource6,  0 },  // XLAT1
    };

    //FIXME need to add sync pin, although configuration is address dependent since one will have to drive the signal
#endif // REV2

/////////////////////////// BEGIN ITEMS WHICH ARE NOT REVISION SPECIFIC /////////////////////////////////////////

/////////////////////////////////////////////////
//////////////////// DEBUG PINS /////////////////
/////////////////////////////////////////////////
const CONFIG_Pin_TypeDef pins_debug[] = {
//    { GPIOA, GPIO_Pin_0, GPIO_Speed_Level_1, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource0, 0 },    // debug 0
//    { GPIOA, GPIO_Pin_1, GPIO_Speed_Level_1, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource1, 0 },    // debug 1
//    { GPIOA, GPIO_Pin_4, GPIO_Speed_Level_1, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource4, 0 },    // debug 2
//    { GPIOB, GPIO_Pin_0, GPIO_Speed_Level_1, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource0, 0 },    // debug 3
//    { GPIOC, GPIO_Pin_1, GPIO_Speed_Level_1, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource1, 0 },    // debug 4
//    { GPIOC, GPIO_Pin_0, GPIO_Speed_Level_1, GPIO_Mode_OUT, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource0, 0 }     // debug 5
};
const CONFIG_Pin_TypeDef pins_addrPD[] = {
    { GPIOC, GPIO_Pin_13, GPIO_Speed_Level_1, GPIO_Mode_IN, GPIO_OType_PP, GPIO_PuPd_DOWN, GPIO_PinSource13, 0 },    // lsb
    { GPIOC, GPIO_Pin_14, GPIO_Speed_Level_1, GPIO_Mode_IN, GPIO_OType_PP, GPIO_PuPd_DOWN, GPIO_PinSource14, 0 }     // msb
};
const CONFIG_Pin_TypeDef pins_addrPU[] = {
    { GPIOC, GPIO_Pin_13, GPIO_Speed_Level_1, GPIO_Mode_IN, GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource13, 0 },    // lsb
    { GPIOC, GPIO_Pin_14, GPIO_Speed_Level_1, GPIO_Mode_IN, GPIO_OType_PP, GPIO_PuPd_UP, GPIO_PinSource14, 0 }     // msb
};

/// PWM pin
const CONFIG_Pin_TypeDef pins_pwm[] = {
    { GPIOB, GPIO_Pin_4, GPIO_Speed_Level_1, GPIO_Mode_AF, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource4, GPIO_AF_1 }, // TIM3.1 TACH input
    { GPIOB, GPIO_Pin_8, GPIO_Speed_Level_1, GPIO_Mode_AF, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource8, GPIO_AF_2 }  // TIM16.1 PWM output
};

/////////////////////////////////////////////////
////////////////////  BUTTONS   /////////////////
/////////////////////////////////////////////////
const CONFIG_Pin_TypeDef pins_buttons[] = {
    { GPIOB, GPIO_Pin_5,  GPIO_Speed_Level_1, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource5,  0 },
    { GPIOF, GPIO_Pin_7,  GPIO_Speed_Level_1, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource7,  0 },
    { GPIOB, GPIO_Pin_3,  GPIO_Speed_Level_1, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource3,  0 },
    { GPIOB, GPIO_Pin_11, GPIO_Speed_Level_1, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource11, 0 },
    { GPIOB, GPIO_Pin_10, GPIO_Speed_Level_1, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource10, 0 },
    { GPIOB, GPIO_Pin_6,  GPIO_Speed_Level_1, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource6,  0 },
    { GPIOB, GPIO_Pin_7,  GPIO_Speed_Level_1, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource7,  0 },
    { GPIOF, GPIO_Pin_0,  GPIO_Speed_Level_1, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource0,  0 },
    { GPIOB, GPIO_Pin_9,  GPIO_Speed_Level_1, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource9,  0 },
    { GPIOB, GPIO_Pin_2,  GPIO_Speed_Level_1, GPIO_Mode_IN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource2,  0 }
};

/////////////////////////////////////////////////
//////////////////  THERMISTORS   ///////////////
/////////////////////////////////////////////////
const CONFIG_Pin_TypeDef pins_adc[] = {
    { GPIOB, GPIO_Pin_1,  GPIO_Speed_Level_1, GPIO_Mode_AN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource1,  0 },
    { GPIOB, GPIO_Pin_0,  GPIO_Speed_Level_1, GPIO_Mode_AN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource0,  0 },
    { GPIOA, GPIO_Pin_7,  GPIO_Speed_Level_1, GPIO_Mode_AN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource7,  0 },
    { GPIOA, GPIO_Pin_5,  GPIO_Speed_Level_1, GPIO_Mode_AN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource5,  0 },
    { GPIOA, GPIO_Pin_6,  GPIO_Speed_Level_1, GPIO_Mode_AN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource6,  0 },
    { GPIOA, GPIO_Pin_0,  GPIO_Speed_Level_1, GPIO_Mode_AN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource0,  0 },
    { GPIOA, GPIO_Pin_1,  GPIO_Speed_Level_1, GPIO_Mode_AN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource1,  0 },
    { GPIOA, GPIO_Pin_2,  GPIO_Speed_Level_1, GPIO_Mode_AN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource2,  0 },
    { GPIOA, GPIO_Pin_3,  GPIO_Speed_Level_1, GPIO_Mode_AN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource3,  0 },
    { GPIOA, GPIO_Pin_4,  GPIO_Speed_Level_1, GPIO_Mode_AN,  GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource4,  0 }
};


/////////////////////////////////////////////////
//////////////////// USARTS /////////////////////
/////////////////////////////////////////////////
static uint8_t us_txbuf0[256];
static uint8_t us_rxbuf0[256];
static FIFO_Data_TypeDef us_fifo0;

static const CONFIG_Pin_TypeDef us0_pins[] = {
    { GPIOA, GPIO_Pin_9,  GPIO_Speed_Level_1, GPIO_Mode_AF, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource9,  GPIO_AF_1 },     // USART1.TX
    { GPIOA, GPIO_Pin_10, GPIO_Speed_Level_1, GPIO_Mode_AF, GPIO_OType_PP, GPIO_PuPd_NOPULL, GPIO_PinSource10, GPIO_AF_1 }  };  // USART1.RX

CONFIG_USART_ConfigState usarts[] = {
    {
        // buffers
        .tx_buf_size=256, .rx_buf_size=256, .tx_buf=us_txbuf0, .rx_buf=us_rxbuf0, .rx_fifo=&us_fifo0,
        // pins
        .pins=us0_pins, .num_pins=2,
        // power
        .ahb1=(RCC_AHBPeriph_GPIOA | RCC_AHBPeriph_DMA1), .apb1=(0), .apb2=(RCC_APB2Periph_USART1),
        // hardware addresses
        .USARTx=USART1, .IRQn=USART1_IRQn, .DMAx=DMA1, .DMA_IntFlags=(0),
        .RDR_ADDR=(USART1_BASE+0x24), .DMA_rx_channel_num=3, .DMA_rx_channel=DMA1_Channel3,
        .TDR_ADDR=(USART1_BASE+0x28), .DMA_tx_channel_num=2, .DMA_tx_channel=DMA1_Channel2,
        // state
        .baud=1000000, .TX_active=false, .configured=false
    }
};

/////////////////////////////////////////////////
//////////////////// FUNCTIONS //////////////////
/////////////////////////////////////////////////

void CONFIG_Setup(void) {

}

/**
 * Configure a group of pins based on an array of pin configuration structs
 */
void CONFIG_pins(const CONFIG_Pin_TypeDef *pins, int num_pins ) {
    GPIO_InitTypeDef  GPIO_InitStructure;
    int i;

    for(i = 0; i < num_pins; i++) {
        //if(pins[i].mode == GPIO_Mode_AF)
        GPIO_PinAFConfig(pins[i].GPIOx, pins[i].pinsource, pins[i].af);

        GPIO_InitStructure.GPIO_Pin = pins[i].pin;
        GPIO_InitStructure.GPIO_Mode = pins[i].mode;
        GPIO_InitStructure.GPIO_OType = pins[i].otype;
        GPIO_InitStructure.GPIO_PuPd = pins[i].PuPd;
        GPIO_InitStructure.GPIO_Speed = pins[i].speed;
        GPIO_Init(pins[i].GPIOx, &GPIO_InitStructure);

    }
}

/**
 * Get the local address of the CPU for this LED board (0-4) based on address pins
 */
uint32_t CONFIG_get_addr(void) {
    uint32_t low = 0, high = 0;
    int i;
    RCC_AHBPeriphClockCmd(ADDRPIN_POWER_AHB, ENABLE);
    // capture the values in both pull up and pull down
    CONFIG_pins(pins_addrPD, ADDRPIN_NUM);
    usleep(5000);
    for(i = ADDRPIN_NUM-1; i >= 0; i--) {
        if( GPIO_ReadInputDataBit(pins_addrPD[i].GPIOx, pins_addrPD[i].pin) == Bit_SET)
            low = (low << 1) | 1;
        else
            low = (low << 1);
    }
    CONFIG_pins(pins_addrPU, ADDRPIN_NUM);
    usleep(5000);
    for(i = ADDRPIN_NUM-1; i >= 0; i--) {
        if( GPIO_ReadInputDataBit(pins_addrPU[i].GPIOx, pins_addrPU[i].pin) == Bit_SET)
            high = (high << 1) | 1;
        else
            high = (high << 1);
    }
    if(low == high)
        return high;
    else
        return 4;
}
