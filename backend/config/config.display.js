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
 * Configuration options and remapping functions for the hardware display. 
 * 
 * The display is made out of pixels, which are housed in display boards, which are housed in 
 * display units. Our display is configured with 7x7 pixels in each display board, and 2x2 display 
 * boards in each display unit. The full display consists of 3x10 display units.
 *
 * The remapping functions are used for converting between display unit numbers, unit column / row 
 * numbers, and pixel numbers.
 *
 * Mod Note: You should only need to change the hardcoded numerical values here, as the rest are 
 *           calculated automatically from those values.
 */
var DisplayConfig = dc = module.exports = {};

/**
 * Width of an individual display board, in pixels
 */
DisplayConfig.boardRows = 7;

/**
 * Height of an individual display board, in pixels
 */
DisplayConfig.boardCols = 7;

/**
 * Number of display boards per unit, horizontally. A unit is the set of display boards controlled 
 * by a single controller board. 
 */
DisplayConfig.boardsPerUnitCols = 2;

/**
 * Number of display boards per unit, vertically
 */
DisplayConfig.boardsPerUnitRows = 2;

/**
 * Number of units in the full display, horizontally. 
 */
DisplayConfig.unitCols = 10;

/**
 * Number of units in the display, vertically
 */
DisplayConfig.unitRows = 3;

/**
 * Full display width, in pixels
 */
DisplayConfig.cols = dc.unitCols * dc.boardsPerUnitCols * dc.boardCols;

/**
 * Full display height, in pixels
 */
DisplayConfig.rows = dc.unitRows * dc.boardsPerUnitRows * dc.boardRows;

/**
 * Number of units per pixel datagram packet
 */
DisplayConfig.displayUnitsPerPacket = dc.unitRows * dc.boardsPerUnitCols;

/**
 * Number of boards in a display unit
 */
DisplayConfig.boardsPerUnit = dc.boardsPerUnitRows * dc.boardsPerUnitCols;

/**
 * Total number of display units in the display
 */
DisplayConfig.numUnits = dc.unitCols * dc.unitRows;

/**
 * Total number of pixels in a display unit
 */
DisplayConfig.pixelsPerUnit = dc.boardRows * dc.boardCols * dc.boardsPerUnit;

/**
 * Returns the unit number which contains a given pixel. Pixels are numbered sequentially, from the
 * top left to the bottom right, in rows.
 */
DisplayConfig.pixelToUnit = function(px) {
  var matchRow = Math.floor(px / dc.cols);
  var matchCol = px % dc.cols;
  var unitCol = Math.floor(matchCol / (dc.boardsPerUnitCols * dc.boardCols));
  var unitRow = Math.floor(matchRow / (dc.boardsPerUnitRows * dc.boardRows));
  return unitRow * dc.unitCols + unitCol;
}

/**
 * Converts a unit-space pixel to a display-space row and column number. "Unit space" refers to a 
 * pixel number in a single display unit. "Display space" refers to a pixel number in the full
 * display.
 */
DisplayConfig.unitPixelToRowCol = function(unitNumber, pixelNumber) {
  var unitRow = Math.floor(unitNumber / dc.unitCols);
  var unitCol = unitNumber - (unitRow * dc.unitCols);
  var pixelRow = Math.floor(pixelNumber / (dc.boardCols * dc.boardsPerUnitCols));
  var pixelCol = pixelNumber - (pixelRow * (dc.boardCols * dc.boardsPerUnitCols));

  var overallRow = (unitRow * (dc.boardsPerUnitRows * dc.boardRows)) + pixelRow;
  var overallCol = (unitCol * (dc.boardsPerUnitCols * dc.boardCols)) + pixelCol;
  return [overallRow, overallCol];
}

/**
 * Returns the row and column location of a given pixel in unit space
 */
DisplayConfig.unitPixelToUnitRowCol = function(pixelNumber) {
  var row = Math.floor(pixelNumber / (dc.boardsPerUnitCols * dc.boardCols));
  var col = pixelNumber % (dc.boardsPerUnitRows * dc.boardRows);
  return [row, col];
}

/**
 * Returns the row and column of a given unit number
 */
DisplayConfig.unitNumberToGlobalUnitRowCol = function(unitNumber) {
  var col = unitNumber % dc.unitCols;
  var row = Math.floor(unitNumber / dc.unitCols);
  return [row, col];
}

/**
 * Returns the unit number for a given unit row and column
 */
DisplayConfig.rowColToUnitNumber = function(row, col) {
  return col + row * dc.unitCols;
}
