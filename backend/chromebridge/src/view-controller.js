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

var Modal = require('./ui/modal');
var AppController = require('./app-controller');
var DisplayController = require('./display-controller');
var DotCorrectionData = require('./calibration/dot-correction-data');
var CalibrationData = require('./calibration/calibration-data');

// Mod Note - to use the physical hardware IP addresses, change this to config.physical
var config = require('../../config/config.emulator');

// Main UI elements
var DisplayUnitList = require('./ui/display-unit-list');
var PowerUnitList = require('./ui/power-unit-list');

// Modal windows
var DotCorrectionModal = require('./ui/dot-correction-modal');

// DOM element ids 
var WEBVIEW_ID = 'webview';
var APP_SELECTOR_ID = 'app-selector';
var PAUSE_BUTTON_ID = 'pause-button';
var STREAMING_STATUS_ID = 'streaming-status';
var RELOAD_APP_LIST_ID = 'reload-app-list-button';
var RELOAD_WEBVIEW_ID = 'reload-webview-button';
var SET_DOT_CORRECTION_ID = 'set-dot-correction-button';
var SET_PREDEF_CALIBRATION_ID = 'set-predefined-calibration-button';
var SET_CALIBRATION_ID = 'set-calibration-button';
var WAITING_OVERLAY_ID = 'waiting-overlay';

/**
 * Class which manages and contains the main interface.
 *
 * The UI for this class is provided by the files in the /ui directory.
 */
var ViewController = module.exports = {};

ViewController.monitoringDisplayUnitNumber = null;

ViewController.monitoringPowerUnitNumber = null;

ViewController.appSelectorEl = null;

ViewController.pauseButtonEl = null;

ViewController.reloadAppListEl = null;

ViewController.streamingStatusEl = null;

ViewController.reloadWebviewEl = null;

ViewController.setDotCorrectionEl = null;

ViewController.setPredefinedCalibrationEl = null;

ViewController.setGammaCalibrationEl = null;

ViewController.waitingModal = null;

ViewController.dotCorrectionModal = null;

document.addEventListener('DOMContentLoaded', function() {

  // Get interface elements
  ViewController.appSelectorEl = document.getElementById(APP_SELECTOR_ID);
  ViewController.pauseButtonEl = document.getElementById(PAUSE_BUTTON_ID);
  ViewController.reloadAppListEl = document.getElementById(RELOAD_APP_LIST_ID);
  ViewController.streamingStatusEl = document.getElementById(STREAMING_STATUS_ID);
  ViewController.reloadWebviewEl = document.getElementById(RELOAD_WEBVIEW_ID);
  ViewController.setDotCorrectionEl = document.getElementById(SET_DOT_CORRECTION_ID);
  ViewController.setPredefinedCalibrationEl = document.getElementById(SET_PREDEF_CALIBRATION_ID);
  ViewController.setCalibrationEl = document.getElementById(SET_CALIBRATION_ID);

  // Load dot correction data
  DotCorrectionData.loadDefaults();

  // Initialize the display controller
  DisplayController.initWithConfig(config);

  // Initialize the app controller
  AppController.initWebview(WEBVIEW_ID);

  // Load the list of apps and start the first one in the list
  AppController.getAvailableApps(true);

  // Create the waiting overlay modal and prevent it from being hidden by the user
  ViewController.waitingModal = new Modal(WAITING_OVERLAY_ID);
  ViewController.waitingModal.clickBehindToHide = false;
  ViewController.waitingModal.escapeToHide = false;

  // Create the dot correction modal window
  ViewController.dotCorrectionModal = new DotCorrectionModal();

  // Switch the current app if a new one is selected with the dropdown menu
  ViewController.appSelectorEl.addEventListener('change', onAppSelectorChanged);

  // Pause or resume pixel streaming if the pause button is clicked
  ViewController.pauseButtonEl.addEventListener('click', onPauseButtonClicked);

  // Reload the apps list drop-down if the reload app list button is clikced
  ViewController.reloadAppListEl.addEventListener('click', onReloadAppListClicked);

  // Reload the webview if the reload webview button is clicked
  ViewController.reloadWebviewEl.addEventListener('click', onReloadWebviewClicked);
  
  // Show the dot correction modal window if the set dot correction button is clicked
  ViewController.setDotCorrectionEl.addEventListener('click', onSetDotCorrectionClicked);

  // Send calibration data to all display units when the calibration button is clicked
  ViewController.setCalibrationEl.addEventListener('click', onSetCalibrationClicked);

}, false);

