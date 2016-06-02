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

#ifndef __DEBUGPIN_H
#define __DEBUGPIN_H

//#define USE_DEBUG_PINS

void PIN_Config(void);
void PIN_Toggle(const CONFIG_Pin_TypeDef *pins, uint8_t index);
void PIN_High(const CONFIG_Pin_TypeDef *pins, uint8_t index);
void PIN_Low(const CONFIG_Pin_TypeDef *pins, uint8_t index);
void PIN_Num(const CONFIG_Pin_TypeDef *pins, uint16_t state, uint8_t num_pins);
bool PIN_State(const CONFIG_Pin_TypeDef *pins, uint8_t index);

#ifdef USE_DEBUG_PINS
 #define DEBUGPIN_TGL(idx) pins_debug[idx].GPIOx->ODR ^= pins_debug[idx].pin
 #define DEBUGPIN_SET(idx) pins_debug[idx].GPIOx->BSRRL = pins_debug[idx].pin
 #define DEBUGPIN_CLR(idx) pins_debug[idx].GPIOx->BSRRH = pins_debug[idx].pin
#else
 #define DEBUGPIN_TGL(idx) {}
 #define DEBUGPIN_SET(idx) {}
 #define DEBUGPIN_CLR(idx) {}
#endif

#endif // __DEBUGPIN_H
