/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/license-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the license.
 */


var anypixel = require('anypixel');
var ctx = anypixel.canvas.getContext2D();

var colors = ['#F00', '#0F0', '#00F'];

/**
 * Listen for onButtonDown events and draw a 2x2 rectangle at the event site
 */
document.addEventListener('onButtonDown', function(event) {
	ctx.fillStyle = colors[Math.floor(Math.random() * 3)];
	ctx.fillRect(event.detail.x - 1, event.detail.y - 1, 2, 2);
});