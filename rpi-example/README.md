
# Starter Example: AnyPixel with Raspberry Pi (1st gen)

We heard your requests for a starter example using the AnyPixel framework. This documentation outlines how to connect a Raspberry Pi to a single LED button for roundtrip communication. 

By the end of this documentation, your Raspberry Pi with AnyPixel will control a red blinking LED and upon interaction turn the light blue. Simple and straightforward.

We hope you scale this project to make other more complex grids at home. If you do, please share!


# Getting Started

You will need to create an LED button [using these steps from Adafruit](https://learn.adafruit.com/neopixel-arcade-button?view=all).

With one LED button, your hardware setup should look like this:

![img](https://github.com/googlecreativelab/anypixel/blob/master/rpi-example/wiring.png)

*<b>NOTE:</b> this example is only known to work on the first generation Raspberry Pi, the libraries used for controlling the WS281x LEDs has not been confirmed to work with Pi 2 hardware.*

*<b>NOTE:</b> If you plan on scaling this example, keep in mind that you may require additional hardware - port expander(s), level shifter(s), and possibly a power supply that supplies a higher amperage (here we're using 5 volts, 2 amps).*


#1. Setting up Raspberry Pi

###1. Flash Raspbian

Link for Raspbian images & instructions can be found [here](https://www.raspberrypi.org/downloads/raspbian/)

###2. Install node.js

####Download Node.js source Raspberry Pi Model A, B, B+
```
wget https://nodejs.org/dist/v4.0.0/node-v4.0.0-linux-armv6l.tar.gz 
tar -xvf node-v4.0.0-linux-armv6l.tar.gz 
cd node-v4.0.0-linux-armv6l
```

###3. Run the application

Take the ```/rpi-example``` directory and transfer it to your RPi. You can simply clone this repo on your RPi to get it there easily.  
Run ```npm install``` in that directory.  This will install the GPIO driver dependencies for the app.  
Then run ```sudo node unit.js``` to start listening to the UDP packets that will be sent in the next step.   



#2. Running the app from host computer

###Install Sample App
Copy and paste ```frontend/examples/getting-started-rpi``` into ```appserver/public/apps/``` and then:

```
cd appserver/public/apps/getting-started-rpi
npm install
npm run build
```


### Install Emulator

```
cd /backend/emulator
npm run build
```
Open Chrome and visit chrome://extensions and click "Load unpackaged extension", and navigate to & select the ```/backend/emulator``` folder.  This should enable the extension with confirmation in Chrome as follows:

![img](https://github.com/googlecreativelab/anypixel/blob/master/rpi-example/emulator.png)

### Install & Run UDP Manager

```
cd /backend/udp-manager
npm install
npm start
```

###Install & Run App Server

```
cd /backend/appserver 
npm install
npm install anypixel
npm start
```

###Install ChromeBridge

```
cd /backend/chromebridge
npm install
```

Open Chrome and visit chrome://extensions and click "Load unpackaged extension", and navigate to & select the ```/backend/chromebridge``` folder.  This should enable the extension with confirmation in Chrome as follows:
#####ChromeBridge Enabled
![img](https://github.com/googlecreativelab/anypixel/blob/master/rpi-example/chromebridge.png)

When you launch ChromeBridge, you should see the "Getting Started RPi" application in the dropdown menu, with a black square that turns blue every second.  When you launch the emulator, it should also show up there.
#####ChromeBridge Working
![img](https://github.com/googlecreativelab/anypixel/blob/master/rpi-example/chromebridge-working.png)
#####Emulator Working
![img](https://github.com/googlecreativelab/anypixel/blob/master/rpi-example/emulator-working.png)

###Point data to Raspberry Pi
Once you confirm that the emulator is working, you can quit it. Now we will start to point messages to the Raspberry Pi.  

Once you have the IP address of the RPi, change out the first unit address in ```backend/config/config.emulator.js```, and match the port set on the RPi server (unless changed, it's set to 3001).  It should look like this, but with your IP address for the first entry:

```
var EmulatorConfig = module.exports = {

  unitAddresses: [
    [
      {ip: '10.0.1.4', port: 3001},
      {ip: '127.0.0.1', port: 3002},
      {ip: '127.0.0.1', port: 3003},
      {ip: '127.0.0.1', port: 3004},
      {ip: '127.0.0.1', port: 3005},
      {ip: '127.0.0.1', port: 3006},
      {ip: '127.0.0.1', port: 3007},
      {ip: '127.0.0.1', port: 3008},
      {ip: '127.0.0.1', port: 3009},
      {ip: '127.0.0.1', port: 3010}
    ],
    [
      {ip: '127.0.0.1', port: 3011},
      {ip: '127.0.0.1', port: 3012},
      {ip: '127.0.0.1', port: 3013},
      {ip: '127.0.0.1', port: 3014},
      {ip: '127.0.0.1', port: 3015},
      {ip: '127.0.0.1', port: 3016},
      {ip: '127.0.0.1', port: 3017},
      {ip: '127.0.0.1', port: 3018},
      {ip: '127.0.0.1', port: 3019},
      {ip: '127.0.0.1', port: 3020}
    ],
    [
      {ip: '127.0.0.1', port: 3021},
      {ip: '127.0.0.1', port: 3022},
      {ip: '127.0.0.1', port: 3023},
      {ip: '127.0.0.1', port: 3024},
      {ip: '127.0.0.1', port: 3025},
      {ip: '127.0.0.1', port: 3026},
      {ip: '127.0.0.1', port: 3027},
      {ip: '127.0.0.1', port: 3028},
      {ip: '127.0.0.1', port: 3029},
      {ip: '127.0.0.1', port: 3030}
    ]
  ],

  powerUnitAddresses: [
    {ip: '127.0.0.1', port: 3031},
    {ip: '127.0.0.1', port: 3032},
    {ip: '127.0.0.1', port: 3033},
    {ip: '127.0.0.1', port: 3034},
    {ip: '127.0.0.1', port: 3035}
  ]
};
```

*<b>NOTE</b>: Normally, the previous step requires changing ```config.physical.js``` instead of ```config.emulator.js```. However, there is a bug at the moment that prevents this. We are working on resolving that bug but it will work as described.*

Rebuild the chromebridge by running ```npm run build``` in ```/backend/chromebridge```, and reload the ChromeBridge app in Chrome.  You should now see your LED button blink blue. When you press it, the button turns red for 1 second. You should also see a red square show up at the top left of your ChromeBridge.   




##At this point you have a full, round-trip connection!  Hack away friends.


