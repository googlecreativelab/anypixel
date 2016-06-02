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

/**
 * Handles the interruption and starting of button state-change timers. This is used by the stateMap
 * to coordinate timing of fuzzy cursor events. Timers are stored in the timerMap by position keys
 */
var timers = module.exports = {};

var timerMap = {};

/**
 * Stops a timer and deletes it from the map
 */
timers.interrupt = function interrupt(position) {
	var key = require('./stateMap').keyFromPosition(position);

	if (timerMap.hasOwnProperty(key)) {
		window.clearTimeout(timerMap[key]);
		delete timerMap[key];
	}
}

/**
 * Adds a state-change timer to the map at a given position, and removes the previous one if it exists
 */
timers.add = function add(position, state, delayMs) {
	timers.interrupt(position);

	var stateMap = require('./stateMap');
	timerMap[stateMap.keyFromPosition(position)] = setTimeout(function(pos, state) {
		return function() {
			stateMap.set(pos, state);
			delete timerMap[stateMap.keyFromPosition(pos)];
		};
	}(position, state), delayMs);
}