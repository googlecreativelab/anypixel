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
#include "pins.h"

/**
 * Configures pins and GPIO peripheral clocks
 */
void PIN_Config(void) {
    RCC_AHB1PeriphClockCmd(PIN_POWER_AHB1, ENABLE);
    #ifdef USE_DEBUG_PINS
        // enable clock to the relevant IO PORT(s)
        RCC_AHB1PeriphClockCmd(DEBUGPIN_POWER_AHB1, ENABLE);

        CONFIG_pins(pins_debug, DEBUGPIN_NUM);
    #endif
}

/**
 * toggle the logic level of the desired pin
 * @param pins pointer to a list of pin configuration structures
 * @param index Which of the pins in the list to access
 */
inline void PIN_Toggle(const CONFIG_Pin_TypeDef *pins, uint8_t index) {
    GPIO_ToggleBits(pins[index].GPIOx, pins[index].pin);
}

/**
 * set the desired pin to high logic level
 * @param pins pointer to a list of pin configuration structures
 * @param index Which of the pins in the list to access
 */
inline void PIN_High(const CONFIG_Pin_TypeDef *pins, uint8_t index) {
    GPIO_SetBits(pins[index].GPIOx, pins[index].pin);
}

/**
 * set the desired pin to low logic level
 * @param pins pointer to a list of pin configuration structures
 * @param index Which of the pins in the list to access
 */
inline void PIN_Low(const CONFIG_Pin_TypeDef *pins, uint8_t index) {
    GPIO_ResetBits(pins[index].GPIOx, pins[index].pin);
}

/**
 * read the state of a specific pin
 * @param pins pointer to a list of pin configuration structures
 * @param index Which of the pins in the list to access
 * @return the state of the specified pin
 */
bool PIN_State(const CONFIG_Pin_TypeDef *pins, uint8_t index) {
    return GPIO_ReadInputDataBit(pins[index].GPIOx, pins[index].pin);
}

/**
 * set all the pins based on the value of the parameter
 * @param pins pointer to a list of pin configuration structures
 * @param state The number whose bits will be used as the pin values
 * @param num_pins The number of bits in state to map to pins in the list of pins pointed to by pins parameter
 */
void PIN_Num(const CONFIG_Pin_TypeDef *pins, uint16_t state, uint8_t num_pins) {
    int i;
    for(i = 0; i < num_pins; i++) {
        if(state & 1)
            GPIO_SetBits(pins[i].GPIOx, pins[i].pin);
        else
            GPIO_ResetBits(pins[i].GPIOx, pins[i].pin);
        state >>= 1;
    }
}
