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
 * IP and port configurations for the physical display. The addresses are defined 3 rows of 10.
 */
var PhysicalConfig = module.exports = {

  unitAddresses: [
    [
      {ip: '192.168.0.20', port: 7},
      {ip: '192.168.0.21', port: 7},
      {ip: '192.168.0.22', port: 7},
      {ip: '192.168.0.23', port: 7},
      {ip: '192.168.0.24', port: 7},
      {ip: '192.168.0.25', port: 7},
      {ip: '192.168.0.26', port: 7},
      {ip: '192.168.0.27', port: 7},
      {ip: '192.168.0.28', port: 7},
      {ip: '192.168.0.29', port: 7}
    ],
    [
      {ip: '192.168.0.30', port: 7},
      {ip: '192.168.0.31', port: 7},
      {ip: '192.168.0.32', port: 7},
      {ip: '192.168.0.33', port: 7},
      {ip: '192.168.0.34', port: 7},
      {ip: '192.168.0.35', port: 7},
      {ip: '192.168.0.36', port: 7},
      {ip: '192.168.0.37', port: 7},
      {ip: '192.168.0.38', port: 7},
      {ip: '192.168.0.39', port: 7}
    ],
    [
      {ip: '192.168.0.40', port: 7},
      {ip: '192.168.0.41', port: 7},
      {ip: '192.168.0.42', port: 7},
      {ip: '192.168.0.43', port: 7},
      {ip: '192.168.0.44', port: 7},
      {ip: '192.168.0.45', port: 7},
      {ip: '192.168.0.46', port: 7},
      {ip: '192.168.0.47', port: 7},
      {ip: '192.168.0.48', port: 7},
      {ip: '192.168.0.49', port: 7}
    ]
  ],

  powerUnitAddresses: [
    {ip: '192.168.0.50', port: 7},
    {ip: '192.168.0.51', port: 7},
    {ip: '192.168.0.52', port: 7},
    {ip: '192.168.0.53', port: 7},
    {ip: '192.168.0.54', port: 7}
  ]
};