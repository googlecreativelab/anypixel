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

var Snake = exports = module.exports = function(arg) {
	// ------------------------------------------------------------
	// VARS
	// ------------------------------------------------------------
	var scope = this;
	var name = "Snake";
	arg = (arg) ? arg : {} ;

	this.id = arg.id ? arg.id : 0;
	this.snakeHead = arg.snakeHead ? arg.snakeHead : 0;
	this.isDetour = arg.isDetour ? arg.isDetour : false;
	this.count = arg.count ? arg.count : 0;
	this.prePath = arg.prePath;
	this.pathOrder = arg.pathOrder ? arg.pathOrder : 3;
	this.speed = arg.speed ? arg.speed : 0.5;
	this.color = arg.color ? arg.color : "#FFF";
	this.isSnake = arg.isSnake ? arg.isSnake : false;
	this.getSnakeMode = arg.getSnakeMode ? arg.getSnakeMode : null;

	this.path;
	this.prePathLength;
	this.snakeLength;
	this.isAtEdge;
	this.isOffScreen;

	this.INC_W = anypixel.config.width;
	this.INC_H = anypixel.config.height;

	// ------------------------------------------------------------
	// METHODS
	// ------------------------------------------------------------
	this.resetPath = function() {
		this.path = [];
		this.path = this.prePath[this.pathOrder];
		this.prePathLength = this.path.length;
		this.snakeLength = this.prePathLength;

		var emptyArray = [];
		for(var j=0; j<this.snakeLength; j++){
			emptyArray.push(-1);
		}
		this.path = this.path.concat(emptyArray);

		this.pathOrder++;
		this.pathOrder%=4;

		this.isAtEdge = false;
		this.isOffScreen = false;
		this.count = 0;
		this.snakeHead = this.count | 0;

	}

	this.parse = function(){

		this.isOffScreen = this.snakeHead-this.snakeLength >=(this.prePathLength-1);
		this.isAtEdge = (this.count > (this.prePathLength-1)) ;

		if(this.isOffScreen && this.speed==0){
			this.count = -1;
		}

		if(!this.isOffScreen && this.isAtEdge && this.speed==0){
			this.count = (this.prePathLength-1);
		}

	}
	
	this.draw = function(context){
		var maxPathLength = this.path.length;
		for(var i=0; i<this.snakeLength; i++){
			id = this.path[	this.modPath(this.snakeHead-i,maxPathLength)	];
			p = this.getPosition(id);
			context.fillStyle = this.color;
			context.fillRect( p.x, p.y, 1, 1);
		}

		if(this.id==3){
			this.count += (this.speed*2);
		} else {
			this.count += this.speed;
		}

		this.snakeHead = this.count | 0;
	}

	this.getIdFromIndex = function(id){
		return this.path[id];
	}

	this.modPath = function(pathPosition, maxValue) {
		return (pathPosition+maxValue*1000000000000) % maxValue;
	}

	this.getId = function(x,y) {
		return y*this.INC_W + x;
	}

	this.getPosition = function(id) {
		return { x:this.getXPosition(id), y:this.getYPosition(id) }
	}

	this.getXPosition = function(id) {
		return id%this.INC_W
	}

	this.getYPosition = function(id) {
		return (id/this.INC_W) | 0;
	}
}

Snake.prototype.constructor = Snake;