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

/* Includes ------------------------------------------------------------------*/
#include "project_config.h"
#include "stm32f4x7_eth.h"
#include "netconf.h"
#include "main.h"
#include <stdio.h>
#include <string.h>
#include "fifo.h"
#include "textfuncs.h"
#include "buttons.h"
#include "LEDproto.h"
#include "uart.h"
#include "pins.h"
#include <math.h>

#include "lwip/udp.h"
#include "lwip/debug.h"

/* Private typedef -----------------------------------------------------------*/
/* Private define ------------------------------------------------------------*/
#define SYSTEMTICK_PERIOD_MS  1
#define PANEL_NW 0
#define USART_NW 3

#define PANEL_NE 1
#define USART_NE 0

#define PANEL_SW 2
#define USART_SW 2

#define PANEL_SE 3
#define USART_SE 1

#define POWER_ROW 3

#define BL_MODE_INACTIVE 0
#define BL_MODE_WAITING 1
#define BL_MODE_ACTIVE 2

//#define TEST_MODES

/* Private macro -------------------------------------------------------------*/
/* Private variables ---------------------------------------------------------*/
__IO uint32_t LocalTime = 0; /* this variable is used to create a time reference incremented by 1ms */
uint32_t timingdelay;

int activePacketIdx = 0;
int readingPacketIdx = 1;
int32_t packets[2][128];
uint32_t lastPacketTime = 0;
uint32_t lastUDPReceivePacketTime = 0;
uint32_t lastButtonPacketTime = 0;
uint32_t lastStatusPacketTime = 0;
uint32_t debugRebootTime = 0;
int debugRebootVal = 1;

int maxPacketDelay = 33;  // at a minimum send a packet every 33ms
int minPacketDelay = 12;  // don't send packets any faster than this to the LED board
int minButtonPacketDelay = 33;
int minStatusPacketDelay = 250;

int activeValveCount = 0;

// these are actually defined as extern in main.h
int IP_lastOctet;
int mac_last_octet;

struct udp_pcb * global_pcb;
struct ip_addr udp_dest;

int global_row = -1;
int global_column = -1;


int bootloaderMode = BL_MODE_INACTIVE;
int bootloaderTimeout = 5000;

const uint8_t panelLEDmap[] = { 87, 88, 89,  90, 91, 92,  93, 94, 95,  65, 66, 67,  68, 69, 70, 100,101,102, 103,104,105,
                                84, 85, 86,  81, 82, 83,  77, 78, 79,  74, 75, 76,  71, 72, 73,  97, 98, 99, 106,107,108,
                                55, 56, 57,  58, 59, 60,  61, 62, 63,  33, 34, 35,  36, 37, 38, 125,126,127, 109,110,111,
                                52, 53, 54,  49, 50, 51,  45, 46, 47,  42, 43, 44,  39, 40, 41, 122,123,124, 113,114,115,
                                23, 24, 25,  26, 27, 28,  29, 30, 31,   1,  2,  3,   4,  5,  6, 119,120,121, 116,117,118,
                                20, 21, 22,  17, 18, 19, 151,152,153, 154,155,156, 157,158,159, 129,130,131, 132,133,134,
                                13, 14, 15,  10, 11, 12, 148,149,150, 145,146,147, 141,142,143, 138,139,140, 135,136,137 };

const uint8_t panelButtonMap[] = { 96, 97, 98, 99,100,148,153,
                                  101,102,103,104,105,147,152,
                                   48, 49, 50, 51, 52,146,151,
                                   53, 54, 55, 56, 57,145,150,
                                    0,  1,  2,  3,  4,144,149,
                                    5,  6,192,193,194,195,196,
                                    7,  8,197,198,199,200,201 };

ledPacket_type ledpackets[4];

// default fixed point 30.0==7680
uint16_t fan_slope[4] = {7680,7680,7680,7680}; // 8 bits fractional component
uint16_t fan_intercept[4] = {800,800,800,800}; // duty cycle at 80 degrees F
uint16_t fan_min[4] = {300,300,300,300};       // minimum fan duty cycle
uint16_t fan_duty[4] = {1024,1024,1024,1024};  // active fan duty cycle
uint16_t fan_setpoint[4] = {1024,1024,1024,1024}; // initial fan setpoint
uint8_t fan_mode[4] = {1,1,1,1};               // fan mode 0->setpoint mode, 1->temperature based auto mode
uint8_t fan_tach[4][9];                        // fan speed window filter.  First 8 entries are readings, 9th entry is index where next reading will be stored within the 8 entries.
uint8_t serialNum[4][6];                       // serial number values retrieved from the LED boards
uint32_t uptimes[20];                          // uptimes for the 5 processors on each of the 4 LED boards

uint8_t buttonpacket[29] = {32,0,0,0,
                            0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0};
uint8_t temperatures[196];
uint8_t panel_avg_temp[4];

/* Private function prototypes -----------------------------------------------*/

/* Private functions ---------------------------------------------------------*/

/**
 * Set the 12bit PWM value for an LED channel based on full panel(4 LED PCBs) addressing
 * @param index row * 3(RGB) * 14(LEDs/row) + column
 * @param value the new value to assign to the indexed entry
 */
void globalSet(int index, int value) {
    int global_row = index / 3 / 14;
    int global_column = (index / 3) % 14;
    int channel = index % 3;
    int panel_row = global_row % 7;
    int panel_column = global_column % 7;
    int panel_index = (global_row / 7)*2+(global_column / 7);
    pack12bit(ledpackets[panel_index].s.payload, panelLEDmap[(panel_row*7+panel_column)*3+channel], value);
}
/**
 * Set the 8bit PWM value for an LED channel based on full panel(4 LED PCBs) addressing
 * @param index row * 3(RGB) * 14(LEDs/row) + column
 * @param value the new value to assign to the indexed entry
 */
