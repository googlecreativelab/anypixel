/**
  ******************************************************************************
  * @file    stm32f0xx_crs.c
  * @author  MCD Application Team
  * @version V1.3.0
  * @date    16-January-2014
  * @brief   This file provides firmware functions to manage the following 
  *          functionalities of CRS peripheral applicable only on STM32F042 and 
  *          STM32F072 devices:
  *            + Configuration of the CRS peripheral
  *            + Interrupts and flags management
  *              
  *
  *  @verbatim
 ===============================================================================
                     ##### How to use this driver #####
 ===============================================================================
    [..]
    
         (+) Enable CRS AHB clock using RCC_APB1eriphClockCmd(RCC_APB1Periph_CRS, ENABLE)
             function

      
     @endverbatim
  *  
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

/* Includes ------------------------------------------------------------------*/
#include "stm32f0xx_crs.h"
#include "stm32f0xx_rcc.h"

/** @addtogroup STM32F0xx_StdPeriph_Driver
  * @{
  */

/** @defgroup CRS 
  * @brief CRS driver modules
  * @{
  */

/* Private typedef -----------------------------------------------------------*/
/* Private define ------------------------------------------------------------*/
/* CRS Flag Mask */
#define FLAG_MASK                 ((uint32_t)0x700)

/* Private macro -------------------------------------------------------------*/
/* Private variables ---------------------------------------------------------*/
/* Private function prototypes -----------------------------------------------*/
/* Private functions ---------------------------------------------------------*/

/** @defgroup CRS_Private_Functions
  * @{
  */

/** @defgroup CRS_Group1 Configuration of the CRS functions
 *  @brief   Configuration of the CRS  functions 
 *
@verbatim
 ===============================================================================
                     ##### CRS configuration functions #####
 ===============================================================================

@endverbatim
  * @{
  */

/**
  * @brief  Deinitializes CRS peripheral registers to their default reset values.
  * @param  None
  * @retval None
  */
void CRS_DeInit(void)
{
  RCC_APB1PeriphResetCmd(RCC_APB1Periph_CRS, ENABLE);
  RCC_APB1PeriphResetCmd(RCC_APB1Periph_CRS, DISABLE);
}

/**
  * @brief  Adjusts the Internal High Speed 48 oscillator (HSI 48) calibration value.
  * @note   The calibration is used to compensate for the variations in voltage
  *         and temperature that influence the frequency of the internal HSI48 RC.
  * @note   This function can be called only when the AUTOTRIMEN bit is reset.
  * @param  CRS_HSI48CalibrationValue: 
  * @retval None
  */
void CRS_AdjustHSI48CalibrationValue(uint8_t CRS_HSI48CalibrationValue)
{
  /* Clear TRIM[5:0] bits */
  CRS->CR &= ~CRS_CR_TRIM;
  
  /* Set the TRIM[5:0] bits according to CRS_HSI48CalibrationValue value */
  CRS->CR |= (uint32_t)((uint32_t)CRS_HSI48CalibrationValue << 8);

}

/**
  * @brief  Enables or disables the oscillator clock for frequency error counter.
  * @note   when the CEN bit is set the CRS_CFGR register becomes write-protected.
  * @param  NewState: new state of the frequency error counter.
  *          This parameter can be: ENABLE or DISABLE.
  * @retval None
  */
void CRS_FrequencyErrorCounterCmd(FunctionalState NewState)
{
  assert_param(IS_FUNCTIONAL_STATE(NewState));

  if (NewState != DISABLE)
  {
     CRS->CR |= CRS_CR_CEN;
  }
  else
  {
    CRS->CR &= ~CRS_CR_CEN;
  }
}

/**
  * @brief  Enables or disables the automatic hardware adjustement of TRIM bits.
  * @note   When the AUTOTRIMEN bit is set the CRS_CFGR register becomes write-protected.
  * @param  NewState: new state of the automatic trimming.
  *          This parameter can be: ENABLE or DISABLE.
  * @retval None
  */
void CRS_AutomaticCalibrationCmd(FunctionalState NewState)
{
  assert_param(IS_FUNCTIONAL_STATE(NewState));

  if (NewState != DISABLE)
  {
    CRS->CR |= CRS_CR_AUTOTRIMEN;
  }
else
  {
    CRS->CR &= ~CRS_CR_AUTOTRIMEN;
  }
}

/**
  * @brief  Generate the software synchronization event
  * @param  None
  * @retval None
  */
void CRS_SoftwareSynchronizationGenerate(void)
{
  CRS->CR |= CRS_CR_SWSYNC;
}

/**
  * @brief  Adjusts the Internal High Speed 48 oscillator (HSI 48) calibration value.
  * @note   The calibration is used to compensate for the variations in voltage
  *         and temperature that influence the frequency of the internal HSI48 RC.
  * @note   This function can be called only when the CEN bit is reset.
  * @param  CRS_ReloadValue: specifies the HSI calibration trimming value.
  *          This parameter must be a number between 0 and .
  * @retval None
  */
