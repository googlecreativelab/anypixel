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

var DisplayController = require('../display-controller');
var Modal = require('./modal');

/**
 * Provides a modal window for displaying power unit status details and controls
 */
var PowerUnitModal = module.exports = function() {
  Modal.call(this, 'power-unit-modal');

  this.currentUnitNumber = null;

  // Get lists of display table cells
  var statusACTableCells = this.el.querySelectorAll('.status_ac td');
  var status24vTableCells = this.el.querySelectorAll('.status_24v td');
  var statusRelayTableCells = this.el.querySelectorAll('.status_relay td');
  var statusRelayActionCells = this.el.querySelectorAll('.actions td');

  // Get title
  this.unitNumberLabel = document.getElementById('power-unit-label');
    
  // Get elements for status: AC Monitors 1, 2
  this.statusAC1Cell = statusACTableCells[0];
  this.statusAC2Cell = statusACTableCells[1];

  // Get elements for status: 24v Supply 1 Monitors A, B, C
  this.status24v1ACell = status24vTableCells[0];
  this.status24v1BCell = status24vTableCells[2];
  this.status24v1CCell = status24vTableCells[4];

  // Get elements for status: 24v Supply 2 Monitors A, B, C
  this.status24v2ACell = status24vTableCells[1];
  this.status24v2BCell = status24vTableCells[3];
  this.status24v2CCell = status24vTableCells[5];

  // Get elements for status: Relay Control 1, 2
  this.statusRelay1Cell = statusRelayTableCells[0];
  this.statusRelay2Cell = statusRelayTableCells[1];

  // Enable relays 1 and 2 if their "on" buttons are clicked
  var relayControlOn1 = statusRelayActionCells[0];
  var relayControlOn2 = statusRelayActionCells[1];
  relayControlOn1.addEventListener('click', this.onRelayButtonClicked.bind(this));
  relayControlOn2.addEventListener('click', this.onRelayButtonClicked.bind(this));

  // Disable relays 1 and 2 if their "off" buttons are clicked
  var relayControlOff1 = statusRelayActionCells[2];
  var relayControlOff2 = statusRelayActionCells[3];
  relayControlOff1.addEventListener('click', this.onRelayButtonClicked.bind(this));
  relayControlOff2.addEventListener('click', this.onRelayButtonClicked.bind(this));
}

// Inherit from Modal
inherits(PowerUnitModal, Modal);

/**
 * Disable the superclass's show function. Since a unit number and status is needed to show 
 * this modal window, the showUnitStatus() function is used instead.
 */
PowerUnitModal.prototype.show = function() {
  throw "please call showUnitDetails() instead.";
}

/**
 * Shows the modal window and updates the status display with the given unit number and status data
 */
PowerUnitModal.prototype.showUnitStatus = function(unitNumber, unitStatus) {
  this.updateUnitStatus(unitStatus);
  this.currentUnitNumber = unitNumber;
  this.unitNumberLabel.textContent = unitNumber + 1;
  PowerUnitModal.super_.prototype.show.call(this);
}

/**
 * Updates the status display with the given status data
 */
PowerUnitModal.prototype.updateUnitStatus = function(unitStatus) {
  setStatus(this.statusAC1Cell, unitStatus['ac'][0]);
  setStatus(this.statusAC2Cell, unitStatus['ac'][1]);

  setStatus(this.status24v1ACell, unitStatus['24v'][0]);
  setStatus(this.status24v1BCell, unitStatus['24v'][1]);
  setStatus(this.status24v1CCell, unitStatus['24v'][2]);

  setStatus(this.status24v2ACell, unitStatus['24v'][3]);
  setStatus(this.status24v2BCell, unitStatus['24v'][4]);
  setStatus(this.status24v2CCell, unitStatus['24v'][5]);

  setStatus(this.statusRelay1Cell, unitStatus['relay'][0]);
  setStatus(this.statusRelay2Cell, unitStatus['relay'][1]);
}

/**
 * Listener for relay control button clicks. Triggers a power unit enabled state change.
 */
PowerUnitModal.prototype.onRelayButtonClicked = function(e) {
  e.preventDefault();
  
  var enabled = e.target.getAttribute('data-action') == "on";
  var relayColumn = parseInt(e.target.parentNode.getAttribute('data-column'));

  if (relayColumn >= 0) {
    DisplayController.setPowerUnitEnabled(this.currentUnitNumber, relayColumn, enabled);
  }
}

/**
 * Sets the HTML properties of a given element to reflect a given status. The state is assumed to 
 * be "on" if a non-zero value is given.
 */
function setStatus(el, status) {
  el.classList.remove('on');
  el.classList.remove('off');

  el.textContent = status > 0 ? 'On' : 'Off';
  el.classList.add(status > 0 ? 'on' : 'off');
}