void globalSet8bit(int index, uint8_t value) {
    int global_row = index / 3 / 14;
    int global_column = (index / 3) % 14;
    int channel = index % 3;
    int panel_row = global_row % 7;
    int panel_column = global_column % 7;
    int panel_index = (global_row / 7)*2+(global_column / 7);
    int addr = panelLEDmap[(panel_row*7+panel_column)*3+channel];
    addr += (addr>>5)*16;   // make sure things are in the correct places for the 5 LED board CPUs to find them
    ledpackets[panel_index].s.payload[addr] = value;
}
/**
 * Update the bit in the button packet corresponding to a specific button.  Addressing is based on row/column on a specific LED board
 * @param boardButtonIndex The index of the button within a specific LED board (row*7+column)
 * @param value The state of the button
 * @param panel The quadrant of the panel which the specific board occupies
 */
void globalButtonSet(int boardButtonIndex, int value, int panel) {
    int col = boardButtonIndex % 7;
    int row = boardButtonIndex / 7;
    int bitAddr;

    switch(panel) {
        case PANEL_NW:
            bitAddr = row * 14 + col;
            break;
        case PANEL_NE:
            bitAddr = row * 14 + col + 7;
            break;
        case PANEL_SW:
            bitAddr = (row + 7) * 14 + col;
            break;
        case PANEL_SE:
            bitAddr = (row + 7) * 14 + col + 7;
            break;
    }
    int byteAddr = bitAddr / 8;
    int bitOffset = 7-(bitAddr - (byteAddr*8));

    if(value)
        buttonpacket[4+byteAddr] |= (1 << bitOffset);
    else
        buttonpacket[4+byteAddr] &= ~(1 << bitOffset);
}
/**
 * Read the bit in the button packet corresponding to a specific button.  Addressing is based on row/column on a specific LED board
 * @param boardButtonIndex The index of the button within a specific LED board (row*7+column)
 * @param panel The quadrant of the panel which the specific board occupies
 * @return true if the button is pressed, otherwise false
 */
 bool globalGetButtonState(int boardButtonIndex, int panel) {
    int col = boardButtonIndex % 7;
    int row = boardButtonIndex / 7;
    int bitAddr;

    switch(panel) {
        case PANEL_NW:
            bitAddr = row * 14 + col;
            break;
        case PANEL_NE:
            bitAddr = row * 14 + col + 7;
            break;
        case PANEL_SW:
            bitAddr = (row + 7) * 14 + col;
            break;
        case PANEL_SE:
            bitAddr = (row + 7) * 14 + col + 7;
            break;
    }
    int byteAddr = bitAddr / 8;
    int bitOffset = 7-(bitAddr - (byteAddr*8));
    if( buttonpacket[4+byteAddr] & (1 << bitOffset) )
        return true;
    return false;
}

/**
 * Checks for data from one of the LED boards and if a full packet is available it is read from the FIFO
 * and processed to update fan speed, temperatures and average temperature, serial number, and uptimes
 * @param usart_idx Index of the USART struct to read data from
 * @param panel_idx location of the board within the panel connected to this USART
 */
void handle_feedback(int usart_idx, int panel_idx) {
    int i, r, c;
    int row_offset, col_offset;
    int workTemp, avgTemp;
    ledPacket_type inPkt;
    DEBUGPIN_SET(1);
    i = UART_RX_frame_available(&usarts[usart_idx]);
    //printf("avail=%d ",i);
    switch(panel_idx) {
        case PANEL_NW:
            row_offset = 0; col_offset = 0; break;
        case PANEL_NE:
            row_offset = 0; col_offset = 7; break;
        case PANEL_SW:
            row_offset = 7; col_offset = 0; break;
        case PANEL_SE:
            row_offset = 7; col_offset = 7; break;
    }

    if(i == LED_PACKET_LEN) { // got valid packet length so process
        UART_RX_read(&usarts[usart_idx], inPkt.a, i);
        avgTemp = 0;

        if(inPkt.s.type >= 0x20)
            return;

        for(r = 0; r < 7; r++) {
            for(c = 0; c < 7; c++) {
                // update button state in global map
                globalButtonSet(7*r+c, inPkt.s.payload[ panelButtonMap[7*r+c] ], panel_idx);
                // update temperatures
                workTemp = inPkt.s.payload[ panelButtonMap[7*r+c] + 10 ];
                temperatures[14*(r+row_offset)+c+col_offset] = workTemp;
                avgTemp += workTemp;
            }
        }
        avgTemp /= 49;
        panel_avg_temp[panel_idx] = avgTemp;

        // calculate new fan speed if in auto mode
        if(fan_mode[panel_idx] == 1)
            fan_duty[panel_idx] = ((fan_slope[panel_idx]*(avgTemp-80)) >> 8) + fan_intercept[panel_idx];
            if(fan_duty[panel_idx] < fan_min[panel_idx])
                fan_duty[panel_idx] = fan_min[panel_idx];

        // update fan status
        uint32_t workVal = 0;
        for(i = 0; i < 4; i++) {
            workVal <<= 8;
            workVal |= inPkt.s.payload[48*3+20+i];
        }
        if(workVal == 65535)
            workVal = 0;
        else
            workVal = 360000/workVal;

        if(workVal == 0 || (workVal > 7 && workVal < 250)) {
            fan_tach[panel_idx][fan_tach[panel_idx][8]&0x07] = (uint8_t)workVal;
            fan_tach[panel_idx][8]++;
        }

        // update serial number
        for(i = 0; i < 6; i++)
            serialNum[panel_idx][i] = inPkt.s.payload[20+i];

        // update uptimes (5 per panel)
        uptimes[panel_idx] = 0;
        for(i = 0; i < 4; i++) {
            uptimes[panel_idx] <<= 8;
            uptimes[panel_idx] |= inPkt.s.payload[48*3+32+i];
        }
    } else {
        if(i > 0) { // got unexpected length packet so flush buffer
            char buf[512];
            if(i > 512)
                i = 512;
            UART_RX_read(&usarts[usart_idx], buf, i);
        }
    }
    DEBUGPIN_CLR(1);
}

