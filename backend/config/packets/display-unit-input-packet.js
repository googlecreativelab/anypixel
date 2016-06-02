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

var DisplayUnitInputPacket = module.exports = {};

DisplayUnitInputPacket.rxHeader = 0;
DisplayUnitInputPacket.rxPacketLength = 3;

/**
 * Returns a array of changed button state object from a given packet. If no buttons have changed 
 * state, an empty array is returned.
 */
DisplayUnitInputPacket.parse = function(packet, inputStateList) {
  var currentByte = 0;
  
  var changedInputs = [];

  // Loop through each byte and see if its state has changed. Button states are encoded in multiple 
  // 8-bit bytes, each button corresponds to 1 bit.
  for (var i = 0; i < packet.length; i++) {
    for (var j = 0; j < 8; j++) {
      var inputIndex = i * 8 + j;

      // There may be some padding at the end, so make sure we stay in bounds
      if (inputIndex < DisplayConfig.pixelsPerUnit) {
        // Shift the requesite number of bits to get the one at index j
        var state = packet[i] & (1 << (7 - j)) ? 1 : 0;

        // Catch any changes
        if (state != inputStateList[inputIndex]) {
          inputStateList[inputIndex] = state;
          changedInputs.push({
            'index': inputIndex,
            'state': state
          });
        }
      }
    }  
  }

  return changedInputs;
}