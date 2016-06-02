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

#include "LEDproto.h"

const uint16_t pkt_udp_payload_len_by_type[] = {0, 588, 882, 882, 588, 882, 588, 441};

/**
 * Set a value in a 12bit packed array
 * @param index The index of the 6bit element in the bit stream
 * @param value The value to which the indexed element will be set
 */
void pack12bit(uint8_t *buf, int index, uint16_t inVal) {
    int addr = (index * 12) / 8;
    int offset = 4-(index * 12) % 8;
    // compute the mask and value shifted into the correct location in the bit array
    uint16_t value = (inVal & 0xFFF) << offset;
    uint16_t mask = ~(0x0FFF << offset);

    // zero out the bits we are working on
    buf[addr]   &= mask >> 8;
    buf[addr+1] &= mask & 0xFF;
    // copy the value into the destination
    buf[addr]   |= value >> 8;
    buf[addr+1] |= value & 0xFF;
}

/**
 * Extract a value from a 12bit packed array
 * @param index The index of the 6bit element in the bit stream
 */
uint16_t unpack12bit(uint8_t *buf, int index) {
    uint16_t retval = 0;
    int addr = (index * 12) / 8;
    int offset = 4-(index * 12) % 8;

    // compute the mask shifted into the correct location in the bit array
    uint16_t mask = (0x0FFF << offset);

    // extract the relevant bytes
    retval = buf[addr] << 8 | buf[addr+1];
    // mask of the unwanted bits
    retval &= mask;
    // shift into the LSBs
    retval >>= offset;
    return retval;
}

/**
 * Set a value in the 6bit packed array
 * @param index The index of the 6bit element in the bit stream
 * @param value The value to which the indexed element will be set
 */
void pack6bit(uint8_t *buf, int index, uint8_t inVal) {
    int addr = (index * 6) / 8;
    int offset = 10-(index * 6) % 8;
    // compute the mask and value shifted into the correct location in the bit array
    uint16_t value = (inVal & 0x3F) << offset;
    uint16_t mask = ~(0x003F << offset);

    // zero out the bits we are working on
    buf[addr]   &= mask >> 8;
    buf[addr+1] &= mask & 0xFF;
    // copy the value into the destination
    buf[addr]   |= value >> 8;
    buf[addr+1] |= value & 0xFF;
}

/**
 * Extract a value from a 6bit packed array
 * @param index The index of the 6bit element in the bit stream
 */
uint8_t unpack6bit(uint8_t *buf, int index) {
    uint16_t retval = 0;
    int addr = (index * 6) / 8;
    int offset = 10-(index * 6) % 8;

    // compute the mask shifted into the correct location in the bit array
    uint16_t mask = (0x003F << offset);

    // extract the relevant bytes
    retval = buf[addr] << 8 | buf[addr+1];
    // mask of the unwanted bits
    retval &= mask;
    // shift into the LSBs
    retval >>= offset;
    return retval;
}