/**
 * handle responses from last packets and send out new packets to each of the 4 LED boards
 */
void sendLEDpackets(void) {
    // read before writing so there was enough time to get things back
    handle_feedback(USART_NW, PANEL_NW);
    handle_feedback(USART_SW, PANEL_SW);
    handle_feedback(USART_SE, PANEL_SE);
    handle_feedback(USART_NE, PANEL_NE);

    UART_SendBytes(&usarts[3], ledpackets[PANEL_NW].a, sizeof(ledPacket_type));
    UART_SendBytes(&usarts[2], ledpackets[PANEL_SW].a, sizeof(ledPacket_type));
    UART_SendBytes(&usarts[1], ledpackets[PANEL_SE].a, sizeof(ledPacket_type));
    UART_SendBytes(&usarts[0], ledpackets[PANEL_NE].a, sizeof(ledPacket_type));
    lastPacketTime = LocalTime;
}

/**
 * Send request for and wait for response from LED board when reading back 8bit->12bit mapping lookup table entries
 * @param outpkt Packet buffer used for sending the lookup request to the LED board (this could probably just be a local variable)
 * @param udpPayload The udp packet buffer into which values are read and will eventually be sent to the the control computer
 * @param index Which of the 65 tables to read (0-64).
 * @param usart Which USART to use
 * @param panel Which panel quadrant is this board located in
 * @return true on success, false if reading fails more than 3 times
 */
static bool lookupTableReadbackHelper(ledPacket_type *outpkt, uint8_t *udpPayload, int index, int usart, int panel) {
    int fail_count = 0;
    int row_offset, col_offset;
    int r,c, len;
    ledPacket_type inpkt;

    outpkt->s.type = PKT_TYPE_GET_LOOKUP;
    outpkt->s.param1 = index;

    switch(panel) {
        case PANEL_NW:
            row_offset = 0; col_offset = 0; break;
        case PANEL_NE:
            row_offset = 0; col_offset = 7; break;
        case PANEL_SW:
            row_offset = 7; col_offset = 0; break;
        case PANEL_SE:
            row_offset = 7; col_offset = 7; break;
    }

    while(1) {
        UART_SendBytes(&usarts[usart], outpkt->a, sizeof(ledPacket_type));
        Delay(20);
        len = UART_RX_frame_available(&usarts[usart]);
        if(len == LED_PACKET_LEN) { // got valid packet length so process
            UART_RX_read(&usarts[usart], inpkt.a, len);
            break;
        } else {
            if(len > 0) { // got unexpected length packet so flush buffer
                char buf[512];
                if(len > 512)
                    len = 512;
                UART_RX_read(&usarts[usart], buf, len);
            }
            if(fail_count++ > 3)
                return false;
        }
    }
    // get inpkt contents moved to udpPayload
    for(r = 0; r < 7; r++) {
        for(c = 0; c < 7; c++) {
            pack12bit(udpPayload, ((r+row_offset)*14+(c+col_offset))*3, unpack12bit(inpkt.s.payload, panelLEDmap[(r*7+c)*3]) );
            pack12bit(udpPayload, ((r+row_offset)*14+(c+col_offset))*3+1, unpack12bit(inpkt.s.payload, panelLEDmap[(r*7+c)*3+1]) );
            pack12bit(udpPayload, ((r+row_offset)*14+(c+col_offset))*3+2, unpack12bit(inpkt.s.payload, panelLEDmap[(r*7+c)*3+2]) );
        }
    }
    return true;
}

/**
 * read back all the lookup tables from all 4 LED boards and send them to the control computer
 */
static void doLookupTableReadback() {
    int i, failcount;
    ledPacket_type pkt;
    struct pbuf *p;
    bool result = false;

    if(global_row == POWER_ROW)
        return;

    p = pbuf_alloc(PBUF_TRANSPORT, 196*3*3/2+4, PBUF_RAM);

    failcount = 0;
    i = 0;
    do {
        result = false;
        result |= lookupTableReadbackHelper(&pkt, p->payload+4, i, USART_NW, PANEL_NW);
        result |= lookupTableReadbackHelper(&pkt, p->payload+4, i, USART_NE, PANEL_NE);
        result |= lookupTableReadbackHelper(&pkt, p->payload+4, i, USART_SW, PANEL_SW);
        result |= lookupTableReadbackHelper(&pkt, p->payload+4, i, USART_SE, PANEL_SE);
        if(result != false) { // only continue if at least one succeeded
            ((uint8_t*)p->payload)[0] = 0x23;
            ((uint8_t*)p->payload)[1] = i;
            if( udp_sendto(global_pcb, p, &udp_dest, 27482) != ERR_OK ) {
                Delay(100);
                LwIP_Periodic_Handle(LocalTime);
                continue;
            }
            Delay(20);
            LwIP_Periodic_Handle(LocalTime);
            i++;
            failcount = 0;
        } else {
            if(failcount++ > 4)
                break;
        }
    } while(i < 65);

    /* free the pbuf */
    pbuf_free(p);
}

