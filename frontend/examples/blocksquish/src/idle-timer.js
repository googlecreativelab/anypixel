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

/**
 * Provides a singleton timer which can execute a callback after a certain amount of time. 
 * This is used to trigger the idle state animations after a period of inactivity
 */
var idleTimer = module.exports = {};

var timerRef = undefined;

/**
 * Clears the timer
 */
idleTimer.clear = function() {
	if (timerRef !== undefined) {
		window.clearTimeout(timerRef);
		timerRef = undefined;
	}
}

/**
 * Starts the timer, which will execute a given callback in a given context, in a given amount of 
 * time set in milliseconds
 */
idleTimer.start = function(callback, context, delayMs) {
	idleTimer.clear();

	timerRef = setTimeout(function() {
		callback.call(context);
		idleTimer.clear();
	}, delayMs);
}

/**
 * Returns true if the timer has started
 */
idleTimer.hasStarted = function() {
	return timerRef !== undefined;
}