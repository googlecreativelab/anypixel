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

var anypixel = require('anypixel');
var imgData = require('./img-data');

/**
 * Provides a canvas for representing button events as radial gradients. This allows users to 
 * create high-temperature areas within the fluid simulation. A noise image is also scrolled 
 * along the bottom of the canvas to seed ambient motion during the idle state
 */
var eventCanvas = module.exports = {};

var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
canvas.width = anypixel.config.width;
canvas.height = anypixel.config.height;

var noiseImg = new Image();
var noiseAlpha = 0.97;
var noiseX = 0;
var cursorSize = 5;

/**
 * Sets up the initial canvas state
 */
eventCanvas.init = function(alpha) {
	noiseAlpha = alpha;
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, anypixel.config.width, anypixel.config.height);
	noiseImg.src = imgData.noise;
	window.requestAnimationFrame(update);
}

/**
 * Returns the event canvas
 */
eventCanvas.getCanvas = function() {
	return canvas;
}

/**
 * Updates the event canvas. Draws a radial gradient for each button pushed, and adds the idle
 * state noise at the bottom of the frame.
 */
function update(t) {
	ctx.globalCompositeOperation = 'source-over';
	ctx.fillStyle = 'rgba(0, 0, 0, 1)';
	ctx.fillRect(0, 0, anypixel.config.width, anypixel.config.height);
	ctx.globalCompositeOperation = 'lighter';
	
	if (Object.keys(anypixel.events.pushedButtons).length) {
		for (var key in anypixel.events.pushedButtons) {
			var button = anypixel.events.pushedButtons[key];
			var x = button.x, y = (button.y - anypixel.config.height) * -1;

			var gradient = ctx.createRadialGradient(x, y, cursorSize, x, y, 0);
			gradient.addColorStop(0, '#000');
			gradient.addColorStop(1, '#300');
			
			ctx.beginPath();
			ctx.arc(x, y, cursorSize, 0, 2 * Math.PI);
			ctx.fillStyle = gradient;
			ctx.fill();
		}
	}

	// Add a scrolling noise texture to the very bottom of the frame. This adds subtle movement to
	// the fluid when the app is idle.
	var yOffset = -1;
	ctx.globalCompositeOperation = 'source-over';
	ctx.drawImage(noiseImg, noiseX, yOffset, anypixel.config.width, 2);
	ctx.drawImage(noiseImg, noiseX - anypixel.config.width, yOffset, anypixel.config.width, 2);
	// ctx.fillStyle = 'rgba(0, 0, 0, ' + noiseAlpha + ')';
	// ctx.fillRect(0, -1, anypixel.config.width, 2);

	noiseX = (noiseX + t * 10) % anypixel.config.width;

	window.requestAnimationFrame(update);
}
