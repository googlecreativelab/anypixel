/**
 * @file
 * Ethernet Interface for standalone applications (without RTOS) - works only for
 * ethernet polling mode (polling for ethernet frame reception)
 *
 */

/*
 * Copyright (c) 2001-2004 Swedish Institute of Computer Science.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products
 *    derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
 * SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
 * OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY
 * OF SUCH DAMAGE.
 *
 * This file is part of the lwIP TCP/IP stack.
 *
 * Author: Adam Dunkels <adam@sics.se>
 *
 */

#include "lwip/opt.h"
#include "lwip/mem.h"
#include "netif/etharp.h"
#include "ethernetif.h"
#include "stm32f4x7_eth.h"
#include "main.h"
#include <string.h>

/* Network interface name */
#define IFNAME0 's'
#define IFNAME1 't'


/* Ethernet Rx & Tx DMA Descriptors */
extern ETH_DMADESCTypeDef  DMARxDscrTab[ETH_RXBUFNB], DMATxDscrTab[ETH_TXBUFNB];

/* Ethernet Driver Receive buffers  */
extern uint8_t Rx_Buff[ETH_RXBUFNB][ETH_RX_BUF_SIZE];

/* Ethernet Driver Transmit buffers */
extern uint8_t Tx_Buff[ETH_TXBUFNB][ETH_TX_BUF_SIZE];

/* Global pointers to track current transmit and receive descriptors */
extern ETH_DMADESCTypeDef  *DMATxDescToSet;
extern ETH_DMADESCTypeDef  *DMARxDescToGet;

/* Global pointer for last received frame infos */
extern ETH_DMA_Rx_Frame_infos *DMA_RX_FRAME_infos;

/**
 * In this function, the hardware should be initialized.
 * Called from ethernetif_init().
 *
 * @param netif the already initialized lwip network interface structure
 *        for this ethernetif
 */
static void low_level_init(struct netif *netif)
{
#ifdef CHECKSUM_BY_HARDWARE
  int i;
#endif
  /* set MAC hardware address length */
  netif->hwaddr_len = ETHARP_HWADDR_LEN;

  /* set MAC hardware address */
  netif->hwaddr[0] =  MAC_ADDR0;
  netif->hwaddr[1] =  MAC_ADDR1;
  netif->hwaddr[2] =  MAC_ADDR2;
  netif->hwaddr[3] =  MAC_ADDR3;
  netif->hwaddr[4] =  MAC_ADDR4;
  netif->hwaddr[5] =  mac_last_octet;

  /* initialize MAC address in ethernet MAC */
  ETH_MACAddressConfig(ETH_MAC_Address0, netif->hwaddr);

  /* maximum transfer unit */
  netif->mtu = 1500;

  /* device capabilities */
  /* don't set NETIF_FLAG_ETHARP if this device is not an ethernet one */
  netif->flags = NETIF_FLAG_BROADCAST | NETIF_FLAG_ETHARP;

  /* Initialize Tx Descriptors list: Chain Mode */
  ETH_DMATxDescChainInit(DMATxDscrTab, &Tx_Buff[0][0], ETH_TXBUFNB);
  /* Initialize Rx Descriptors list: Chain Mode  */
  ETH_DMARxDescChainInit(DMARxDscrTab, &Rx_Buff[0][0], ETH_RXBUFNB);

#ifdef CHECKSUM_BY_HARDWARE
  /* Enable the TCP, UDP and ICMP checksum insertion for the Tx frames */
  for(i=0; i<ETH_TXBUFNB; i++)
    {
      ETH_DMATxDescChecksumInsertionConfig(&DMATxDscrTab[i], ETH_DMATxDesc_ChecksumTCPUDPICMPFull);
    }
#endif

   /* Note: TCP, UDP, ICMP checksum checking for received frame are enabled in DMA config */

  /* Enable MAC and DMA transmission and reception */
  ETH_Start();

}

/**
 * This function should do the actual transmission of the packet. The packet is
 * contained in the pbuf that is passed to the function. This pbuf
 * might be chained.
 *
 * @param netif the lwip network interface structure for this ethernetif
 * @param p the MAC packet to send (e.g. IP packet including MAC addresses and type)
 * @return ERR_OK if the packet could be sent
 *         an err_t value if the packet couldn't be sent
 *
 * @note Returning ERR_MEM here if a DMA queue of your MAC is full can lead to
 *       strange results. You might consider waiting for space in the DMA queue
 *       to become availale since the stack doesn't retry to send a packet
 *       dropped because of memory failure (except for the TCP timers).
 */