/**
 * UDP packet received callback function (performs the bulk of Ethernet side protocol implementation)
 */
void udp_process_recv_packet(void *arg, struct udp_pcb *pcb, struct pbuf *p, struct ip_addr *addr, u16_t port)
{
    int i, pixValue;
    static int pktCount = 0;
    uint8_t workType;
    uint8_t workParam;

    DEBUGPIN_SET(0);

    pktCount++;

    if (p != NULL) {
        lastUDPReceivePacketTime = LocalTime;
        workType = ((uint8_t*)p->payload)[0];
        switch( workType ) {
            case PKT_TYPE_8BIT_CAL:
                for(i = 0; i < 196*3; i++) {
                    pixValue = ((uint8_t*)p->payload)[16+i];
                    globalSet8bit(i, pixValue);
                }
                break;
            case PKT_TYPE_GSVALS:
                for(i = 0; i < 196*3; i++) {
                    pixValue = unpack12bit(p->payload+16, i);
                    globalSet(i, pixValue);
                }
                break;
            case PKT_TYPE_DOTCORRECT_PACK12:
                for(i = 0; i < 196*3; i++) {
                    pixValue = unpack12bit(p->payload+16, i);
                    globalSet(i, pixValue);
                }
                break;
            case PKT_TYPE_8BIT_RAW:
                for(i = 0; i < 196*3; i++) {
                    pixValue = ((uint8_t*)p->payload)[16+i];
                    globalSet8bit(i, pixValue);
                }
                break;
            case PKT_TYPE_SET_LOOKUP:
                for(i = 0; i < 196*3; i++) {
                    pixValue = unpack12bit(p->payload+16, i);
                    globalSet(i, pixValue);
                }
                workParam = ((uint8_t*)p->payload)[6];
                break;
            case PKT_TYPE_DOTCORRECT_PACK8:
                for(i = 0; i < 196*3; i++) {
                    pixValue = ((uint8_t*)p->payload)[16+i];
                    globalSet(i, pixValue);
                }
                workType = PKT_TYPE_DOTCORRECT_PACK12;
                break;
            case PKT_TYPE_DOTCORRECT_PACK6:
                for(i = 0; i < 196*3; i++) {
                    pixValue = unpack6bit(p->payload+16, i);
                    globalSet(i, pixValue);
                }
                workType = PKT_TYPE_DOTCORRECT_PACK12;
                break;
            case PKT_TYPE_GET_LOOKUP:
                doLookupTableReadback();
                pbuf_free(p);
                DEBUGPIN_CLR(0);
                return;
            case PKT_TYPE_FAN_CONFIG:
                {
                    uint8_t *pl = p->payload+16;
                    for(i = 0; i < 4; i++) {
                        fan_setpoint[i]  = (pl[   i*2] << 8) | pl[   i*2+1];
                        fan_mode[i]      =  pl[ 8+i  ];
                        fan_slope[i]     = (pl[12+i*2] << 8) | pl[12+i*2+1];
                        fan_intercept[i] = (pl[20+i*2] << 8) | pl[20+i*2+1];
                        fan_min[i]       = (pl[28+i*2] << 8) | pl[28+i*2+1];
                        if(fan_mode[i] == 0)
                            fan_duty[i] = fan_setpoint[i];
                    }
                }
                break;
            case PKT_TYPE_RELAY_CTRL:
                if(((uint8_t*)(p->payload+16))[0] != 0)
                    PIN_High(pins_powerctrl, PWR_CTRL_AC_0);
                else
                    PIN_Low(pins_powerctrl, PWR_CTRL_AC_0);

                if(((uint8_t*)(p->payload+16))[1] != 0)
                    PIN_High(pins_powerctrl, PWR_CTRL_AC_1);
                else
                    PIN_Low(pins_powerctrl, PWR_CTRL_AC_1);
                break;
            case PKT_TYPE_REBOOT: // 0xF0
                if( ((uint32_t*)(p->payload+16))[0] == 0x816A4EB2) {
                    if( ((uint8_t*)(p->payload+16))[4] & 0x0F) {
                        ledPacket_type outpkt;
                        outpkt.s.type = PKT_TYPE_REBOOT;
                        ((uint32_t*)outpkt.s.payload)[0] = 0x816A4EB2;
                        ((uint32_t*)outpkt.s.payload)[12] = 0x816A4EB2;
                        ((uint32_t*)outpkt.s.payload)[24] = 0x816A4EB2;
                        ((uint32_t*)outpkt.s.payload)[36] = 0x816A4EB2;
                        ((uint32_t*)outpkt.s.payload)[48] = 0x816A4EB2;
                        for(i = 0; i < 4; i++) {
                            if( ((uint8_t*)(p->payload+16))[4] & (0x01 << i)) {
                                UART_SendBytes(&usarts[i], outpkt.a, sizeof(ledPacket_type));
                            }
                        }
                    }
                    if( ((uint8_t*)(p->payload+16))[4] & 0x10) {
                        Delay(100);  // delay 100ms before rebooting to make sure outgoing packet gets sent completely
                        NVIC_SystemReset();
                    }
                }
                break;
            case PKT_TYPE_BL_INIT:
                if(bootloaderMode == BL_MODE_WAITING) {
                    // need to change bootloader mode and init LED board
                    bootloaderMode = BL_MODE_ACTIVE;
                }

            default:
                workType = 0;
                break;
        }

        // copy the packet type into the packets being sent to each endpoint
        for(i = 0; i < 4; i++) {
            ledpackets[i].s.type = workType;
            ledpackets[i].s.param1 = workParam;
        }

        // limit the rate of communications to the LED board
        if( (global_row != POWER_ROW) && (LocalTime - lastPacketTime >= minPacketDelay) )
            sendLEDpackets();

        /* free the pbuf */
        pbuf_free(p);
    }
    DEBUGPIN_CLR(0);
}

