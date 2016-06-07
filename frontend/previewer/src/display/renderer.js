/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/license-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the license.
 */

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
 * Composites a target canvas with the button-patterned mask. If an additional canvas is provided,
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
