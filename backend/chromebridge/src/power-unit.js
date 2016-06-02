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
var PowerUnitStatusPacket = require('../../config/packets/power-unit-status-packet');

/**
 * Class which manages the status and communication for a single power unit. 
 * 
 * Mod Note: Our power units are set up to provide power for 2 columns of display units. Therefore,
 *           this is set up for interfacing with two 24v DC supplies, two 208v AC circuits, and two 
 *           control relays. If your setup is different, you'll need to adjust this class to
 *           accommodate those changes. 
 *           
 * The UI for this class is provided by ui/power-unit-modal.js and ui/power-unit-list.js
 */
var PowerUnit = module.exports = function(ipAddress, port, unitNumber) {
  this.ipAddress   = ipAddress;
  this.port        = port;
  this.unitNumber  = unitNumber;
  this.relayStatus = [];
  this.isHealthy   = false;
}

PowerUnit.statusUpdateEvent = 'powerUnitStatusUpdate';

/**
 * Parse a power unit status packet and notify the display controller of a status change
 */
PowerUnit.prototype.updateStatus = function(buffer, headerLength) {
  var full_packet = new Uint8Array(buffer);

  // Drop header
  var packet = full_packet.slice(headerLength, full_packet.length);

  // Parse status
  var status = PowerUnitStatusPacket.parse(packet);
  this.relayStatus = status['relay'];

  // Create status update event
  var statusUpdateEvent = new CustomEvent(PowerUnit.statusUpdateEvent, {
    'detail': {
      unitNumber: this.unitNumber,
      status: status
    }
  });

  // Check health status
  this.isHealthy = 
    status['24v'][0] > 0 &&
    status['24v'][1] > 0 &&
    status['24v'][2] > 0 &&
    status['24v'][3] > 0 &&
    status['24v'][4] > 0 &&
    status['24v'][5] > 0 &&
    status['ac'][0] > 0 &&
    status['ac'][1] > 0 &&
    status['relay'][0] > 0 &&
    status['relay'][1] > 0;

  // Dispatch status update event
  document.dispatchEvent(statusUpdateEvent);
}

/**
 * Sets the power enabled state for a power unit in one of the two columns.
 */
PowerUnit.prototype.setPowerUnitEnabled = function(column, enabled) {
  var payloadSize = 2;
  var buffer = new ArrayBuffer(payloadSize); 
  var payload = new Uint8Array(buffer);

  // Payload
  var relay1_status = this.relayStatus[0] > 0;
  var relay2_status = this.relayStatus[1] > 0;
  
  if (column === 0) {
    relay1_status = enabled;
  } else {
    relay2_status = enabled;
  }

  payload[0] = relay1_status ? 0x10 : 0x00; // 0: off, non-zero: on
  payload[1] = relay2_status ? 0x10 : 0x00; // 0: off, non-zero: on

  // Create the packet
  var packet = PacketBuilder.buildTxPacket({
    commandFlag   : PacketBuilder.commandFlags.tx_relayControl,
    unitNumber    : this.unitNumber,
    sequenceNumber: 0,
    ipAddress     : this.ipAddress,
    port          : this.port,
    payload       : payload
  });

  // Send
  this.sendMessage(packet);
  console.log('PowerUnit', this.unitNumber + ': setting enabled - column', column, enabled);
}

/**
 * Transmits a given data packet to the unit's ip address uver UDP
 */
PowerUnit.prototype.sendMessage = function(data) {
  // Inline require to avoid a circular dependency
  var DisplayController = require('./display-controller');

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
}