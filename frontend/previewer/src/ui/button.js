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
 * Encapsulates a DOM element and provides toggling of a selected state. Second parameter is the
 * button's starting state
 */
var Button = module.exports = function(id, isSelected) {
	this.el = document.getElementById(id);
	this.setSelected(isSelected);
}

/**
 * Toggles the selected state of the button
 */
Button.prototype.setSelected = function(isSelected) {
	this.selected = isSelected;
	if (this.selected) {
		this.el.classList.add('selected');
	} else {
		this.el.classList.remove('selected');
	}
}