void CRS_FrequencyErrorCounterReload(uint32_t CRS_ReloadValue)
{
 
  /* Clear RELOAD[15:0] bits */
  CRS->CFGR &= ~CRS_CFGR_RELOAD;
  
  /* Set the RELOAD[15:0] bits according to CRS_ReloadValue value */
  CRS->CFGR |= (uint32_t)CRS_ReloadValue;

}

/**
  * @brief  
  * @note   This function can be called only when the CEN bit is reset.
  * @param  CRS_ErrorLimitValue: specifies the HSI calibration trimming value.
  *          This parameter must be a number between 0 and .
  * @retval None
  */
void CRS_FrequencyErrorLimitConfig(uint8_t CRS_ErrorLimitValue)
{
  /* Clear FELIM[7:0] bits */
  CRS->CFGR &= ~CRS_CFGR_FELIM;
  
  /* Set the FELIM[7:0] bits according to CRS_ErrorLimitValue value */
  CRS->CFGR |= (uint32_t)CRS_ErrorLimitValue;
}

/**
  * @brief  
  * @note   This function can be called only when the CEN bit is reset.
  * @param  CRS_Prescaler: specifies the HSI calibration trimming value.
  *          This parameter can be one of the following values:
  *            @arg CRS_SYNC_Div1:   
  *            @arg CRS_SYNC_Div2:   
  *            @arg CRS_SYNC_Div4:   
  *            @arg CRS_SYNC_Div8:   
  *            @arg CRS_SYNC_Div16:  
  *            @arg CRS_SYNC_Div32:  
  *            @arg CRS_SYNC_Div64: 
  *            @arg CRS_SYNC_Div128: 
  * @retval None
  */
void CRS_SynchronizationPrescalerConfig(uint32_t CRS_Prescaler)
{
  /* Check the parameters */
  assert_param(IS_CRS_SYNC_DIV(CRS_Prescaler));
  
  /* Clear SYNCDIV[2:0] bits */
  CRS->CFGR &= ~CRS_CFGR_SYNCDIV;
  
  /* Set the CRS_CFGR_SYNCDIV[2:0] bits according to CRS_Prescaler value */
  CRS->CFGR |= CRS_Prescaler;
}

/**
  * @brief  
  * @note   This function can be called only when the CEN bit is reset.
  * @param  CRS_Source: .
  *          This parameter can be one of the following values:
  *            @arg CRS_SYNCSource_GPIO:   
  *            @arg CRS_SYNCSource_LSE:   
  *            @arg CRS_SYNCSource_USB:   
  * @retval None
  */
void CRS_SynchronizationSourceConfig(uint32_t CRS_Source)
{
  /* Check the parameters */
  assert_param(IS_CRS_SYNC_SOURCE(CRS_Source));
  
  /* Clear SYNCSRC[1:0] bits */
  CRS->CFGR &= ~CRS_CFGR_SYNCSRC;
  
  /* Set the SYNCSRC[1:0] bits according to CRS_Source value */
  CRS->CFGR |= CRS_Source;
}

/**
  * @brief  
  * @note   This function can be called only when the CEN bit is reset.
  * @param  CRS_Polarity: .
  *          This parameter can be one of the following values:
  *            @arg CRS_SYNCPolarity_Rising:   
  *            @arg CRS_SYNCPolarity_Falling:   
  * @retval None
  */
void CRS_SynchronizationPolarityConfig(uint32_t CRS_Polarity)
{
  /* Check the parameters */
  assert_param(IS_CRS_SYNC_POLARITY(CRS_Polarity));
  
  /* Clear SYNCSPOL bit */
  CRS->CFGR &= ~CRS_CFGR_SYNCPOL;
  
  /* Set the SYNCSPOL bits according to CRS_Polarity value */
  CRS->CFGR |= CRS_Polarity;
}

/**
  * @brief  Returns the Relaod value.
  * @param  None
  * @retval The reload value 
  */
uint32_t CRS_GetReloadValue(void)
{
  return ((uint32_t)(CRS->CFGR & CRS_CFGR_RELOAD));
}

/**
  * @brief  Returns the HSI48 Calibration value.
  * @param  None
  * @retval The reload value 
  */
uint32_t CRS_GetHSI48CalibrationValue(void)
{
  return (((uint32_t)(CRS->CR & CRS_CR_TRIM)) >> 8);
}

/**
  * @brief  Returns the frequency error capture.
  * @param  None
  * @retval The frequency error capture value 
  */
uint32_t CRS_GetFrequencyErrorValue(void)
{
  return ((uint32_t)(CRS->ISR & CRS_ISR_FECAP));
}

/**
  * @brief  Returns the frequency error direction.
  * @param  None
  * @retval The frequency error direction. The returned value can be one 
  *         of the following values:
  *           - 0x00: Up counting
  *           - 0x8000: Down counting   
  */
uint32_t CRS_GetFrequencyErrorDirection(void)
{
  return ((uint32_t)(CRS->ISR & CRS_ISR_FEDIR));
}

/** @defgroup CRS_Group2 Interrupts and flags management functions
 *  @brief   Interrupts and flags management functions 
 *
@verbatim
 ===============================================================================
             ##### Interrupts and flags management functions #####
 ===============================================================================
@endverbatim
  * @{
  */
