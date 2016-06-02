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
var diff = require('../util/diff');
var stateMap = require('./stateMap');

/**
 * Provides a single-point cursor. Each cursor maintains its own map of active points, 
 * separate from the global stateMap.
 */
var Cursor = module.exports = function(cursorId) {
	this.id = cursorId;
	this.activePoints = {};
};

/**
 * Function called when the cursor's input starts. Activates a single point
 */
Cursor.prototype.onInputStart = function(position) {
	this.activePoints[stateMap.keyFromPosition(position)] = true;
	stateMap.set(position, true);
}

/**
 * Function called when the cursor is moved. 
 */
Cursor.prototype.onInputMove = function(lastPosition, currentPosition) {
	// Diff previous active points against current active points
	var currentActivePoints = {};
	currentActivePoints[stateMap.keyFromPosition(currentPosition)] = true;
	var diffPoints = diff(this.activePoints, currentActivePoints);

	// Any points which are in the current set and not in the previous set add a position to the state map
	diffPoints.added.forEach(function(key) {
		stateMap.set(stateMap.keyToPosition(key), true);
		this.activePoints[key] = true;
	}, this);

	// Any points which are in the previous set and not in the current set remove a position from the state map
	diffPoints.removed.forEach(function(key) {
		stateMap.set(stateMap.keyToPosition(key), false);
		delete this.activePoints[key];
	}, this);
}

/**
 * Function called when the cursor is released. All active buttons are released from the stateMap
 */
Cursor.prototype.onInputEnd = function(position) {
	delete this.activePoints[stateMap.keyFromPosition(position)];
	stateMap.set(position, false);
}