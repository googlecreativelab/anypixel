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

#ifndef LEDPROTO_H
#define LEDPROTO_H

#include <stdint.h>

#define PKT_TYPE_8BIT_CAL 1
#define PKT_TYPE_GSVALS 2
#define PKT_TYPE_DOTCORRECT_PACK12 3
#define PKT_TYPE_8BIT_RAW 4
#define PKT_TYPE_SET_LOOKUP 5
#define PKT_TYPE_DOTCORRECT_PACK8 6
#define PKT_TYPE_DOTCORRECT_PACK6 7
#define PKT_TYPE_GET_LOOKUP 8
// fan config never gets sent to LED boards, just controlled by header parameters in normal packets
#define PKT_TYPE_FAN_CONFIG 9
#define PKT_TYPE_RELAY_CTRL 0x10
// requires a value of 0x816A4EB2 in the payload to allow reboot
#define PKT_TYPE_REBOOT 0xF0

#define PKT_TYPE_BL_INIT         0x20
#define PKT_TYPE_BL_UNLOCK_FLASH 0x21
#define PKT_TYPE_BL_ERASE_FLASH  0x22
#define PKT_TYPE_BL_READ_BLOCK   0x23
#define PKT_TYPE_BL_WRITE_BLOCK  0x24
#define PKT_TYPE_BL_CHECKSUM_APP 0x25
#define PKT_TYPE_BL_START_APP    0x26
#define PKT_TYPE_BL_NOP          0x27
#define PKT_TYPE_BL_GET_ADDR     0x28

extern const uint16_t pkt_udp_payload_len_by_type[];

#define LED_PACKET_HEADER_LEN (4)
#define LED_PACKET_PAYLOAD_LEN (240)
#define LED_PACKET_LEN (LED_PACKET_HEADER_LEN + LED_PACKET_PAYLOAD_LEN)

// for all pkt types other than SET_LOOKUP param1-3 contain two packed 12-bit values.  The first is fan pwm, the second is bonus LED pwm

struct pkt_struct {
    uint8_t type;
    uint8_t param1;
    uint8_t param2;
    uint8_t param3;
    uint8_t payload[LED_PACKET_PAYLOAD_LEN];
};

typedef union {
	struct pkt_struct s;
	char a[sizeof(struct pkt_struct)];
	uint8_t ua[sizeof(struct pkt_struct)];
} ledPacket_type;


void pack12bit(uint8_t *buf, int index, uint16_t inVal);
uint16_t unpack12bit(uint8_t *buf, int index);
void pack6bit(uint8_t *buf, int index, uint8_t inVal);
uint8_t unpack6bit(uint8_t *buf, int index);

#endif // LEDPROTO_H
