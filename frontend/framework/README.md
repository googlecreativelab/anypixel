# Anypixel - Framework

This is the framework for building your own Anypixel apps. Anypixel provides a canvas, a few button events, and some information about the display. The rest is up to you! 

## Getting Started

1. **Install the [previewer](https://github.com/googlecreativelab/anypixel/blob/master/frontend/previewer/README.md)** 
	- *See the [previewer documentation](https://github.com/googlecreativelab/anypixel/tree/master/frontend/previewer) repository for more information about using the previewer tool.*

2. **`npm install anypixel`**

Anypixel works by injecting your app into a template HTML page which communicates with the button wall. Only one .js file is injected; if you're using multiple .js files, we recommend bundling them together. In the example app, we use [Browserify](browserify.org) to do this.

## Usage
```js
var anypixel = require('anypixel');
```

### Canvas
The `canvas` object is a thin wrapper around the drawing canvas:
```js
anypixel.canvas.getContext2D(); // Returns the '2d' context
anypixel.canvas.getContext3D(); // Returns the 'webgl' context
```

### Config
The `config` object contains the following display properties:
```js
anypixel.config.width;     // Width of the canvas, in pixels
anypixel.config.height;    // Height of the canvas, in pixels
anypixel.config.canvasId;  // The DOM ID of the canvas element
```

### Events
**onButtonDown**: dispatched when a button is pressed
```js
document.addEventListener('onButtonDown', function(event) {
    // event.detail.x: x-axis coordinate
    // event.detail.y: y-axis coordinate
});
```
<br>
**onButtonUp**: dispatched when a button is no longer pressed
```js
document.addEventListener('onButtonUp', function(event) {
    // event.detail.x: x-axis coordinate
    // event.detail.y: y-axis coordinate
});
```
