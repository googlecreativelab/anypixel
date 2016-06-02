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
#include "debugpin.h"

/**
 * Configures pins and GPIO peripheral clocks
 */
void DEBUGPIN_Config(void) {
	// enable clock to the relevant IO PORT(s)
	RCC_AHBPeriphClockCmd(DEBUGPIN_POWER_AHB, ENABLE);

    CONFIG_pins(pins_debug, DEBUGPIN_NUM);
}

/**
 * toggle the logic level of the desired pin
 * @param index Specifies which of the debug pins to change
 */
inline void DEBUGPIN_Toggle(uint8_t index) {
    assert(index < DEBUGPIN_NUM);
    //GPIO_ToggleBits(pins_debug[index].GPIOx, pins_debug[index].pin);
    //FIXME this implementation is untested and was just implemented since the F0 std lib doesn't seem to include the toggle function (processor doesn't have toggle register)
    if(GPIO_ReadInputDataBit(pins_debug[index].GPIOx,pins_debug[index].pin) == Bit_SET)
        GPIO_ResetBits(pins_debug[index].GPIOx, pins_debug[index].pin);
    else
        GPIO_SetBits(pins_debug[index].GPIOx, pins_debug[index].pin);
}

/**
 * set the desired pin to high logic level
 * @param index Specifies which of the debug pins to change
 */
inline void DEBUGPIN_High(uint8_t index) {
    assert(index < DEBUGPIN_NUM);
    GPIO_SetBits(pins_debug[index].GPIOx, pins_debug[index].pin);
}

/**
 * set the desired pin to low logic level
 * @param index Specifies which of the debug pins to change
 */
inline void DEBUGPIN_Low(uint8_t index) {
    assert(index < DEBUGPIN_NUM);
    GPIO_ResetBits(pins_debug[index].GPIOx, pins_debug[index].pin);
}

/**
 * set all the pins based on the value of the parameter
 * @param state The number whose bits will be used as the pin values
 */
void DEBUGPIN_Num(uint16_t state) {
    int i;
    for(i=0; i < DEBUGPIN_NUM; i++) {
        if(state & 1)
            GPIO_SetBits(pins_debug[i].GPIOx, pins_debug[i].pin);
        else
            GPIO_ResetBits(pins_debug[i].GPIOx, pins_debug[i].pin);
        state >>= 1;
    }
}
