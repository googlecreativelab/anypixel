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

#include "11AA02E48.h"

// Implementation of Microchip UNI/O Manchester encoded single wire eeprom interface
// inspiration from https://github.com/sde1000/NanodeUNIO/blob/master/NanodeUNIO.cpp

static const CONFIG_Pin_TypeDef pin = EEPROM_PIN_CONF;
static uint16_t pin_mask;

#define UNIO_START 0x55
#define UNIO_READ  0x03
#define UNIO_CRRD  0x06
#define UNIO_WRITE 0x6c
#define UNIO_WREN  0x96
#define UNIO_WRDI  0x91
#define UNIO_RDSR  0x05
#define UNIO_WRSR  0x6e
#define UNIO_ERAL  0x6d
#define UNIO_SETAL 0x67

#define T_STBY 1000
#define T_HDR_SETUP   100
#define T_HDR_LOW  100
#define T_QTR_BIT 16

#define PIN_HIGH pin.GPIOx->BSRR = pin.pin;
#define PIN_LOW pin.GPIOx->BRR = pin.pin;

/**
 * Basic setup of pin
 */
void eeprom_Config(void) {
    RCC_AHBPeriphClockCmd(EEPROM_AHB, ENABLE);
    CONFIG_pins(&pin, 1);
    pin_mask = ~pin.pin;
}

/**
 * Perform a single bit transaction
 *    read: q0=1, q2=1
 * write 0: q0=1, q2=0
 * write 1: q0=0, q2=1
 */
static bool rwbit(bool q0, bool q2) {
    bool q1, q3;
    pin.GPIOx->ODR = q0 ? pin.GPIOx->ODR | pin.pin : pin.GPIOx->ODR & pin_mask;
    usleep(T_QTR_BIT);
    q1 = pin.GPIOx->IDR & pin.pin;
    usleep(T_QTR_BIT);
    pin.GPIOx->ODR = q2 ? pin.GPIOx->ODR | pin.pin : pin.GPIOx->ODR & pin_mask;
    usleep(T_QTR_BIT);
    q3 = pin.GPIOx->IDR & pin.pin;
    usleep(T_QTR_BIT);

    return !q1 && q3;
}

/**
 * Send a single byte with control over the acknowledgment bit
 * @param byte The byte to send
 * @param mak The master acknowledgment to send at the end of the transaction
 * @return The slave acknowledgment bit received
 */
static bool send_byte(uint8_t byte, bool mak) {
    uint8_t i;
    for(i = 0; i < 8; i++) {
        rwbit(!(byte & 0x80), (byte & 0x80));
        byte <<= 1;
    }
    rwbit(!mak, mak);
    return rwbit(true, true); // return the SAK
}

/**
 * Receive a single byte with control over the acknowledgment bit
 * @param byte A pointer to where the received byte will be stored
 * @param mak The master acknowledgment to send at the end of the transaction
 * @return The slave acknowledgment bit received
 */
static bool recv_byte(uint8_t *byte, bool mak) {
    uint8_t i, work;
    for(i = 0; i < 8; i++)
        work = (work << 1) | rwbit(true, true);
    *byte = work;
    rwbit(!mak, mak);
    return rwbit(true, true); // return the SAK
}

/**
 * Performs a read for a block of bytes from a given address
 * @param buf A pointer into a buffer where the received bytes will be stored
 * @param addr The memory location on the target device to be read
 * @param len The number of bytes to be read
 * @return True if all transaction succeed, otherwise false
 */
static bool read_block(uint8_t *buf, uint16_t addr, uint16_t len) {
    int i;
    bool retval = true;
    // send start header
    PIN_HIGH;
    usleep(T_STBY);
    PIN_LOW;
    usleep(T_HDR_LOW);
    send_byte(UNIO_START, true);
    // send command header
    retval &= send_byte(0xA0, true);
    retval &= send_byte(UNIO_READ, true);
    retval &= send_byte(addr >> 8, true);
    retval &= send_byte(addr & 0xFF, true);
    // recv payload
    for(i = 0; i < len; i++) {
        retval &= recv_byte( buf+i, i != (len-1) );
    }
    return retval;
}

/**
 * Read the 48 bit unique ID from a 11AA02E48 chip
 * @param MACaddr A pointer to the location where the received bytes will be stored
 * @return true on success, otherwise false
 */
bool eeprom_ReadMAC(uint8_t *MACaddr) {
    int i;
    bool retval;
    for(i = 0; i < 10; i++) {
        retval = read_block(MACaddr, 0xFA, 6);
        if(retval)
            break;
        usleep(1000000);
    }
    if(!retval) {
        for(i = 0; i < 6; i++)
            MACaddr[i] = 0xFF;
    }
    return retval;
}
