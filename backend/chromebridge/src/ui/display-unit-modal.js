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

var inherits = require('inherits');
var chroma = require('chroma-js');

var config = require('../../../config/config.display');
var DisplayController = require('../display-controller');
var CalibrationData = require('../calibration/calibration-data');
var Modal = require('./modal');

/**
 * Provides a modal window for displaying display unit status details and controls
 */
var DisplayUnitModal = module.exports = function() {
  Modal.call(this, 'display-unit-modal');

  this.currentUnitNumber = null;

  // Get title
  this.unitNumberLabel = document.getElementById('display-unit-label');

  // Get pixel temperature table element
  this.pixelTempTable = document.getElementById('pixel-temp-table');

  // Create pixel temperature table cells, one for each pixel in the display unit
  this.pixelTempCells = createTable(this.pixelTempTable, 
  	config.boardRows * config.boardsPerUnitRows,
  	config.boardCols * config.boardsPerUnitCols);

  // Get average temperature table element
  this.averageTempTable = document.getElementById('avg-temp-table');

  // Create average temperature table cells, one for each board in the display unit
  this.averageTempCells = createTable(this.averageTempTable, config.boardsPerUnitRows, config.boardsPerUnitCols);

  // Get MAC address table element
  this.macAddressTable = document.getElementById('mac-address-table');

  // Create mac address table cells, one for each board in the display unit
  this.macAddressCells = createTable(this.macAddressTable, config.boardsPerUnitRows, config.boardsPerUnitCols);

  // Get uptime table element
  this.uptimeTable = document.getElementById('uptime-table');

  // Create uptime table cells, one for each board in the display unit
  this.uptimeCells = createTable(this.uptimeTable, config.boardsPerUnitRows, config.boardsPerUnitCols);

  // Create the temperature color gradient scale, from blue to yellow to red.
  this.colorScale = chroma.scale('Spectral').domain([1, 0]);

  // Listen for send dot correction button clicks and show the dot correction window for this unit.
  var sendDotCorrectionButton = document.getElementById('send-dot-correction-button');
  sendDotCorrectionButton.addEventListener('click', this.onSendDotCorrectionClicked.bind(this));

  // Listen for send calibration button clicks
  var sendCalibrationButton = document.getElementById('send-calibration-button');
  sendCalibrationButton.addEventListener('click', this.onSendCalibrationClicked.bind(this));
}

// Inherit from Modal
inherits(DisplayUnitModal, Modal);

/**
 * Disable the superclass's show function. Since a unit number and status is needed to show 
 * this modal window, the showUnitStatus() function is used instead.
 */
DisplayUnitModal.prototype.show = function() {
  throw "please call showUnitDetails() instead.";
}

/**
 * Shows the modal window and updates the status display with the given unit number and status data
 */
DisplayUnitModal.prototype.showUnitStatus = function(unitNumber, unitStatus) {
	this.updateUnitStatus(unitStatus);
	this.currentUnitNumber = unitNumber;
	this.unitNumberLabel.textContent = unitNumber;
	DisplayUnitModal.super_.prototype.show.call(this);
}

/**
 * Updates the status display with the given status data
 */
DisplayUnitModal.prototype.updateUnitStatus = function(unitStatus) {
	// Update pixel temperatures
	unitStatus.pixelTemp.forEach(function(f, i) {
		this.pixelTempCells[i].style.backgroundColor = this.colorScale(f / 255).css();
		this.pixelTempCells[i].textContent = f;
	}, this);

	// Update average temperatures
	unitStatus.avgTemp.forEach(function(f, i) {
		this.averageTempCells[i].style.backgroundColor = this.colorScale(f / 255).css();
		this.averageTempCells[i].textContent = f;
	}, this);

	// Update MAC addresses
	var addressCursor = 0;
	this.macAddressCells.forEach(function(el) {
		var macAddress = '';
		for (var i = 0; i < 6; i++) {
			macAddress += int8ToHex(unitStatus.ids[addressCursor++]);
			macAddress += i < 5 ? ':' : '';
		}
		el.textContent = macAddress;
	});

	// Update uptimes
	this.uptimeCells.forEach(function(el, i) {
		el.textContent = msToHumanReadableTime(unitStatus.uptime[i]);
	});
}

/**
 * Listener for send dot correction clicks. Shows the dot correction modal window and allows sending
 * of dot correction data to the current display unit.
 */
DisplayUnitModal.prototype.onSendDotCorrectionClicked = function(e) {
	// Inline require to avoid a circular dependency
	var ViewController = require('../view-controller');

	e.preventDefault();
  ViewController.dotCorrectionModal.show(this.currentUnitNumber);
}

/**
 * Listener for send calibration clicks. Sends the calibration data to the current display unit.
 */
DisplayUnitModal.prototype.onSendCalibrationClicked = function(e) {
	e.preventDefault();
	CalibrationData.setDisplayUnitCalibration(this.currentUnitNumber);
}

/**
 * Creates a table in a given parent element with a given number of rows and columns. Returns an 
 * array of the table cell elements.
 */
function createTable(parentEl, rows, cols) {
	var cells = [];
	for (var row = 0; row < rows; row++) {
  	var rowEl = document.createElement('tr');
  	for (var col = 0; col < cols; col++) {
  		var colEl = document.createElement('td');
  		cells.push(colEl);
  		rowEl.appendChild(colEl);
  	}
  	parentEl.appendChild(rowEl);
  }
  return cells;
}

/**
 * Converts an 8-bit integer to a hex string
 */
function int8ToHex(int8) {
	var octet = int8.toString(16);
	return (octet.length === 1) ? ('0' + octet) : octet;
}

/**
 * Converts time in milliseconds to human-readable days, hours, minutes, and so on
 */
function msToHumanReadableTime(ms) {
	var milliseconds = Math.round((ms % 1000) / 100),
			seconds = Math.round(ms / 1000) % 60,
			minutes = Math.round(ms / (1000 * 60)) % 60,
			hours = Math.round(ms / (1000 * 60 * 60)) % 24,
			days = Math.round(ms / (1000 * 60 * 60 * 24));

	days = (days < 10) ? '0' + days : days;
	hours = (hours < 10) ? '0' + hours : hours;
	minutes = (minutes < 10) ? '0' + minutes : minutes;
	seconds = (seconds < 10) ? '0' + seconds : seconds;

	return days + ':' + hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
}
