![img](https://github.com/googlecreativelab/anypixel/blob/master/header.png)

[AnyPixel.js](http://googlecreativelab.github.io/anypixel) is an open-source software and hardware library that makes it possible to use the web to create big, unusual, interactive displays. Anyone can fork the code and the schematics to create their own display at any scale.

The first display using this platform is in the 8th Avenue lobby at the Google NYC office. To create this installation, we used 5880 off-the-shelf arcade buttons with LEDs inside them as our pixels. AnyPixel.js’ straightforward hardware/software framework makes it easy to build any display where each pixel is an interactive element.

![buttonwall](https://github.com/googlecreativelab/anypixel/blob/master/buttonwall.jpg)

## What You'll Find
- **/hardware** - EAGLE schematics, board layouts, CAD files, wiring diagrams, and blueprints
- **/firmware** - microcontroller code, written for the STM32 family of devices
- **/backend** - node.js and chrome applications for communicating with the hardware.
- **/frontend** - the app framework, an in-browser previewer, and 12 example apps written by Googlers and friends worldwide.

## Getting Started

### Check out the examples 
We've included 12 example apps written by Googlers and friends for the 8th Avenue lobby display in NYC. To check them out, install the [previewer](https://github.com/googlecreativelab/anypixel/tree/master/frontend/previewer) and run one of the [examples](https://github.com/googlecreativelab/anypixel/tree/master/frontend/examples).

### Build your own app 
Building your own app is easy with the Anypixel framework. To get started, check out the [framework documentation](https://github.com/googlecreativelab/anypixel/tree/master/frontend/framework) and the [example app](https://github.com/googlecreativelab/anypixel/tree/master/frontend/examples/getting-started):

``` 
var anypixel = require('anypixel'); 
var ctx = anypixel.canvas.getContext2D();

var colors = ['#F00', '#0F0', '#00F'];

/**  
 * * Listen for onButtonDown events and draw a 2x2 rectangle at the event site
 */
document.addEventListener('onButtonDown', function(event) {   
	ctx.fillStyle = colors[Math.floor(Math.random() * 3)];
	ctx.fillRect(event.detail.x - 1, event.detail.y - 1, 2, 2);
}); 
```

## Contributors
- [Jeremy Abel](https://github.com/jeremyabel)
- [Kyle Phillips](https://github.com/hapticdata)
- [Nick Fox-Gieg](https://github.com/n1ckfg)
- [Jeramy Morrill](https://github.com/theceremony)
- [Manny Tan](https://github.com/mannytan)
- [Felix Woitzel](https://github.com/flexi23)
- [Anders Hoff](https://github.com/inconvergent)
- [Dimitry Bentsionov](https://github.com/dimitry)
- [Nick Stahlnecker](https://github.com/Stahlneckr)
