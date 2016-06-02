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

var DisplayConfig = require('../config.display');

var DisplayUnitStatusPacket = module.exports = {}

/**
 * Returns a status object from a given packet. If no packet is provided, return default data.
 */
DisplayUnitStatusPacket.parse = function(packet, unitNumber) { 
  var currentByte = 0;

  var temp = [],
      rpm = [],
      ids = [],
      uptime = [],
      newUptime = [],
      avgTemp = [];

  // Get individual pixel temperatures in degrees F 
  for (var i = 0; i < DisplayConfig.pixelsPerUnit; i++) {
    temp.push(packet[currentByte++]);
  }

  // Get fan RPM, one byte for each display board in the unit
  for (var i = 0; i < DisplayConfig.boardsPerUnit; i++) {
    rpm.push(packet[currentByte++]);
  }

  // Get unique IDs, 6 bytes for each display board in the unit
  for (var i = 0; i < DisplayConfig.boardsPerUnit; i++) {
    for (var j = 0; j < 6; j++) {
      ids.push(packet[currentByte++]);
    }
  }

  // Get uptime, 4 bytes for each display board in the unit
  for (var i = 0; i < DisplayConfig.boardsPerUnit; i++) {
    for (var j = 0; j < 4; j++) {
      uptime.push(packet[currentByte++]);
    }
  }

  // Get average temperatures in degrees F, one byte for each display board in the unit
  for (var i = 0; i < DisplayConfig.boardsPerUnit; i++) {
    avgTemp.push(packet[currentByte++]);
  }

  // The uptime is given as a 32-bit number spread over 4 bytes. Shift each byte into a single 
  // value to get the correct uptime value.
  for (var i = 0; i < DisplayConfig.boardsPerUnit * 4;) {
    var t = (uptime[i++] << 24) | (uptime[i++] << 16) | (uptime[i++] << 8) | uptime[i++];
    newUptime.push(t);
  }

  return status = {
    'pixelTemp': temp,
    'fanSpeed': rpm,
    'ids': ids,
    'uptime': newUptime,
    'avgTemp': avgTemp
  };
}

/**
 * Returns the default status object
 */
DisplayUnitStatusPacket.getDefault = function() {
  // Fill a Uint8Array with more than enough zeros to ensure that the byte counter will never exceed 
  // the packet size. Since the number of bytes in a real packet is determined by the number of 
  // pixels in a unit and the number of display boards in a unit, the size of empty packet is based 
  // on those two numbers.
  var numBytes = DisplayConfig.pixelsPerUnit * DisplayConfig.boardsPerUnit * 24;
  return DisplayUnitStatusPacket.parse(new Uint8Array(numBytes).fill(0));
}