/**
 * Updates the app list drop-down using the list of apps from AppController
 */
ViewController.updateAppList = function() {
  // Save the previous selection so it can be restored later
  var prevSelection = ViewController.appSelectorEl.options[ViewController.appSelectorEl.selectedIndex];
  var prevPath = prevSelection.getAttribute('value');

  // Clear previous entries from the drop-down app list. Doing this in reverse-order ensures
  // that the element to be removed actually exists.
  for (var i = ViewController.appSelectorEl.options.length - 1; i >= 0; i--) {
    ViewController.appSelectorEl.remove(i);
  }

  // Re-populate the drop-down app list
  AppController.availableApps.forEach(function(app) {
    var optionEl = document.createElement('option'); 
    optionEl.setAttribute('value', app.path);
    optionEl.textContent = app.name;
    ViewController.appSelectorEl.appendChild(optionEl);

    if (app.path == prevPath) {
      prevSelection = optionEl;
    }
  });

  // Restore the previous selection
  prevSelection.selected = true;
}

/**
 * Pauses streaming of pixel data to the display
 */
ViewController.pausePixelStreaming = function() {
  console.log('ViewController: pausing pixeling streaming');
  AppController.pixelStreamingEnabled = false;
  ViewController.streamingStatusEl.classList.add('paused');
  ViewController.streamingStatusEl.textContent = 'Paused';
  ViewController.pauseButtonEl.textContent = 'Resume';
}

/**
 * Resumes streaming of pixel data to the display
 */
ViewController.resumePixelStreaming = function() {
  console.log('ViewController: resuming pixeling streaming');
  AppController.pixelStreamingEnabled = true;
  ViewController.streamingStatusEl.classList.remove('paused');
  ViewController.streamingStatusEl.textContent = 'Streaming';
  ViewController.pauseButtonEl.textContent = 'Pause';
}

/**
 * Shows the waiting overlay. This also blocks all interaction until the overlay is hidden
 */
ViewController.showWaitingOverlay = function() {
  ViewController.waitingModal.show();
}

/**
 * Hides the waiting overlay and restores interaction
 */
ViewController.hideWaitingOverlay = function() {
  ViewController.waitingModal.hide();
}

/**
 * Listener for app selector drop-down changes. Switches the current app if a new one is selected 
 * with the dropdown menu.
 */
function onAppSelectorChanged(e) {
  var selectedIndex = ViewController.appSelectorEl.selectedIndex;
  var selectedOption = ViewController.appSelectorEl.options[selectedIndex];
  var selectedAppPath = selectedOption.getAttribute('value');
  var app = AppController.getAppFromPath(selectedAppPath);
  AppController.switchToApp(app);
}

/**
 * Listener for pause button clicks. Pause or resume pixel streaming if the pause button is clicked.
 */
function onPauseButtonClicked(e) {
  e.preventDefault();
  if (AppController.pixelStreamingEnabled) {
    ViewController.pausePixelStreaming();
  } else {
    ViewController.resumePixelStreaming();
  }
}

/**
 * Listener for app list reload button clicks. Reloads the app list drop-down.
 */
function onReloadAppListClicked(e) {
  e.preventDefault();
  AppController.getAvailableApps();
}

/**
 * Listener for webview reload button clicks. Reloads the webview.
 */
function onReloadWebviewClicked(e) {
  e.preventDefault();
  AppController.reloadApp();
}

/**
 * Listener for set dot correction button clicks. Shows the dot correction modal window.
 */
function onSetDotCorrectionClicked(e) {
  e.preventDefault();
  ViewController.dotCorrectionModal.show();
}

/**
 * Listener for set gamma calibration button clicks. Sends gamma curve calibration data to all 
 * display units.
 */
function onSetCalibrationClicked(e) {
  e.preventDefault();
  CalibrationData.setAllDisplayUnitsCalibration();
}