/**
 * binds udp port and registers the callback function to process received packets
 */
void udp_recv_init(void)
{
    /* get new pcb */
    global_pcb = udp_new();
    if (global_pcb == NULL) {
        LWIP_DEBUGF(UDP_DEBUG, ("udp_new failed!\n"));
        return;
    }

    /* bind to any IP address on port 7 */
    if (udp_bind(global_pcb, IP_ADDR_ANY, 7) != ERR_OK) {
        LWIP_DEBUGF(UDP_DEBUG, ("udp_bind failed!\n"));
        return;
    }

    /* set udp_echo_recv() as callback function
       for received packets */
    udp_recv(global_pcb, udp_process_recv_packet, NULL);
}

/**
 * Simple test function which turns buttons red/green when button is down and remain red after released
 */
void buttonTest(int intensity) {
    int i;

    handle_feedback(USART_NW, PANEL_NW);
    handle_feedback(USART_SW, PANEL_SW);
    handle_feedback(USART_SE, PANEL_SE);
    handle_feedback(USART_NE, PANEL_NE);
    for(i = 0; i < 49; i++) {
        if( globalGetButtonState(i, PANEL_NE) ) {
            pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i*3], intensity);
            pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i*3+1], intensity);
            pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i*3+2], 0);
        } else {
            //pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i*3], intensity);
            pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i*3+1], 0);
            pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i*3+2], 0);
        }
    }
    UART_SendBytes(&usarts[3], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
    UART_SendBytes(&usarts[2], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
    UART_SendBytes(&usarts[1], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
    UART_SendBytes(&usarts[0], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
    Delay(10);
}

// map of intensities to the 16 position selector switch when in test mode
int test_intensities[16] = {2,4,8,16, 32,64,128,256, 300,400,500,700, 1000,2000,3000,4000};
/**
 * Implements a number of test modes useful for verifying board functionality by assembler and after received
 */
void test_modes() {
    int i, row, col;

    int rampStep = 10;
    int rampValue = 0;
    int rampMin, rampMax;

    while(1) {
        i = BUTTONS_Read_All();
        row = (i >> 4) & 0xF;
        col = i & 0xF;
        switch(row) {
            case 0: // cycle through RGBW illumination
            case 1: // red
                for(i = 0; i < 49*3; i++)
                    pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i], 0);
                for(i = 0; i < 49; i++)
                    pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i*3], test_intensities[col]);
                UART_SendBytes(&usarts[3], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[2], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[1], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[0], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                Delay(2000);
                if(row != 0) break;
            case 2: // green
                for(i = 0; i < 49*3; i++)
                    pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i], 0);
                for(i = 0; i < 49; i++)
                    pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i*3+1], test_intensities[col]);
                UART_SendBytes(&usarts[3], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[2], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[1], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[0], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                Delay(2000);
                if(row != 0) break;
            case 3: // blue
                for(i = 0; i < 49*3; i++)
                    pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i], 0);
                for(i = 0; i < 49; i++)
                    pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i*3+2], test_intensities[col]);
                UART_SendBytes(&usarts[3], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[2], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[1], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[0], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                Delay(2000);
                if(row != 0) break;
            case 4: // white
                for(i = 0; i < 49*3; i++)
                    pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i], test_intensities[col]);
                UART_SendBytes(&usarts[3], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[2], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[1], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[0], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                Delay(2000);
                break;
            case 5: // gamma correction test
                for(i = 0; i < 196; i++) {
                    globalSet8bit(i*3, i);
                    globalSet8bit(i*3+1, 0);
                    globalSet8bit(i*3+2, 0);
                }
                ledpackets[PANEL_NW].s.type = PKT_TYPE_8BIT_CAL;
                UART_SendBytes(&usarts[3], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[2], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[1], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[0], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                Delay(1000);
                ledpackets[PANEL_NW].s.type = PKT_TYPE_8BIT_RAW;
                UART_SendBytes(&usarts[3], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[2], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[1], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[0], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                Delay(1000);
                break;
            case 6: // one LED element at a time
                // Startup sequence the lights all the LEDs one at a time
                ledpackets[PANEL_NW].s.type = PKT_TYPE_GSVALS;
                for(i = 0; i < 49*3+1; i++) {
                    if(i < 49*3)
                        pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i], test_intensities[col]);
                    if(i > 0)
                        pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i-1], 0);
                    UART_SendBytes(&usarts[3], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                    UART_SendBytes(&usarts[2], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                    UART_SendBytes(&usarts[1], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                    UART_SendBytes(&usarts[0], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));

                    Delay(10);
                }
                break;
            case 7: // Test ramp for burnin testing of LED boards
                rampMax = test_intensities[col];
                rampMin = test_intensities[col]/5;
                for(rampValue = rampMin; rampValue < rampMax; rampValue += rampStep) {
                    for(i = 0; i <192*3; i++) {
                        globalSet(i,rampValue);
                    }
                    for(i = 0; i < 4; i++) {
                        ledpackets[i].s.type = PKT_TYPE_GSVALS;
                        pack12bit(ledpackets[i].ua+1, 0, rampValue/2);
                    }
                    sendLEDpackets();
                    Delay(10);
                }
                Delay(1000);
                for(rampValue = rampMax; rampValue > rampMin; rampValue -= rampStep) {
                    for(i = 0; i <192*3; i++) {
                        globalSet(i,rampValue);
                    }
                    for(i = 0; i < 4; i++) {
                        ledpackets[i].s.type = PKT_TYPE_GSVALS;
                        pack12bit(ledpackets[i].ua+1, 0, rampValue/2);
                    }
                    sendLEDpackets();
                    Delay(10);
                }
                break;
            case 8: // button test
                buttonTest(test_intensities[col]);
                break;
            case 9: // clear
                for(i = 0; i <49*3; i++)
                    pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i], 0);
                UART_SendBytes(&usarts[3], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[2], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[1], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[0], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                Delay(1000);
                break;
            case 10: // thermal cycle
                if( (rampMin > 600) || (rampMin < -600))  rampMin = 600;
                if(rampMin <= 0) {
                    for(i = 0; i < 49*3; i++)
                        pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i], 4000);
                } else {
                    for(i = 0; i < 49*3; i++)
                        pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i], 0);
                }
                UART_SendBytes(&usarts[3], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[2], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[1], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[0], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                Delay(1000);
                rampMin--;
                break;
            default:
                break;
        }
    }
}

