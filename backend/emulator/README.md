# Backend - Emulator

The emulator is a [Chrome App](https://developer.chrome.com/apps) which simulates the network communications of the physical display hardware. Each [display unit](#TODO) listens for UDP packets on a separate port, just as the physical display units each have individual IP addresses.

To configure the IP address and port settings for the emulator, see [config/config.emulator.js](https://github.com/googlecreativelab/anypixel/blob/master/backend/config/config.emulator.js). Changes to the config files will require rebuilding both the emulator and [ChromeBridge](https://github.com/googlecreativelab/anypixel/tree/master/backend/chromebridge).

## Getting Started

To install:

1. **Install node components** - `$ npm install`

2. **Open the Chrome Extensions page** - In the Chrome browser, navigate to `chrome://extensions`

3. **Enable Developer mode:**
![img](https://github.com/googlecreativelab/anypixel/blob/master/backend/extension.png)

4. **Load the extension** - Click the "Load unpacked extension..." button and select the 
/emulator folder. The Emulator app will be added to the top of the extensions list.

4. **Launch the app** - click the "Launch" button under the extension title:
![img](https://github.com/googlecreativelab/anypixel/blob/master/backend/launch.png)

To build:

```sh
$ npm run build
```
