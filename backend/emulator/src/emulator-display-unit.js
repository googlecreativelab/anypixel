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
var PowerConfig = require('../../config/config.power');
var PacketBuilder = require('../../config/packets/packet-builder');
var displayCanvas = require('./display-canvas');

/**
 * Class which emulates a hardware display unit. Like the hardware display unit, the emulated 
 * version recieves UDP packets and acts on them. It also transmits simulated status information,
 * and will respond accurately to losing power.
 */
var EmulatorDisplayUnit = module.exports = function(port, unitNumber, controllerPort, powerUnit) {
  this.port = port;
  this.controllerPort = controllerPort;
  this.unitNumber = unitNumber;
  this.powerUnit = powerUnit;
  this.socketIdSender = null;
  this.position = { x: 0, y: 0 };
  this.rowcol = null;
  this.buttonStates = [];
  this.needToSendButtonStates = false;
  this.imageData = null;
  this.statusInterval = 0;
  this.temperatures = [];
  this.macAddresses = [];
  this.startTime = Infinity;
  this.uptime = 0;
};

/**
 * Starts the UDP sender and sets up intervals for sending input and board status information
 */
EmulatorDisplayUnit.prototype.initialize = function() {
  this.startUDPSender();
  this.rowcol = DisplayConfig.unitNumberToGlobalUnitRowCol(this.unitNumber);
  this.relayCol = PowerConfig.unitColToRelayCol(this.rowcol[1]);
  this.position.x = this.rowcol[1];
  this.position.y = this.rowcol[0];

  this.startTime = Date.now();

  // Set default button states
  for (var i = 0; i < DisplayConfig.pixelsPerUnit; i++) {
    this.buttonStates[i] = 0;
  }

  // Generate random MAC addresses, one for each board
  for (var i = 0; i < DisplayConfig.boardsPerUnit; i++) {
    this.macAddresses.push(generateMACAddress().split(':'));
  }

  // Send button states every 33ms
  setInterval(this.sendButtons.bind(this), 33);
  
  // Send status updates every 1 second
  setInterval(this.sendStatusUpdate.bind(this), 1000); 

  // Listen for button state change events
  document.addEventListener(displayCanvas.buttonStateChangeEvent, this.onButtonStateChange.bind(this));
};

/**
 * Creates a UDP socket for sending unit status information
 */
EmulatorDisplayUnit.prototype.startUDPSender = function() {
  chrome.sockets.udp.create(function(socket_info) {
    this.socketIdSender = socket_info.socketId;
    chrome.sockets.udp.bind(this.socketIdSender, '0.0.0.0', 0, function(result) { /* Ignore */ });
  }.bind(this));
};

/**
 * Handler for incoming pixel data. Stores the data in an ImageData object if the unit has power,
 * otherwise it stores black to simulate being "off".
 */
EmulatorDisplayUnit.prototype.pixelHandler = function(data) {
  // Verify packet header type
  if (data[0] != 1) {
    console.error('Emulator: Unrecognized data:', data);
    return;
  }

  var data_8 = new Uint8ClampedArray(DisplayConfig.pixelsPerUnit * 4);

  var r, g, b, a;

  // Render the actual pixel data if this unit is getting power, otherwise render black
  if (this.powerUnit.status['relay'][this.relayCol] > 0) {
    for (var i = 16, j = 0; i < data.length;) {
      r = data_8[j++] = data[i++];
      g = data_8[j++] = data[i++];
      b = data_8[j++] = data[i++];
      a = data_8[j++] = 255;

      // Compute the simulated temperature value for this pixel
      var avg = (r + g + b) / 3;
      var avgNormalized = avg / 255;
      this.temperatures[j / 4] = 70 + avgNormalized * 50;
    }
  } else {
    for (var i = 16, j = 0; i < data.length; i += 3) {
      r = data_8[j++] = 0;
      g = data_8[j++] = 0;
      b = data_8[j++] = 0;
      a = data_8[j++] = 255;
      this.temperatures[j / 4] = 70;
    }
  }

  var dataWidth = DisplayConfig.boardCols * DisplayConfig.boardsPerUnitCols;
  var dataHeight = DisplayConfig.boardRows * DisplayConfig.boardsPerUnitRows;
  this.imageData = new ImageData(data_8, dataWidth, dataHeight);
};

