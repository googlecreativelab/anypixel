/**
  ******************************************************************************
  * @file    stm32f0xx_crs.h
  * @author  MCD Application Team
  * @version V1.3.0
  * @date    16-January-2014
  * @brief   This file contains all the functions prototypes for the CRS firmware 
  *          library, applicable only for STM32F042 and STM32F072 devices.
  ******************************************************************************
  * @attention
  *
  * <h2><center>&copy; COPYRIGHT 2014 STMicroelectronics</center></h2>
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
#ifndef __STM32F0XX_CRS_H
#define __STM32F0XX_CRS_H

#ifdef __cplusplus
 extern "C" {
#endif

/*!< Includes ----------------------------------------------------------------*/
#include "stm32f0xx.h"

/** @addtogroup STM32F0xx_StdPeriph_Driver
  * @{
  */

/** @addtogroup CRS
  * @{
  */

/* Exported types ------------------------------------------------------------*/
/* Exported constants --------------------------------------------------------*/

/** @defgroup CRS_Interrupt_Sources
  * @{
  */
#define CRS_IT_SYNCOK             CRS_ISR_SYNCOKF    /*!< SYNC event OK */
#define CRS_IT_SYNCWARN           CRS_ISR_SYNCWARNF  /*!< SYNC warning */
#define CRS_IT_ERR                CRS_ISR_ERRF       /*!< error */
#define CRS_IT_ESYNC              CRS_ISR_ESYNCF     /*!< Expected SYNC */
#define CRS_IT_TRIMOVF            CRS_ISR_TRIMOVF    /*!< Trimming overflow or underflow */
#define CRS_IT_SYNCERR            CRS_ISR_SYNCERR    /*!< SYNC error */
#define CRS_IT_SYNCMISS           CRS_ISR_SYNCMISS    /*!< SYNC missed*/

#define IS_CRS_IT(IT) (((IT) == CRS_IT_SYNCOK) || ((IT) == CRS_IT_SYNCWARN) || \
                       ((IT) == CRS_IT_ERR)  || ((IT) == CRS_IT_ESYNC))
                       
#define IS_CRS_GET_IT(IT) (((IT) == CRS_IT_SYNCOK) || ((IT) == CRS_IT_SYNCWARN) || \
                           ((IT) == CRS_IT_ERR) || ((IT) == CRS_IT_ESYNC) || \
                           ((IT) == CRS_IT_TRIMOVF) || ((IT) == CRS_IT_SYNCERR) || \
                           ((IT) == CRS_IT_SYNCMISS))

#define IS_CRS_CLEAR_IT(IT) ((IT) != 0x00)                                         

/**
  * @}
  */

/** @defgroup CRS_Flags
  * @{
  */
#define CRS_FLAG_SYNCOK             CRS_ISR_SYNCOKF    /*!< SYNC event OK */
#define CRS_FLAG_SYNCWARN           CRS_ISR_SYNCWARNF  /*!< SYNC warning */
#define CRS_FLAG_ERR                CRS_ISR_ERRF       /*!< error */
#define CRS_FLAG_ESYNC              CRS_ISR_ESYNCF     /*!< Expected SYNC */
#define CRS_FLAG_TRIMOVF            CRS_ISR_TRIMOVF    /*!< Trimming overflow or underflow */
#define CRS_FLAG_SYNCERR            CRS_ISR_SYNCERR    /*!< SYNC error */
#define CRS_FLAG_SYNCMISS           CRS_ISR_SYNCMISS    /*!< SYNC missed*/

#define IS_CRS_FLAG(FLAG) (((FLAG) == CRS_FLAG_SYNCOK) || ((FLAG) == CRS_FLAG_SYNCWARN) || \
                           ((FLAG) == CRS_FLAG_ERR) || ((FLAG) == CRS_FLAG_ESYNC) || \
                           ((FLAG) == CRS_FLAG_TRIMOVF) || ((FLAG) == CRS_FLAG_SYNCERR) || \
                           ((FLAG) == CRS_FLAG_SYNCMISS))

/**
  * @}
  */
  
/** @defgroup CRS_Synchro_Source
  * @{
  */
#define CRS_SYNCSource_GPIO       ((uint32_t)0x00)        /*!< Synchro Signal soucre GPIO */
#define CRS_SYNCSource_LSE        CRS_CFGR_SYNCSRC_0      /*!< Synchro Signal source LSE */
#define CRS_SYNCSource_USB        CRS_CFGR_SYNCSRC_1      /*!< Synchro Signal source USB SOF */

