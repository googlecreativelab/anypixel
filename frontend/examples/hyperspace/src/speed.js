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

/**
 * Provides functionality related to the global speed of the stars. The hyperspace easteregg is
 * implemented here.
 */
var Speed = module.exports = {};

Speed.minValue = 0.035;
Speed.maxValue = 150;
Speed.value = Speed.minValue;
Speed.hyperValue = 0.0;

var hyperDelaySecs = 4.0;
var hyperRampAmount = 0.03;
var hyperTimeout = hyperDelaySecs;

/**
 * Event listener for DOMContentLoaded. Increases the global speed according to an exponential 
 * curve. Position along the curve is determined by how many buttons are being held down. 
 * More buttons = faster time to hyperspeed.
 */
document.addEventListener('DOMContentLoaded', function() {
	function update(t) {
		var numButtons = Object.keys(anypixel.events.pushedButtons).length;

		if (numButtons > 0) {
			if (hyperTimeout <= 0) {
				Speed.hyperValue += hyperRampAmount;
				Speed.value += hyperRampAmount / 4;
			} else {
				hyperTimeout -= numButtons * hyperRampAmount;
			}
		} else {
			hyperTimeout = hyperDelaySecs;
			Speed.hyperValue = Math.max(0, Speed.hyperValue - (Speed.hyperValue * hyperRampAmount * 5));
			Speed.value = Math.min(Math.max(Speed.minValue, Speed.value - (Speed.value * hyperRampAmount * 5)), Speed.maxValue);
		}
		window.requestAnimationFrame(update);
	}

	window.requestAnimationFrame(update);
});

