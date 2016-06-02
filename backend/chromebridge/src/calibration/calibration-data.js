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

var DisplayConfig = require('../../../config/config.display');

/**
 * Class which handles the loading and setting of calibration data. Calibration data is used to 
 * ensure a uniform display brightness by correcting for discrepencies in individual LED brightness.
 * The data consists of a set of lookup tables containing 64 values on a gamma-correction curve.
 *
 * The use of 64 values instead of 256 (8-bit color max) is due to the memory constraints of the 
 * ST32 microcontroller used by the LED boards, so the number of entries are decreased by a factor
 * of 4, and linear interpolation is used to get the full 256 values on the hardware side.
 *
 * All methods and properties in here are static.
 */
var CalibrationData = module.exports = {};

/**
 * Sets calibration data for a given display unit. Returns a promise that resolves when the data has 
 * finished sending.
 */
CalibrationData.setDisplayUnitCalibration = function(unitNumber, skipWaitDialog, skipPausing) {

  return new Promise(function(resolve, reject) {

    // Inline require to avoid a circular dependency
    var ViewController = require('../view-controller');
    var DisplayController = require('../display-controller');

    // Show waiting
    if (!skipWaitDialog) {
      ViewController.showWaitingOverlay();
    }

    // Pause sending data
    if (!skipPausing) {
      ViewController.pausePixelStreaming();
    }

    if (!skipWaitDialog) {
      console.log('CalibrationData: sending calibration - unit number', unitNumber);
    }

    // Send calibration data and resume activity once the data is sent
    DisplayController.setDisplayUnitCalibration(unitNumber, getGammaData())
      .then(function() {
        // Resume sending data
        if (!skipPausing) {
          ViewController.resumePixelStreaming();
        }

        // Hide waiting
        if (!skipWaitDialog) {
          ViewController.hideWaitingOverlay();
        }

        // Finish
        resolve();
      });
  });
}

/**
 * Sends gamma curve calibration data to all display units
 */
CalibrationData.setAllDisplayUnitsCalibration = function() {
  // Inline require to avoid a circular dependency
  var ViewController = require('../view-controller');
  var DisplayController = require('../display-controller');

  // Pause sending data
  ViewController.showWaitingOverlay();
  ViewController.pausePixelStreaming();

  console.log('CalibrationData: sending calibration - all units');

  var gammaData = getGammaData();
  var promises = DisplayController.setAllDisplayUnitsCalibration(gammaData);

  // Execute all promises then resume sending data
  Promise.all(promises)
    .then(function() {
      ViewController.hideWaitingOverlay();
      ViewController.resumePixelStreaming();
    });
}

/**
 * Returns a payload buffer containing 12-bit calibration values repacked into 8-bit bytes
 */
CalibrationData.buildPayloadFromData = function(data) {
  // Only 8-bit packets can be transmitted, but the calibration data is 12-bit.
  data = repack12bitTo8bit(data);

  var buffer = new ArrayBuffer(data.length);
  var payload = new Uint8Array(buffer);

  payload.set(data);

  return buffer;
}

/**
 * Returns an array of 3-channel lookup tables which contains values from a gamma-correction curve 
 * with a gamma of 2.2. Each lookup table contains 3 * 65 entries, or 65 entries for each color 
 * channel, and there is one table for each pixel in the display.
 *
 * Mod Note: for simplicity we are using the same gamma curve for each channel, but you could easily
 *           use a separate curve for each channel, or even a separate curve for each pixel.
 *            
 * See: https://en.wikipedia.org/wiki/Gamma_correction#Power_law_for_video_display
 */
function getGammaData() {
  var calibration = [];
  for (var i = 0; i < 65; i++) {
    var lookup = [];

    // Calculate gamma curve for all three channels
    var r = g = b = Math.round(3865 * Math.pow(i / 64, 2.2));
    
    for (var j = 0; j < DisplayConfig.pixelsPerUnit; j++) {
      lookup.push(r);
      lookup.push(g);
      lookup.push(b);
    }
    calibration.push(lookup);
  }

  return calibration;
}

/**
 * Returns an array of 8-bit values repacked from a given array of 12-bit values
 *
 * Example: 
 *   12-bit input: [ 0xFFF, 0xAAA, 0xFFF ]
 *   8-bit output: [ 0xFF, 0xFA, 0xAA, 0xFF, 0xF0 ]
 */
function repack12bitTo8bit(array12) {
  var array8 = [];

  for (var i = 0; i < array12.length; i++) {
    var msb = array12[i] >> 4;
    array8.push(msb);

    // Now get the last 4 bits. So this is the first 4 bits of the next.
    // Do an extra shift so we can add it to the next byte.
    var lsb = (array12[i] - (msb << 4)) << 4 
    i++;

    // Get the first byte of the next 3 byte object
    if (i < array12.length) {
      var msb2 = array12[i] >> 8;
      array8.push(lsb + msb2);

      // What's left?
      var lsb2 = array12[i] - (msb2 << 8);
      array8.push(lsb2);
    } else {
      array8.push(lsb);
    }
  }

  return array8;
}