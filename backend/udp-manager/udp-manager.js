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

var dgram = require('dgram');
var DisplayConfig = require('../config/config.display');
var PacketBuilder = require('../config/packets/packet-builder');
var udpConfig = require('../config/config.udp');

// Create 2 datagram clients (receive, send)
var server = dgram.createSocket('udp4');
var client = dgram.createSocket('udp4');

// Define UDP listener
server.on('listening', function() {
  console.log('UDP Manager | Started on port ' + server.address().port);
});

// Parse incoming messages and send them off to the correct location
server.on('message', function(message, remote) {
  if (message && message.length > 0) {
    // Parse the buffer
    var data8v = new Uint8Array(message);

    switch (message[0]) {
      // 8-bit data
      case 1:
        // header + number of pixels, with 3 channels each
        var packetLength = (DisplayConfig.pixelsPerUnit * 3) + PacketBuilder.txHeaderLength; 
        var numPackets = data8v.length / packetLength;
        splitAndSend(message, packetLength, numPackets);
        break;

      // 12-bit data
      case 2:
        // 12-bit data occupies 1.5 8-bit bytes
        var packetLength = (DisplayConfig.pixelsPerUnit * 3 * 1.5) + PacketBuilder.txHeaderLength;
        var numPackets = data8v.length / packetLength;
        splitAndSend(message, packetLength, numPackets);
        break;
    }
  }
});

// Start listening for bundled packets
server.bind(udpConfig.udpManagerPort, udpConfig.packetBundleIP);

/**
 * Splits up a bundled packet into individual packets and sends them to the specified IP address
 * contained in the packet header
 */
function splitAndSend(data, packetLength, numPackets) {
  var packets = [];
  
  for (var i = 0; i < numPackets; i++) {
    packets.push(data.slice(i * packetLength, (i * packetLength) + packetLength));
  }

  for (var i = 0; i < packets.length; i++) {
    var ip = packets[i][10] + '.' + packets[i][11] + '.' + packets[i][12] + '.' + packets[i][13];
    var port = (packets[i][14] << 8) + packets[i][15];
    sendPacket(packets[i], ip, port);
  }
}

/**
 * Sends a given data packet to a given ip, on a given port
 */
function sendPacket(data, ip, port) {
  client.send(data, 0, data.length, port, ip, function(err, bytes) {});
}