static err_t low_level_output(struct netif *netif, struct pbuf *p)
{
  err_t errval;
  struct pbuf *q;
  u8 *buffer =  (u8 *)(DMATxDescToSet->Buffer1Addr);
  __IO ETH_DMADESCTypeDef *DmaTxDesc;
  uint16_t framelength = 0;
  uint32_t bufferoffset = 0;
  uint32_t byteslefttocopy = 0;
  uint32_t payloadoffset = 0;

  DmaTxDesc = DMATxDescToSet;
  bufferoffset = 0;

  /* copy frame from pbufs to driver buffers */
  for(q = p; q != NULL; q = q->next)
    {
      /* Is this buffer available? If not, goto error */
      if((DmaTxDesc->Status & ETH_DMATxDesc_OWN) != (u32)RESET)
      {
        errval = ERR_BUF;
        goto error;
      }

      /* Get bytes in current lwIP buffer */
      byteslefttocopy = q->len;
      payloadoffset = 0;

      /* Check if the length of data to copy is bigger than Tx buffer size*/
      while( (byteslefttocopy + bufferoffset) > ETH_TX_BUF_SIZE )
      {
        /* Copy data to Tx buffer*/
        memcpy( (u8_t*)((u8_t*)buffer + bufferoffset), (u8_t*)((u8_t*)q->payload + payloadoffset), (ETH_TX_BUF_SIZE - bufferoffset) );

        /* Point to next descriptor */
        DmaTxDesc = (ETH_DMADESCTypeDef *)(DmaTxDesc->Buffer2NextDescAddr);

        /* Check if the buffer is available */
        if((DmaTxDesc->Status & ETH_DMATxDesc_OWN) != (u32)RESET)
        {
          errval = ERR_USE;
          goto error;
        }

        buffer = (u8 *)(DmaTxDesc->Buffer1Addr);

        byteslefttocopy = byteslefttocopy - (ETH_TX_BUF_SIZE - bufferoffset);
        payloadoffset = payloadoffset + (ETH_TX_BUF_SIZE - bufferoffset);
        framelength = framelength + (ETH_TX_BUF_SIZE - bufferoffset);
        bufferoffset = 0;
      }

      /* Copy the remaining bytes */
      memcpy( (u8_t*)((u8_t*)buffer + bufferoffset), (u8_t*)((u8_t*)q->payload + payloadoffset), byteslefttocopy );
      bufferoffset = bufferoffset + byteslefttocopy;
      framelength = framelength + byteslefttocopy;
    }

  /* Note: padding and CRC for transmitted frame
     are automatically inserted by DMA */

  /* Prepare transmit descriptors to give to DMA*/
  ETH_Prepare_Transmit_Descriptors(framelength);

  errval = ERR_OK;

error:

  /* When Transmit Underflow flag is set, clear it and issue a Transmit Poll Demand to resume transmission */
  if ((ETH->DMASR & ETH_DMASR_TUS) != (uint32_t)RESET)
  {
    /* Clear TUS ETHERNET DMA flag */
    ETH->DMASR = ETH_DMASR_TUS;

    /* Resume DMA transmission*/
    ETH->DMATPDR = 0;
  }
  return errval;
}

/**
 * Should allocate a pbuf and transfer the bytes of the incoming
 * packet from the interface into the pbuf.
 *
 * @param netif the lwip network interface structure for this ethernetif
 * @return a pbuf filled with the received packet (including MAC header)
 *         NULL on memory error
   */
static struct pbuf * low_level_input(struct netif *netif)
{
  struct pbuf *p, *q;
  uint32_t len;
  FrameTypeDef frame;
  u8 *buffer;
  __IO ETH_DMADESCTypeDef *DMARxDesc;
  uint32_t bufferoffset = 0;
  uint32_t payloadoffset = 0;
  uint32_t byteslefttocopy = 0;
  uint32_t i=0;

  /* get received frame */
  frame = ETH_Get_Received_Frame();

  /* Obtain the size of the packet and put it into the "len" variable. */
  len = frame.length;
  buffer = (u8 *)frame.buffer;

  /* We allocate a pbuf chain of pbufs from the Lwip buffer pool */
  p = pbuf_alloc(PBUF_RAW, len, PBUF_POOL);