#define IS_CRS_SYNC_SOURCE(SOURCE) (((SOURCE) == CRS_SYNCSource_GPIO) || \
                                    ((SOURCE) == CRS_SYNCSource_LSE) ||\
                                    ((SOURCE) == CRS_SYNCSource_USB))
/**
  * @}
  */

/** @defgroup CRS_SynchroDivider
  * @{
  */
#define CRS_SYNC_Div1        ((uint32_t)0x00)                          /*!< Synchro Signal not divided */
#define CRS_SYNC_Div2        CRS_CFGR_SYNCDIV_0                        /*!< Synchro Signal divided by 2 */
#define CRS_SYNC_Div4        CRS_CFGR_SYNCDIV_1                        /*!< Synchro Signal divided by 4 */
#define CRS_SYNC_Div8        (CRS_CFGR_SYNCDIV_1 | CRS_CFGR_SYNCDIV_0) /*!< Synchro Signal divided by 8 */
#define CRS_SYNC_Div16       CRS_CFGR_SYNCDIV_2                        /*!< Synchro Signal divided by 16 */
#define CRS_SYNC_Div32       (CRS_CFGR_SYNCDIV_2 | CRS_CFGR_SYNCDIV_0) /*!< Synchro Signal divided by 32 */
#define CRS_SYNC_Div64       (CRS_CFGR_SYNCDIV_2 | CRS_CFGR_SYNCDIV_1) /*!< Synchro Signal divided by 64 */
#define CRS_SYNC_Div128      CRS_CFGR_SYNCDIV                          /*!< Synchro Signal divided by 128 */

#define IS_CRS_SYNC_DIV(DIV) (((DIV) == CRS_SYNC_Div1) || ((DIV) == CRS_SYNC_Div2)   ||\
                              ((DIV) == CRS_SYNC_Div4) || ((DIV) == CRS_SYNC_Div8)   || \
                              ((DIV) == CRS_SYNC_Div16) || ((DIV) == CRS_SYNC_Div32) || \
                              ((DIV) == CRS_SYNC_Div64) || ((DIV) == CRS_SYNC_Div128))
/**
  * @}
  */

/** @defgroup CRS_SynchroPolarity
  * @{
  */
#define CRS_SYNCPolarity_Rising       ((uint32_t)0x00)      /*!< Synchro Active on rising edge */
#define CRS_SYNCPolarity_Falling      CRS_CFGR_SYNCPOL      /*!< Synchro Active on falling edge */

#define IS_CRS_SYNC_POLARITY(POLARITY) (((POLARITY) == CRS_SYNCPolarity_Rising) || \
                                    ((POLARITY) == CRS_SYNCPolarity_Falling))
/**
  * @}
  */


    
/* Exported macro ------------------------------------------------------------*/
/* Exported functions ------------------------------------------------------- */
/* Configuration of the CRS **********************************/
void CRS_DeInit(void);
void CRS_AdjustHSI48CalibrationValue(uint8_t CRS_HSI48CalibrationValue);
void CRS_FrequencyErrorCounterCmd(FunctionalState NewState);
void CRS_AutomaticCalibrationCmd(FunctionalState NewState); 
void CRS_SoftwareSynchronizationGenerate(void);
void CRS_FrequencyErrorCounterReload(uint32_t CRS_ReloadValue);
void CRS_FrequencyErrorLimitConfig(uint8_t CRS_ErrorLimitValue);
void CRS_SynchronizationPrescalerConfig(uint32_t CRS_Prescaler);
void CRS_SynchronizationSourceConfig(uint32_t CRS_Source);
void CRS_SynchronizationPolarityConfig(uint32_t CRS_Polarity);
uint32_t CRS_GetReloadValue(void);
uint32_t CRS_GetHSI48CalibrationValue(void);
uint32_t CRS_GetFrequencyErrorValue(void);
uint32_t CRS_GetFrequencyErrorDirection(void);

/* Interrupts and flags management functions **********************************/
void CRS_ITConfig(uint32_t CRS_IT, FunctionalState NewState);
FlagStatus CRS_GetFlagStatus(uint32_t CRS_FLAG);
void CRS_ClearFlag(uint32_t CRS_FLAG);
ITStatus CRS_GetITStatus(uint32_t CRS_IT);
void CRS_ClearITPendingBit(uint32_t CRS_IT);

#ifdef __cplusplus
}
#endif

#endif /* __STM32F0XX_CRS_H */

/**
  * @}
  */

/**
  * @}
  */

/************************ (C) COPYRIGHT STMicroelectronics *****END OF FILE****/
