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

var PacketBuilder = module.exports = {};

/**
 * Byte order for the transmitting packet header
 */
var txHeaderStructure = {
  'command_flag'   : 0,
  'reserved'       : [1, 2, 3, 4, 5, 6, 7],
  'table_entry'    : 6,
  'unit_number'    : 8,
  'sequence_number': 9,
  'ip_address'     : [10, 11, 12, 13],
  'port'           : [14, 15]
};

/**
 * Byte order for the recieving packet header
 */
var rxHeaderStructure = {
  'command_flag': 0,
  'unit_number' : 1,
  'reserved'    : [2, 3]
};

/**
 * Length of a transmitting packet header
 */
PacketBuilder.txHeaderLength = 16;

/**
 * Length of a recieving packet header
 */
PacketBuilder.rxHeaderLength = 4;

/**
 * Map of command names to command flag values. 
 * Transmit (tx) data is sent out from chromebridge to the controller boards. Recieve (rx) data
 * is sent from the controller boards to chromebridge. 
 *
 * For more details see the packet documentation: 
 * https://github.com/googlecreativelab/anypixel/wiki/Communications-Packets
 */
PacketBuilder.commandFlags = {
  tx_8BitColor:          0x01, // Set 8-bit color
  tx_12BitCalLookup:     0x05, // Set 12-bit cal lookup table
  tx_8BitDotCorrection:  0x06, // Set 8-bit dot correction
  tx_relayControl:       0x10, // Set relay enable
  req_reboot:            0xF0, // Request board reboots
  rx_inputState:         0x20, // Input states
  rx_statusData:         0x21, // Display status data
  rx_powerData:          0x22, // Power status data
  rx_12BitCalLookup:     0x23  // 12-bit cal lookup table data
};

/**
 * Constructs a packet for transmitting data to the control boards. 
 * 
 * Required parameters are:
 *   commandFlag - flag used to determine the packet's function
 *   unitNumber - id number of the target display unit
 *   ipAddress - ip address of the target display unit
 *   port - output port
 *   payload - payload data to append after the header
 *
 * Optional parameters are:
 *   tableEntry - calibration table index, used by the tx_12BitCalLookup command
 */
PacketBuilder.buildTxPacket = function(params) {
  params = getVerifiedParams(params);

  // Initialize the header with zeros
  var header = [];
  for (var i = 0; i < PacketBuilder.txHeaderLength; i++) {
    header.push(0);
  }

  // Set the initial pieces
  header[txHeaderStructure['command_flag']] = params.commandFlag;
  header[txHeaderStructure['unit_number']] = params.unitNumber;
  header[txHeaderStructure['sequence_number']] = 0;

  // Add the table entry parameter, if it exists
  if (params.hasOwnProperty('table_entry')) {
    header[txHeaderStructure['table_entry']] = params.tableEntry;
  }

  // Split the IP address into 4 separate octets
  if (params.ipAddress !== null && typeof params.ipAddress == 'string') {
    var ipBytes = params.ipAddress.split('.').map(function(octet, i) { 
      return parseInt(octet); 
    });
    
    // Put each octet into the correct place in the header
    for (var i = 0; i < 4; i++) {
      header[txHeaderStructure['ip_address'][i]] = ipBytes[i];
    }
  }

  // Mask and shift to split port into 2 bytes
  if (params.port !== null && typeof params.port == 'number') {
    header[txHeaderStructure['port'][0]] = (params.port >> 8) & 0xFF;
    header[txHeaderStructure['port'][1]] = params.port & 0xFF;
  }

  // Create a viewer for the payload data
  var payloadData_8v = new Uint8Array(params.payload)

  // Create an array for the full packet
  var fullPacketData_8 = new ArrayBuffer(header.length + payloadData_8v.length);
  var fullPacketData_8v = new Uint8Array(fullPacketData_8);
  var currentByte = 0;

  // Add the header
  header.forEach(function(data) {
    fullPacketData_8v[currentByte++] = data;
  });

  // Add the payload
  payloadData_8v.forEach(function(data) {
    fullPacketData_8v[currentByte++] = data;
  });

  return fullPacketData_8;
}

/**
 * Constructs a packet recieved from the control boards.
 * 
 * Required parameters are:
 *   commandFlag - flag used to determine the packet's function
 *   payload - payload data to append after the header
 *
 * Optional parameters are:
 *   unitNumber - id number of the packet's source control board
 */
PacketBuilder.buildRxPacket = function(params) {
  params = getVerifiedParams(params);

  // Initialize the hader with zeros
  var header = [];
  for (var i = 0; i < PacketBuilder.rxHeaderLength; i++) {
    header.push(0);
  }

  // Set the command flag and unit number. If no unit number is provided, default to zero.
  header[rxHeaderStructure['command_flag']] = params.commandFlag;
  header[rxHeaderStructure['unit_number']] = params.unitNumber;

  // Create a viewer for the payload data
  var payloadData_8v = new Uint8Array(params.payload);

  // Create an array for the full packet
  var fullPacketData_8 = new ArrayBuffer(header.length + payloadData_8v.length);
  var fullPacketData_8v = new Uint8Array(fullPacketData_8);
  var currentByte = 0;

  // Add the header
  header.forEach(function(data) {
    fullPacketData_8v[currentByte++] = data;
  });

  // Add the payload
  payloadData_8v.forEach(function(data) {
    fullPacketData_8v[currentByte++] = data;
  });

  return fullPacketData_8;
}

/**
 * Returns a verified set of packet parameters. Throws an error if verification fails.
 */
function getVerifiedParams(params) {
  if (params == null || params.commandFlag == null || params.commandFlag === undefined) {
    throw 'Packet: Invalid packet';
  }

  // Check the header flag
  if (typeof params.commandFlag === 'number') {
    // Keep as is
  } else if (typeof params.commandFlag === 'string' && PacketBuilder.commandFlags[params.commandFlag]) {
    params.commandFlag = PacketBuilder.commandFlags[params.commandFlag];
  } else {
    throw 'Packet: Invalid commandFlag';
  }

  // Check the unit number, default to zero if none is specified
  if (params.unitNumber === undefined) {
    params.unitNumber = 0;
  }

  return params;
}
