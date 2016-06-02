(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = require('./lib/anypixel');
},{"./lib/anypixel":2}],2:[function(require,module,exports){
'use strict';

module.exports.config = require('./config');
module.exports.canvas = require('./canvas');
module.exports.events = require('./events');
module.exports.events.setStateListenerOn(document);

},{"./canvas":3,"./config":4,"./events":5}],3:[function(require,module,exports){
'use strict';

var config = require('./config');
var canvas = module.exports = {};

var domCanvas = document.getElementById(config.canvasId);

domCanvas.width = config.width;
domCanvas.height = config.height;

/**
 * Returns the 2D canvas context
 */
canvas.getContext2D = function getContext2D() {
	return domCanvas.getContext('2d');
}

/**
 * Returns the 3D canvas context
 */
canvas.getContext3D = function getContext3D() {
	return domCanvas.getContext('webgl', {preserveDrawingBuffer: true});
}
},{"./config":4}],4:[function(require,module,exports){
'use strict';

/**
 * Expose some configuration data
 */
var config = module.exports = {};

config.canvasId = 'button-canvas';
config.width = 140;
config.height = 42;
},{}],5:[function(require,module,exports){
'use strict';

/**
 * Listen for the 'buttonStates' event from a DOM target and emit onButtonDown / Up events
 * depending on the reported button state
 */
var events = module.exports = {};
var enableDispatch = true;

events.setStateListenerOn = function setStateListenerOn(target) {
		
	if (target.anypixelListener) {
		enableDispatch = false;
	}
	
	target.anypixelListener = true;

	target.addEventListener('buttonStates', function(data) {
		data.detail.forEach(function(button) {
			var x = button.p.x;
			var y = button.p.y;
			var state = button.s;
			var event = state === 1 ? 'onButtonDown' : 'onButtonUp';
			var key = x + ':' + y;

			if (state === 1) {
				events.pushedButtons[key] = {x: x, y: y};
			} else {
				delete events.pushedButtons[key];
			}
			if (enableDispatch) {
				target.dispatchEvent(new CustomEvent(event, {detail: {x: x, y: y}}));
			}
		});
	});
}

/**
 * A map of currently-pushed buttons, provided for utility
 */
events.pushedButtons = {};

},{}],6:[function(require,module,exports){
var config = require('anypixel').config;

/**
 * Provides functions for emulating the color properties of the LEDs on the buttonboard
 */
var colorEmulation = module.exports = {};

var resultsCanvas = document.createElement('canvas');
var resultsContext = resultsCanvas.getContext('2d');
resultsCanvas.width = config.width;
resultsCanvas.height = config.height;

var imgData = resultsContext.createImageData(1, 1);
var newPixelData = imgData.data;

/**
 * Filters a given canvas to simulate the look of LEDs on the buttonwall. Returns a copy of the
 * original canvas. The original canvas is not modified.
 * 
 * TODO(abelj): this isn't very accurate
 */
colorEmulation.filter = function(canvas) {
	resultsContext.drawImage(canvas, 0, 0);
	var data = resultsContext.getImageData(0, 0, canvas.width, canvas.height).data;

  // Filter every pixel
	for (var i = 0, l = data.length; i < l; i += 4) {
		var r = data[i];
		var g = data[i + 1];
		var b = data[i + 2];
		var y = Math.floor((i / 4) / canvas.width);
		var x = Math.floor((i / 4) - y * canvas.width);
		var hsv = rgbToHSV(r / 255, g / 255, b / 255);

    // Cap the minimum brightness to 75%. This is the percieved brightness of a button whos LED 
    // is entirely off. 
    hsv.v = Math.max(0.75, hsv.v);

		var rgb = hsvToRGB(hsv.h, hsv.s, hsv.v);
		newPixelData[0] = rgb.r;
		newPixelData[1] = rgb.g;
		newPixelData[2] = rgb.b;
		newPixelData[3] = 255;

		resultsContext.putImageData(imgData, x, y);
	}

	return resultsCanvas;
}

/**
 * Converts an RGB color to HSV colorspace
 * Incorporates code from https://github.com/bgrins/TinyColor
 */
function rgbToHSV(r, g, b) {
	var max = Math.max(r, g, b), min = Math.min(r, g, b);
	var h, s, v = max;

  var d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max == min) {
    h = 0;
  } else {
    switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h, s: s, v: v };
}

/**
 * Converts an HSV color to RGB colorspace
 * Incorporates code from https://github.com/bgrins/TinyColor
 */
function hsvToRGB(h, s, v) {
  h *= 6;

  var i = Math.floor(h),
      f = h - i,
      p = v * (1 - s),
      q = v * (1 - f * s),
      t = v * (1 - (1 - f) * s),
      mod = i % 6,
      r = [v, q, p, p, t, v][mod],
      g = [t, v, v, q, p, p][mod],
      b = [p, p, t, v, v, q][mod];

  return { r: r * 255, g: g * 255, b: b * 255 };
}
},{"anypixel":1}],7:[function(require,module,exports){
'use strict';
var config = require('anypixel').config;
var color = require('./color-emulation');

/**
 * Simulates the look of the physical button wall, drawing each pixel as a circular button 
 * overlayed on a background photograph of the wall environment. The buttonwall canvas is scaled 
 * up to match the photo, and is masked with a grid of circular buttons.
 */
var renderer = module.exports = {};

// Canvas used for drawing the final emulated output
var displayCanvas, displayContext;

// Canvas used for drawing the button pattern source
var buttonCanvas, buttonContext;

// Canvas used for drawing the button pattern mask
var maskCanvas, maskContext;

// CLI parameters for button size, spacing, and position
var bgImage = new Image();
var bgWidth, bgHeight, btnSpacing, btnRadius, bgStartX, bgStartY;

/**
 * Creates the canvases required for rendering
 */
renderer.init = function init() {
	var bgStyle = document.documentElement.style;
	var bgImageURL = bgStyle.backgroundImage.slice(4, -1).replace(/"/g, "");

	bgImage.onload = function() {
		bgWidth = bgImage.naturalWidth;
		bgHeight = bgImage.naturalHeight;	

		window.addEventListener('resize', onResize);
		onResize();
	}

	bgImage.src = bgImageURL;

	// Create the canvas for rendering the upscaled and masked render target
	displayCanvas = document.createElement('canvas');
	displayCanvas.style.imageRendering = 'pixelated';
	displayContext = displayCanvas.getContext('2d');
	document.body.appendChild(displayCanvas);

	// Create the canvas for drawing the single button element used in the patterned mask
	buttonCanvas = document.createElement('canvas');
	buttonContext = buttonCanvas.getContext('2d');

	// Create the canvas for drawing the button-patterned mask
	maskCanvas = document.createElement('canvas');
	maskContext = maskCanvas.getContext('2d');

	// Get display attributes from the script tag
	var script = document.getElementById('preview-script');
	btnSpacing = script.getAttribute('data-spacing');
	btnRadius = script.getAttribute('data-radius');
	bgStartX = script.getAttribute('data-x');
	bgStartY = script.getAttribute('data-y');
}

/**
 * Composites a target canvas with the button-patterened mask. If an additional canvas is provided, 
 * it will be rendered atop the target canvas.
 */
renderer.render = function render(target, debugCanvas, filterCanvas) {
	var canvas = target;
	
	displayContext.save();
	displayContext.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
	displayContext.drawImage(maskCanvas, 0, 0);
	displayContext.globalCompositeOperation = 'source-atop';

	if (filterCanvas) {
		canvas = color.filter(target);
	}
		
	displayContext.drawImage(canvas, 
			0, 0, config.width, config.height, 
			0, 0, maskCanvas.width, maskCanvas.height);	

	if (debugCanvas) {
		displayContext.globalCompositeOperation = 'source-over';
		displayContext.drawImage(debugCanvas, 
				0, 0, config.width, config.height, 
				0, 0, maskCanvas.width, maskCanvas.height);
	}

	displayContext.restore();
}

/**
 * Returns the canvas drawn to by the renderer.
 */
renderer.getOutput = function getOutput() {
	return displayCanvas;
}

/**
 * Redraws the button mask after a window resize event
 */
function onResize() {
	// Multiplier to compensate for the difference between the current window size and the 
	// scale of the button dimensions 
	var scaleFactor = 1; 
	var aspect = bgWidth / bgHeight; 

	if (window.innerWidth > window.innerHeight * aspect) {
		scaleFactor = window.innerHeight / bgHeight;
	} else {
		scaleFactor = window.innerWidth / bgWidth;
	}

	// Redraw singular canvas button element
	var buttonSize = btnSpacing * scaleFactor;
	var buttonRadius = btnRadius * scaleFactor;
	buttonCanvas.width = buttonSize;
	buttonCanvas.height = buttonSize;
	buttonContext.clearRect(0, 0, buttonCanvas.width, buttonCanvas.height);
	buttonContext.arc(buttonSize / 2, buttonSize / 2, buttonRadius, 0, 2 * Math.PI);
	buttonContext.fillStyle = '#FFF';
	buttonContext.fill();

	// Make a pattern from the single button element
	var buttonPattern = displayContext.createPattern(buttonCanvas, 'repeat');

	// Redraw button-patterned mask
	maskCanvas.width = buttonSize * config.width;
	maskCanvas.height = buttonSize * config.height;
	maskContext.rect(0, 0, buttonSize * config.width, buttonSize * config.height);
	maskContext.scale(buttonSize / buttonCanvas.width, buttonSize / buttonCanvas.width);
	maskContext.fillStyle = buttonPattern;
	maskContext.fill();

	// Resize and position the display canvas
	displayCanvas.width = maskCanvas.width;
	displayCanvas.height = maskCanvas.height;
	displayCanvas.style.left = (bgStartX * scaleFactor) + 'px';
	displayCanvas.style.top = (bgStartY * scaleFactor) + 'px';

	// Ensure that any further drawing operations use nearest-neighbor interpolation
	displayContext.imageSmoothingEnabled = false;
}

},{"./color-emulation":6,"anypixel":1}],8:[function(require,module,exports){
'use strict';

var config = require('anypixel').config;
var renderer = require('./display/renderer');
var input = require('./input');
var DebugCanvas = require('./ui/debug-canvas');
var Button = require('./ui/button');
var CursorPointer = require('./input/cursor');
var CursorHand = require('./input/cursor-hand');

var displayDebugCanvas = false;
var enableColorCorrection = true;

document.addEventListener('DOMContentLoaded', function() {
	renderer.init();

	// Get the app canvas 
	var canvas = document.getElementById(config.canvasId);

	// Set the renderer's display canvas as the input event source
	input.setEventSource(renderer.getOutput());

	// Create a DebugCanvas for the input to draw to
	var debug = new DebugCanvas();
	input.setDebugCanvas(debug);

	// Create UI buttons
	var btnCursorSelectPointer = new Button('cursor-pointer', true);
	var btnCursorSelectHand = new Button('cursor-hand', false);
	var btnToggleColorEmu = new Button('color-toggle', false);
	var btnToggleDebugVis = new Button('vis-toggle', true);

	// Listener for pointer cursor selection button. Toggle state and set cursor to pointer
	btnCursorSelectPointer.el.addEventListener('click', function() {
		btnCursorSelectPointer.setSelected(true);
		btnCursorSelectHand.setSelected(false);
		input.setCursorObject(CursorPointer);
	});

	// Listener for hand cursor selection button. Toggle state and set cursor to hand
	btnCursorSelectHand.el.addEventListener('click', function() {
		btnCursorSelectPointer.setSelected(false);
		btnCursorSelectHand.setSelected(true);
		input.setCursorObject(CursorHand);
	});

	// Listener for event debug visiblity button. Toggle visibility of the event debug canavs
	btnToggleDebugVis.el.addEventListener('click', function() {
		displayDebugCanvas = !displayDebugCanvas;
		btnToggleDebugVis.setSelected(displayDebugCanvas);
	});

	// Listener for color correction toggle
	btnToggleColorEmu.el.addEventListener('click', function() {
		enableColorCorrection = !enableColorCorrection;
		btnToggleColorEmu.setSelected(enableColorCorrection);
	})

	// Update the renderer every frame
	function update(t) {
		renderer.render(
			canvas, 
			displayDebugCanvas ? debug.getCanvas() : undefined,
			enableColorCorrection
		);
		window.requestAnimationFrame(update);
	}

	window.requestAnimationFrame(update);
	
}, false);

},{"./display/renderer":7,"./input":12,"./input/cursor":10,"./input/cursor-hand":9,"./ui/button":17,"./ui/debug-canvas":18,"anypixel":1}],9:[function(require,module,exports){
'use strict';
var Cursor = require('./cursor');
var stateMap = require('./stateMap');
var diff = require('../util/diff');

/** 
 * Provides a cursor which simulates an open-palm hand. 
 * 
 * The hand shape is randomly generated and is modeled on results from physical testing. 
 * The timing of the events generated by the simulated hand is fuzzed to futher emulate the 
 * variable timing that each part of a hand exhibits when it's mashed on a grid of buttons. 
 */
var CursorHand = module.exports = function() {
	Cursor.call(this);
	this.cursorPoints = {};
}

// Inherit from Cursor
CursorHand.prototype = new Cursor();
CursorHand.prototype.constructor = CursorHand;

// The amount of time in milliseconds over which multiple button inputs can take place from a single 
// cursor action. This is used to simulate the uneven pressure and timing of a human hand against 
// the buttonwall.
var maxFuzzMs = 40;

/**
 * Function called when the cursor's input starts. This function generates a new 5x5 hand shape,
 * centered on a 2x2 or 3x2 rectangle palm. Points in the initial palm are then iteratively grown
 * outwards to simulate fingers
 */
CursorHand.prototype.onInputStart = function(position) {
	// Palm can be a 2x2 or 3x2 rectangle of points
	var palmX = Math.random() > 0.5 ? 2 : 1;
	var palmY = 2;
	var palmW = palmX > 1 ? 2 : randInt(2, 3);
	var palmH = 2;
	for (var y = palmY; y < palmY + palmH; y++) {
		for (var x = palmX; x < palmX + palmW; x++) {
			var keyCursor = stateMap.keyFromPosition({x: x, y: y});
			var keyActive = stateMap.keyFromPosition({
				x: position.x + x,
				y: position.y + y
			});

			this.activePoints[keyActive] = true;
			this.cursorPoints[keyCursor] = true;
		}	
	}
	
	// Iteratively grow some fingers (more points) out of the existing set of points
	for (var i = 0; i < 3; i++) {
		// Only grow from the middle 3x3 points
		for (var y = 1; y < 3; y++) {
			for (var x = 1; x < 3; x++) {
				var keyActive = stateMap.keyFromPosition({
					x: x + position.x,
					y: y + position.y
				});

				// Only grow from existing points
				if (this.activePoints.hasOwnProperty(keyActive)) {
					// Growth direction is one unit towards any of the 8 points surrounding the current point
					var growth = {
						x: x + randInt(-1, 1),
						y: y + randInt(-1, 1)
					};

					// Store grown point's local position for redrawing during onInputMove()
					this.cursorPoints[stateMap.keyFromPosition(growth)] = true;
					
					// Store grown point's position offset by the cursor position
					this.activePoints[stateMap.keyFromPosition({
						x: growth.x + position.x,
						y: growth.y + position.y
					})] = true;
				}
			}
		}
	}

	// Fuzz the timing when adding the points to the stateMap
	for (var point in this.activePoints) {
		stateMap.set(stateMap.keyToPosition(point), true, Math.random() * maxFuzzMs);
	}

	function randInt(min, max) { 
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
}

/**
 * Function called when the cursor is moved. Points which leave the activePoints map are removed
 * from the button state map, and points that are new are added.
 */
CursorHand.prototype.onInputMove = function(lastPosition, currentPosition) {
	// Make map of current active points by translating each cursor point by the current position
	var currentActivePoints = {};
	for (var point in this.cursorPoints) {
		var cursorPointPos = stateMap.keyToPosition(point);
		
		var position = {
			x: cursorPointPos.x + currentPosition.x,
			y: cursorPointPos.y + currentPosition.y
		};

		// The current active points is a map of each cursor point offset by currentPosition
		currentActivePoints[stateMap.keyFromPosition(position)] = true;
	}

	// Diff the previous active points against the current active points
	var diffPoints = diff(this.activePoints, currentActivePoints);

	// Any points which are in the current set and not in the previous set add a position to the state map
	diffPoints.added.forEach(function(key) {
		stateMap.set(stateMap.keyToPosition(key), true);
		this.activePoints[key] = true;
	}, this);

	// Any points which are in the previous set and not in the current set remove a position from the state map
	diffPoints.removed.forEach(function(key) {
		stateMap.set(stateMap.keyToPosition(key), false);
		delete this.activePoints[key];
	}, this);
}

/**
 * Function called when the cursor is released. All active buttons are removed from the state map.
 */
CursorHand.prototype.onInputEnd = function(position) {
	for (var point in this.activePoints) {
		stateMap.set(stateMap.keyToPosition(point), false, Math.random() * maxFuzzMs);
	}	

	this.cursorPoints = {};
	this.activePoints = {};
}
},{"../util/diff":19,"./cursor":10,"./stateMap":14}],10:[function(require,module,exports){
'use strict';
var diff = require('../util/diff');
var stateMap = require('./stateMap');

/**
 * Provides a single-point cursor. Each cursor maintains its own map of active points, 
 * separate from the global stateMap.
 */
var Cursor = module.exports = function(cursorId) {
	this.id = cursorId;
	this.activePoints = {};
};

/**
 * Function called when the cursor's input starts. Activates a single point
 */
Cursor.prototype.onInputStart = function(position) {
	this.activePoints[stateMap.keyFromPosition(position)] = true;
	stateMap.set(position, true);
}

/**
 * Function called when the cursor is moved. 
 */
Cursor.prototype.onInputMove = function(lastPosition, currentPosition) {
	// Diff previous active points against current active points
	var currentActivePoints = {};
	currentActivePoints[stateMap.keyFromPosition(currentPosition)] = true;
	var diffPoints = diff(this.activePoints, currentActivePoints);

	// Any points which are in the current set and not in the previous set add a position to the state map
	diffPoints.added.forEach(function(key) {
		stateMap.set(stateMap.keyToPosition(key), true);
		this.activePoints[key] = true;
	}, this);

	// Any points which are in the previous set and not in the current set remove a position from the state map
	diffPoints.removed.forEach(function(key) {
		stateMap.set(stateMap.keyToPosition(key), false);
		delete this.activePoints[key];
	}, this);
}

/**
 * Function called when the cursor is released. All active buttons are released from the stateMap
 */
Cursor.prototype.onInputEnd = function(position) {
	delete this.activePoints[stateMap.keyFromPosition(position)];
	stateMap.set(position, false);
}
},{"../util/diff":19,"./stateMap":14}],11:[function(require,module,exports){
'use strict';

/**
 * Provides a function whicbh dispatches a buttonState CustomEvent with a given location and state 
 */
module.exports = function dispatchStateEvent(location, pushedState) {
	document.dispatchEvent(new CustomEvent('buttonStates', {
		'detail': [{
			'p': {x: location.x, y: location.y},
			's': pushedState === true ? 1 : 0
		}]
	}));
}
},{}],12:[function(require,module,exports){
'use strict';
var mouse = require('./mouse');
var touch = require('./touch');
var Cursor = require('./cursor');
var stateMap = require('./stateMap');
var dispatch = require('./dispatch');
var diff = require('../util/diff');

/**
 * Provides an abstraction of mouse and touch events for simulating button presses with custom
 * cursors. Cursors are tracked by id, allowing for both software-simulated and hardware multitouch 
 */
var input = exports = module.exports = {};

var cursors = {};
var eventSource = null;
var debugCanvas;

// The default cursor is a single point
var cursorObject = Cursor;

/**
 * Adds input event callbacks on a given DOM element.
 */
input.setEventSource = function setEventSource(domEventSource) {
	eventSource = domEventSource;

	// Set mouse callbacks 
	mouse.setEventSource(eventSource);
	mouse.onMouseDown(onInputStart);
	mouse.onMouseMove(onInputMove);
	mouse.onMouseUp(onInputEnd);

	// Set touch callbacks
	touch.setEventSource(eventSource);
	touch.onTouchStart(onInputStart);
	touch.onTouchMove(onInputMove);
	touch.onTouchEnd(onInputEnd);

	window.requestAnimationFrame(update);
}

/**
 * Sets the DebugCanvas to use for plotting button state changes
 */
input.setDebugCanvas = function setDebugCanvas(canvas) {
	debugCanvas = canvas;
}

/**
 * Sets the cursor object to be used for all new inputs
 */
input.setCursorObject = function setCursorObject(cursorObj) {
	cursorObject = cursorObj;
}

/**
 * Callback for starting a new input cursor. Creates a new cursor and adds it to the list.
 */
function onInputStart(inputId, position) {
	var newCursor = new cursorObject(inputId);
	cursors[inputId] = newCursor;
	newCursor.onInputStart(position);
}

/**
 * Callback for moving an existing input cursor
 */
function onInputMove(inputId, previousPos, currentPos) {
	var currentCursor = cursors[inputId];
	if (currentCursor) {
		currentCursor.onInputMove(previousPos, currentPos);
	}
}

/**
 * Callback for ending an existing input cursor. Removes the cursor from the list.
 */
function onInputEnd(inputId, position) {
	var oldCursor = cursors[inputId];
	oldCursor.onInputEnd(position);
	delete cursors[inputId];
}

/**
 * Compares the current frame's button states with the previous frame's. Any changes are converted
 * to buttonState events 
 */
function update(t) {
	if (stateMap.hasChanged()) {
		var diffPoints = diff(stateMap.getLastStates(), stateMap.getCurrentStates());

		// New points added trigger down events
		diffPoints.added.forEach(function(key) {
			var position = stateMap.keyToPosition(key);
			dispatch(position, true);
			tryDebugPlot(position, true);
		});

		// Old points removed trigger up events
		diffPoints.removed.forEach(function(key) {
			var position = stateMap.keyToPosition(key);
			dispatch(position, false);
			tryDebugPlot(position, false);
		});
	}

	// Set the current state to the previous state
	stateMap.save();

	window.requestAnimationFrame(update);
}

/**
 * Attempt to plot a point on the debugCanvas, if there is one
 */
function tryDebugPlot(position, state) {
	if (debugCanvas) {
		debugCanvas.plot(position, state);
	}
}
},{"../util/diff":19,"./cursor":10,"./dispatch":11,"./mouse":13,"./stateMap":14,"./touch":16}],13:[function(require,module,exports){
var config = require('anypixel').config;

/**
 * Provides an abstracted interface for mouse events. Event coordinates are remapped from the width 
 * and height of their source DOM node to the width and height of the buttonwall.
 */
var mouse = module.exports = {};

var lastKnownPos;
var eventSource;

// ID's are used to keep track of which cursor belongs to which input event. ID's are only present
// in touch events, but in order to provide a unified interface between mouse and touch events, 
// they are emulated for mouse events. Since there can only ever be one mouse cursor, the ID is 0
var cursorId = 0;

// Event callbacks
var fnMouseDown, fnMouseUp, fnMouseMove;

/**
 * Calls the mouse down callback and saves the current position.
 */
function mouseDown(e) {
	var currentPos = mapCoords(e.offsetX, e.offsetY);
	lastKnownPos = currentPos;

	if (fnMouseDown) {
		fnMouseDown(cursorId, currentPos);
	}
}

/**
 * Calls the mouse move callback and saves the current position.
 */
function mouseMove(e) {
	if (e.buttons > 0) {
		var currentPos = mapCoords(e.offsetX, e.offsetY);

		if (fnMouseMove) {
			fnMouseMove(cursorId, lastKnownPos, currentPos);
		}

		lastKnownPos = currentPos;
	}
}

/**
 * Calls the mouse up callback and clears the last known position;
 */
function mouseUp(e) {
	if (lastKnownPos !== undefined && lastKnownPos.x !== undefined && lastKnownPos.y !== undefined) {
		if (fnMouseUp) {
			fnMouseUp(cursorId, lastKnownPos);
		}

		lastKnownPos = {x: undefined, y: undefined};
	}
}

/**
 * Perform a linear transform on a given position, from the event source's coordinate space 
 * to the buttonwall's coordinate space.
 */
function mapCoords(x, y) {
	x = Math.floor(x / eventSource.width * config.width);
	y = Math.floor(y / eventSource.height * config.height);
	return {x: x, y: y};
}

/**
 * Adds mouse event listeners to a given DOM node
 */
mouse.setEventSource = function setEventSource(source) {
	eventSource = source;
	eventSource.addEventListener('mousedown', mouseDown);
	eventSource.addEventListener('mousemove', mouseMove);
	eventSource.addEventListener('mouseup', mouseUp);

	// Handles if the mouse is released outside of eventSource
	document.addEventListener('mouseup', mouseUp);
}

/**
 * Set mouse start callback function
 */
mouse.onMouseDown = function onMouseDown(fn) {
	fnMouseDown = fn;
}

/**
 * Set mouse move callback function
 */
mouse.onMouseMove = function onMouseMove(fn) {
	fnMouseMove = fn;
}

/**
 * Set mouse up callback function
 */
mouse.onMouseUp = function onMouseUp(fn) {
	fnMouseUp = fn;
}
},{"anypixel":1}],14:[function(require,module,exports){
var timers = require('./timers');

/**
 * StateMap manages the global list of pressed buttons
 */
var stateMap = module.exports = {};

var currentStates = {};
var lastStates = {};
var isDirty = false;

/**
 * Set the state of a button at a given position. This can be delayed by a given amount of milliseconds
 */
stateMap.set = function set(position, state, delayMs) {
	if (delayMs === undefined || delayMs <= 0) {
		timers.interrupt(position);
		isDirty = true;

		if (state) {
			currentStates[stateMap.keyFromPosition(position)] = true;
		} else {
			delete currentStates[stateMap.keyFromPosition(position)];
		}
	} else {
		timers.add(position, state, delayMs);
	}
}

/**
 * Returns true if currentStates has changed since this function was last called, 
 * otherwise returns false
 */
stateMap.hasChanged = function hasChanged() {
	if (isDirty) {
		isDirty = false;
		return true;
	}
	return false;
}

/**
 * Copies the currentStates map to the lastStates map
 */
stateMap.save = function save() {
	lastStates = {};
	for (var prop in currentStates)	{
		lastStates[prop] = true;
	}
}

/** 
 * Returns the currentStates map
 */
stateMap.getCurrentStates = function getCurrentStates() {
	return currentStates;
}

/**
 * Returns the lastStates map
 */
stateMap.getLastStates = function getLastStates() {
	return lastStates;
}

/**
 * Utility function for generating a map key from an {x, y} object
 */
stateMap.keyFromPosition = function keyFromPosition(position) {
	return position.x + ':' + position.y;
}

/**
 * Utility function for generating an {x, y} object from a map key
 */
stateMap.keyToPosition = function keyToPosition(key) {
	var strs = key.split(':');
	var x = parseInt(strs[0], 10);
	var y = parseInt(strs[1], 10);
	return {x: x, y: y};
}
},{"./timers":15}],15:[function(require,module,exports){
'use strict';

/**
 * Handles the interruption and starting of button state-change timers. This is used by the stateMap
 * to coordinate timing of fuzzy cursor events. Timers are stored in the timerMap by position keys
 */
var timers = module.exports = {};

var timerMap = {};

/**
 * Stops a timer and deletes it from the map
 */
timers.interrupt = function interrupt(position) {
	var key = require('./stateMap').keyFromPosition(position);

	if (timerMap.hasOwnProperty(key)) {
		window.clearTimeout(timerMap[key]);
		delete timerMap[key];
	}
}

/**
 * Adds a state-change timer to the map at a given position, and removes the previous one if it exists
 */
timers.add = function add(position, state, delayMs) {
	timers.interrupt(position);

	var stateMap = require('./stateMap');
	timerMap[stateMap.keyFromPosition(position)] = setTimeout(function(pos, state) {
		return function() {
			stateMap.set(pos, state);
			delete timerMap[stateMap.keyFromPosition(pos)];
		};
	}(position, state), delayMs);
}
},{"./stateMap":14}],16:[function(require,module,exports){
'use strict';
var config = require('anypixel').config;

/**
 * Provides an abstracted interface for touch events. Event coordinates are remapped from the width 
 * and height of their source DOM node to the width and height of the buttonwall.
 */
var touch = module.exports = {};

var lastKnownPos = {};
var eventSource;

// Event callbacks
var fnTouchStart, fnTouchMove, fnTouchEnd;

/**
 * Calls the touch start callback for every touchstart event
 */
function touchStart(e) {
	e.preventDefault();

	for (var i = 0; i < e.changedTouches.length; i++) {
		var t = e.changedTouches[i];
		var currentPos = mapCoords(t);
		lastKnownPos[t.identifier] = currentPos;

		if (fnTouchStart) {
			fnTouchStart(t.identifier, currentPos);
		}		
	}
}

/**
 * Calls the touch move callback for every touchmove event
 */
function touchMove(e) {
	e.preventDefault();

	for (var i = 0; i < e.changedTouches.length; i++) {
		var t = e.changedTouches[i];
		var previousPos = lastKnownPos[t.identifier];
		var currentPos = mapCoords(t);

		// Only call the callback if the remapped coordinates have changed. This prevents events from 
		// being fired when their positions are rounded off after being remapped.
		if (previousPos.x != currentPos.x || previousPos.y != currentPos.y) {
			lastKnownPos[t.identifier] = t;

			if (fnTouchMove) {
				fnTouchMove(t.identifier, previousPos, currentPos);
			}
		}
	}
}

/**
 * Calls the touch end callback for every touchend event
 */
function touchEnd(e) {
	e.preventDefault();

	for (var i = 0; i < e.changedTouches.length; i++) {
		var t = e.changedTouches[i];
		var currentPos = mapCoords(t);
		delete lastKnownPos[t.identifier];

		if (fnTouchEnd) {
			fnTouchEnd(t.identifier, currentPos);
		}
	}
}

/**
 * Calculates the offsetX and offsetY properties. These are not provided natively for touch events, 
 * so they must be calculated manually.
 */
function getTouchOffset(e) {
	var x = e.pageX - e.target.offsetLeft;
	var y = e.pageY - e.target.offsetTop;
	return {x: x, y: y};
}

/**
 * Perform a linear transform on a given position, from the event source's coordinate space 
 * to the buttonwall's coordinate space.
 */
function mapCoords(e) {
	x = Math.floor(getTouchOffset(e).x / eventSource.width * config.width);
	y = Math.floor(getTouchOffset(e).y / eventSource.height * config.height);
	return {x: x, y: y};
}

/**
 * Adds touch event listeners to a given DOM node
 */
touch.setEventSource = function setEventSource(source) {
	eventSource = source;
	eventSource.addEventListener('touchstart', touchStart);
	eventSource.addEventListener('touchmove', touchMove);
	eventSource.addEventListener('touchend', touchEnd);
}

/**
 * Set touch start callback function
 */
touch.onTouchStart = function onTouchStart(fn) {
	fnTouchStart = fn;
}

/**
 * Set touch move callback function
 */
touch.onTouchMove = function onTouchMove(fn) {
	fnTouchMove = fn;
}

/**
 * Set touch end callback function
 */
touch.onTouchEnd = function onTouchEnd(fn) {
	fnTouchEnd = fn;
}
},{"anypixel":1}],17:[function(require,module,exports){
'use strict';

/**
 * Encapsulates a DOM element and provides toggling of a selected state. Second parameter is the
 * button's starting state
 */
var Button = module.exports = function(id, isSelected) {
	this.el = document.getElementById(id);
	this.setSelected(isSelected);
}

/**
 * Toggles the selected state of the button
 */
Button.prototype.setSelected = function(isSelected) {
	this.selected = isSelected;
	if (this.selected) {
		this.el.classList.add('selected');
	} else {
		this.el.classList.remove('selected');
	}
}
},{}],18:[function(require,module,exports){
'use strict';
var config = require('anypixel').config;

/**
 * Provides a drawing canavs for debugging. Currently used for displaying the contents of the 
 * input stateMap.
 */
var DebugCanvas = module.exports = function() {
	this.canvas = document.createElement('canvas');
	this.canvas.width = config.width;
	this.canvas.height = config.height;

	this.ctx = this.canvas.getContext('2d');
	this.ctx.imageSmoothingEnabled = false;

	this.imageData = this.ctx.createImageData(1, 1);
	this.pixelData = this.imageData.data;
}

/**
 * Adds or removes a pixel from the canvas at a given position
 */
DebugCanvas.prototype.plot = function(position, state) {
	this.pixelData[0] = 0;
	this.pixelData[1] = 0;
	this.pixelData[2] = 0;
	this.pixelData[3] = state ? 255 : 0;
	this.ctx.putImageData(this.imageData, position.x, position.y);
}

/**
 * Returns the canvas
 */
DebugCanvas.prototype.getCanvas = function() {
	return this.canvas;
}
},{"anypixel":1}],19:[function(require,module,exports){
'use strict';

/** 
 * Provides a function which returns the difference between the properties of two objects.
 */
module.exports = function diff(base, compared) {

	var removed = [];
	var added = [];

	// Loop through the compared object to get items added to it
	for (var prop in compared) {
		if (compared.hasOwnProperty(prop) && !(prop in base)) {
			added.push(prop);
		}
	}

	// Loop through the base object to get items removed from it
	for (var prop in base) {
		if (base.hasOwnProperty(prop) && !(prop in compared)) {
			removed.push(prop);
		}
	}

	return {
		removed: removed,
		added: added
	};
}
},{}]},{},[8]);
