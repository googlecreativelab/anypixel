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

var PacketBuilder = require('../../config/packets/packet-builder');
var DisplayConfig = require('../../config/config.display');
var UdpConfig = require('../../config/config.udp');
var DisplayUnit = require('./display-unit');
var PowerUnit = require('./power-unit');

/**
 * Class which manages the state and communication of the full display, made up of display units
 * and power units. 
 * 
 * All methods and properties here are static.
 */
var DisplayController = module.exports = {};

DisplayController.displayUnits = [];

DisplayController.powerUnits = [];

DisplayController.displayUnitIPMap = {};

DisplayController.powerUnitIPMap = {};

DisplayController.socketId = null;

DisplayController.events = {
  displayUnitStatus: 'displayUnitStatus',
  powerUnitStatus: 'powerUnitStatus'
};

/**
 * Initializes the DisplayController with a given config class, and creates the necessary number of
 * display and power units based on the information in the config class. 
 * 
 * Valid config classes are 
 *   config.physical - physical display, with external IP addresses
 *   config.emulator - emulated display, with internal IP addresses
 */
DisplayController.initWithConfig = function(config) {
  DisplayController.config = config;

  if (config !== null) {
    // Start UDP client for receiving
    startUDPReceiver();

    // Start UDP client for sending, then instantiate display and power units
    startUDPSender().then(function() {
      var unitCounter = 0;

      // Instantiate display units
      for (var i = 0; i < DisplayController.config.unitAddresses.length; i++) {
        for (var j = 0; j < DisplayController.config.unitAddresses[i].length; j++) {
          DisplayController.addDisplayUnit(DisplayController.config.unitAddresses[i][j], unitCounter++);
        }
      }

      // Instiate power units
      for (var i = 0; i < DisplayController.config.powerUnitAddresses.length; i++) {
        DisplayController.addPowerUnit(DisplayController.config.powerUnitAddresses[i], i);
      }
    });
  }
}

/**
 * Adds a new display unit with a given ip, port, and id number to the display
 */
DisplayController.addDisplayUnit = function(ipPort, unitNumber) {
  var displayUnit = new DisplayUnit(ipPort.ip, ipPort.port, unitNumber);
  DisplayController.displayUnitIPMap[ipPort.ip] = unitNumber;
  DisplayController.displayUnits[unitNumber] = displayUnit;
};

/**
 * Adds a new power unit with a given ip, port, and id number to the display
 */
DisplayController.addPowerUnit = function(ipPort, unitNumber) {
  var powerUnit = new PowerUnit(ipPort.ip, ipPort.port, unitNumber);
  DisplayController.powerUnitIPMap[ipPort.ip] = unitNumber;
  DisplayController.powerUnits[unitNumber] = powerUnit;
};

/**
 * Updates all display units with pixel data from the current app. The data is packed into bundles
 * of multiple display units to reduce the number of packets required to update the full display.
 */
DisplayController.updateFrame = function(data) {
  // Make a copy of the array buffer (ignoring first byte: header)
  var data8 = data.slice(1);
  var data8v = new Uint8Array(data8);

  // Clear the RGB array for each unit
  DisplayController.displayUnits.forEach(function(unit) {
    unit.clearPixelArray();
  });

  // Assign each pixel to the right display unit
  for (var i = 0, l = data8v.length; i < l;) {
    var pixelNumber = i / 3;
    DisplayController.displayUnits[DisplayConfig.pixelToUnit(pixelNumber)].addPixel(
      data8v[i++], 
      data8v[i++], 
      data8v[i++]);
  }

  // Generate the pixel packets
  DisplayController.displayUnits.forEach(function(unit) {
    unit.savePixelPacket();
  });

  // Pack multiple display
  for (var i = 0; i < DisplayController.displayUnits.length / DisplayConfig.displayUnitsPerPacket; i++) {
    
    // Calculate which unit numbers to include in the bundle
    var bundleIndexes = [];
    for (var j = 0; j < DisplayConfig.displayUnitsPerPacket; j++) {
      var unitIndex = (i * DisplayConfig.displayUnitsPerPacket) + j;
      bundleIndexes.push(unitIndex);
    }

    // Dispatch
    DisplayController.sendPacketBundle(bundleIndexes);
  }
};

/**
 * Sends a UDP packet consisting of pixel data from multiple display units, bundled into a single
 * packet. Bundling multiple unit's data into a single packet means that less packets need to be
 * sent from ChromeBridge to the UDP Manager.
 */
DisplayController.sendPacketBundle = function(indices) {
  // Calculate buffer length by summing the byte lengths of each pixel buffer in the list of indices
  // in the bundle.
  var bundleLength = indices.reduce(function(sum, index) {
    var unit = DisplayController.displayUnits[index];
    return sum + unit.pixelBuffer.byteLength;
  }, 0);

  // Create the data buffer
  var buffer = new ArrayBuffer(bundleLength);
  var data = new Uint8Array(buffer);
  var currentByte = 0;

  // Append multiple display unit data 
  for (var i = 0; i < indices.length; i++) {
    var pxBuffer = DisplayController.displayUnits[indices[i]].pixelBuffer;
    var unitBuffer = new Uint8Array(pxBuffer);
    for (var j = 0, l = unitBuffer.length; j < l; j++) {
      data[currentByte++] = unitBuffer[j];
    }
  }

  // Dispatch
  chrome.sockets.udp.send(
    DisplayController.socketId, 
    buffer, 
    UdpConfig.udpManagerIP,
    UdpConfig.udpManagerPort, 
    function(result) {
      if (chrome.runtime.lastError) { /* Ignore */ }
    });
};

