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
 * Class which emulates a hardware power unit. Like the hardware power unit, the emulated 
 * version recieves UDP packets and acts on them. It also transmits simulated status information.
 */
var EmulatorPowerUnit = module.exports = function(port, unitNumber, controllerPort) {
	this.port = port;
	this.unitNumber = unitNumber;
	this.controllerPort = controllerPort;
	this.socketIdSender = null;
	this.status = null;
	this.statusInterval = 0;
	
	var bracketRowEl = document.getElementById('power-unit-bracket-row');
	var labelRowEl = document.getElementById('power-unit-label-row');

	var bracketCellEl = document.createElement('td');
	var bracketCellDiv = document.createElement('div');
	bracketCellDiv.classList.add('power-unit-bracket');
	bracketCellEl.appendChild(bracketCellDiv);
	bracketRowEl.appendChild(bracketCellEl);

	var labelCellEl = document.createElement('td');
	labelCellEl.textContent = 'Power Unit ' + (this.unitNumber + 1);
	labelRowEl.appendChild(labelCellEl);
}

/**
 * Starts the UDP sender and sets up default status information
 */
EmulatorPowerUnit.prototype.initialize = function() {
	this.startUDPSender();

	// Set default status (everything ok)
	this.status = PowerUnitStatusPacket.getDefault();

	// Send status updates every 1 second
  setInterval(this.sendStatusUpdate.bind(this), 1000); 
}

/**
 * Creates a UDP socket for sending unit status information
 */
EmulatorPowerUnit.prototype.startUDPSender = function() {
  chrome.sockets.udp.create(function(socket_info) {
    this.socketIdSender = socket_info.socketId;
    chrome.sockets.udp.bind(this.socketIdSender, '0.0.0.0', 0, function(result) { /* Ignore */ });
  }.bind(this));
};

/**
 * Create and send a status update packet
 */
EmulatorPowerUnit.prototype.sendStatusUpdate = function() {
	var data_8 = new ArrayBuffer(6 + 2 + 2);
	var data_8v = new Uint8Array(data_8);
	var b = 0;

	// 24v Supply Monitor 1: A, B, C
	data_8v[b++] = this.status['24v'][0];
	data_8v[b++] = this.status['24v'][1];
	data_8v[b++] = this.status['24v'][2];

	// 24v Supply Monitor 2: A, B, C
	data_8v[b++] = this.status['24v'][3];
	data_8v[b++] = this.status['24v'][4];
	data_8v[b++] = this.status['24v'][5];

	// AC Monitor: 1, 2
	data_8v[b++] = this.status['ac'][0];
	data_8v[b++] = this.status['ac'][1];

	// Relay: 1, 2
	data_8v[b++] = this.status['relay'][0];
	data_8v[b++] = this.status['relay'][1];

	// Create the packet
	var packet = PacketBuilder.buildRxPacket({
		commandFlag: PacketBuilder.commandFlags.rx_powerData,
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
 * Handler for relay control packets. Updates the relay status by parsing the given data packet.
 */
EmulatorPowerUnit.prototype.relayMessageHandler = function(data) {
	// Verify packet header type
	if (data[0] != PacketBuilder.commandFlags.tx_relayControl) {
		console.error('Emulator: Unrecognized data:', data);
		return;
	}

	this.status['relay'] = [
		data[PacketBuilder.txHeaderSize + 0],
		data[PacketBuilder.txHeaderSize + 1]
	];

	this.sendStatusUpdate();
}