  if (p != NULL)
  {
    DMARxDesc = frame.descriptor;
    bufferoffset = 0;
    for(q = p; q != NULL; q = q->next)
    {
      byteslefttocopy = q->len;
      payloadoffset = 0;

      /* Check if the length of bytes to copy in current pbuf is bigger than Rx buffer size*/
      while( (byteslefttocopy + bufferoffset) > ETH_RX_BUF_SIZE )
      {
        /* Copy data to pbuf*/
        memcpy( (u8_t*)((u8_t*)q->payload + payloadoffset), (u8_t*)((u8_t*)buffer + bufferoffset), (ETH_RX_BUF_SIZE - bufferoffset));

        /* Point to next descriptor */
        DMARxDesc = (ETH_DMADESCTypeDef *)(DMARxDesc->Buffer2NextDescAddr);
        buffer = (unsigned char *)(DMARxDesc->Buffer1Addr);

        byteslefttocopy = byteslefttocopy - (ETH_RX_BUF_SIZE - bufferoffset);
        payloadoffset = payloadoffset + (ETH_RX_BUF_SIZE - bufferoffset);
        bufferoffset = 0;
      }
      /* Copy remaining data in pbuf */
      memcpy( (u8_t*)((u8_t*)q->payload + payloadoffset), (u8_t*)((u8_t*)buffer + bufferoffset), byteslefttocopy);
      bufferoffset = bufferoffset + byteslefttocopy;
    }
  }

  /* Release descriptors to DMA */
  DMARxDesc =frame.descriptor;

  /* Set Own bit in Rx descriptors: gives the buffers back to DMA */
  for (i=0; i<DMA_RX_FRAME_infos->Seg_Count; i++)
  {
    DMARxDesc->Status = ETH_DMARxDesc_OWN;
    DMARxDesc = (ETH_DMADESCTypeDef *)(DMARxDesc->Buffer2NextDescAddr);
  }

  /* Clear Segment_Count */
  DMA_RX_FRAME_infos->Seg_Count =0;

  /* When Rx Buffer unavailable flag is set: clear it and resume reception */
  if ((ETH->DMASR & ETH_DMASR_RBUS) != (u32)RESET)
  {
    /* Clear RBUS ETHERNET DMA flag */
    ETH->DMASR = ETH_DMASR_RBUS;
    /* Resume DMA reception */
    ETH->DMARPDR = 0;
  }
  return p;
}

/**
 * This function should be called when a packet is ready to be read
 * from the interface. It uses the function low_level_input() that
 * should handle the actual reception of bytes from the network
 * interface. Then the type of the received packet is determined and
 * the appropriate input function is called.
 *
 * @param netif the lwip network interface structure for this ethernetif
 */
err_t ethernetif_input(struct netif *netif)
{
  err_t err;
  struct pbuf *p;

  /* move received packet into a new pbuf */
  p = low_level_input(netif);

  /* no packet could be read, silently ignore this */
  if (p == NULL) return ERR_MEM;

  /* entry point to the LwIP stack */
  err = netif->input(p, netif);

  if (err != ERR_OK)
  {
    LWIP_DEBUGF(NETIF_DEBUG, ("ethernetif_input: IP input error\n"));
    pbuf_free(p);
  }
  return err;
}

/**
 * Should be called at the beginning of the program to set up the
 * network interface. It calls the function low_level_init() to do the
 * actual setup of the hardware.
 *
 * This function should be passed as a parameter to netif_add().
 *
 * @param netif the lwip network interface structure for this ethernetif
 * @return ERR_OK if the loopif is initialized
 *         ERR_MEM if private data couldn't be allocated
 *         any other err_t on error
 */
err_t ethernetif_init(struct netif *netif)
{
  LWIP_ASSERT("netif != NULL", (netif != NULL));

#if LWIP_NETIF_HOSTNAME
  /* Initialize interface hostname */
  netif->hostname = "lwip";
#endif /* LWIP_NETIF_HOSTNAME */

  netif->name[0] = IFNAME0;
  netif->name[1] = IFNAME1;
  /* We directly use etharp_output() here to save a function call.
   * You can instead declare your own function an call etharp_output()
   * from it if you have to do some checks before sending (e.g. if link
   * is available...) */
  netif->output = etharp_output;
  netif->linkoutput = low_level_output;

  /* initialize the hardware */
  low_level_init(netif);

  return ERR_OK;
}
