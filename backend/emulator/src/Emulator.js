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

var PacketHeader = require('../../config/packets/packet-builder');
var EmulatorDisplayUnit = require('./emulator-display-unit');
var EmulatorPowerUnit = require('./emulator-power-unit');
var PowerConfig = require('../../config/config.power');
var UdpConfig = require('../../config/config.udp');
var EmulatorConfig = require('../../config/config.emulator');
var viewController = require('./view-controller');
var displayCanvas = require('./display-canvas');
var renderCanvas = require('./render-canvas');

var displayUnits = [];
var powerUnits = [];

document.addEventListener('DOMContentLoaded', function() {
  displayCanvas.init();
  renderCanvas.init();
  viewController.init();

  chrome.sockets.udp.onReceive.addListener(onMessageRecieved);

  // Initialize power units
  for (var i = 0; i < EmulatorConfig.powerUnitAddresses.length; i++) {
    addPowerUnit(EmulatorConfig.powerUnitAddresses[i].port, i);
  }

  // Initialize display units
  var displayUnitCounter = 0;
  for (var row = 0; row < EmulatorConfig.unitAddresses.length; row++) {
    for (var col = 0; col < EmulatorConfig.unitAddresses[row].length; col++) {
      var powerUnitNumber = PowerConfig.unitRowColToUnitNumber(row, col);
      var powerUnit = powerUnits[powerUnitNumber];
      addDisplayUnit(EmulatorConfig.unitAddresses[row][col].port, displayUnitCounter++, powerUnit);
    }
  }

  window.requestAnimationFrame(update);
}, false);

/**
 * Creates a new display unit with a given port, unit number, and power unit and adds it to the 
 * display
 */
function addDisplayUnit(port, unitNumber, powerUnit) {
  var displayUnit = new EmulatorDisplayUnit(port, unitNumber, UdpConfig.controllerPort, powerUnit);

  chrome.sockets.udp.create(function(socketInfo) {
    var socketIdUDP = socketInfo.socketId;
    chrome.sockets.udp.bind(socketIdUDP, '0.0.0.0', port, function(result) { /* Ignore */ });
  });

  displayUnit.initialize();

  displayUnits[unitNumber] = displayUnit;
}

/**
 * Creates a new power unit with a given port and unit number and adds it to the display
 */
function addPowerUnit(port, unitNumber) {
  var powerUnit = new EmulatorPowerUnit(port, unitNumber, UdpConfig.controllerPort);

  chrome.sockets.udp.create(function(socketInfo) {
    var socketIdUDP = socketInfo.socketId;
    chrome.sockets.udp.bind(socketIdUDP, '0.0.0.0', port, function(result) { /* Ignore */ });
  });

  powerUnit.initialize();

  powerUnits[unitNumber] = powerUnit;
}

/**
 * Reroutes incoming UDP packets to the appropriate display or power unit
 */
function onMessageRecieved(message) {
  var data_8 = message.data.slice(0);
  var data_8v = new Uint8Array(data_8);
  var commandFlag = data_8v[0];
  var unitNumber = data_8v[8];

  if (commandFlag == PacketHeader.commandFlags.tx_relayControl) { 
    powerUnits[unitNumber].relayMessageHandler(data_8v);
  } else {
    displayUnits[unitNumber].pixelHandler(data_8v);
  }
}

/**
 * Updates the display and render canvases every frame
 */
function update() {
  displayUnits.forEach(function(unit) {
    renderCanvas.render(unit.imageData, unit.position.y, unit.position.x);
  });

  displayCanvas.update();

  window.requestAnimationFrame(update);
}