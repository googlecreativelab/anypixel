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

/**
 * IP and port configurations for the emulator. Since the emulator runs locally, the port number
 * is used to differentiate between units. The addresses are defined 3 rows of 10. 
 */
var EmulatorConfig = module.exports = {

  unitAddresses: [
    [
      {ip: '127.0.0.1', port: 3001},
      {ip: '127.0.0.1', port: 3002},
      {ip: '127.0.0.1', port: 3003},
      {ip: '127.0.0.1', port: 3004},
      {ip: '127.0.0.1', port: 3005},
      {ip: '127.0.0.1', port: 3006},
      {ip: '127.0.0.1', port: 3007},
      {ip: '127.0.0.1', port: 3008},
      {ip: '127.0.0.1', port: 3009},
      {ip: '127.0.0.1', port: 3010}
    ],
    [
      {ip: '127.0.0.1', port: 3011},
      {ip: '127.0.0.1', port: 3012},
      {ip: '127.0.0.1', port: 3013},
      {ip: '127.0.0.1', port: 3014},
      {ip: '127.0.0.1', port: 3015},
      {ip: '127.0.0.1', port: 3016},
      {ip: '127.0.0.1', port: 3017},
      {ip: '127.0.0.1', port: 3018},
      {ip: '127.0.0.1', port: 3019},
      {ip: '127.0.0.1', port: 3020}
    ],
    [
      {ip: '127.0.0.1', port: 3021},
      {ip: '127.0.0.1', port: 3022},
      {ip: '127.0.0.1', port: 3023},
      {ip: '127.0.0.1', port: 3024},
      {ip: '127.0.0.1', port: 3025},
      {ip: '127.0.0.1', port: 3026},
      {ip: '127.0.0.1', port: 3027},
      {ip: '127.0.0.1', port: 3028},
      {ip: '127.0.0.1', port: 3029},
      {ip: '127.0.0.1', port: 3030}
    ]
  ],

  powerUnitAddresses: [
    {ip: '127.0.0.1', port: 3031},
    {ip: '127.0.0.1', port: 3032},
    {ip: '127.0.0.1', port: 3033},
    {ip: '127.0.0.1', port: 3034},
    {ip: '127.0.0.1', port: 3035}
  ]
};