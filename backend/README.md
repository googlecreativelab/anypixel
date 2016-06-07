# AnyPixel - Backend
The AnyPixel backend consists of four applications which work together to provide an interface 
between the javascript-driven AnyPixel apps (the [_frontend_](https://github.com/googlecreativelab/anypixel/tree/master/frontend)) and the physical display 
[hardware](https://github.com/googlecreativelab/anypixel/tree/master/hardware). 

- **AppServer** - A node.js server which locally hosts the AnyPixel apps.

- **ChromeBridge** - A Chrome app which displays AnyPixel apps and handles the communication between the AppServer apps and the physical display hardware. 

- **UdpManager** - A node.js app which distributes data packets from ChromeBridge to the individual hardware components.

- **Emulator** - A Chrome app for debugging, which simulates the network communications 
between ChromeBridge and the physical display hardware.

![img](https://github.com/googlecreativelab/anypixel/blob/master/backend/flow.png)

## Installation & Startup
_These instructions assume a basic familiarity with the command line of your particular system. 
For a good introduction to the command line, check out 
[The Command Line Crash Course](http://cli.learncodethehardway.org/book/)._

### Getting Started
1. **Download and install [node.js](https://nodejs.org/en/).**

2. **Install [browserify](http://browserify.org/)** - `$ npm install -g browserify`

---------

### AppServer
1. **Install node components** - In the /appserver directory, do: `$ npm install`

2. **Start the server** - In the /appserver directory, do `$ npm start`

To stop the server, do `$ npm stop`

_For more info on adding your own apps to the AppServer, see the [AppServer README](https://github.com/googlecreativelab/anypixel/tree/master/backend/appserver)._

---------

### UdpManager
1. **Install node components** - In the /udp-manager directory, do: `$npm install`

2. **Start the manager** - In the /udp-manager directory, do `$ npm start`

To stop the manager, do `$ npm stop` 

---------

### Emulator
1. **Install node components** - In the /emulator directory, do: `$ npm install`

2. **Install and launch the Chrome app** - Follow the ChromeBridge installation instructions above, 
except when loading the extension, select the **/emulator** folder instead.

---------

### ChromeBridge
1. **Install node components** - In the /chromebridge directory, do: `$ npm install`

2. **Open the Chrome Extensions page** - In the Chrome browser, navigate to `chrome://extensions`

3. **Enable Developer mode:**
![img](https://github.com/googlecreativelab/anypixel/blob/master/backend/extension.png)

4. **Load the extension** - Click the "Load unpacked extension..." button and select the 
/chromebridge folder. The ChromeBridge app will be added to the top of the extensions list.

4. **Ensure the AppServer and the Emulator are running** - or plug in your physical display hardware.

5. **Launch the app** - click the "Launch" button under the extension title:
![img](https://github.com/googlecreativelab/anypixel/blob/master/backend/launch.png)

_For more info on using the ChromeBridge app, see the [ChromeBridge README](https://github.com/googlecreativelab/anypixel/tree/master/backend/chromebridge)_.
