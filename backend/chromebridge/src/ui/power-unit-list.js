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

var DisplayController = require('../display-controller');
var DisplayConfig = require('../../../config/config.display');
var PowerConfig = require('../../../config/config.power');
var PowerUnitStatusPacket = require('../../../config/packets/power-unit-status-packet');
var PowerUnitModal = require('./power-unit-modal');
var PowerUnit = require('../power-unit');

var PowerUnitList = module.exports = {};

PowerUnitList.containerEl = null;

PowerUnitList.powerUnitModal = null;

PowerUnitList.currentUnitNumberInModal = null;

PowerUnitList.unitStatuses = [];

PowerUnitList.unitEls = [];

/**
 * Builds the list of power units for the main UI
 */
document.addEventListener('DOMContentLoaded', function() {
	// Get the container element
	PowerUnitList.containerEl = document.getElementById('power_status');

	// Create the power unit modal window
	PowerUnitList.powerUnitModal = new PowerUnitModal();

	// Update the display when a status update is recieved
	document.addEventListener(PowerUnit.statusUpdateEvent, onPowerUnitStatusUpdated);

	// Create the list elements and add them to the container element
	for (var row = 0; row < DisplayConfig.unitRows / PowerConfig.unitRowsPerPowerUnit; row++) {
		var rowEl = document.createElement('tr');

		for (var col = 0; col < DisplayConfig.unitCols / PowerConfig.unitColsPerPowerUnit; col++) {
			var colEl = document.createElement('td');
			var unitNumber = DisplayConfig.rowColToUnitNumber(row, col);
			colEl.textContent = unitNumber + 1;
			colEl.setAttribute('data-unit-number', unitNumber);
			colEl.classList.add('power');
			colEl.classList.add('off');
			colEl.addEventListener('click', onPowerUnitClicked);

			rowEl.appendChild(colEl);
			PowerUnitList.unitEls[unitNumber] = colEl;

			// Set default status
			PowerUnitList.unitStatuses[unitNumber] = PowerUnitStatusPacket.getDefault();
		}

		PowerUnitList.containerEl.appendChild(rowEl);
	}
}, false);

/**
 * Listener for power unit clicks. Shows the power unit modal window with detailed status 
 * information for the unit that was clicked.
 */
function onPowerUnitClicked(e) {
	var targetUnitNumber = parseInt(e.target.getAttribute('data-unit-number'));
	var targetUnitStatus = PowerUnitList.unitStatuses[targetUnitNumber];
	PowerUnitList.currentUnitNumberInModal = targetUnitNumber;
	PowerUnitList.powerUnitModal.showUnitStatus(targetUnitNumber, targetUnitStatus);
}

/**
 * Listener for power unit status updates. Updates the list elements and the current modal window
 */
function onPowerUnitStatusUpdated(e) {
	var unitNumber = e.detail.unitNumber;
	var unitStatus = e.detail.status;
	PowerUnitList.unitStatuses[unitNumber] = unitStatus;

	// Update the modal window
	if (PowerUnitList.currentUnitNumberInModal == unitNumber) {
		PowerUnitList.powerUnitModal.updateUnitStatus(unitStatus);
	}

	// Get overall health
	var isHealthy = DisplayController.powerUnits[unitNumber].isHealthy;
		
	// Display the unit's overall health state
	if (isHealthy) {
		PowerUnitList.unitEls[unitNumber].classList.remove('off');
		PowerUnitList.unitEls[unitNumber].classList.add('on');
	} else {
		PowerUnitList.unitEls[unitNumber].classList.remove('on');
		PowerUnitList.unitEls[unitNumber].classList.add('off');
	}
}