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

var DisplayConfig = require('../../config/config.display');
var DisplayController = require('./display-controller');
var PacketBuilder = require('../../config/packets/packet-builder');
var CalibrationData = require('./calibration/calibration-data');
var DotCorrectionData = require('./calibration/dot-correction-data');
var DisplayUnitInputPacket = require('../../config/packets/display-unit-input-packet');
var DisplayUnitStatusPacket = require('../../config/packets/display-unit-status-packet');

var UPTIME_ALERT_TIMEOUT = 10000;

/**
 * Class which manages the status and communication for a single display unit.
 *
 * The UI for this class is provided by ui/display-unit-modal.js and ui/display-unit-list.js
 */
var DisplayUnit = module.exports = function(ipAddress, port, unitNumber) {
  this.ipAddress      = ipAddress;
  this.port           = port;
  this.unitNumber     = unitNumber;
  this.RGBArray       = null;
  this.row            = null;
  this.col            = null;
  this.inputStates    = [];
  this.pixelBuffer    = null;
  this.healthStatuses = [];
  this.lastUptimes    = [];

  // Initialize input state array with zeros
  for (var i = 0; i < DisplayConfig.pixelsPerUnit; i++) {
    this.inputStates.push(0);
  }

  // Initialize the healthy status array with false
  for (var i = 0; i < DisplayConfig.boardsPerUnit; i++) {
    this.healthStatuses.push(false);
  }

  // Initialize the last uptimes array with zeros
  for (var i = 0; i < DisplayConfig.boardsPerUnit; i++) {
    this.lastUptimes.push(0);
  }
};

DisplayUnit.statusUpdateEvent = 'displayUnitStatusUpdate';

/**
 * Parse input state update packets and notify the current app of any state changes
 */
DisplayUnit.prototype.updateInputStates = function(buffer, headerLength) {
  var full_packet = new Uint8Array(buffer);
  var packet = full_packet.slice(headerLength, full_packet.length);
  var changedInputs = DisplayUnitInputPacket.parse(packet, this.inputStates);

  if (changedInputs.length) {
    var packetLength = DisplayUnitInputPacket.rxPacketLength * changedInputs.length + 1;
    var data_8 = new ArrayBuffer(packetLength);
    var data_8v = new Uint8Array(data_8);
    var currentByte = 0;

    data_8v[currentByte++] = DisplayUnitInputPacket.rxHeader;

    // Get pixel location for each changed input
    for (var i = 0; i < changedInputs.length; i++) {
      var position = DisplayConfig.unitPixelToRowCol(this.unitNumber, changedInputs[i].index);
      data_8v[currentByte++] = position[0];
      data_8v[currentByte++] = position[1];
      data_8v[currentByte++] = changedInputs[i].state;
    }

    require('./app-controller').sendMessage(data_8);
  }
}

/**
 * Parse a display unit status packet and notify the display controller of a status change
 */
DisplayUnit.prototype.updateStatus = function(buffer, headerLength) {
  // Drop header
  var full_packet = new Uint8Array(buffer);
  var packet = full_packet.slice(headerLength, full_packet.length);
  var status = DisplayUnitStatusPacket.parse(packet, this.unitNumber);

  // Create status update event
  var statusUpdateEvent = new CustomEvent(DisplayUnit.statusUpdateEvent, {
    'detail': {
      unitNumber: this.unitNumber,
      status: status
    }
  });

  status.uptime.forEach(function(t, i) {
    this.healthStatuses[i] = t - this.lastUptimes[i] < UPTIME_ALERT_TIMEOUT;
    this.lastUptimes[i] = t;
  }, this);

  // Dispatch status update event
  document.dispatchEvent(statusUpdateEvent);
};

/**
 * Returns true if all display boards are healthy
 */
