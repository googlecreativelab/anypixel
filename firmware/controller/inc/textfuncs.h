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

#ifndef __TEXTFUNCS_H
#define __TEXTFUNCS_H

#include <stdint.h>
#include <stdbool.h>

extern uint8_t num2hex[];

int TEXT_strcpy(uint8_t *buf, const char *inStr);
int TEXT_strncmp(uint8_t *buf, const char *inStr, uint16_t num);
uint16_t TEXT_deleteWhiteSpace(uint8_t *buf, uint16_t len);
uint8_t TEXT_parseInt(uint8_t *buf, int *result);
uint16_t TEXT_numToString(uint8_t *buf, int32_t value, int16_t bufSize, uint8_t minLen, uint8_t padChar, bool padBeforeSign);
uint16_t TEXT_numToHexString(uint8_t *buf, uint32_t value, int16_t bufSize, uint8_t minLen, uint8_t padChar);


#endif /* __TEXTFUNCS_H */
