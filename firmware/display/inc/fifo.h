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

#ifndef __FIFO_H
#define __FIFO_H

#include <stdint.h>
#include <stdbool.h>

typedef struct {
	uint8_t *buffer;
	uint16_t head;
	uint16_t tail;
	uint16_t size;
	uint16_t free;
	uint32_t overrun;
} FIFO_Data_TypeDef;

bool FIFO_InitStruct(FIFO_Data_TypeDef *inStruct, uint8_t* inBuf, uint16_t inBufSize);
bool FIFO_write(FIFO_Data_TypeDef *inStruct, uint8_t inByte);
bool FIFO_write_bytes(FIFO_Data_TypeDef *inStruct, uint8_t *inBytes, uint16_t count);
bool FIFO_read(FIFO_Data_TypeDef *inStruct, uint8_t *outByte, uint16_t count);
uint16_t FIFO_read_until(FIFO_Data_TypeDef *inStruct, uint8_t *outByte, uint16_t max, const char *searchList, uint8_t listLength);
uint16_t FIFO_read_token(FIFO_Data_TypeDef *inStruct, uint8_t *outBytes, uint16_t max, const char *delimiters, uint8_t listLength);
uint8_t FIFO_peek(FIFO_Data_TypeDef *inStruct);
uint16_t FIFO_available(FIFO_Data_TypeDef *inStruct);
uint16_t FIFO_free(FIFO_Data_TypeDef *inStruct);

#endif /* __FIFO_H */