DisplayUnit.prototype.isHealthy = function() {
  for (var i = 0; i < this.healthStatuses.length; i++) {
    if (!this.healthStatuses[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Clears the pixel arrays
 */
DisplayUnit.prototype.clearPixelArray = function() {
  this.RGBArray = [];
  this.RGBArrayPacked = [];
};

/**
 * Adds a given color to the pixel array
 */
DisplayUnit.prototype.addPixel = function(r, g, b) {
  this.RGBArray.push(r);
  this.RGBArray.push(g);
  this.RGBArray.push(b);
};

/**
 * Creates and saves a packet containing the pixel data from the current frame
 */
DisplayUnit.prototype.savePixelPacket = function() {
  this.RGBArrayPacked = this.RGBArray;
  
  // Create pixel data buffer
  var data_8 = new ArrayBuffer(this.RGBArrayPacked.length);
  var data_8v = new Uint8Array(data_8);
  
  // Add the pixels
  for (var i = 0; i < this.RGBArrayPacked.length; i++) {
    data_8v[i] = this.RGBArrayPacked[i];
  }

  // Build the packet
  var packet = PacketBuilder.buildTxPacket({
    commandFlag   : PacketBuilder.commandFlags.tx_8BitColor,
    unitNumber    : this.unitNumber,
    sequenceNumber: 0,
    ipAddress     : this.ipAddress,
    port          : this.port,
    payload       : data_8
  });

  // Save the packet
  this.pixelBuffer = packet;
};

/**
 * Sets the given dot correction values. Returns a promise which resolves when the data is sent.
 * 
 * See /calibration/dot-correction-data.js for more info about dot correction.
 */
DisplayUnit.prototype.setDotCorrection = function(r, g, b) {
  return new Promise(function(resolve, reject) {
    var packet = PacketBuilder.buildTxPacket({
      commandFlag   : PacketBuilder.commandFlags.tx_8BitDotCorrection,
      unitNumber    : this.unitNumber,
      sequenceNumber: 0,
      ipAddress     : this.ipAddress,
      port          : this.port,
      payload       : DotCorrectionData.buildPayloadFromData(r, g, b)
    });

    this.sendMessage(packet);
    
    setTimeout(function() {
      resolve();
    }.bind(this), 100);

  }.bind(this));
};

/**
 * Sets the calibration data for this display unit. Returns a promise which resolves when all the
 * calibration data packets have been sent. Each calibration table index is sent out sequentially,
 * with a short delay between each one.
 */
DisplayUnit.prototype.setCalibration = function(calibration) {
  var perPacketDelayMs = 33;

  // Returns a promise which resolves after a given amount of time in milliseconds
  function delay(ms) {
    return new Promise(function (resolve, reject) {
      setTimeout(resolve, ms);
    });
  }

  function sendCalibration() {
    var promises = [];
    for (var i = 0; i < calibration.length; i++) {
      var tableData = calibration[i];
      promises.push(new Promise(function(resolve, reject) {
      
        // Create the packet    
        var packet = PacketBuilder.buildTxPacket({
          commandFlag   : PacketBuilder.commandFlags.tx_12BitCalLookup,
          unitNumber    : this.unitNumber,
          sequenceNumber: 0,
          ipAddress     : this.ipAddress,
          port          : this.port,
          tableEntry    : i, 
          payload       : CalibrationData.buildPayloadFromData(tableData),
        });

        // Send with a small delay
        delay(i * perPacketDelayMs).then(function() {
          this.sendMessage(packet);
          resolve();
        }.bind(this));

      }.bind(this)));
    }
    return Promise.all(promises);
  }

  return new Promise(function(resolve, reject) {
    sendCalibration.call(this).then(function() {
      setTimeout(function() {
        resolve();
      }, perPacketDelayMs); 
    }.bind(this));
  }.bind(this));
};

/**
 * Transmits a given data packet to the unit's ip address uver UDP
 */
DisplayUnit.prototype.sendMessage = function(data) {
  if (DisplayController.socketId) {
    chrome.sockets.udp.send(
      DisplayController.socketId, 
      data, 
      this.ipAddress, 
      this.port, 
      function(result) {
        if (chrome.runtime.lastError) { /* Ignore */ }
      });
  }
};