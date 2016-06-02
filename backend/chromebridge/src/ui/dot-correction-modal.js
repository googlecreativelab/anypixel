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

var DotCorrectionData = require('../calibration/dot-correction-data');
var Modal = require('./modal');

/**
 * Provides a modal window for editing the dot correction values
 */
var DotCorrectionModal = module.exports = function() {
  Modal.call(this, 'dot-correction-modal');

  this.currentUnitNumber = undefined;

  // Get input field elements
  this.inputR = document.getElementById('dot-correct-field-r');
  this.inputG = document.getElementById('dot-correct-field-g');
  this.inputB = document.getElementById('dot-correct-field-b');

  // Get button elements
  this.sendEl = document.getElementById('dot-correct-send-button');
  this.cancelEl = document.getElementById('dot-correct-cancel-button');

  // Send the data to all display units when the send button is clicked
  this.sendEl.addEventListener('click', this.onSendClicked.bind(this));

  // Dismiss the modal window when the cancel button is clicked
  this.cancelEl.addEventListener('click', this.onCancelClicked.bind(this));
}

// Inherit from Modal
inherits(DotCorrectionModal, Modal);

/**
 * Shows the modal window with prepopulated dot correction data
 */
DotCorrectionModal.prototype.show = function(unitNumber) {
  // Populate input fields with current data
  this.inputR.value = DotCorrectionData.defaults.r;
  this.inputG.value = DotCorrectionData.defaults.g;
  this.inputB.value = DotCorrectionData.defaults.b;

  this.currentUnitNumber = unitNumber;

  // Call super constructor's show function
  DotCorrectionModal.super_.prototype.show.call(this);

  // Give focus to the first input field
  this.inputR.focus();
}

/**
 * Listener for send button clicks. Sends the data to all display units and dismisses the modal
 * window.
 */
DotCorrectionModal.prototype.onSendClicked = function(e) {
  e.preventDefault();

  // Save values
  DotCorrectionData.setDefaults(
    parseInt(this.inputR.value),
    parseInt(this.inputG.value),
    parseInt(this.inputB.value)
  );

  // Send the dot correction data to the current display unit, if one is set. Otherwise, send it to
  // all display units.
  if (this.currentUnitNumber != undefined) {
    DotCorrectionData.setDisplayUnitDotCorrection(this.currentUnitNumber);
  } else {
    DotCorrectionData.setAllDisplayUnitsDotCorrection();
  }

  // Dismiss
  this.currentUnitNumber = null;
  this.hide();
}

/**
 * Listener for cancel button clicks. Dismisses the modal window without sending.
 */
DotCorrectionModal.prototype.onCancelClicked = function(e) {
  e.preventDefault();
  this.hide();
}