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

var config = require('anypixel').config;
require('./math');

/**
 * Provides a canvas for drawing localized expanding circular ripples at each interaction point.
 * This is used to alter the state of the reaction.
 */
var expandingCircles = module.exports = {};

var sizeX = Math.nearestPow2(config.width),
		sizeY = Math.nearestPow2(config.height);

var canvas = document.createElement('canvas');
canvas.width = sizeX;
canvas.height = sizeY;
var context = canvas.getContext('2d');
var addCircles = [];

/**
 * Event listener for DOMContentLoaded. Starts the update loop
 */
document.addEventListener('DOMContentLoaded', function() {
	window.requestAnimationFrame(update);

	// Draws expanding circles out from each touch point.
	function update(t) {
		context.save();
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.scale(sizeX / config.width, sizeY / config.height);
		context.beginPath();

		addCircles.forEach(function(circle) {
			if (circle.a > 0) {
				circle.r += 0.5;
			}

			if (circle.r > 0 && circle.a > 0) {
				circle.a -= 3;
				context.arc(circle.x, circle.y, circle.r, 0, 2 * Math.PI);
				context.strokeStyle = Math.rgbToHex(0, 64, 0);
				context.lineWidth = 2;
				context.stroke();
			}
		})

		context.stroke();
		context.restore();
		window.requestAnimationFrame(update);
	}
}, false);

/**
 * Event listener for buttonDown. Creates a new expanding circle at the touch point.
 */
document.addEventListener('onButtonDown', function(event) {
	addCircles.push({
		x: event.detail.x,
		y: event.detail.y,
		r: 0,
		a: 64
	});
});

/**
 * Returns the canvas
 */
expandingCircles.getCanvas = function() {
	return canvas;
}
