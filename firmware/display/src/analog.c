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

#include "analog.h"

static __IO uint16_t adc_readings[10];

/**
 * This function configures IO, clocks, and ADC, including self calibration.
 * The ADC is configured to perform auto sampling, updating an array
 * of readings using DMA transfers.
 */
void ANALOG_Config(void) {
    ADC_InitTypeDef adci;
    DMA_InitTypeDef dmai;

    // Enable clocks
    RCC_AHBPeriphClockCmd(ADC_POWER_AHB, ENABLE);
    RCC_APB1PeriphClockCmd(ADC_POWER_APB1, ENABLE);
	RCC_APB2PeriphClockCmd(ADC_POWER_APB2, ENABLE);

    // Configure the pins as analog inputs
    CONFIG_pins(pins_adc, ADC_PINS_NUM);

    // configure ADC
    ADC_StructInit(&adci);
    adci.ADC_Resolution = ADC_Resolution_12b;
    adci.ADC_ContinuousConvMode = ENABLE;
    adci.ADC_ExternalTrigConvEdge = ADC_ExternalTrigConvEdge_None;
    adci.ADC_DataAlign = ADC_DataAlign_Right;
    adci.ADC_ScanDirection = ADC_ScanDirection_Upward;
    ADC_Init(ADC1, &adci);

    // configure channels
    ADC_ChannelConfig(ADC1, ADC_Channel_0, ADC_SampleTime_239_5Cycles);
    ADC_ChannelConfig(ADC1, ADC_Channel_1, ADC_SampleTime_239_5Cycles);
    ADC_ChannelConfig(ADC1, ADC_Channel_2, ADC_SampleTime_239_5Cycles);
    ADC_ChannelConfig(ADC1, ADC_Channel_3, ADC_SampleTime_239_5Cycles);
    ADC_ChannelConfig(ADC1, ADC_Channel_4, ADC_SampleTime_239_5Cycles);
    ADC_ChannelConfig(ADC1, ADC_Channel_5, ADC_SampleTime_239_5Cycles);
    ADC_ChannelConfig(ADC1, ADC_Channel_6, ADC_SampleTime_239_5Cycles);
    ADC_ChannelConfig(ADC1, ADC_Channel_7, ADC_SampleTime_239_5Cycles);
    ADC_ChannelConfig(ADC1, ADC_Channel_8, ADC_SampleTime_239_5Cycles);
    ADC_ChannelConfig(ADC1, ADC_Channel_9, ADC_SampleTime_239_5Cycles);

    // get calibration
    ADC_GetCalibrationFactor(ADC1);

    // Set up DMA for circular buffer mode
    ADC_DMARequestModeConfig(ADC1, ADC_DMAMode_Circular);

    ADC_DMACmd(ADC1, ENABLE);

    ADC_Cmd(ADC1, ENABLE);

    // wait for the ADRDY flag is set
    while( !ADC_GetFlagStatus(ADC1, ADC_FLAG_ADRDY));

    ADC_StartOfConversion(ADC1);

    DMA_DeInit(DMA1_Channel1);
    dmai.DMA_PeripheralBaseAddr = (uint32_t)ADC_DMA_ADDR;
    dmai.DMA_MemoryBaseAddr = (uint32_t)adc_readings;
    dmai.DMA_DIR = DMA_DIR_PeripheralSRC;
    dmai.DMA_BufferSize = 10;
    dmai.DMA_PeripheralInc = DMA_PeripheralInc_Disable;
    dmai.DMA_MemoryInc = DMA_MemoryInc_Enable;
    dmai.DMA_PeripheralDataSize = DMA_PeripheralDataSize_HalfWord;
    dmai.DMA_MemoryDataSize = DMA_MemoryDataSize_HalfWord;
    dmai.DMA_Mode = DMA_Mode_Circular;
    dmai.DMA_Priority = DMA_Priority_High;
    dmai.DMA_M2M = DMA_M2M_Disable;
    DMA_Init(DMA1_Channel1, &dmai);
    DMA_Cmd(DMA1_Channel1, ENABLE);
}

/**
 * Access the readings that are updated automatically using DMA (this is not polling)
 * @param channel The channel number from which to retrieve the reading
 * @return The most recent ADC reading for the requested channel
 */
uint16_t ANALOG_get_voltage(int channel) {
    if(channel < ADC_PINS_NUM)
        return adc_readings[channel];
    else
        return 0xFFFF;
}
