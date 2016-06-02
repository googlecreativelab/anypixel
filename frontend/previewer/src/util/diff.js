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
 * Provides a function which returns the difference between the properties of two objects.
 */
module.exports = function diff(base, compared) {

	var removed = [];
	var added = [];

	// Loop through the compared object to get items added to it
	for (var prop in compared) {
		if (compared.hasOwnProperty(prop) && !(prop in base)) {
			added.push(prop);
		}
	}

	// Loop through the base object to get items removed from it
	for (var prop in base) {
		if (base.hasOwnProperty(prop) && !(prop in compared)) {
			removed.push(prop);
		}
	}

	return {
		removed: removed,
		added: added
	};
}