# Backend - ChromeBridge

ChromeBridge is a [Chrome App](https://developer.chrome.com/apps) which acts as an interface between **Anypixel apps** and the **physical hardware**, as well as a user interface for monitoring and controlling the state of the physical hardware.

## Getting Started

To install:

1. **Install node components** - `$ npm install`

2. **Open the Chrome Extensions page** - In the Chrome browser, navigate to `chrome://extensions`

3. **Enable Developer mode:**
![img](https://github.com/googlecreativelab/anypixel/blob/master/backend/extension.png)

4. **Load the extension** - Click the "Load unpacked extension..." button and select the 
/chromebridge folder. The ChromeBridge app will be added to the top of the extensions list.

4. **Ensure the AppServer and the Emulator are running** - or plug in your physical display hardware.

5. **Launch the app** - click the "Launch" button under the extension title:
![img](https://github.com/googlecreativelab/anypixel/blob/master/backend/launch.png)


To build:

```sh
$ npm run build
```


# Hardware Interface

#### Pixel Data

Each frame, ChromeBridge receives a full frame of raw pixel data from the app currently hosted by the AppServer. This data is split up according to which **display unit** is responsible for displaying the corresponding section of the app canvas. 

![img](https://github.com/googlecreativelab/anypixel/blob/master/display.png)

Each display unit's pixel data is then moved into a data packet and assigned an IP address and a port corresponding to the address of the matching display unit controller board. To speed things up, several display units' packets are **bundled** into a single UDP packet and are sent to the **udp-manager** to be unbundled and distributed to the IP address stored in each packet.

_For details on the packet formats used for this and all other data, see the [packet documentation](https://github.com/googlecreativelab/anypixel/wiki/Communications-Packets)_


#### Button Inputs

Every 33ms, the control boards send a list of button input states. ChromeBridge finds the inputs that have changed since the previous frame, and dispatches corresponding input events to the current app.


# User Interface

#### App Status Monitoring

The current application can be changed by choosing an option from the Application dropdown. The dropdown list is populated when ChromeBridge first starts, so if you add any new apps, click the **Reload app list** button to update the list.


#### Pixel Streaming

Pause or resume the sending of pixel data to the display hardware using the **Pause** button. Sometimes pixel streaming will be automatically paused to allow the transmission of calibration or dot correction data.  


#### Hardware Status Monitoring

Every second or so, the hardware will send status data containing information about the overall health of each piece of the system. This includes information like the temperature of each LED, the MAC address of each board, how long each board has been running for, and whether the power supplies are working correctly.


#### Display Unit Monitoring / Control

The overall health of each display unit is shown in a grid. Display units which are not working correctly will be colored in red, while ones that are stable are in green. 

Clicking on a display unit will bring up more detailed information, including a per-pixel temperature display, board MAC addresses, and uptime information. You can also set the dot correction and calibration data for the individual display unit.


#### Power Unit Monitoring / Control

Below the display unit grid is the power unit status display. Each power unit powers the 6 display units above it. Like the display units, green = good, red = bad. Clicking on a power unit will bring up more detailed information about the state of each part of the power supply, and provides controls for switching the power relays on and off.
