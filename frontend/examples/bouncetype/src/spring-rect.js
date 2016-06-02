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
var spring = require('./spring');

/**
 * Provides a rectangle who's width and y offset are attached to one-dimensional springs. These
 * springs give an elastic easing effect for any changes to the width or y offset.
 */
var SpringRect = module.exports = function(index, width, yOffset, minWidth, maxWidth, svgPath) {
	this.index = index;
	this.width = width;
	this.origWidth = width;
	this.origWidthNormalized = width;

	this.minWidth = minWidth;
	this.maxWidth = maxWidth;

	this.yOffset = yOffset;
	this.origYOffset = yOffset;

	this.widthSpring = new spring(this.width);
	this.yOffsetSpring = new spring(this.yOffset);

	this.loadedSVG = false;
	this.isSpace = true;
	this.isActive = false;
	this.isActiveIdle = false;
	this.isHeld = false;
	this.firstUpdate = false;

	// Load an svg image if a path has been provided
	if (svgPath) {
		this.svgImage = new Image();

		var self = this;
		this.svgImage.onload = function() {
			self.isSpace = false;
			self.loadedSVG = true;
			self.svgAspectRatio = self.svgImage.naturalHeight / self.svgImage.naturalWidth;
			self.transitionIn();
		}

		this.svgImage.src = svgPath;
	} else {
		this.transitionIn();
	}
}

/**
 * Sets the update flag after an amount of time determined by the rectangle's index.
 */
SpringRect.prototype.transitionIn = function() {
	var self = this;
	setTimeout(function() {
		self.firstUpdate = true;
	}, this.index * 80 + 250);
}

/**
 * Returns true if a given position is inside this rectangle. Because the rectangle's height is
 * off the edge of the interactable space, we only care about checking the x-axis.
 */
SpringRect.prototype.hitTest = function(vector) {
	return ((vector.x > this.xOffset) && (vector.x < this.getWidth() + this.xOffset));
}

/**
 * Returns true if all spring velocities are less than a given threshold
 */
SpringRect.prototype.isAtRest = function(threshold) {
	var wv = Math.abs(this.widthSpring.velocity);
	var yv = Math.abs(this.yOffsetSpring.velocity);
	return wv < threshold && yv < threshold;
}

/**
 * Returns the value of the width spring, scaled to the display boundary
 */
SpringRect.prototype.getWidth = function() {
	return this.widthSpring.value * config.width;
}

/**
 * Returns the value of the y offset spring
 */
SpringRect.prototype.getYOffset = function() {
	return this.yOffsetSpring.value;
}

/**
 * Sets and updates the width spring to a given value
 */
SpringRect.prototype.updateWidth = function(newValue) {
	this.widthSpring.setValue(newValue);
	this.widthSpring.update();
}

/**
 * Sets and updates the y offset spring to a given value
 */
SpringRect.prototype.updateYOffset = function(newValue) {
	this.yOffsetSpring.setValue(newValue);
	this.yOffsetSpring.update();
}

SpringRect.prototype.setWidth = function(width) {
	this.width = width;
}

SpringRect.prototype.setYOffset = function(yOffset) {
	this.yOffset = yOffset;
}

/**
 * Sets the active state to a given value
 */
SpringRect.prototype.setActive = function(newValue) {
	this.isActive = newValue;
	this.isActiveIdle = false;
}

/**
 * Sets the active idle state to a given value
 */
SpringRect.prototype.setActiveIdle = function(newValue) {
	this.isActiveIdle = newValue;
}

/**
 * Sets the held state to a given value
 */
SpringRect.prototype.setHeld = function(newValue) {
	this.isHeld = newValue;
}

/**
 * Resets the width and y offset to their original positions, and clears the activated flags
 */
SpringRect.prototype.reset = function() {
	this.setWidth(this.origWidth);
	this.setYOffset(this.origYOffset);
	this.setActive(false);
	this.setHeld(false);
	this.setActiveIdle(false);
}