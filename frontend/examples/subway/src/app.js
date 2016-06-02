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


var anypixel = require('anypixel');
var data = require('./data');
var Snake = require('./snake');
var context = anypixel.canvas.getContext2D();
var dat = require('exdat');

var gui;

// ------------------------------------------------------------
// VARS
// ------------------------------------------------------------
var guiObject = {
	speed: 0.5,
	detourLength: 0.5
}

var LEFT_SIDE = 1;
var RIGHT_SIDE = 2;
var INC_W = anypixel.config.width;
var INC_H = anypixel.config.height;

// states
var IS_DRAWING_IN = 1;
var IS_PAUSED = 2;
var IS_DRAWING_OUT = 3;

var totalSnakes = 7;
var pathOrder = [];
var snakes;
var detourSnakes;
var colorCount = 0;
var snakeMode = IS_DRAWING_IN;
var snakeModeCount = 0;
var exploder = [0,0,0,0];
var TO_DEGREES = 180 / Math.PI;
var TO_RADIANS = Math.PI / 180;


// ------------------------------------------------------------
// EVENTS
// ------------------------------------------------------------
document.addEventListener('onButtonDown', function(event) {
	var pointId = event.detail.y*INC_W + event.detail.x;
	createDetour(pointId);
	exploder.push(pointId);
	exploder.shift();

	var id = 5739, inc = INC_W, index = 0;
	var isExploding = exploder[index++]==(id-=inc) && exploder[index++]==(id-=inc) && exploder[index++]==(id-=inc) && exploder[index++]==(id-=inc);
	if(isExploding){
		for(var j=0; j<500; j++){
			createDetour(Math.random()*INC_W*INC_H|0);
		}
	}
});

document.addEventListener('DOMContentLoaded', function() {

	// GUI
	gui = new dat.GUI();
	gui.add(guiObject, 'speed', 0, 2.0).step(0.00005).onChange(function(value) { 
		var snake;
		var detourSnake;
		var j;
		for(j=0; j<totalSnakes; j++){
			snakes[j].speed = value;
		}
		for(j=0; j<detourSnakes.length; j++){
			detourSnakes[j].speed = value;
		}
	});
	gui.add(guiObject, 'detourLength', 0, 1.0).step(0.00005);


	var i,j;
	var snake;
	snakes = [];
	detourSnakes = [];
	for(j=0; j<totalSnakes; j++){
		pathOrder.push(4);
		var prePath = [];
		for(i=0; i<4; i++){
			prePath.push(data.getPrePath([i*7+j]));
		}
		snake = new Snake({
			getSnakeMode:snakeMode,
			prePath:prePath,
			snakeHead:0,
			speed:guiObject.speed,
			count:0,
			color:data.getColor(j),
			id:j+1,
			isSnake:true
		});	
		snake.resetPath();
		snake.snakeLength = snake.prePathLength*1.0|0;
		snakes.push(snake);
	}

	window.requestAnimationFrame(update);
});

function onSnakeWaitComplete(){
	for(j=0; j<totalSnakes; j++){
		snake = snakes[j];
		snake.speed = guiObject.speed;
	}
}

function onSnakeDrawComplete(){
	for(j=0; j<totalSnakes; j++){
		snake = snakes[j];
		snake.resetPath();
		snake.speed = guiObject.speed;
	}
}

function onDetourFinished(snake){
	var index = detourSnakes.indexOf(snake);
	if (index > -1) {
		detourSnakes.splice(index, 1);
	}
}

