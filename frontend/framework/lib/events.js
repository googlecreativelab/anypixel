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
 * Listen for the 'buttonStates' event from a DOM target and emit onButtonDown / Up events
 * depending on the reported button state
 */
var events = module.exports = {};

events.setStateListenerOn = function setStateListenerOn(target) {
		
	if (target.anypixelListener) {
		return;
	}
	
	target.anypixelListener = true;

	target.addEventListener('buttonStates', function(data) {
		data.detail.forEach(function(button) {
			var x = button.p.x;
			var y = button.p.y;
			var state = button.s;
			var event = state === 1 ? 'onButtonDown' : 'onButtonUp';
			var key = x + ':' + y;

			if (state === 1) {
				events.pushedButtons[key] = {x: x, y: y};
			} else {
				delete events.pushedButtons[key];
			}
			
			target.dispatchEvent(new CustomEvent(event, {detail: {x: x, y: y}}));
		});
	});
}

/**
 * A map of currently-pushed buttons, provided for utility
 */
events.pushedButtons = {};
