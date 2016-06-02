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

var PowerConfig = require('../config.power');

var PowerUnitStatusPacket = module.exports = {}

/**
 * Returns a status object from a given packet. If no packet is provided, return default data.
 *
 * Mod Note: Our power units are set up to provide power for 2 columns of display units. Therefore,
 *           this is set up for interfacing with two 24v supplies, two 208v circuits, and two 
 *           control relays. If your setup is different, you'll need to adjust this class to
 *           accommodate those changes. 
 */
PowerUnitStatusPacket.parse = function(packet) { 
  var currentByte = 0;

  var status24v = [],
      statusAC = [],
      statusRelay = [];

  // Get 24v supply statuses
  for (var i = 0; i < PowerConfig.dcOutputsPerUnit; i++) {
    status24v.push(packet[currentByte++]);
  }

  // Get AC input statuses
  for (var i = 0; i < PowerConfig.acInputsPerUnit; i++) {
    statusAC.push(packet[currentByte++]);
  }

  // Get control relay statuses
  for (var i = 0; i < PowerConfig.controlRelaysPerUnit; i++) {
    statusRelay.push(packet[currentByte++]);
  }

  return status = {
    '24v': status24v,
    'ac': statusAC,
    'relay': statusRelay
  };
}

/**
 * Returns the default status object (everything ok)
 */
PowerUnitStatusPacket.getDefault = function() {
  // Fill a Uint8Array with more than enough ones to ensure that the byte counter will never exceed 
  // the packet size. 
  return PowerUnitStatusPacket.parse(new Uint8Array(100).fill(1));
}