# Backend - Config
The main configuration and data packet structure of the Anypixel display is managed by these files, which are shared between the four backend apps. 

Changes to the config files will require rebuilding both the [emulator](https://github.com/googlecreativelab/anypixel/tree/master/backend/emulator) and [ChromeBridge](https://github.com/googlecreativelab/anypixel/tree/master/backend/chromebridge).

## What You'll Find
- **config.xxxxx files** - configuration values and IP addresses for various hardware systems. 
- **/packets** - files for data packet creation and parsing
