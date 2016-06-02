# Comms Protocols

16-bit header, followed by the payload

## PC to Controllers

### Header

| Offset | Size (Bytes) |    Field Name   |                         Purpose                       |
|--------|--------------|-----------------|-------------------------------------------------------|
| 0x00   | 1            | Command ID      | Identifies the command to be performed, listed below. |
| 0x01   | 7            | Reserved        | Reserved (see command 0x05)                           |
| 0x08   | 1            | Unit Address    | Physical address of the target control board, calculated as 20 + 10 * row + column (zero indexed)
| 0x09   | 1            | Sequence Number | TODO                                                  |
| 0x0A   | 4            | IP Address      | IP address of the target board                        |
| 0x0C   | 2            | Port            | TODO                                                  |

### Commands

#### 0x01 - Set RGB (8-bit)
**Description:** Sets the colors of all 49 LEDs on a board, using the calibration mapping. Order is 
top-left to bottom-right, row by row. Format is RGB888 (8-bit RGB).

**Payload:**

| Byte | 0 | 1 | 2 | 3 | 4 | 5 | 6 | ... |
|------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:---:|
|      | R | G | B | R | G | B | R | ... |

----------

#### 0x02 - Set RGB (12-bit)
**Description:** Sets the colors of all 49 LEDs on a board, using the calibration mapping. Order is 
top-left to bottom-right, row by row. Format is compacted 12-bit

----------

#### 0x03 - Dot correction (12-bit)
**Description:**

----------

#### 0x04 - Set RGB raw (8-bit)
**Description:**

----------

#### 0x05 - Set calibration lookup table
**Description:**

----------

#### 0x06 - Dot correction (8-bit)
**Description:**

----------

#### 0x07 - Dot correction (6-bit)
**Description:**

----------

#### 0x08 - Calibration lookup table request
**Description:**

----------

#### 0x09 - Set fan speed / mode
**Description:**

----------

#### 0x10 - Relay enable
_Only applies to the control boards in the power box_

**Description:** Flags for enabling the two AC power relays. Set to enable, clear to disable.

**Payload:**

| Byte |      0     |      1     |
|------|:----------:|:----------:|
|      | Relay 1 EN | Relay 2 EN |

----------

#### 0xF0 - Reboot board
**Description:** Triggers a reboot of the controller and/or LED boards. The first four bytes are a 
checksum to prevent accidental reboots. The last byte contains 5 flags: 

|Bit|  7  |  6  |  5  |   4  |    3   |    2   |    1   |    0   |
|---|:---:|:---:|:---:|:----:|:------:|:------:|:------:|:------:|
|   |  -  |  -  |  -  | CTRL | LED NW | LED SW | LED SE | LED NE |

Setting the **CTRL** flag will reboot the target control board. Setting each **LED** flag will 
reboot the LED board in the given quadrant.

**Payload:**

| Byte |   0  |   1  |   2  |   3  |     4      |
|------|:----:|:----:|:----:|:----:|:----------:|
|      |`0x81`|`0x6A`|`0x4E`|`0xB2`|`0b000xxxxx`|
