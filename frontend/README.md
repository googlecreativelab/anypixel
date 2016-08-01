# Anypixel - Frontend 
The AnyPixel frontend consists of the interactive apps which run on the AnyPixel display, and the framework used for building them. Because the display is a physical installation, a previewer is also provided for testing your apps. The previewer simulates the look and feel of the physical buttonwall in the 8th Avenue lobby in NYC.

## Getting Started

### Check out the examples 
We've included 12 example apps written by Googlers and friends for the 8th Avenue lobby display in NYC. To check them out, install the [previewer](https://github.com/googlecreativelab/anypixel/tree/master/frontend/previewer) and run one of the [examples](https://github.com/googlecreativelab/anypixel/tree/master/frontend/examples).

### Build your own app 
Building your own app is easy with the Anypixel framework. To get started, check out the [framework documentation](https://github.com/googlecreativelab/anypixel/tree/master/frontend/framework) and the [example app](https://github.com/googlecreativelab/anypixel/tree/master/frontend/examples/getting-started):

``` js
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

## What You'll Find 
- **/examples** - 12 example apps written by Googlers and friends 
- **/framework** - the framework for building your own Anypixel apps 
- **/previewer** - an in-browser previewer for testing your apps
