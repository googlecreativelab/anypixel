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
 * Functions for managing communications between the current Anypixel app and ChromeBridge. This 
 * handles sending the canvas pixel data to ChromeBridge, and deals with messages sent from
 * ChromeBridge.
 */
var AnypixelApp = module.exports = {};

AnypixelApp.isReady = false;

AnypixelApp.appWindow = null;

AnypixelApp.appOrigin = null;

AnypixelApp.context = null;

AnypixelApp.canvas = null;

AnypixelApp.Events = {
  Ready       : 'buttonWallReady',
  ButtonStates: 'buttonStates',
};

/**
 * Sets the canvas to an element with a given id
 */
AnypixelApp.setCanvas = function(canvasId) {
  AnypixelApp.canvas = document.getElementById(canvasId);
  AnypixelApp.context = AnypixelApp.canvas.getContext('2d') || AnypixelApp.canvas.getContext('webgl');
};

/**
 * Listener for message received events. Parses incoming messages into js events and dispatches them.
 */
AnypixelApp.receiveMessage = function(event) {
  // If first message, dispatch the ready event
  if (!AnypixelApp.isReady) {
    console.log('Opened communication with the Chrome app.');

    // Save app parameters
    AnypixelApp.isReady = true;
    AnypixelApp.appWindow = event.source;
    AnypixelApp.appOrigin = event.origin;

    // Send the ready event
    document.dispatchEvent(new Event(AnypixelApp.Events.Ready));
  } else {
    // Parse message
    if (event && event.data) {
      var data8v = new Uint8Array(event.data);
      // Check message type
      var message_type = data8v[0];

      // Case: Button states
      if (message_type == 0) {
        // Parse button states and dispatch event with updates
        var buttonStates = [];
        for (var i = 1; i < data8v.length; i++) { // Skip first byte (header)
          var buttonData = {
            p: {
              y: data8v[i++],
              x: data8v[i++]
            },
            s: data8v[i]
          }

          buttonStates.push(buttonData);         
        }

        document.dispatchEvent(new CustomEvent(AnypixelApp.Events.ButtonStates, {
          'detail': buttonStates
        }));
      }
    }
  }
};

/**
 * Grabs the pixels from the canvas and sends them to the ChromeBridge app via postMessage()
 */
AnypixelApp.updateFrame = function() {
  // Verify that we have the Canvas context
  if (AnypixelApp.context === null) {
    return;
  }
    
  // Grab the raw pixel data from the 2d or 3d context
  var pixelData;
  if (this.context.readPixels) {
    pixelData = getPixels3D(AnypixelApp.canvas.width, AnypixelApp.canvas.height, AnypixelApp.context);
  } else {
    pixelData = getPixels2D(AnypixelApp.canvas.width, AnypixelApp.canvas.height, AnypixelApp.context);
  }

  // Convert the pixel data to an 8-bit ArrayBuffer
  var currentByte = 0;
  var data_8 = new ArrayBuffer(pixelData.length / 4 * 3 + 1); // From 4 channel to 3 channel + 1 header
  var data_8v = new Uint8Array(data_8);
  data_8v[currentByte++] = 0; // Header (0 = Pixel data)

  for (var i = 0, l = pixelData.length; i < l;) {
    data_8v[currentByte++] = pixelData[i++]; // r
    data_8v[currentByte++] = pixelData[i++]; // g
    data_8v[currentByte++] = pixelData[i++]; // b
    i++; // Ignore the alpha channel
  }

  // Send the pixel data
  this.sendMessage(data_8);
};

/**
 * Sends a given data packet to the ChromeBridge app
 */
AnypixelApp.sendMessage = function(data) {
  if (AnypixelApp.isReady === true) {
    AnypixelApp.appWindow.postMessage(data, AnypixelApp.appOrigin);
  } else {
    console.error('Cannot send message to Chrome wrapper app - communication channel has not yet been opened');
  }
};

/**
 * Returns an array of pixels from a 2d context
 */
function getPixels2D(w, h, ctx) {
  var pixels = ctx.getImageData(0, 0, w, h);
  return pixels.data;
}

/**
 * Returns an array of pixels from a 3d context. Due to webgl pixel ordering, the y-axis needs to be
 * flipped.
 */
function getPixels3D(w, h, ctx) {
  var buffer = new Uint8Array(w * h * 4);
  AnypixelApp.context.readPixels(0, 0, w, h, ctx.RGBA, ctx.UNSIGNED_BYTE, buffer);

  // Flip y-axis
  var buffer2 = new Uint8Array(w * h * 4);
  var bufferWidth = w * 4;
  for (var i = 0, l = buffer.length; i < l; i++) {
    var row = Math.floor(i / bufferWidth);
    var row2 = h - row - 1;
    var i2 = (i % bufferWidth) + (row2 * bufferWidth);
    buffer2[i2] = buffer[i];
  }

  return buffer2;
}
