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

var config = require('../../../config/config.display');
var DisplayController = require('../display-controller');
var DisplayUnitModal = require('./display-unit-modal');
var DisplayUnit = require('../display-unit');
var DisplayUnitStatusPacket = require('../../../config/packets/display-unit-status-packet');

var DisplayUnitList = module.exports = {};

DisplayUnitList.containerEl = null;

DisplayUnitList.displayUnitModal = null;

DisplayUnitList.currentUnitNumberInModal = null;

DisplayUnitList.unitStatuses = [];

DisplayUnitList.unitEls = [];

/**
 * Builds the list of display units
 */
document.addEventListener('DOMContentLoaded', function() {
	// Get the container element
	DisplayUnitList.containerEl = document.getElementById('unit_status');

	// Create the display unit modal window
	DisplayUnitList.displayUnitModal = new DisplayUnitModal();

	// Update the display when a status update is recieved
	document.addEventListener(DisplayUnit.statusUpdateEvent, onDisplayUnitStatusUpdated);
	
	// Create the list elements and add them to the container element
	for (var row = 0; row < config.unitRows; row++) {
		var rowEl = document.createElement('tr');

		for (var col = 0; col < config.unitCols; col++) {
			var colEl = document.createElement('td');
			var unitNumber = config.rowColToUnitNumber(row, col)
			colEl.textContent = unitNumber;
			colEl.setAttribute('data-unit-number', unitNumber);
			colEl.classList.add('unit');
			colEl.classList.add('off');
			colEl.addEventListener('click', onDisplayUnitClicked);
			
			rowEl.appendChild(colEl);
			DisplayUnitList.unitEls[unitNumber] = colEl;

			// Set default status: everything off
			DisplayUnitList.unitStatuses[unitNumber] = DisplayUnitStatusPacket.getDefault();
		}

		DisplayUnitList.containerEl.appendChild(rowEl);
	}
}, false);

/**
 * Listener for display unit clicks. Shows the display unit modal window with detailed status 
 * information for the unit that was clicked.
 */
function onDisplayUnitClicked(e) {
	var targetUnitNumber = parseInt(e.target.getAttribute('data-unit-number'));
	var targetUnitStatus = DisplayUnitList.unitStatuses[targetUnitNumber];
	DisplayUnitList.currentUnitNumberInModal = targetUnitNumber;
	DisplayUnitList.displayUnitModal.showUnitStatus(targetUnitNumber, targetUnitStatus);
}	

/**
 * Listener for display unit status updates. Updates the list elements and the current modal window
 */
function onDisplayUnitStatusUpdated(e) {
	var unitNumber = e.detail.unitNumber;
	var unitStatus = e.detail.status;
	DisplayUnitList.unitStatuses[unitNumber] = unitStatus;

	// Update the modal window
	if (DisplayUnitList.currentUnitNumberInModal == unitNumber) {
		DisplayUnitList.displayUnitModal.updateUnitStatus(unitStatus);
	}

	// Get overall health
	var isHealthy = DisplayController.displayUnits[unitNumber].isHealthy();

		// Display the unit's overall health state
	if (isHealthy) {
		DisplayUnitList.unitEls[unitNumber].classList.remove('off');
		DisplayUnitList.unitEls[unitNumber].classList.add('on');
	} else {
		DisplayUnitList.unitEls[unitNumber].classList.remove('on');
		DisplayUnitList.unitEls[unitNumber].classList.add('off');
	}
}