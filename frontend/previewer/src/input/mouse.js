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