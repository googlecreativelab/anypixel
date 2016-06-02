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
var Spring = require('./spring');

/**
 * Provides a rectangle who's width, height and y offset are attached to one-dimensional springs. 
 * These springs give an elastic easing effect for any changes to the width, height or y offset.
 * Each rectangle can also have a set of lines associated with it. the positions of these lines are
 * determined by the difference between the original rectangle's aspect ratio and the unchanged
 * aspect ratio.
 */
var SpringLetter = module.exports = function(id, width, color, lines) {
	this.width = width;
	this.origWidth = width;
	this.prevWidth = width;

	this.height = config.height;
	this.origHeight = config.height;

	this.xOffset = 0;
	this.yOffset = config.height;
	this.origYOffset = 0;

	this.widthSpring = new Spring(this.width);
	this.heightSpring = new Spring(this.height);
	this.yOffsetSpring = new Spring(this.yOffset);

	this.color = color;
	this.lines = [];

	this.isActive = false;
	this.isIdleActive = false;

	this.buttons = {};

	// Line coordinates are stored as ratios of the original height and width
	this.lines = lines.map(function(line) {
		return line.map(function(coord) {
			var x = coord[0] / this.origWidth;
			var y = coord[1] / this.origHeight;
			return [x, y];
		}, this);
	}, this);
}

/**
 * Maps the line ratios back to pixel coordinates using the new width and height, and returns the
 * result.
 */
SpringLetter.prototype.getLines = function getLines() {
	return this.lines.map(function(line) {
		return line.map(function(ratio) {
			var x = ratio[0] * Math.round(this.getWidth());
			var y = ratio[1] * Math.round(this.getHeight());
			return [Math.round(x), Math.round(y)];
		}, this);
	}, this);
}

/**
 * Returns true if a given position is inside this rectangle. Because the rectangle's height is
 * off the edge of the interactable space, we only care about checking the x-axis.
 */
SpringLetter.prototype.hitTest = function(vector) {
	return ((vector.x >= this.xOffset) && (vector.x < this.getWidth() + this.xOffset));
}

/**
 * Event listener for onButtonDown. Expands the rectangle and squishes the height down to the 
 * y-axis value of the highest button event. If there are multiple button presses within the bounds
 * of the rectangle, the height and y offset span between the highest and lowest values.
 */
SpringLetter.prototype.onButtonDown = function(pos) {
	this.buttons[pos.x + ':' + pos.y] = pos;

	this.setActive(true);
	this.setIdleActive(false);

	// Sort buttons by y-axis position, high to low.
	var sortBtns = Object.keys(this.buttons).map(function(key) { return this.buttons[key]; }, this);
	sortBtns.sort(function(a, b) {
		var greater = a.y > b.y ? 1 : 0;
		var equal = a.y == b.y ? 1 : 0;
		return greater || equal - 1;
	});

	var letterTop = sortBtns[0].y;
	var letterBottom = config.height - letterTop;

	this.setYOffset(letterTop);
	this.setHeight(letterBottom);
	this.setWidth(config.width / 2);
}

/**
 * Event listener for onButtonUp. Resets the rectangle if no other pushed buttons are active within
 * its bounds.
 */
SpringLetter.prototype.onButtonUp = function(pos) {
	delete this.buttons[pos.x + ':' + pos.y];
	if (Object.keys(this.buttons).length <= 0) { 
		this.reset();
	}
}

/**
 * Sets and updates the width spring to a given value
 */
SpringLetter.prototype.updateWidth = function(newValue) {
	this.widthSpring.setValue(newValue);
	this.widthSpring.update();
}

/**
 * Sets and updates the height spring to a given value
 */
SpringLetter.prototype.updateHeight = function(newValue) {
	this.heightSpring.setValue(newValue);
	this.heightSpring.update();
}

/**
 * Sets and updates the y offset spring to a given value
 */
SpringLetter.prototype.updateYOffset = function(newValue) {
	this.yOffsetSpring.setValue(newValue);
	this.yOffsetSpring.update();
}

/**
 * Sets the base width to a given value
 */
SpringLetter.prototype.setWidth = function(newValue) {
	this.width = newValue;
}

/**
 * Sets the base height to a given value
 */
SpringLetter.prototype.setHeight = function(newValue) {
	this.height = newValue;
}

/**
 * Sets the base y offset to a given value
 */
SpringLetter.prototype.setYOffset = function(newValue) {
	this.yOffset = newValue;
}

/**
 * Sets the active state to a given value
 */
SpringLetter.prototype.setActive = function(newValue) {
	this.isActive = newValue;
}

/**
 * Sets the idle active state to a given value
 */
SpringLetter.prototype.setIdleActive = function(newValue) {
	this.isIdleActive = newValue;
}

/**
 * Returns the value of the width spring. A lowpass filter is used to smooth out any sudden changes
 * to the width. See: http://phrogz.net/js/framerate-independent-low-pass-filter.html
 */
SpringLetter.prototype.getWidth = function() {
	var w = Math.round(this.widthSpring.getValue() * config.width); 
	this.prevWidth += Math.round((w - this.prevWidth) / 3);
	return this.prevWidth;
}

/**
 * Returns the value of the height spring
 */
SpringLetter.prototype.getHeight = function() {
	return this.heightSpring.getValue();
}

/**
 * Returns the value of the y offset spring
 */
SpringLetter.prototype.getYOffset = function() {
	return this.yOffsetSpring.getValue();
}

/**
 * Resets the width, height, and y offset to their original positions, and clears the activated 
 * flags.
 */
SpringLetter.prototype.reset = function() {
	this.setWidth(this.origWidth);
	this.setHeight(this.origHeight);
	this.setYOffset(this.origYOffset);
	this.setActive(false);
	this.setIdleActive(false);
}