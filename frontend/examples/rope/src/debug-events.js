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
 * Event listener for DOMContentLoaded. Triggers three buttonDown events, for debugging multitouch.
 */
document.addEventListener('DOMContentLoaded', function() {
	document.dispatchEvent(new CustomEvent('buttonStates', {
		'detail': [{
			'p': {x: 70, y: 21},
			's': 1
		}]
	}));
	document.dispatchEvent(new CustomEvent('buttonStates', {
		'detail': [{
			'p': {x: 20, y: 21},
			's': 1
		}]
	}));

	document.dispatchEvent(new CustomEvent('buttonStates', {
		'detail': [{
			'p': {x: 110, y: 30},
			's': 1
		}]
	}));
}, false);