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
#include "uart.h"
#include "debugpin.h"
#include "TLC59401.h"
#include "buttons.h"
#include "LEDproto.h"
#include "11AA02E48.h"
#include "analog.h"

__IO uint32_t LocalTime = 0; /* this variable is used to create a time reference incremented every 1ms */
uint32_t timingdelay;

#define TICKS_PER_MS 12
#define BLACK_TIMEOUT 5000

static uint32_t busAddress = 0;
static bool packetStarted = false;
//static bool busIdleDetected = true;
static int lastByteTime = 0;
static int packetIdx = 0;
static int fan_pwm = 2048;
static int led_pwm = 0;

static ledPacket_type inPacket;
static ledPacket_type outPacket;

static uint8_t MACaddr[6];

// mapping from thermistor index to analog channel
static const uint8_t analog_map[] = {9,8,7,5,6,0,1,2,3,4};

uint16_t FanCapture = 0;
uint32_t FanLastIrq = 0;

uint16_t captures[32];
uint16_t captureCounter = 0;

/**
 * interrupt handler for fan speed input timer
 */
void TIM3_IRQHandler(void) {
    static uint16_t CaptureNumber = 0;
    static uint16_t inval1, inval2;
    if(TIM_GetITStatus(TIM3, TIM_IT_CC1) == SET) {
        captures[captureCounter++ % 32] = TIM_GetCapture1(TIM3);
        // clear the CC interrupt pending bit
        TIM_ClearITPendingBit(TIM3, TIM_IT_CC1);
        if(CaptureNumber == 0) {
            inval1 = TIM_GetCapture1(TIM3);
            CaptureNumber = 1;
        }
        else if(CaptureNumber == 1) {
            inval2 = TIM_GetCapture1(TIM3);
            if(inval2 < inval1)
                FanCapture = (0xFFFF - inval1) - inval2;
            else
                FanCapture = inval2 - inval1;
            CaptureNumber = 0;
        }
        FanLastIrq = LocalTime;
    }
}

/**
 * Configures timers for fan tachometer monitoring and PWM output
 */
void fan_setup() {
    TIM_TimeBaseInitTypeDef tbis;
    TIM_OCInitTypeDef ocis;
    NVIC_InitTypeDef nvis;
    TIM_ICInitTypeDef icis;

    // Turn on peripherals
    RCC_AHBPeriphClockCmd(FAN_POWER_AHB, ENABLE);
    RCC_APB1PeriphClockCmd(FAN_POWER_APB1, ENABLE);
	RCC_APB2PeriphClockCmd(FAN_POWER_APB2, ENABLE);

    CONFIG_pins(pins_pwm, PWM_PINS_NUM);

    // First configure the PWM output
    tbis.TIM_Prescaler = 0;
    tbis.TIM_ClockDivision = TIM_CKD_DIV1;
    tbis.TIM_CounterMode = TIM_CounterMode_Up;
    tbis.TIM_Period = 1920;
    tbis.TIM_RepetitionCounter = 0;
    TIM_TimeBaseInit(TIM16, &tbis);

    ocis.TIM_OCMode = TIM_OCMode_PWM1;
    ocis.TIM_OutputState = TIM_OutputState_Enable;
    ocis.TIM_OutputNState = TIM_OutputNState_Disable;
    ocis.TIM_Pulse = 1000;
    ocis.TIM_OCPolarity = TIM_OCPolarity_High;
    ocis.TIM_OCNPolarity = TIM_OCNPolarity_High;
    ocis.TIM_OCIdleState = TIM_OCIdleState_Set;
    ocis.TIM_OCNIdleState = TIM_OCNIdleState_Reset;
    TIM_OC1Init(TIM16, &ocis);

    TIM_Cmd(TIM16, ENABLE);
    TIM_CtrlPWMOutputs(TIM16, ENABLE);

    // Now configure the Tach PWM input to measure rising edge to rising edge time
    icis.TIM_Channel = TIM_Channel_1;
    icis.TIM_ICPolarity = TIM_ICPolarity_Rising;
    icis.TIM_ICSelection = TIM_ICSelection_DirectTI;
    icis.TIM_ICPrescaler = TIM_ICPSC_DIV1;
    icis.TIM_ICFilter = 0x0;

    TIM_TimeBaseStructInit(&tbis);
    tbis.TIM_Prescaler = 199;
    tbis.TIM_ClockDivision = TIM_CKD_DIV4;
    tbis.TIM_CounterMode = TIM_CounterMode_Up;
    tbis.TIM_RepetitionCounter = 0;
    TIM_TimeBaseInit(TIM3, &tbis);

    TIM_ICInit(TIM3, &icis);
    TIM_Cmd(TIM3, ENABLE);
    TIM_ITConfig(TIM3, TIM_IT_CC1, ENABLE);

    nvis.NVIC_IRQChannel = TIM3_IRQn;
    nvis.NVIC_IRQChannelPriority = 0;
    nvis.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&nvis);
}

/**
 * Set the fan control PWM signal duty cycle
 * @param value 0-1920 range for the PWM duty cycle
 */
