/*
Copyright 2016 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var DisplayCanvas = require('./display-canvas');

/**
 * Class which handles the user interface portions of the emulator
 */
var ViewController = module.exports = {};

ViewController.checkboxGridLines = null;

ViewController.checkboxUnitNumbers = null;

/**
 * Grabs the elements of the interface and adds event listeners
 */
ViewController.init = function() {
	ViewController.checkboxGridLines = document.getElementById('checkbox-show-grid-lines');
	ViewController.checkboxGridLines.addEventListener('click', onCheckboxGridLinesClicked);
	DisplayCanvas.drawGridLines = ViewController.checkboxGridLines.checked;

	ViewController.checkboxUnitNumbers = document.getElementById('checkbox-show-unit-numbers');
	ViewController.checkboxUnitNumbers.addEventListener('click', onCheckboxUnitNumbersClicked);
	DisplayCanvas.drawUnitNumbers = ViewController.checkboxUnitNumbers.checked;
}

/**
 * Listener for show gridlines checkbox clicks. Toggles whether or not to draw the display unit
 * grid lines.
 */
function onCheckboxGridLinesClicked(e) {
	DisplayCanvas.drawGridLines = ViewController.checkboxGridLines.checked;	
}

/**
 * Listener for show unit numbers checkbox clicks. Toggles whether or not to draw the display unit
 * number in the corner of each display unit
 */
function onCheckboxUnitNumbersClicked(e) {
	DisplayCanvas.drawUnitNumbers = ViewController.checkboxUnitNumbers.checked;
}