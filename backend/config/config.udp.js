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

var UdpConfig = module.exports = {};

/**
 * The port used to communicate with the control boards
 */
UdpConfig.controllerPort = 27482;

/**
 * The port used to communicate with the udp manager
 */
UdpConfig.udpManagerPort = 27483;

/**
 * The udp manager's IP address
 */
UdpConfig.udpManagerIP = '127.0.0.1';

/**
 * The emulator's IP address
 */
UdpConfig.emulatorIP = '127.0.0.1';
