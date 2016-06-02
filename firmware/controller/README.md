# Firmware - Controller

You have to set the correct memory layout for your device in the linker script.
Please check the FLASH and SRAM length.

e.g.

```
MEMORY
{
  FLASH (rx) : ORIGIN = 0x08000000, LENGTH = 0x08000   /* 32k */
  RAM (rwx)  : ORIGIN = 0x20000000, LENGTH = 0x01000   /*  4k */
}
```

This project contains the following third party software located in the ThirdParty subdirectory

- LwIP Lightweight TCP/IP protocol stack
- ST STM32F4 Standard Peripheral Library
- ST STM32F4x7 Ethernet driver (See Application Note AN3966)
- ARM csmis header files (provided with ST Standard Peripheral Library)