/**
 * Parses incoming UDP packets from display units and power units and distributes them to the
 * correct unit number.
 */
DisplayController.messageHandler = function(info) {
  var headerLength = PacketBuilder.rxHeaderLength;
  
  if (info && info.socketId && info.data) {
    // Extract data
    var data_8 = info.data.slice(0);
    var data_8v = new Uint8Array(data_8);

    // Map address to display / power unit by IP address
    var displayUnitNumber = DisplayController.displayUnitIPMap[info.remoteAddress];
    var powerUnitNumber = DisplayController.powerUnitIPMap[info.remoteAddress];

    // If the emulator is being used, the unit number will be in the 2nd byte of the packet
    if (info.remoteAddress == UdpConfig.emulatorIP) {
      displayUnitNumber = data_8v[1];
      powerUnitNumber = data_8v[1];
    }

    // Handle display unit packet
    if (DisplayController.displayUnits[displayUnitNumber]) {
      // Route the data based on packet type (first byte)
      switch(data_8v[0]) {
        case PacketBuilder.commandFlags.rx_inputState: 
          DisplayController.displayUnits[displayUnitNumber].updateInputStates(data_8, headerLength);
          break;
        case PacketBuilder.commandFlags.rx_statusData:
          DisplayController.displayUnits[displayUnitNumber].updateStatus(data_8, headerLength);
          break;
      }
    }

    // Handle power unit packet
    if (DisplayController.powerUnits[powerUnitNumber]) {
      // Route the data based on packet type (first byte)
      switch (data_8v[0]) {
        case PacketBuilder.commandFlags.rx_powerData:
          DisplayController.powerUnits[powerUnitNumber].updateStatus(data_8v, headerLength);
          break;
      }
    }
  }
};

/**
 * Sets the enabled state for a given power unit in a given column
 */
DisplayController.setPowerUnitEnabled = function(unitNumber, column, enable) {
  var powerUnit = DisplayController.powerUnits[unitNumber];
  if (typeof powerUnit === 'undefined') {
    return;
  }

  powerUnit.setPowerUnitEnabled(column, enable);
};

/**
 * Sets dot correction values for a single given display unit. Returns a promise.
 */
DisplayController.setDisplayUnitDotCorrection = function(unitNumber, r, g, b) {
  var displayUnit = DisplayController.displayUnits[unitNumber];
  if (typeof displayUnit === 'undefined') {
    return null;
  }

  return displayUnit.setDotCorrection(r, g, b);
};

/**
 * Sets dot correction values for all display units. Returns an array of promises.
 */
DisplayController.setAllDisplayUnitsDotCorrection = function(r, g, b) {
  return DisplayController.displayUnits.map(function(displayUnit) {
    return displayUnit.setDotCorrection(r, g, b);
  });
};

/**
 * Sets calibration for a given display unit. Returns a promise.
 */
DisplayController.setDisplayUnitCalibration = function(unitNumber, calibration) {
  var displayUnit = DisplayController.displayUnits[unitNumber];
  if (typeof displayUnit === 'undefined') {
    return null;
  }

  return displayUnit.setCalibration(calibration);
};

/**
 * Sets calibration for all display units. Returns an array of promises.
 */
DisplayController.setAllDisplayUnitsCalibration = function(calibration) {
  return DisplayController.displayUnits.map(function(displayUnit) {
    return displayUnit.setCalibration(calibration);
  });
};

/**
 * Starts a UDP receiver, using UdpConfig for the settings
 */
function startUDPReceiver() {
  console.log('DisplayController: Listening on port: ', UdpConfig.controllerPort);

  // Open listeners on '0.0.0.0', which accepts packets from all local network interfaces
  chrome.sockets.udp.create(function(socketInfo) {
    chrome.sockets.udp.onReceive.addListener(DisplayController.messageHandler.bind(DisplayController));
      
    chrome.sockets.udp.bind(socketInfo.socketId, '0.0.0.0', UdpConfig.controllerPort, function(result) {
      if (result < 0) {
        console.error('DisplayController: Could not bind to listen! Port:', UdpConfig.controllerPort);
      }
    });
  });
}

/**
 * Starts a UDP transmitter. Returns a promise which resolves when the socket binding is completed.
 */
function startUDPSender() {
  return new Promise(function(resolve, reject) {
    chrome.sockets.udp.create(function(socketInfo) {
      DisplayController.socketId = socketInfo.socketId;

      chrome.sockets.udp.bind(DisplayController.socketId, '0.0.0.0', 0, function(result) {
        if (result < 0) {
          console.error('DisplayController: Could not bind for sending!');
          reject();
          return;
        }

        resolve();
      });
    });
  });
}