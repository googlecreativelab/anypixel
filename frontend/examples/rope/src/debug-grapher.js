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
var colors = require('../third_party/colorbrewer/colors');

var DebugGrapher = module.exports = {};

var clearColor = '#f4f4f4';
var scale = 4;
var drawLabels = true;
var pathCanvas, pathCtx, graphCanvas, graphCtx;
var graphData = {};

/**
 * Sets up the path and graph canvases
 */
DebugGrapher.enable = function() {
	if (!pathCanvas && !graphCanvas) {
		pathCanvas = document.createElement('canvas');
		pathCanvas.width = anypixel.config.width * scale;
		pathCanvas.height = anypixel.config.height * scale;
		pathCanvas.style.zIndex = 100;
		pathCanvas.style.top = '18px';
		pathCanvas.style.left = '100px';
		pathCanvas.style.boxShadow = '0 2px 5px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12)';
		pathCanvas.id = 'path-debug';
		document.body.appendChild(pathCanvas);

		pathCtx = pathCanvas.getContext('2d');
		pathCtx.fillStyle = clearColor;
		pathCtx.fillRect(0, 0, pathCanvas.width, pathCanvas.height);

		graphCanvas = document.createElement('canvas');
		graphCanvas.width = anypixel.config.width * scale;
		graphCanvas.height = anypixel.config.height * scale;
		graphCanvas.style.zIndex = 100;
		graphCanvas.style.top = '18px';
		graphCanvas.style.left = (100 + parseInt(pathCanvas.width) + 18) + 'px';
		graphCanvas.style.boxShadow = '0 2px 5px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12)';
		graphCanvas.id = 'graph-debug';
		document.body.appendChild(graphCanvas);

		graphCtx = graphCanvas.getContext('2d');
		graphCtx.fillStyle = clearColor;
		graphCtx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);
	}
};

/**
 * Returns the height of the canvas
 */
DebugGrapher.getHeight = function() {
	return graphCanvas.height;
}

/**
 * Returns true if enabled
 */
DebugGrapher.isEnabled = function() {
	return pathCanvas && graphCanvas;
}

/**
 * Sets the canvas scale factor
 */
DebugGrapher.setScale = function(value) {
	scale = value;
	pathCanvas.width = anypixel.config.width * scale;
	pathCanvas.height = anypixel.config.height * scale;
	graphCanvas.width = anypixel.config.width * scale;
	graphCanvas.height = anypixel.config.height * scale;
	graphCanvas.style.left = (100 + pathCanvas.width + 18) + 'px';
}

/**
 * Sets whether or not to draw various labels
 */
DebugGrapher.setDrawLabels = function(value) {
	drawLabels = value;
}

/**
 * Updates a given graph field with given data
 */
DebugGrapher.updateGraphField = function(name, data) {
	graphData[name] = data;
}

/**
 * Draws all of the graphs contained in the graphData object
 */
DebugGrapher.drawGraphs = function() {
	if (graphCanvas) {
		Object.keys(graphData).forEach(function(key, i) {
			var data = graphData[key];
			graphCtx.beginPath();
			graphCtx.moveTo(0, graphCanvas.height);

			data.forEach(function(d, j, a) {
				graphCtx.lineTo(j / a.length * graphCanvas.width * 2 / 3, d);
			});

			graphCtx.lineWidth = 2;
			graphCtx.strokeStyle = graphCtx.fillStyle = colors[i % colors.length];
			graphCtx.stroke();

			graphCtx.fillRect(graphCanvas.width * 2 / 3 + 9, 9 + i * (12 + 6), 12, 12);
			graphCtx.font = '8px Verdana';
			graphCtx.fillStyle = '#666';
			graphCtx.fillText(key, graphCanvas.width * 2 / 3 + 9 + 12 + 6, 9 + 9 + i * (12 + 6)); 
		});
	}

	graphCtx.beginPath();
	graphCtx.moveTo(graphCanvas.width * 2 / 3, 0);
	graphCtx.lineTo(graphCanvas.width * 2 / 3, graphCanvas.height);
	graphCtx.lineWidth = 1;
	graphCtx.strokeStyle = '#CCC';
	graphCtx.stroke();
}

/**
 * Draws a given path as a 1px black line.
 */
DebugGrapher.drawPath = function(path) {
	if (pathCanvas) {
		pathCtx.beginPath();
		pathCtx.moveTo(path[0][0] * scale, path[0][1] * scale);

		for (var i = 1; i < path.length; i++) {
			pathCtx.lineTo(path[i][0] * scale, path[i][1] * scale);
		}

		pathCtx.lineWidth = 1;
		pathCtx.strokeStyle = '#000';
		pathCtx.stroke();
		pathCtx.closePath();

		if (drawLabels) {
			path.forEach(function(p, i){  
				pathCtx.beginPath();
				pathCtx.arc(p[0] * scale, p[1] * scale, 2, 0, 2 * Math.PI);
				pathCtx.fillStyle = '#F00';
				pathCtx.fill();
				pathCtx.font = '8px Verdana';
				pathCtx.fillText(i, p[0] * scale, p[1] * scale - 5);
			});
		}
	}
}

/**
 * Draws a given set of circles
 */
DebugGrapher.drawCircles = function(circles) {
	if (pathCanvas) {
		circles.forEach(function(c) {
			pathCtx.beginPath();
			pathCtx.arc(c.x * scale, c.y * scale, c.r * scale, 0, 2 * Math.PI);
			pathCtx.strokeStyle = '#CCC';
			pathCtx.lineWidth = 6;
			pathCtx.stroke();
		});
	}
}

/**
 * Draws a set of grouped points as 4x4 colored rectangles. Rectangle color is determined by the 
 * group's key number.
 */
DebugGrapher.drawGroups = function(groups) {
	if (pathCanvas) {
		for (var key in groups) {
			var group = groups[key];
			pathCtx.fillStyle = colors[parseInt(key) % colors.length];

			group.forEach(function(p) {
				pathCtx.fillRect(p.x * scale - 2, p.y * scale - 2, 4, 4);
			});
		}
	}
}

/**
 * Clears both canvases
 */
DebugGrapher.clear = function() { 
	if (pathCanvas) {
		pathCtx.fillStyle = clearColor;
		pathCtx.fillRect(0, 0, pathCanvas.width, pathCanvas.height);
	}

	if (graphCanvas) {
		graphCtx.fillStyle = clearColor;
		graphCtx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);
	}
}