/**
  * @brief  Enables or disables the specified CRS interrupts.
  * @param  CRS_IT: specifies the RCC interrupt sources to be enabled or disabled.
  *          This parameter can be any combination of the following values:
  *              @arg CRS_IT_SYNCOK: 
  *              @arg CRS_IT_SYNCWARN: 
  *              @arg CRS_IT_ERR: 
  *              @arg CRS_IT_ESYNC: 
  * @param  NewState: new state of the specified CRS interrupts.
  *          This parameter can be: ENABLE or DISABLE.
  * @retval None
  */
void CRS_ITConfig(uint32_t CRS_IT, FunctionalState NewState)
{
  /* Check the parameters */
  assert_param(IS_CRS_IT(CRS_IT));
  assert_param(IS_FUNCTIONAL_STATE(NewState));
  
  if (NewState != DISABLE)
  {
    CRS->CR |= CRS_IT;
  }
  else
  {
    CRS->CR &= ~CRS_IT;
  }
}

/**
  * @brief  Checks whether the specified CRS flag is set or not.
  * @param  CRS_FLAG: specifies the flag to check.
  *          This parameter can be one of the following values:
  *              @arg CRS_FLAG_SYNCOK: 
  *              @arg CRS_FLAG_SYNCWARN: 
  *              @arg CRS_FLAG_ERR: 
  *              @arg CRS_FLAG_ESYNC:   
  *              @arg CRS_FLAG_TRIMOVF: 
  *              @arg CRS_FLAG_SYNCERR: 
  *              @arg CRS_FLAG_SYNCMISS: 
  * @retval The new state of CRS_FLAG (SET or RESET).
  */
FlagStatus CRS_GetFlagStatus(uint32_t CRS_FLAG)
{
  /* Check the parameters */
  assert_param(IS_CRS_FLAG(CRS_FLAG));

  return ((FlagStatus)(CRS->ISR & CRS_FLAG));
}

/**
  * @brief  Clears the CRS specified FLAG.
  * @param  CRS_FLAG: specifies the flag to check.
  *          This parameter can be one of the following values:
  *              @arg CRS_FLAG_SYNCOK: 
  *              @arg CRS_FLAG_SYNCWARN: 
  *              @arg CRS_FLAG_ERR: 
  *              @arg CRS_FLAG_ESYNC:   
  *              @arg CRS_FLAG_TRIMOVF: 
  *              @arg CRS_FLAG_SYNCERR: 
  *              @arg CRS_FLAG_SYNCMISS: 
  * @retval None
  */
void CRS_ClearFlag(uint32_t CRS_FLAG)
{
  /* Check the parameters */
  assert_param(IS_CRS_FLAG(CRS_FLAG));
  
  if ((CRS_FLAG & FLAG_MASK)!= 0)
  {
    CRS->ICR |= CRS_ICR_ERRC;  
  }
  else
  {
    CRS->ICR |= CRS_FLAG;
  }
}

/**
  * @brief  Checks whether the specified CRS IT pending bit is set or not.
  * @param  CRS_IT: specifies the IT pending bit to check.
  *          This parameter can be one of the following values:
  *              @arg CRS_IT_SYNCOK: 
  *              @arg CRS_IT_SYNCWARN: 
  *              @arg CRS_IT_ERR: 
  *              @arg CRS_IT_ESYNC:   
  *              @arg CRS_IT_TRIMOVF: 
  *              @arg CRS_IT_SYNCERR: 
  *              @arg CRS_IT_SYNCMISS: 
  * @retval The new state of CRS_IT (SET or RESET).
  */
ITStatus CRS_GetITStatus(uint32_t CRS_IT)
{
  /* Check the parameters */
  assert_param(IS_CRS_GET_IT(CRS_IT));

  return ((ITStatus)(CRS->ISR & CRS_IT));
}

/**
  * @brief  Clears the CRS specified IT pending bi.
  * @param  CRS_FLAG: specifies the IT pending bi to clear.
  *          This parameter can be one of the following values:
  *              @arg CRS_IT_SYNCOK: 
  *              @arg CRS_IT_SYNCWARN: 
  *              @arg CRS_IT_ERR: 
  *              @arg CRS_IT_ESYNC:   
  *              @arg CRS_IT_TRIMOVF: 
  *              @arg CRS_IT_SYNCERR: 
  *              @arg CRS_IT_SYNCMISS: 
  * @retval None
  */
void CRS_ClearITPendingBit(uint32_t CRS_IT)
{
  /* Check the parameters */
  assert_param(IS_CRS_CLEAR_IT(CRS_IT));
  
  if ((CRS_IT & FLAG_MASK)!= 0)
  {
    CRS->ICR |= CRS_ICR_ERRC;  
  }
  else
  {
    CRS->ICR |= CRS_IT;
  }
}
/**
  * @}
  */
  
/**
  * @}
  */

/**
  * @}
  */

/**
  * @}
  */

/************************ (C) COPYRIGHT STMicroelectronics *****END OF FILE****/
