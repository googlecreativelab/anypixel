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
 * Class which handles the loading and setting of dot correction data. Dot correction is a feature
 * of the chip used by the LED display boards, the TLC59401. This chip is a constant-current PWM
 * driver, meaning that it outputs a constant amount of current, but effectively varies the 
 * voltage using PWM (pulse-width modulation). Dot correction is used to adjust the reference 
 * current for the constant current driver.
 *
 *      More info on PWM - https://en.wikipedia.org/wiki/Pulse-width_modulation
 *    TLC59401 datasheet - http://www.ti.com/lit/ds/symlink/tlc59401.pdf
 *
 * All methods and properties in here are static.
 */
var DotCorrectionData = module.exports = {};

/**
 * Default dot correction data. Valid values are in the range 0..100
 */
DotCorrectionData.defaults = { r: 50, g: 100, b: 50 };

/**
 * Maximum dot correction value. 
 * See Equation 8: http://www.ti.com/lit/ds/symlink/tlc59401.pdf  
 */
DotCorrectionData.MAX_DC_VALUE = 63;

/**
 * Loads the default dot correction values from local storage
 */
DotCorrectionData.loadDefaults = function() {
  chrome.storage.local.get({
    r: DotCorrectionData.defaults.r,
    g: DotCorrectionData.defaults.g,
    b: DotCorrectionData.defaults.b
  }, function(items) {
    console.log('Retrieved dot correction values from storage.');
    DotCorrectionData.defaults = items;
  });
}

/**
 * Sets the default values to the given r, g, and b values and saves them to local storage
 */
DotCorrectionData.setDefaults = function(r, g, b) {
  DotCorrectionData.defaults.r = r;
  DotCorrectionData.defaults.g = g;
  DotCorrectionData.defaults.b = b;

  chrome.storage.local.set(DotCorrectionData.defaults, function() {});
}

/**
 * Sets the dot correction values for a given display unit. Returns a promise which resolves when 
 * the operation is complete.
 */
DotCorrectionData.setDisplayUnitDotCorrection = function(unitNumber) {
  return new Promise(function (resolve, reject) {
    
    // Inline require to avoid a circular dependency
    var ViewController = require('../view-controller');
    var DisplayController = require('../display-controller');

    // Pause sending data
    ViewController.showWaitingOverlay();
    ViewController.pausePixelStreaming();

    console.log('DotCorrectionData: sending data - unit number', unitNumber);

    // Send data
    DisplayController.setDisplayUnitDotCorrection(
      unitNumber, 
      DotCorrectionData.defaults.r, 
      DotCorrectionData.defaults.g, 
      DotCorrectionData.defaults.b)

      .then(function() {
        // Resume sending data
        ViewController.hideWaitingOverlay();
        ViewController.resumePixelStreaming();
        resolve();
      });
  });
}

/**
 * Sets the dot correction value for all display units. Returns a promise which resolves when the
 * operation is complete.
 */
DotCorrectionData.setAllDisplayUnitsDotCorrection = function() {
  return new Promise(function (resolve, reject) {

    // Inline require to avoid a circular dependency
    var ViewController = require('../view-controller');
    var DisplayController = require('../display-controller');

    // Pause sending data
    ViewController.showWaitingOverlay();
    ViewController.pausePixelStreaming();

    console.log('DotCorrectionData: sending data - all units');

    // Send data
    var promises = DisplayController.setAllDisplayUnitsDotCorrection(
      DotCorrectionData.defaults.r, 
      DotCorrectionData.defaults.g, 
      DotCorrectionData.defaults.b
    );

    Promise.all(promises)
      .then(function() {
        // Resume sending data
        ViewController.hideWaitingOverlay();
        ViewController.resumePixelStreaming();
        resolve();
      });
  });
}

/**
 * Returns a payload buffer containing dot correction values from given r, g, b values
 */
DotCorrectionData.buildPayloadFromData = function(r, g, b) {
  var payloadLength = DisplayConfig.pixelsPerUnit * 3; // 3 color channels: R, G, B
  var buffer = new ArrayBuffer(payloadLength);
  var payload = new Uint8Array(buffer);

  // Scale RGB values from 0..100 to the range required by the LED driver chip
  r = Math.round(DotCorrectionData.MAX_DC_VALUE * (r / 100));
  g = Math.round(DotCorrectionData.MAX_DC_VALUE * (g / 100));
  b = Math.round(DotCorrectionData.MAX_DC_VALUE * (b / 100));

  for (var i = 0; i < payloadLength;) {
    payload[i++] = r;
    payload[i++] = g;
    payload[i++] = b;
  }

  return buffer;
}