/**
 * Listener for button state change events. If the event is for this unit, check if the state is
 * different and request an update if it is.
 */
EmulatorDisplayUnit.prototype.onButtonStateChange = function(e) {
  if (e.detail.unitNumber == this.unitNumber) {
    if (this.buttonStates[e.detail.buttonId] != e.detail.state) {
      this.buttonStates[e.detail.buttonId] = e.detail.state;
      this.needToSendButtonStates = true;
    }
  }
}

/**
 * Create and send a button status change packet if the update flag is set
 */
EmulatorDisplayUnit.prototype.sendButtons = function() {
  if (!this.needToSendButtonStates) {
    return;
  }

  // Prepare button state packet. Each button state is represented by a single bit, so the total
  // number of bytes required is the number of buttons divided by 8 bits in a byte.
  var packetLength = Math.ceil(DisplayConfig.pixelsPerUnit / 8);
  var data_8 = new ArrayBuffer(packetLength); 
  var data_8v = new Uint8Array(data_8);
  
  // Iterate through all buttons and set the applicable bit in the byte
  for (var i = 0; i < this.buttonStates.length; i++) {
    var button_byte = Math.floor(i / 8);
    var button_bit = 8 - ((i % 8) + 1);
    data_8v[button_byte] += this.buttonStates[i] << (button_bit);
  }

  // Create the packet
  var packet = PacketBuilder.buildRxPacket({
    commandFlag: PacketBuilder.commandFlags.rx_inputState,
    unitNumber: this.unitNumber,
    payload: data_8
  });

  // Send packet and clear the flag when completed
  chrome.sockets.udp.send(
    this.socketIdSender, 
    packet, 
    '127.0.0.1', 
    this.controllerPort, 
    function(result) {
      this.needToSendButtonStates = false;
    }.bind(this));
};

/**
 * Send emulated status information. This includes tpixel temperatures, fan speeds, MAC addresses,
 * and uptime values.
 */
EmulatorDisplayUnit.prototype.sendStatusUpdate = function() {
  var packetLength = 
    this.temperatures.length + 
    DisplayConfig.boardsPerUnit + 
    (this.macAddresses.length * 6) +
    (DisplayConfig.boardsPerUnit * 4) +
    DisplayConfig.boardsPerUnit;
  var data_8 = new ArrayBuffer(packetLength);
  var data_8v = new Uint8Array(data_8);
  var b = 0;

  this.uptime = Date.now() - this.startTime;

  // Set temperatures, one for each pixel
  this.temperatures.forEach(function(temp) {
    data_8v[b++] = temp;
  });

  // Set fan rpms, one for each board
  for (var i = 0; i < DisplayConfig.boardsPerUnit; i++) {
    data_8v[b++] = 128;
  }

  // Set MAC addresses, one for each board
  this.macAddresses.forEach(function(macAddress) {
    macAddress.forEach(function(octet) {
      data_8v[b++] = parseInt('0x' + octet);
    });
  });

  // Set uptime, one for each board
  for (var i = 0; i < DisplayConfig.boardsPerUnit; i++) {
    data_8v[b++] = (this.uptime & 0xFF000000) >> 24;
    data_8v[b++] = (this.uptime & 0x00FF0000) >> 16;
    data_8v[b++] = (this.uptime & 0x0000FF00) >> 8;
    data_8v[b++] = (this.uptime & 0x000000FF);
  }

  // Set average temperatures, one for each bord
  for (var i = 0; i < DisplayConfig.boardsPerUnit; i++) {
    data_8v[b++] = 83;
  }

  // Create the packet
  var packet = PacketBuilder.buildRxPacket({
    commandFlag: PacketBuilder.commandFlags.rx_statusData,
    unitNumber: this.unitNumber,
    payload: data_8
  });

  // Send packet
  chrome.sockets.udp.send(
    this.socketIdSender,
    packet,
    '127.0.0.1',
    this.controllerPort,
    function(result) { /* Ignore */ });
}

/**
 * Returns a randomly-generated MAC address string
 */
function generateMACAddress() {
  return 'XX:XX:XX:XX:XX:XX'.replace(/X/g, function() {
    return '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16));
  });
}
