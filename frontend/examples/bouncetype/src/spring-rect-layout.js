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
var SpringRect = require('./spring-rect');
var idleTimer = require('./idle-timer');
var shuffle = require('./shuffle');

require('./math');

/**
 * Provides a layout engine for a set of rectangles where the width of each rectangle is on a 
 * spring. Regardless of the actual widths of each rectangle, the width values are normalized
 * between 0..1 such that the set of all rectangles can be scaled to fit an arbitrary container.
 * Increasing the size of one rectangle will cause the others to shrink to compensate, and the 
 * springs give these size changes a nice bouncy animation. */
var SpringRectLayout = module.exports = function() {
	this.rects = [];
	this.unusedIdleRects = [];
	this.usedIdleRects = [];
	this.idleTimer = undefined;
	this.idleDelayMs = 6000;
}

/**
 * Adds a rectangle to the layout. If it's a letter, it also gets added to the unusedIdleRects list.
 * This list is shuffled and pulled from whenever the idle state is active.
 */
SpringRectLayout.prototype.addRect = function(index, width, yOffset, minWidth, maxWidth, svgPath) {
	var rect = new SpringRect(index, width, yOffset, minWidth, maxWidth, svgPath);
	this.rects.push(rect);

	// Add the new rect to the unused idle list if it's an actual letter
	if (svgPath) {
		this.unusedIdleRects.push(rect);
	}

	shuffle(this.unusedIdleRects);
}

/**
 * Expands a given rectangle, and shrinks every other rectangle
 */
SpringRectLayout.prototype.expandRect = function(targetRect) {
	var IMAGE_HEIGHT = 347.522;
	
	targetRect.setWidth(Math.randomRange(targetRect.minWidth, targetRect.maxWidth));
	targetRect.setYOffset(Math.randomRange(-IMAGE_HEIGHT / 2, IMAGE_HEIGHT / 5));

	// Rectangles expanded during the idle state should not be marked as active.
	if (!idleTimer.hasStarted()) {
		targetRect.setActive(true);
		targetRect.setHeld(true);
	} else {
		targetRect.setActiveIdle(true);
	}

	// Modify all other rectangles
	this.rects.forEach(function(rect) {
		if (rect != targetRect) {
			var minWidth = 25;
			var maxWidth = 75;
			var minYOffset = rect.origYOffset;
			var maxYOffset = rect.origYOffset;

			// Shrink letters. Non-active letters will be shrunk more than active ones
			if (!rect.isSpace) {
				minWidth = rect.isActive ? rect.minWidth : rect.origWidth / 2.5;
				maxWidth = rect.isActive ? rect.maxWidth : rect.origWidth / 1.25;

				minYOffset = rect.isActive ? 0 : IMAGE_HEIGHT / 6;
				maxYOffset = rect.isactive ? IMAGE_HEIGHT / 3 : IMAGE_HEIGHT / 2;	
			}

			// Randomize rect dimensions / offsets
			rect.setWidth(Math.randomRange(minWidth, maxWidth));
			rect.setYOffset(Math.randomRange(minYOffset, maxYOffset));
		}
	});
}

/**
 * Updates the state of the layout, and triggers the idle state if enough time has passed between
 * the previous idle state or an interaction.
 */
SpringRectLayout.prototype.update = function() {
	if (!this.rects.length) return;

	// Normalize widths
	var widthSum = 0;
	var letterWidthSum = 0;
	this.rects.forEach(function(rect, i, a) {
		widthSum += rect.width;

		if (i !== 0 && i !== a.length - 1 && rect.firstUpdate) {
			letterWidthSum += rect.width;
		}
	});

	var dirtyRects = false;

	// Update rectangles
	this.rects.forEach(function(rect, i) { 
		var width = rect.width / widthSum;

		if (i === 0 || i === this.rects.length - 1) {
			width = ((widthSum - letterWidthSum) / 2) / widthSum;
		}
		
		// If the rectangle isn't ready to start updating, set the starting values for each spring.
		// In the starting state, the width of the spaces on the left and right ends are half of the
		// full screen width, and the width of each letter and letter spacer is 0. This allows the 
		// letters to scale in from the center in a staggered manner.
		if (!rect.firstUpdate) {
			rect.widthSpring.value = i === 0 || i === this.rects.length - 1 ? width : 0;
			rect.origWidthNormalized = width * anypixel.config.width;
			rect.yOffsetSpring.value = 150;
		} else {
			rect.updateWidth(width); 
			rect.updateYOffset(rect.yOffset);
		}

		// Clear the idle timer if a rectangle has been marked as active
		if (rect.isActive) {
			dirtyRects = true;
			idleTimer.clear();
			this.idleDelayMs = 6000;
		}
	}, this);

	// Start the idle timer if no rectangles have been modified and the timer isn't started
	if (!dirtyRects && !idleTimer.hasStarted()) {
		idleTimer.start(function() {
			this.rects.forEach(function(rect) {
				rect.reset();
			});

			// Repopulate and shuffle the exhaustive array if it's empty
			if (!this.unusedIdleRects.length) {
				shuffle(this.usedIdleRects);
				while (this.usedIdleRects.length) {
					this.unusedIdleRects.push(this.usedIdleRects.pop());
				}
			} 

			// Pop a rect off the idle stack and expand it
			var rect = this.unusedIdleRects.pop();
			this.usedIdleRects.push(rect);
			this.expandRect(rect);

			// Gently ease into the idle mode by gradually decreasing the time between idle actions
			this.idleDelayMs = Math.max(3000, this.idleDelayMs - 1000);

		}, this, this.idleDelayMs);
	}
}

/**
 * Performs a hit test on every rectangle and returns the first positive result
 */
SpringRectLayout.prototype.hitTest = function(vector) {
	return this.rects.find(function(rect) {
		return rect.hitTest(vector);
	});
}