// ------------------------------------------------------------
// METHODS
// ------------------------------------------------------------
function update(elapsedTime) {

	context.fillStyle = '#000';
	context.fillRect(0, 0, INC_W, INC_H);

	var snake;
	var detourSnake;
	var j;
	var speed;

	// check for completion of snake lines. If done, stay put
	if(snakeMode==IS_DRAWING_IN){
		var isDrawnCount = 0;
		for(j=0; j<totalSnakes; j++){
			snake = snakes[j];
			if(snake.isAtEdge && snake.speed != 0) {
				snake.speed = 0;
			}
			if(snake.speed == 0){
				isDrawnCount++;
			}
		}
		if(isDrawnCount==totalSnakes) {
			snakeMode = IS_PAUSED;
			snakeModeCount = 0;
		}

	// if all snake lines are done drawing add a little pause to keep the logo still
	} else if(snakeMode==IS_PAUSED){
		snakeModeCount++;
		if(snakeModeCount>=10) {
			snakeMode = IS_DRAWING_OUT;
			snakeModeCount = 0;
			onSnakeWaitComplete();
		}

	// when pause is done, restart snakes
	} else if(snakeMode==IS_DRAWING_OUT){
		if(snakeModeCount==0 || snakeModeCount==100 || snakeModeCount==200){
			createDetour(Math.random()*INC_W|0);
		}
		snakeModeCount++;
		var isDrawnCount = 0;
		for(j=0; j<totalSnakes; j++){
			snake = snakes[j];
			if(snake.isOffScreen && snake.speed != 0){
				snake.speed = 0;
			}
			if(snake.speed==0){
				isDrawnCount++;
			}
		}
		if(isDrawnCount==totalSnakes) {
			snakeMode = IS_DRAWING_IN;
			onSnakeDrawComplete();
		}

	}

	for(j=0; j<totalSnakes; j++){
		snake = snakes[j];
		snake.parse();
		snake.draw(context);
	}

	// adjust speed for large button events
	speed = (detourSnakes.length+1)/300 + 0.5;
	speed = ((speed*100) | 0) / 100;
	for(j=0; j<detourSnakes.length; j++){
		detourSnake = detourSnakes[j];

		if(!detourSnake.isOffScreen){
			detourSnake.speed = speed;
			detourSnake.parse();
			detourSnake.draw(context);
		};

	}

	for(j=0; j<detourSnakes.length; j++){
		if(detourSnake.isOffScreen){
			onDetourFinished(detourSnake);
		}
	}

	window.requestAnimationFrame(update);
}

