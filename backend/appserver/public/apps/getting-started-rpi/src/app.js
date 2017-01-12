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

var count = 0;
var downPosition = null;

setInterval(function(){
  // if button is down at (0, 0), keep showing red
  if(downPosition && downPosition.x === 0 && downPosition.y === 0){
    return;
  }
  // otherwise blink blue
  ctx.fillStyle = (count % 2 === 0) ? '#000' : '#00F';
  ctx.fillRect(0, 0, 20, 20);
  count++;
}, 1000);

/**
 * Listen for onButtonDown events and draw one red dot at the event site
 */
document.addEventListener('onButtonDown', function(event) {
  downPosition = event.detail;
  ctx.fillStyle = '#F00'; 
  ctx.fillRect(event.detail.x, event.detail.y, 20, 20);
});

document.addEventListener('onButtonUp', function(event){
  downPosition = null;
});