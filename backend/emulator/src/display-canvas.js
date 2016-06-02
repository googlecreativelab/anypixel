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

var config = require('../../config/config.display');
var renderCanvas = require('./render-canvas');

/**
 * The display canvas is used to render an enlarged view of the render canvas, and is what the user
 * will see in the chrome app itself.
 */
var displayCanvas = module.exports = {};

displayCanvas.dimensions = {
  displayUnitSize: 0,
  pixelSize: 0,
  margin: 12,
}

displayCanvas.buttonStateChangeEvent = 'buttonStateChange';

displayCanvas.drawGridLines = true;
displayCanvas.drawUnitNumbers = true;

/**
 * Creates the display canvas and adds mouse and window resize listeners
 */
displayCanvas.init = function() {
  displayCanvas.el = document.getElementById('display-canvas');
  displayCanvas.el.addEventListener('mousedown', onMouseDown);
  displayCanvas.el.addEventListener('mouseup', onMouseUp);
  displayCanvas.ctx = displayCanvas.el.getContext('2d');
  displayCanvas.ctx.imageSmoothingEnabled = false;
  window.addEventListener('resize', onResize);
  onResize();
}

/**
 * Updates the canvas by drawing the render canvas at full size, along with grid lines if requested.
 */
displayCanvas.update = function() {
  displayCanvas.ctx.fillStyle = '#000';
  displayCanvas.ctx.fillRect(0, 0, displayCanvas.el.width, displayCanvas.el.height);
	displayCanvas.ctx.drawImage(renderCanvas.el, 0, 0, displayCanvas.el.width, displayCanvas.el.height);

  if (displayCanvas.drawUnitNumbers) {
    drawUnitNumbers();
  }
  
  if (displayCanvas.drawGridLines) {  
    plotUnitGrid();

    displayCanvas.ctx.lineWidth = 4;
    displayCanvas.ctx.strokeStyle = '#000';
    displayCanvas.ctx.stroke();

    displayCanvas.ctx.lineWidth = 2;
    displayCanvas.ctx.strokeStyle = '#FFF';
    displayCanvas.ctx.stroke();
  }
}

/**
 * Plots a set of paths used for drawing the display unit row and column lines
 */
function plotUnitGrid() {
  var p = displayCanvas.dimensions.displayUnitSize;

  displayCanvas.ctx.beginPath();

  // Plot columns
  for (var i = 1; i < config.unitCols; i++) {
    displayCanvas.ctx.moveTo(p * i, 0);  
    displayCanvas.ctx.lineTo(p * i, displayCanvas.el.height);
  }

  // Plot rows
  for (var i = 1; i < config.unitRows; i++) {
    displayCanvas.ctx.moveTo(0, p * i);
    displayCanvas.ctx.lineTo(displayCanvas.el.width, p * i);
  }
}

/**
 * Draws the display unit number in the corner of each display unit
 */
function drawUnitNumbers() {
  var p = displayCanvas.dimensions.displayUnitSize;

  for (var row = 0; row < config.unitRows; row++) {
    for (var col = 0; col < config.unitCols; col++) {
      var x = col * p;
      var y = row * p;
      var unitNumber = config.rowColToUnitNumber(row, col);
      displayCanvas.ctx.fillStyle = '#000';
      displayCanvas.ctx.fillRect(x, y, 24, 24);
      displayCanvas.ctx.fillStyle = '#FFF';
      displayCanvas.ctx.font = '12px monospace';
      displayCanvas.ctx.fillText(unitNumber, x + 5, y + 15);
    }
  }
}

/**
 * Listener for window resize events. Resizes the canvas and adjusts the display unit and pixel size
 */
function onResize() {
	var windowWidth = window.innerWidth - (displayCanvas.dimensions.margin * 2);
	displayCanvas.dimensions.displayUnitSize = windowWidth / config.unitCols;
	displayCanvas.dimensions.pixelSize = displayCanvas.dimensions.displayUnitSize / (config.boardCols * config.boardsPerUnitCols);
	displayCanvas.el.width = displayCanvas.dimensions.displayUnitSize * config.unitCols;
  displayCanvas.el.height = displayCanvas.dimensions.displayUnitSize * config.unitRows;
  displayCanvas.ctx.imageSmoothingEnabled = false;
	displayCanvas.ctx.fillStyle = '#000';
  displayCanvas.ctx.fillRect(0, 0, displayCanvas.el.width, displayCanvas.el.height);
}

/**
 * Listener for mouse down events. Calculates the pixel position and dispatches a state change event
 */
function onMouseDown(e) {
  dispatchButtonEvent(e, 1);
}

/**
 * Listener for mouse up events. Calculates the pixel position and dispatches a state change event.
 */
function onMouseUp(e) {
  dispatchButtonEvent(e, 0);
}

/**
 * Dispatches a button state change event from a given event object and state value.
 */
function dispatchButtonEvent(e, state) {
  var unitRowCol = mouseOffsetToUnitRowCol(e.offsetX, e.offsetY);
  var unitNumber = config.rowColToUnitNumber(unitRowCol.row, unitRowCol.col);
  var buttonId = mouseOffsetToButtonId(e.offsetX, e.offsetY, unitRowCol.row, unitRowCol.col);

  var buttonStateChangeEvent = new CustomEvent(displayCanvas.buttonStateChangeEvent, {
    'detail': {
      unitNumber: unitNumber,
      buttonId: buttonId,
      state: state
    }
  });

  document.dispatchEvent(buttonStateChangeEvent);
}

/**
 * Maps a given x and y coordinate to a display unit row and column
 */
function mouseOffsetToUnitRowCol(x, y) {
  return {
    'col': Math.floor(x / displayCanvas.dimensions.displayUnitSize),
    'row': Math.floor(y / displayCanvas.dimensions.displayUnitSize)
  }
}

/**
 * Maps a given x and y mouse coordiante and a unit row and column number to a button ID number
 */
function mouseOffsetToButtonId(x, y, unitRow, unitCol) {
  x = Math.floor(x / displayCanvas.dimensions.pixelSize);
  y = Math.floor(y / displayCanvas.dimensions.pixelSize);

  x -= config.boardCols * config.boardsPerUnitCols * unitCol;
  y -= config.boardRows * config.boardsPerUnitRows * unitRow;

  return x + y * (config.boardRows * config.boardsPerUnitRows);
}