function createDetour(cursorId) {

	var c = getPosition(cursorId); 			// cursor point
	// choose a snake based on approximation
	var selectedId = totalSnakes*c.x/INC_W|0;
	var selectedSnake = snakes[selectedId];
	var pathOrder = selectedSnake.pathOrder;
	pathOrder+=Math.random()*3|0;
	pathOrder%=4;

	var newPath = data.getPrePath([pathOrder*totalSnakes+selectedId]);
	var index = (Math.random()*newPath.length*0.5-2) | 0;
	var p2 = getPosition(newPath[index]); 
	var p2_1 = getPosition(newPath[index+1]); 
	var detourPath = getDetourData (c, p2, p2_1);
	var pathArray = newPath.slice(index,newPath.length);

	detourPath = detourPath.concat(pathArray);

	var detourSnake = new Snake({
		prePath:[detourPath,detourPath,detourPath,detourPath],
		snakeHead:0,
		speed:guiObject.speed,
		count:1,
		isDetour:true,
		color:data.getColor(colorCount)
	});

	detourSnake.resetPath();
	detourSnake.snakeLength = detourSnake.prePathLength*guiObject.detourLength|0;
	colorCount++;
	colorCount %= 4;
	detourSnakes.push(detourSnake);

}
function getDetourData(a,b,c){

	var detourPath = [];

	var bcDelta = {	x: (b.x - c.x), y: (b.y - c.y)	};
	var acDelta = {	x: (a.x - c.x), y: (a.y - c.y)	};
	pathIdSide = (cross(acDelta,bcDelta)>0) ? LEFT_SIDE:RIGHT_SIDE;
	degrees = (Math.atan2(bcDelta.y,bcDelta.x)*TO_DEGREES + 360) % 360;

	if(false) {
	} else if((degrees==0 || degrees==180) && pathIdSide==LEFT_SIDE) {
		detourPath = detourPath.concat( plotHorizontalPoints(a.x, a.y, (b.x-a.x)) );
		detourPath = detourPath.concat( plotVerticalPoints(b.x, a.y, (b.y-a.y)) );
	} else if((degrees==0 || degrees==180) && pathIdSide==RIGHT_SIDE) {
		detourPath = detourPath.concat( plotHorizontalPoints(a.x, a.y, (b.x-a.x)) );
		detourPath = detourPath.concat( plotVerticalPoints(b.x, a.y, (b.y-a.y)) );
	} else if((degrees==90 || degrees==270) && pathIdSide==LEFT_SIDE) {
		detourPath = detourPath.concat( plotVerticalPoints(a.x, a.y, (b.y-a.y)) );
		detourPath = detourPath.concat( plotHorizontalPoints(a.x, b.y, (b.x-a.x)) );
	} else if((degrees==90 || degrees==270) && pathIdSide==RIGHT_SIDE) {
		detourPath = detourPath.concat( plotVerticalPoints(a.x, a.y, (b.y-a.y)) );
		detourPath = detourPath.concat( plotHorizontalPoints(a.x, b.y, (b.x-a.x)) );
	} else if((degrees==135 || degrees==315) && pathIdSide==LEFT_SIDE) {
		detourPath = detourPath.concat( plotHorizontalPoints(a.x, a.y, (b.x-a.x)) );
		detourPath = detourPath.concat( plotVerticalPoints(b.x, a.y, (b.y-a.y)) );
	} else if((degrees==135 || degrees==315) && pathIdSide==RIGHT_SIDE) {
		detourPath = detourPath.concat( plotVerticalPoints(a.x, a.y, (b.y-a.y)) );
		detourPath = detourPath.concat( plotHorizontalPoints(a.x, b.y, (b.x-a.x)) );
	} else if((degrees==45 || degrees==225) && pathIdSide==LEFT_SIDE) {
		detourPath = detourPath.concat( plotVerticalPoints(b.x, a.y, (b.y-a.y)) );
		detourPath = detourPath.concat( plotHorizontalPoints(a.x, a.y, (b.x-a.x)) );
	} else if((degrees==45 || degrees==225) && pathIdSide==RIGHT_SIDE) {
		detourPath = detourPath.concat( plotHorizontalPoints(a.x, b.y, (b.x-a.x)) );
		detourPath = detourPath.concat( plotVerticalPoints(a.x, a.y, (b.y-a.y)) );
	}

	return detourPath;
}


function plotHorizontalPoints(x,y,width){
	var detour = [];
	var total = Math.abs(width)|0;
	if(width > 0) {
		for(var i=0; i<total; i++){
			detour.push(getId(x+i,y));
		}
	} else {
		for(var i=0; i<total; i++){
			detour.push(getId(x-i,y));
		}
	}
	return detour;
}

function plotVerticalPoints(x,y,height){
	var detour = [];
	var total = Math.abs(height)|0;
	if(height > 0) {
		for(var i=0; i<total; i++){
			detour.push(getId(x,y+i));
		}
	} else {
		for(var i=0; i<total; i++){
			detour.push(getId(x,y-i));
		}
	}
	return detour;
}


// ------------------------------------------------------------
// UTILITY
// ------------------------------------------------------------
function modPath(pathPosition, maxValue) {
	return (pathPosition+maxValue*1000000000000) % maxValue;
}

function getId(x,y) {
	return y*INC_W + x;
}

function getPosition(id) {
	return { x:getXPosition(id), y:getYPosition(id) }
}

function getXPosition(id) {
	return id%INC_W
}

function getYPosition(id) {
	return (id/INC_W) | 0;
}

function cross(a, b) {
  return (a.x * b.y - a.y * b.x);
}

document.onselectstart = function () { return false; }
