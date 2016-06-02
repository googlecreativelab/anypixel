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