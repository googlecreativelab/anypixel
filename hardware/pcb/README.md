# Electronics Overview

## Power

24v power is delivered from the power supply boxes to the LED boards through a 4A fuse. On each LED
board the 24v rail powers three identical 5v buck converters (or alternatively a single 1/4 brick
supply with the three 5v rails bridged together) which provide power to the LEDs and is further
stepped down to 3.3v to power the microcontrollers.  There is also a power supply that steps the 24v
down to 12v to power the cooling fan. The 24v rail is also connected to the RJ12 connection which
goes to the IP controller.

The IP controller has a diode ORing arrangement, accepting power from any of the 4 LED boards and/or
an additional external supply via a barrel connector. There are two switching supplies on the IP
controller board, one with a 3.3v output to power all the onboard electronics, and a 5v output
device for powering accessories through a 2 pin header.


## Data Flow

The IP controller board contains a 3 port 100Mbit Ethernet switch with two ports exposed as RJ45
connectors which allows for daisy chaining boards together eliminating the need for long cable runs
back to a single large switch. The third port of this switch is connected to the STM32F407
microcontroller on the IP controller which takes in packets containing data for a complete 14x14
button panel. The firmware divides this data into 4 smaller packets and send these to the 4
connected 7x7 LED boards.

Communication to the LED boards is over asynchronous serial with a baud rate of 1Mbit.  There are 5
STM32F030 microcontrollers on each LED board that each control 9 or 10 RGB LEDs and have the same
number of thermistors and switches as input.  The thermistors are used to report the temperature of
each LED, and the switch is used for user input. The microcontrollers are connected in a chain, with
the TX from the IP controller connected to the first microcontroller's RX, and then the first
microcontroller's TX to the second microcontroller's RX and so on until the 5th microcontroller's TX
connects back to the IP controller's RX.  This configuration and the firmware make the LED board
behave like a large shift register, with each processor gathering its input and replacing it with
its output in the appropriate location in each packet based on its address as the stream of data is
shifted through it.  The packets are delimited by an idle state on the serial line (no signal edges
occur in the time it takes to transmit a complete byte, or about 10 microseconds).

The interface from the STM32F030 microcontrollers to the two TLC59401 LED drivers it controls is
like a shift register as well.  The two TLC59401 chips are connected in series.  There are
additional connections to the TLC59401 to facilitate the PWM signal generation, these include a
grayscale clock and a blanking signal.


## LED drive

The TLC59401 chip is a 16 channel constant current supply PWM controlled LED driver.  The device has
a global reference resistor to set the maximum channel current.  Each channel then has an analog dot
correct circuit which controls the current reference in 64 steps.  This dot correction feature is
used for rough calibration and is not changed during operation.  The global reference combined with
the dot correction circuit provide for a constant current output to drive the LEDs.

The TLC59401 also has PWM to toggle the constant current outputs on and off with a programmable duty
cycle. This is a 12-bit PWM system yielding 4096 discrete intensities for the output on top of the
5-bit/64 value dot correction values, which provides a 17-bit range for the system.  The firmware
implements a lookup table for converting from the typical 8-bits per channel input media to the
12-bit PWM values. Due to memory constrains the lookup table has only 65 entries and uses linear
interpolation to map the complete 256-value/8-bit input range to appropriate output values.
