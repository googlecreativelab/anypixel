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