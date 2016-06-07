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
 * Provides a function which dispatches a buttonState CustomEvent with a given location and state
 */
module.exports = function dispatchStateEvent(location, pushedState) {
	document.dispatchEvent(new CustomEvent('buttonStates', {
		'detail': [{
			'p': {x: location.x, y: location.y},
			's': pushedState === true ? 1 : 0
		}]
	}));
}