/**
 * Send packet to each of the 4 LED boards, wait, then read response
 */
static void BLhelper_send() {
    UART_SendBytes(&usarts[3], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
    UART_SendBytes(&usarts[2], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
    UART_SendBytes(&usarts[1], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
    UART_SendBytes(&usarts[0], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
    Delay(1000);
    handle_feedback(USART_NW, PANEL_NW);
    handle_feedback(USART_SW, PANEL_SW);
    handle_feedback(USART_SE, PANEL_SE);
    handle_feedback(USART_NE, PANEL_NE);
}
/**
 * Copy the contents from the first CPU segment of a USART packet into the remaining 4 segments
 */
static void BLhelper_dup() {
    int i;
    for(i = 0; i < 48; i++) {
        uint8_t val = ledpackets[PANEL_NW].s.payload[i];
        ledpackets[PANEL_NW].s.payload[i+48]   = val;
        ledpackets[PANEL_NW].s.payload[i+48*2] = val;
        ledpackets[PANEL_NW].s.payload[i+48*3] = val;
        ledpackets[PANEL_NW].s.payload[i+48*4] = val;
    }
}

/**
 * Get the LED boards into bootloader mode
 */
void startBootloader() {
    int i;
    uint32_t * payload32 = (uint32_t*)ledpackets[PANEL_NW].s.payload;

    // send reboot a bunch of times to make sure we get it to work
    for(i = 0; i < 10; i++) {
        ledpackets[PANEL_NW].s.type = PKT_TYPE_REBOOT;
        payload32[0] = 0x816A4EB2;
        BLhelper_dup();
        BLhelper_send();
        Delay(100);
    }
    for(i = 0; i < 10; i++) {
        ledpackets[PANEL_NW].s.type = PKT_TYPE_BL_INIT;
        BLhelper_send();
        Delay(500);
    }
}

/**
 * Test some of the LED board bootloader functionality
 */
void doBootloaderTest() {
    int i, j;
    uint32_t * payload32 = (uint32_t*)ledpackets[PANEL_NW].s.payload;

    /*for(i = 0; i < 10; i++) {
        ledpackets[PANEL_NW].s.type = PKT_TYPE_BL_READ_BLOCK;
        payload32[0] = 0x08002000+32*i;
        payload32[1] = 0x8;
        BLhelper_dup();
        BLhelper_send();
    }*/

    ledpackets[PANEL_NW].s.type = PKT_TYPE_BL_UNLOCK_FLASH;
    payload32[0] = 0x45670123;
    payload32[1] = 0xCDEF89AB;
    BLhelper_dup();
    BLhelper_send();

    ledpackets[PANEL_NW].s.type = PKT_TYPE_BL_ERASE_FLASH;
    payload32[0] = 0xACEA1623;
    BLhelper_dup();
    BLhelper_send();

    Delay(5000);

    for(i = 0; i < 10; i++) {
        ledpackets[PANEL_NW].s.type = PKT_TYPE_BL_WRITE_BLOCK;
        payload32[0] = 0x08002000+32*i;
        payload32[1] = 0x8;
        for(j = 0; j < 8; j++)
            payload32[2+j] = 8*i+j;
        BLhelper_dup();
        BLhelper_send();
    }

    for(i = 0; i < 10; i++) {
        ledpackets[PANEL_NW].s.type = PKT_TYPE_BL_READ_BLOCK;
        payload32[0] = 0x08002000+32*i;
        payload32[1] = 0x8;
        BLhelper_dup();
        BLhelper_send();
    }

    while(1);

}

/**
 * calculate the median value in a list of 8 values (used for fan speed window filter)
 * @param list An array of 8 elements
 * @return the 4th element in the sorted array (the lower of the 2 middle values)
 */
static uint8_t calcMedian(uint8_t *list) {
    uint8_t workList[8], temp;
    int i, j;
    memcpy(workList, list, 8);
    for(i = 0; i < 7; i++) {
        for(j = i+1; j < 8; j++) {
            if(workList[j] < workList[i]) {
                temp = workList[i];
                workList[i] = workList[j];
                workList[j] = temp;
            }
        }
    }
    return workList[3];
}

/**
  * @brief  Main program.
  * @param  None
  * @retval None
  */
int main(void)
{
  /*!< At this stage the microcontroller clock setting is already configured to
       168 MHz, this is done through SystemInit() function which is called from
       startup file (startup_stm32f4xx.s) before to branch to application main.
       To reconfigure the default setting of SystemInit() function, refer to
       system_stm32f4xx.c file
     */
    int i;

    struct pbuf *p;

    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_4);

    /* configure ethernet (GPIOs, clocks, MAC, DMA) */
    printf("about to start ethernet config\n");
    ETH_BSP_Config();

    // Determine the IP address based on dip switch position
    BUTTONS_Config();
    PIN_Config();
    CONFIG_pins(pins_powerctrl, PWRCTRL_NUM_PINS);
    PIN_Num(pins_debug, 0, DEBUGPIN_NUM);

    PIN_Low(pins_powerctrl, PWR_CTRL_AC_0);
    PIN_Low(pins_powerctrl, PWR_CTRL_AC_1);

    Delay(10);
    i = BUTTONS_Read_All();
    #ifdef TEST_MODES
        i = 2;
    #endif
    global_row = (i >> 4) & 0xF;
    global_column = i & 0xF;
    IP_lastOctet = 20+global_row*10+global_column;
    mac_last_octet = 20+global_row*10+global_column;
    printf("IP: 192.168.0.%d", IP_lastOctet);

    IP4_ADDR(&udp_dest, IP_ADDR0, IP_ADDR1, IP_ADDR2, 10);

    /* Initilaize the LwIP stack */
    LwIP_Init();

    // Initialize, bind, and setup callback for UDP
    udp_recv_init();

    if(global_row != POWER_ROW) {
        // this is a normal panel (not a power box)
        UART_Config(&usarts[0]);
        UART_Config(&usarts[1]);
        UART_Config(&usarts[2]);
        UART_Config(&usarts[3]);

        Delay(10);

        //startBootloader();
        //doBootloaderTest();

        // Wait for initialization of LED board firmware and debug display
        Delay(7000);

        // run through sequence of setting dot correction
        int dotval = 58;
        while(dotval <= 63) {
            Delay(50);
            // set dot correction
            ledPacket_type pkt;
            memset(pkt.a, 0, sizeof(ledPacket_type));
            pkt.s.type = PKT_TYPE_DOTCORRECT_PACK12;
            for(i = 0; i < 49; i++) {
                pack12bit(pkt.s.payload, panelLEDmap[i*3+1], dotval);
                #ifdef TEST_MODES
                    pack12bit(pkt.s.payload, panelLEDmap[i*3], dotval*12/16);
                    pack12bit(pkt.s.payload, panelLEDmap[i*3+2], dotval*12/16);
                #else
                    pack12bit(pkt.s.payload, panelLEDmap[i*3  ], dotval/2);
                    pack12bit(pkt.s.payload, panelLEDmap[i*3+2], dotval/2);
                #endif
            }
            UART_SendBytes(&usarts[0], pkt.a, sizeof(ledPacket_type));
            UART_SendBytes(&usarts[1], pkt.a, sizeof(ledPacket_type));
            UART_SendBytes(&usarts[2], pkt.a, sizeof(ledPacket_type));
            UART_SendBytes(&usarts[3], pkt.a, sizeof(ledPacket_type));
            Delay(50);
            ledpackets[PANEL_NW].s.type = PKT_TYPE_GSVALS;
            for(i = 0; i <7*3; i++)
                pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i], 800);
            for(; i <49*3; i++)
                pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i], 0);
            UART_SendBytes(&usarts[3], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
            UART_SendBytes(&usarts[2], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
            UART_SendBytes(&usarts[1], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
            UART_SendBytes(&usarts[0], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
            dotval++;
            Delay(30);
        }
        // set calibration to a 2.2 gamma curve
        {
            int j;
            float value;
            uint16_t iValue;
            ledpackets[PANEL_NW].s.type = PKT_TYPE_SET_LOOKUP;
            for(i = 0; i < 65; i++) {
                value = 4000*pow( (float)i/65.0, 2.2);
                iValue = ((uint16_t)value) & 0xFFF;
                for(j = 0; j < 49*3; j++) {
                    pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[j], iValue);
                }
                ledpackets[PANEL_NW].s.param1 = i;
                UART_SendBytes(&usarts[3], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[2], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[1], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[0], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                Delay(30);
            }
        }
        // turn off all channels
        ledpackets[PANEL_NW].s.type = PKT_TYPE_GSVALS;
        for(i = 0; i <49*3; i++) {
            pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i], 0);
        }
        UART_SendBytes(&usarts[3], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
        UART_SendBytes(&usarts[2], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
        UART_SendBytes(&usarts[1], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
        UART_SendBytes(&usarts[0], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));

        // Startup sequence that lights all the LEDs one at a time
        ledpackets[PANEL_NW].s.type = PKT_TYPE_GSVALS;
        for(i = 0; i <49*3+1; i++) {
            if(i < 49*3)
                pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i], 800);
            if(i > 0)
                pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i-1], 0);
            UART_SendBytes(&usarts[3], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
            UART_SendBytes(&usarts[2], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
            UART_SendBytes(&usarts[1], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
            UART_SendBytes(&usarts[0], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));

            Delay(10);
        }

        #ifdef TEST_MODES
            test_modes();
        #endif

        //buttonTest();
    }

    // Normal execution infinite while loop
    while(1) {
        if (ETH_CheckFrameReceived()) {
            /* process received ethernet packet*/
            LwIP_Pkt_Handle();
        }

        // for normal panels send packet to LED boards if overdue and not in bootloader mode
        if(global_row != POWER_ROW && LocalTime - lastPacketTime >= maxPacketDelay && bootloaderMode == BL_MODE_INACTIVE) {
            sendLEDpackets();
            DEBUGPIN_TGL(8);
        }

        if(global_row == POWER_ROW) {
            // This is a power box controller
            if(LocalTime-lastStatusPacketTime >= minStatusPacketDelay) {
                lastStatusPacketTime = LocalTime;
                p = pbuf_alloc(PBUF_TRANSPORT, 4+6+2+2, PBUF_RAM);
                i = 0;
                ((uint8_t*)p->payload)[i++] = 0x22;
                ((uint8_t*)p->payload)[i++] = 0x0;
                ((uint8_t*)p->payload)[i++] = 0x0;
                ((uint8_t*)p->payload)[i++] = 0x0;
                ((uint8_t*)p->payload)[i++] = PIN_State(pins_powerctrl, PWR_MON_0_0);
                ((uint8_t*)p->payload)[i++] = PIN_State(pins_powerctrl, PWR_MON_0_1);
                ((uint8_t*)p->payload)[i++] = PIN_State(pins_powerctrl, PWR_MON_0_2);
                ((uint8_t*)p->payload)[i++] = PIN_State(pins_powerctrl, PWR_MON_1_0);
                ((uint8_t*)p->payload)[i++] = PIN_State(pins_powerctrl, PWR_MON_1_1);
                ((uint8_t*)p->payload)[i++] = PIN_State(pins_powerctrl, PWR_MON_1_2);
                ((uint8_t*)p->payload)[i++] = !PIN_State(pins_powerctrl, PWR_MON_AC_0);
                ((uint8_t*)p->payload)[i++] = !PIN_State(pins_powerctrl, PWR_MON_AC_1);
                ((uint8_t*)p->payload)[i++] = PIN_State(pins_powerctrl, PWR_CTRL_AC_0);
                ((uint8_t*)p->payload)[i++] = PIN_State(pins_powerctrl, PWR_CTRL_AC_1);
                udp_sendto(global_pcb, p, &udp_dest, 27482);
                /* free the pbuf */
                pbuf_free(p);
            }
        } else {
            // This is an LED panel controller

            // build and send button data packet at a fixed rate
            if(LocalTime-lastButtonPacketTime >= minButtonPacketDelay && bootloaderMode == BL_MODE_INACTIVE) {
                lastButtonPacketTime = LocalTime;
                DEBUGPIN_TGL(7);
                p = pbuf_alloc(PBUF_TRANSPORT, 29, PBUF_RAM);
                memcpy(p->payload, buttonpacket, 29);
                udp_sendto(global_pcb, p, &udp_dest, 27482);
                /* free the pbuf */
                pbuf_free(p);
            }
            // build and send button data packet at a fixed rate
            if(LocalTime-lastStatusPacketTime >= minStatusPacketDelay && bootloaderMode == BL_MODE_INACTIVE) {
                lastStatusPacketTime = LocalTime;
                p = pbuf_alloc(PBUF_TRANSPORT, 4+196+4+4*6+4*4+4, PBUF_RAM);
                ((uint8_t*)p->payload)[0] = 0x21;
                memcpy(p->payload+4, temperatures, 196);
                ((uint8_t*)(p->payload))[4+196+0] = calcMedian(fan_tach[0]);
                ((uint8_t*)(p->payload))[4+196+1] = calcMedian(fan_tach[1]);
                ((uint8_t*)(p->payload))[4+196+2] = calcMedian(fan_tach[2]);
                ((uint8_t*)(p->payload))[4+196+3] = calcMedian(fan_tach[3]);
                memcpy(p->payload+4+196+4, serialNum, 4*6);
                memcpy(p->payload+4+196+4+4*6, uptimes, 4*4);
                memcpy(p->payload+4+196+4+4*6+4*4, panel_avg_temp, 4);
                udp_sendto(global_pcb, p, &udp_dest, 27482);
                /* free the pbuf */
                pbuf_free(p);
            }
        }

        LwIP_Periodic_Handle(LocalTime);

        // Turn off the display if we don't receive anything for more than 5 seconds
        if( (LocalTime - lastUDPReceivePacketTime) > 5000 ) {
            // turn off all channels
            ledpackets[PANEL_NW].s.type = PKT_TYPE_GSVALS;
            for(i = 0; i <49*3; i++) {
                pack12bit(ledpackets[PANEL_NW].s.payload, panelLEDmap[i], 0);
            }
            if( (global_row != POWER_ROW) && (LocalTime - lastPacketTime >= minPacketDelay) ) {
                handle_feedback(USART_NW, PANEL_NW);
                handle_feedback(USART_SW, PANEL_SW);
                handle_feedback(USART_SE, PANEL_SE);
                handle_feedback(USART_NE, PANEL_NE);
                UART_SendBytes(&usarts[3], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[2], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[1], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                UART_SendBytes(&usarts[0], ledpackets[PANEL_NW].a, sizeof(ledpackets[PANEL_NW].a));
                lastPacketTime = LocalTime;
            }
        }
    }
}

/**
  * @brief  Inserts a delay time.
  * @param  nCount: number of ms to wait for.
  * @retval None
  */
void Delay(uint32_t nCount) {
  /* Capture the current local time */
  timingdelay = LocalTime;

  /* wait until the desired delay is finished */
  while( (LocalTime - timingdelay) < nCount ) {
  }
}

/**
  * @brief  Updates the system local time
  * @param  None
  * @retval None
  */
void Time_Update(void) {
    LocalTime += SYSTEMTICK_PERIOD_MS;
}

#ifdef  USE_FULL_ASSERT

/**
  * @brief  Reports the name of the source file and the source line number
  *   where the assert_param error has occurred.
  * @param  file: pointer to the source file name
  * @param  line: assert_param error line source number
  * @retval None
  */
void assert_failed(uint8_t* file, uint32_t line) {
  /* User can add his own implementation to report the file name and line number,
     ex: printf("Wrong parameters value: file %s on line %d\r\n", file, line) */

  /* Infinite loop */
  while (1)
  {}
}
#endif


/************************ (C) COPYRIGHT STMicroelectronics *****END OF FILE****/
