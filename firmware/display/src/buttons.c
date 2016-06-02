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
#include "buttons.h"

void BUTTONS_Config(void) {
	// enable clock to the relevant IO PORT(s)
	RCC_AHBPeriphClockCmd(BUTTONS_POWER_AHB, ENABLE);

    CONFIG_pins(pins_buttons, BUTTONS_NUM);
}

uint32_t BUTTONS_Read_All(void) {
	int8_t i;
	uint32_t result = 0;
	for(i = BUTTONS_NUM-1; i >= 0; i--)
		result = (result << 1) | BUTTONS_Read(i);
	return result;
}

uint8_t BUTTONS_Read(uint8_t index) {
	if(GPIO_ReadInputDataBit(pins_buttons[index].GPIOx, pins_buttons[index].pin) == ((BUTTONS_POLARITY >> index) & 1) )
		return 1;
	else
		return 0;
}