void fan_set_duty(uint16_t value) {
    TIM16->CCR1 = value;
}

int main(void) {
    int i;
    uint8_t inByte;
    int RXcount = 0;
    int TXcount = 0;
    int RX_overrun_clear_count = 0;

    RCC_ClocksTypeDef RCC_Clocks;

    LocalTime = 0;

    // set up systick
    /* Configure Systick clock source as HCLK */
    SysTick_CLKSourceConfig(SysTick_CLKSource_HCLK);

    // do eeprom process before starting any interrupts due to time critical nature of bit-bang implementation and 6% timing error allowance
    busAddress = CONFIG_get_addr();
    if(busAddress == 0) {
        eeprom_Config();
        eeprom_ReadMAC(MACaddr);
    }

    // do analog setup before things get noisy
    usleep(100000); // give power a little time to stabilize
    ANALOG_Config();

    /* SystTick configuration: an interrupt every 1ms */
    RCC_GetClocksFreq(&RCC_Clocks);
    SysTick_Config(RCC_Clocks.HCLK_Frequency / (1000/SYSTEMTICK_PERIOD_MS*TICKS_PER_MS));

    /* Set Systick interrupt priority to 0*/
    NVIC_SetPriority (SysTick_IRQn, 0);

    if(busAddress == 3)
        fan_setup();

    Delay(1000);

    DEBUGPIN_Config();

    BUTTONS_Config();

    TLC59401_Config();

    // test sequence
    for(i = 0; i < 32; i ++) {
        TLC59401_SetValue(i, 500);
        if(i > 0)
            TLC59401_SetValue(i-1, 0);
        TLC59401_Send();
        Delay(30);
    }
    TLC59401_SetValue(31, 0);
    TLC59401_Send();
    Delay(30);

    // display the bus address on the LEDs
    TLC59401_SetValue(2, 500);
    if(busAddress >= 1)
        TLC59401_SetValue(5, 500);
    if(busAddress >= 2)
        TLC59401_SetValue(8, 500);
    if(busAddress >= 3)
        TLC59401_SetValue(11, 500);
    if(busAddress >= 4)
        TLC59401_SetValue(14, 500);
    TLC59401_Send();
    Delay(30);

    UART_Config(&usarts[0]);
    while(1) {
        // Grab a serial packet
        while(1) {
            // wait for byte to be available while sending the LED packet
            while( USART_GetFlagStatus(USART1,USART_FLAG_RXNE) == RESET ) {
                if(USART_GetFlagStatus(USART1,USART_FLAG_ORE)) {
                    USART_ClearFlag(USART1,USART_FLAG_ORE);
                    RX_overrun_clear_count++;
                    packetStarted = false;
                }
                //if(lastByteTime+1 < LocalTime)
                if((LocalTime - lastByteTime) > TICKS_PER_MS)  // this should be timer wrap safe
                    packetStarted = false;
                if((LocalTime - lastByteTime) > (BLACK_TIMEOUT*TICKS_PER_MS)) {  // If we haven't received anything for 5 seconds turn off the LEDs
                    for(i=0; i < TLC59401_CHANNELS; i++)
                        TLC59401_SetValue(i, 0);
                    TLC59401_Send();
                }
            }
            inByte = USART_ReceiveData(USART1);
            RXcount++;
            if(!packetStarted) {
                if((LocalTime - lastByteTime) > TICKS_PER_MS) {
                    // more than a full millisecond has elapsed since our last byte so this is the start of a packet
                    packetStarted = true;
                    packetIdx = 0;
                } else {
                    // in the middle of a unsynchronized packet?
                    lastByteTime = LocalTime;
                    continue;
                }
            }
            outPacket.a[packetIdx++] = inByte;
            lastByteTime = LocalTime;
            if( packetIdx >= sizeof(ledPacket_type) ) {
                // we are done with this packet
                packetStarted = false;
                break;
            }
        }
        // copy contents intended for this device to the input packet
        for(i = 0; i < LED_PACKET_HEADER_LEN; i++) { // copy the header over
            inPacket.a[i] = outPacket.a[i];
        }
        for(i = 0; i < 48; i++)
            inPacket.s.payload[i] = outPacket.s.payload[i + busAddress*48];

        // Fill our portion of the outgoing packet
        if(inPacket.s.type == PKT_TYPE_GET_LOOKUP) {
            TLC59401_GetCalibration(inPacket.s.param1, outPacket.s.payload + busAddress*48);
        } else {
            uint32_t tempWork;
            // 0-10 update button status in outgoing packet
            for(i = 0; i < 10; i++)
                outPacket.s.payload[i + busAddress*48] = BUTTONS_Read(i);
            // 10-19 update thermistor values
            for(i = 0; i < 10; i++) {
                tempWork = ANALOG_get_voltage(analog_map[i]);
                // fixed point linear approximation math to convert to deg F (roughly accurate from 70-220 degrees)
                tempWork = (tempWork*2753+2066808) >> 16;
                outPacket.s.payload[i + 10 + busAddress*48] = tempWork;
            }
            // 20-25 addr==0: update MAC address in outgoing packet
            //       addr==3: update FAN Tach value
            if(busAddress == 0)
                for(i = 0; i < 6; i++)
                    outPacket.s.payload[i + 20 + busAddress*48] = MACaddr[i];
            if(busAddress == 3) {
                if( (LocalTime - FanLastIrq) > TICKS_PER_MS*1000 )
                    FanCapture = 0xFFFF;
                for(i = 0; i < 4; i++)
                    outPacket.s.payload[i + 20 + busAddress*48] = (FanCapture >> (24-8*i)) & 0xFF;
            }
            // 32-35 Uptime in ms/6
            tempWork = LocalTime; // copy for update safety
            for(i = 0; i < 4; i++)
                outPacket.s.payload[i + 32 + busAddress*48] = (tempWork >> (24-8*i)) & 0xFF;
        }

        // send outgoing packet
        for(i = 0; i < sizeof(ledPacket_type); i++) {
            while( USART_GetFlagStatus(USART1,USART_FLAG_TXE) == RESET );
            USART_SendData(USART1, outPacket.a[i]);
            TXcount++;
        }
        if(outPacket.s.type != PKT_TYPE_SET_LOOKUP) {
            fan_pwm = unpack12bit(inPacket.ua+1, 0);
            if(busAddress == 3)
                fan_set_duty(fan_pwm);
            led_pwm = unpack12bit(inPacket.ua+1, 1);
        }

        // handle all the expected packet types
        switch(inPacket.s.type) {
            case PKT_TYPE_8BIT_CAL: // 1
                for(i = 0; i < TLC59401_CHANNELS; i++) {
                    TLC59401_Set8bitCalValue( i, inPacket.s.payload[i] );
                }
                TLC59401_Send();
                break;
            case PKT_TYPE_GSVALS: // 2
                // Update LED values
                TLC59401_SetPacket(inPacket.s.payload);
                // disable pixels to do three rail approximation
                /*if(busAddress == 3)
                    for(i=0; i < 32; i++)
                        TLC59401_SetValue(i, 0);
                if(busAddress == 2)
                    for(i=0; i < 12; i++)
                        TLC59401_SetValue(i, 0);
                if(busAddress == 4)
                    for(i=0; i < 12; i++)
                        TLC59401_SetValue(i, 0);*/
                TLC59401_Send();
                break;
            case PKT_TYPE_DOTCORRECT_PACK12: // 3
                // Update dot correction values with same bit alignment as greyscale data
                for(i = 0; i < 32; i++)
                    TLC59401_SetDotCorrection( i, unpack12bit(inPacket.s.payload,i) );
                TLC59401_SendDotCorrection();
                break;
            case PKT_TYPE_8BIT_RAW: // 4
                for(i = 0; i < TLC59401_CHANNELS; i++) {
                    TLC59401_SetValue( i, ((uint16_t)inPacket.s.payload[i]) << 4 );
                }
                TLC59401_Send();
                break;
            case PKT_TYPE_SET_LOOKUP: // 5
                TLC59401_SetCalibration(inPacket.s.param1, inPacket.s.payload);
                break;
            case PKT_TYPE_DOTCORRECT_PACK8: // 6
                for(i = 0; i < 32; i++)
                    TLC59401_SetDotCorrection( i, unpack12bit(inPacket.s.payload,i) );
                TLC59401_SendDotCorrection();
                break;
            case PKT_TYPE_DOTCORRECT_PACK6: // 7
                TLC59401_SetDotCorrectionPacket(inPacket.s.payload);
                TLC59401_SendDotCorrection();
                break;
            case PKT_TYPE_GET_LOOKUP: // 8
                // already taken care of
                break;
            case PKT_TYPE_REBOOT: // 0xF0
                {
                    uint32_t *inBuf = (uint32_t *)inPacket.s.payload;
                    if(inBuf[0] == 0x816A4EB2) {
                        Delay(100*TICKS_PER_MS);  // delay 100ms before rebooting to make sure outgoing packet gets sent completely
                        NVIC_SystemReset();
                    }
                }
                break;
            default:
                break;
        }
    }
}

/**
 * @brief  Inserts a delay time.
 * @param  nCount: number of ms to wait for.
 * @retval None
 */
void Delay(uint32_t nCount)
{
  /* Capture the current local time */
  timingdelay = LocalTime;

  /* wait until the desired delay is finished */
  while( (LocalTime - timingdelay) < (nCount*TICKS_PER_MS) ) {
  }
}

/**
 * @brief  This function handles SysTick Handler.
 * @param  None
 * @retval None
 */
void SysTick_Handler(void)
{
  /* Update the LocalTime by adding SYSTEMTICK_PERIOD_MS each SysTick interrupt */
    LocalTime += SYSTEMTICK_PERIOD_MS;
    TLC59401_Update();
}

__IO uint32_t usleep_num;
/**
 * only off by at most around 2uSec
 */
void usleep(uint32_t nCount) {
    while(nCount-- > 0) {
        usleep_num++;
        usleep_num++;
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
        asm("NOP");
    }
}
