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
var config = anypixel.config;
var idleTimer = require('./idle-timer');

/**
 * Provides a layout engine for a set of rectangles where the width of each rectangle is on a 
 * spring. Regardless of the actual widths of each rectangle, the width values are normalized
 * between 0..1 such that the set of all rectangles can be scaled to fit an arbitrary container.
 * Increasing the size of one rectangle will cause the others to shrink to compensate, and the 
 * springs give these size changes a nice bouncy animation. */
var SpringRectLayout = module.exports = function() {
	this.rects = [];
	this.firstUpdate = false;
	this.idleTimer = undefined;
	this.idleDelayMs = 6000;
	this.initialDelayMax = [];
	this.initialDelayCurrent = [];
}

/**
 * Sets up the delay timers for the initial intro transition
 */
SpringRectLayout.prototype.init = function() {
	this.rects.forEach(function(rect, i) {
		var delayMs = 300 + (i * 40)
		this.initialDelayMax.push(delayMs);
		this.initialDelayCurrent.push(delayMs);
	}, this);
}

/**
 * Updates the state of the layout, and triggers the idle state if enough time has passed between
 * the previous idle state or an interaction.
 */
SpringRectLayout.prototype.update = function() {
	if (!this.rects.length) return;

	var widthSum = 0;
	this.rects.forEach(function(rect) {
		widthSum += rect.width;
	}, this);

	var dirtyRects = false;

	// Update rectangles and normalize widths
	this.rects.forEach(function(rect, i) { 
		var width = rect.width / widthSum;

		this.initialDelayCurrent[i] = Math.max(0, this.initialDelayCurrent[i] - 5);
		
		// Ensure a stable state when first run by equalizing the spring length
		if (!this.firstUpdate) {
			rect.widthSpring.value = width * rect.widthSpring.divisor;
			rect.yOffsetSpring.value = config.height;
			rect.heightSpring.value = 0.0;
		} else {
			rect.updateWidth(width); 
			rect.updateYOffset(rect.yOffset);
			if (this.initialDelayCurrent[i] <= this.initialDelayMax[i] / 2) {
				rect.updateHeight(rect.height);
			}
		}

		// The height of each inactive letter is the average of the heights of its direct neighbors.
		if (!rect.isActive && this.firstUpdate) {

			var leftYOffset = i > 0 ? this.rects[i - 1].getYOffset() : 0;
			var rightYOffset = i < this.rects.length - 1 ? this.rects[i + 1].getYOffset() : 0;
			var avgYOffset = (leftYOffset + rightYOffset) / 2;

			if (this.initialDelayCurrent[i] <= 0) {
				rect.setYOffset(avgYOffset);
				rect.setHeight(config.height - avgYOffset);
			} else if (this.initialDelayCurrent[i] <= this.initialDelayMax[i] / 2) {
				rect.setYOffset(0);
				rect.setHeight(config.height);
			}
		}

		// Clear the idle timer if a rectangle has been marked as active
		if (rect.isActive) {
			dirtyRects = true;
			idleTimer.clear();
			this.idleDelayMs = 5000;
		}
	}, this);
	
	// Start the idle timer if no rectangles have been modified and the timer isn't started
	if (!dirtyRects && !idleTimer.hasStarted()) {
		idleTimer.start(function() {
			this.rects.forEach(function(rect) {
				rect.reset();
			});

			// Pick a random rectangle and expand it
			var rect = this.rects[Math.floor(Math.random() * this.rects.length)];
			rect.setIdleActive(true);
			rect.setWidth(config.width * 0.8);

			// Gently ease into the idle mode by gradually decreasing the time between idle actions
			this.idleDelayMs = Math.max(3000, this.idleDelayMs - 1000);

		}, this, this.idleDelayMs);
	}

	this.firstUpdate = true;
}

/**
 * Performs a hit test on every rectangle and returns the first positive result
 */
SpringRectLayout.prototype.hitTest = function(vector) {
	return this.rects.find(function(rect) {
		return rect.hitTest(vector);
	});
}
