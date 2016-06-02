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

#ifndef __UART_H
#define __UART_H

#include "project_config.h"

void UART_Config(CONFIG_USART_ConfigState *cfg);
bool UART_SendBytes(CONFIG_USART_ConfigState *cfg, const char *buf, uint16_t length, bool block);
uint16_t UART_RX_available(CONFIG_USART_ConfigState *cfg);
bool UART_RX_read(CONFIG_USART_ConfigState *cfg, char *outBuffer, uint16_t count);
uint16_t UART_RX_readline(CONFIG_USART_ConfigState *cfg, char *outBuffer, uint16_t max);
void USART_IRQ_Handler(CONFIG_USART_ConfigState *cfg);

#endif /* __UART_H */
