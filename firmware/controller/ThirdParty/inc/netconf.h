/**
  ******************************************************************************
  * @file    netconf.h
  * @author  MCD Application Team
  * @version V1.1.0
  * @date    31-July-2013
  * @brief   This file contains all the functions prototypes for the netconf.c
  *          file.
  ******************************************************************************
  * @attention
  *
  * <h2><center>&copy; COPYRIGHT 2013 STMicroelectronics</center></h2>
  *
  * Licensed under MCD-ST Liberty SW License Agreement V2, (the "License");
  * You may not use this file except in compliance with the License.
  * You may obtain a copy of the License at:
  *
  *        http://www.st.com/software_license_agreement_liberty_v2
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  *
  ******************************************************************************
  */

/* Define to prevent recursive inclusion -------------------------------------*/
#ifndef __NETCONF_H
#define __NETCONF_H

#ifdef __cplusplus
 extern "C" {
#endif

extern int IP_lastOctet;

/* Includes ------------------------------------------------------------------*/
/* Exported types ------------------------------------------------------------*/
/* Exported constants --------------------------------------------------------*/
#define DHCP_START                 1
#define DHCP_WAIT_ADDRESS          2
#define DHCP_ADDRESS_ASSIGNED      3
#define DHCP_TIMEOUT               4
#define DHCP_LINK_DOWN             5
/* Exported macro ------------------------------------------------------------*/
/* Exported functions ------------------------------------------------------- */
void LwIP_Init(void);
void LwIP_Pkt_Handle(void);
void LwIP_Periodic_Handle(__IO uint32_t localtime);

#ifdef __cplusplus
}
#endif

#endif /* __NETCONF_H */


/************************ (C) COPYRIGHT STMicroelectronics *****END OF FILE****/
