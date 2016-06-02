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
var config = anypixel.config;

var ctx = anypixel.canvas.getContext2D();;
ctx.imageSmoothingEnabled = false;

var pixel = ctx.createImageData(1, 1);
var pixelData = pixel.data;

var logo;

document.addEventListener('DOMContentLoaded', function() {
    logo = new Logo();

    fillBoxSetup();
    gridSetup();

    for (var y = 0; y < numRows; y++) {
        for (var x = 0; x < numColumns; x++) {
            rulesInit(x, y);
            guysInit(x, y);
        }
    }

	window.requestAnimationFrame(update);
}, false);


document.addEventListener('onButtonDown', function(e) {
	if (e.detail.x != null && e.detail.y != null) {
		console.log("DOWN " + e.detail.x + " " + e.detail.y);
		mainGrid[e.detail.x][e.detail.y].hovered = true;
		mainGrid[e.detail.x][e.detail.y].clicked = true;
		mainGrid[e.detail.x][e.detail.y].userclicked = true;
		
		if (mode != 0) {
			mode = 0;
			markTimeMode = time;
			console.log("mode: main");
		}

		if (e.detail.x == 0 && e.detail.y == 0) {
			debugCounter++;
			if (debugCounter >= debugCounterMax) {
				newChoice();
			}
			console.log("debug click: " + debugCounter);
		}

		markTimeButton = time;
		console.log("last button press: " + markTimeButton);						
	}
});

function newChoice() {
	mode = 1;
	markTimeMode = Date.now();
	markTimeBUtton = Date.now();
	choose++;
	if (choose > maxChoices) choose = 0;
	firstRun = true;
	console.log("debug: choose " + choose);
}

document.addEventListener('onButtonUp', function(e) {
	if (e.detail.x != null && e.detail.y != null) {
		console.log("UP " + e.detail.x + " " + e.detail.y);
		mainGrid[e.detail.x][e.detail.y].hovered = false;
		mainGrid[e.detail.x][e.detail.y].clicked = false;
		mainGrid[e.detail.x][e.detail.y].userclicked = false;
	}
});

function update(t) {
	time = Date.now();

	if (mode == 0 && time > markTimeMode + timeOutMode0) { // coming from main
		mode = 1; // -> going to attract
		markTimeMode = time;
		console.log("mode: attract");
	} else if (mode == 1 && time > markTimeMode + timeOutMode1) { // coming from logo
		mode = 2; // -> going to logo
		markTimeMode = time;
		console.log("mode: logo");
		logo.armed = true;
		logo.pass = 0;
	} else if (mode == 2 && time > markTimeMode + timeOutMode2) { // coming from attract
		mode = 1; // -> going to attract
		markTimeMode = time;
		console.log("mode: attract");
	}

	if (time > markTimeButton + timeOutButton) {
		firstRun = true;
	}

	if (firstRun) {
		fillBoxSetup();
		markTimeButton = time;
		debugCounter = 0;
		firstRun = false;
	}

    for (var y = 0; y < numRows; y++) {
        for (var x = 0; x < numColumns; x++) {
            var loc = x + (y * numColumns);
            rulesHandler(x, y);

            if (mode == 1) {
            	if (Math.random() < attractModeOnOdds) {
            		mainGrid[x][y].hovered = true;
            		mainGrid[x][y].clicked = true;
            	} 
            	if (Math.random() < attractModeOffOdds) {
            		mainGrid[x][y].hovered = false;
            		mainGrid[x][y].clicked = false;
            		mainGrid[x][y].userclicked = false;
            		mainGrid[x][y].kaboom = false;
            		mainGrid[x][y].lifeCounter = 0;
            	} 
            }

            if (mode == 2 && logo.armed) {
            	if (logo.pixelSet.has(loc)) {
            		if (logo.pass <= logo.passMax / 2) {
        				if (Math.random() < logo.passOdds) {
                			mainGrid[x][y].hovered = true;
                			mainGrid[x][y].clicked = true;
            			}
            		} else {
            			if (Math.random() < 2 * logo.passOdds) {
                			mainGrid[x][y].hovered = false;
                			mainGrid[x][y].clicked = false;	                			
                			mainGrid[x][y].userclicked = false;
            			}
					}
            	} else {
                	if (Math.random() < attractModeOnOdds) {
                		mainGrid[x][y].hovered = true;
                		mainGrid[x][y].clicked = true;
                	} 
                	if (Math.random() < attractModeOffOdds) {
                		mainGrid[x][y].hovered = false;
                		mainGrid[x][y].clicked = false;
                		mainGrid[x][y].userclicked = false;
                		mainGrid[x][y].kaboom = false;
                		mainGrid[x][y].lifeCounter = 0;
                	} 
            	}
            	if (y >= numRows - 1 && x >= numRows - 1) {
            		logo.pass++;
            		if (logo.pass > logo.passMax) logo.armed = false;
            	}
            }

            if (mainGrid[x][y] != null) {
                mainGrid[x][y].run();
        	}

        	pixelData[0] = mainGrid[x][y].fillColor[0];
			pixelData[1] = mainGrid[x][y].fillColor[1];
			pixelData[2] = mainGrid[x][y].fillColor[2];
			pixelData[3] = mainGrid[x][y].fillColor[3];
			ctx.putImageData(pixel, x, y);
        }
	}

	window.requestAnimationFrame(update);
}

// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ 

//---     MAIN CONTROLS     ---
// 0 main, 1 logo, 2 attract
var time = 0;

// ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~
var mode = 1;
var choose = 0;
var maxChoices = 2; //4; // 7;
var debugCounter = 0;
var debugCounterMax = 3;

var markTimeMode = 0;
var timeOutMode0 = 2000; // main
var timeOutMode1 = 5000; // attract
var timeOutMode2 = 10000; // logo

var attractModeOnOdds = 0.000005; // 0.000005

// this is what clears the screen after user timeout
var attractModeOffOdds = 0.05; // 0.005 // 0.65

var markTimeButton = 0;
var timeOutButton = 10000; // 5000
var firstRun = true;

// a starting point, if you want to avoid chain reactions: 0, 20, 100, 0.2
// first (Pittsburgh) test settings: 8, 35, 100, 0.2
// second (NYC) test settings: 0, 20, 85, 0.2
var delayCounter = 4;    // delays start of spread
var lifeCounter = 28;    // how long spread lasts
var respawnCounter = 85; // how long until retrigger
var globalChaos = 0.2;    // 0 = min, 1 = max
// ~ * ~ * ~ * ~ * ~ * ~ * ~ * ~

var sW = anypixel.config.width;
var sH = anypixel.config.height;

var numColumns, numRows;
var guyWidth, guyHeight, startX, startY;
var mainGrid = [];
var setRules = "";
var odds_X_Yplus1, odds_Xminus1_Y, odds_X_Yminus1, odds_Xplus1_Y, odds_Xplus1_Yplus1, odds_Xminus1_YminuX1, odds_Xplus1_Yminus1, odds_Xminus1_Yplus1;

function gridSetup() {
    numColumns = sW;
    numRows = sH;

    guyWidth = 1;
    guyHeight = 1;

    startX = 0;
    startY = 0;

    // make mainGrid a 2D array
    for (var i = 0; i < numColumns; i++) {
        var mg = [];
        for (var j = 0; j < numRows; j++) {
            var g = new GridGuy(startX, startY, guyWidth, guyHeight, setRules, globalChaos, delayCounter, lifeCounter, respawnCounter);
            mg.push(g);
        }
        mainGrid.push(mg);
    }
}

function rulesHandler(x, y) {
    if (mainGrid[x][y].switchArray[0]) {    // NWcorner
    	// do nothing
    } else if (mainGrid[x][y].switchArray[1]) {    // NEcorner
    	// do nothing
    } else if (mainGrid[x][y].switchArray[2]) {    // SWcorner
    	// do nothing
    } else if (mainGrid[x][y].switchArray[3]) {     // SEcorner
    	// do nothing
    } else if (mainGrid[x][y].switchArray[4]) {    //Nrow
    	// do nothing
    } else if (mainGrid[x][y].switchArray[5]) {    //Srow
    	// do nothing
    } else if (mainGrid[x][y].switchArray[6]) {    //Wrow
    	// do nothing
    } else if (mainGrid[x][y].switchArray[7]) {    //Erow
    	// do nothing
    } else { // everything else
        if (mainGrid[x][y].clicked) {
            //these are direction probabilities
            mainGrid[x][y + 1].kaboom = rollDice(odds_X_Yplus1);
            mainGrid[x - 1][y].kaboom = rollDice(odds_Xminus1_Y);
            mainGrid[x][y - 1].kaboom = rollDice(odds_X_Yminus1);
            mainGrid[x + 1][y].kaboom = rollDice(odds_Xplus1_Y);
            mainGrid[x + 1][y + 1].kaboom = rollDice(odds_Xplus1_Yplus1);
            mainGrid[x - 1][y - 1].kaboom = rollDice(odds_Xminus1_YminuX1);
            mainGrid[x + 1][y - 1].kaboom = rollDice(odds_Xplus1_Yminus1);
            mainGrid[x - 1][y + 1].kaboom = rollDice(odds_Xminus1_Yplus1);
        }

	    if (mainGrid[x][y].userclicked) {
	        if (mainGrid[x][y + 1].kaboom) mainGrid[x][y + 1].userclicked = true;;
            if (mainGrid[x - 1][y].kaboom) mainGrid[x - 1][y].userclicked = true;;
            if (mainGrid[x][y - 1].kaboom) mainGrid[x][y - 1].userclicked = true;;
            if (mainGrid[x + 1][y].kaboom) mainGrid[x + 1][y].userclicked = true;;
            if (mainGrid[x + 1][y + 1].kaboom) mainGrid[x + 1][y + 1].userclicked = true;
            if (mainGrid[x - 1][y - 1].kaboom) mainGrid[x - 1][y - 1].userclicked = true;
            if (mainGrid[x + 1][y - 1].kaboom) mainGrid[x + 1][y - 1].userclicked = true;
            if (mainGrid[x - 1][y + 1].kaboom) mainGrid[x - 1][y + 1].userclicked = true;     		
	    }    
    }
}

function rollDice(v1) {
    if (Math.random() <= v1) {
        return true;
    } else {
        return false;
    }
}

function rulesInit(x, y) {
    setRules = "";
    if (x == 0 && y == 0) {
        setRules = "NWcorner";
    } else if (x == numColumns - 1 && y == 0) {
        setRules = "NEcorner";
    } else if (x == 0 && y == numRows - 1) {
        setRules = "SWcorner";
    } else if (x == numColumns - 1 && y == numRows - 1) {
        setRules = "SEcorner";
    } else if (y == 0) {
        setRules = "Nrow";
    } else if (y == numRows - 1) {
        setRules = "Srow";
    } else if (x == 0) {
        setRules = "Wrow";
    } else if (x == numColumns - 1) {
        setRules = "Erow";
    }
}

function guysInit(x, y) {
    mainGrid[x][y] = new GridGuy(startX, startY, guyWidth, guyHeight, setRules, globalChaos, delayCounter, lifeCounter, respawnCounter);
    if (startX < anypixel.config.width - guyWidth) {
        startX += guyWidth;
    } else {
        startX = guyWidth / 2;
        startY += guyHeight;
    }
}

function resetAll() {
    startX = 0;
    startY = 0;
    currentFrame = 0;
    for (var y = 0; y < numRows; y++) {
        for (var x = 0; x < numColumns; x++) {
            mainGrid[x][y].hovered = false;
            mainGrid[x][y].clicked = false;
            mainGrid[x][y].userclicked = false;
            mainGrid[x][y].kaboom = false;
            mainGrid[x][y].delayCountDown = mainGrid[x][y].delayCountDownOrig;
            mainGrid[x][y].lifeCountDown = mainGrid[x][y].lifeCountDownOrig;
            mainGrid[x][y].respawnCountDown = mainGrid[x][y].respawnCountDownOrig;
            mainGrid[x][y].fillColor = mainGrid[x][y].fillColorOrig;
        }
    }
}

// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~

var randomValues = new Array(8);

function fillBoxSetup() {
	for (var i = 0; i < randomValues.length; i++) {
		randomValues[i] = Math.random();
	}

	choose = Math.floor(Math.random() * maxChoices);
	console.log("choose: " + choose);
	
	if (choose == 0) { 
		// 0. CROSS | OK
	    odds_Xminus1_YminuX1 = 0;//randomValues[0]; // x-1 y-1
	    odds_X_Yminus1 = 0.5;//randomValues[1]; // x y-1
	    odds_Xplus1_Yminus1 = 0;//randomValues[2]; // x+1 y-1
	    odds_Xminus1_Y = 0.5;//randomValues[3]; // x-1 y
	    odds_Xplus1_Y = 0.5;//randomValues[4]; // x+1 y
	    odds_Xminus1_Yplus1 = 0;//randomValues[5]; // x-1 y+1
	    odds_X_Yplus1 = 0.5;//randomValues[6]; // x y+1
	    odds_Xplus1_Yplus1 = 0;//randomValues[7]; // x+1 y+1			
	//} else if (choose == 1) { 
		// 1. OCEAN | OK
	    //odds_Xminus1_YminuX1 = 0;//randomValues[0]; // x-1 y-1
	    //odds_X_Yminus1 = 0;//randomValues[1]; // x y-1
	    //odds_Xplus1_Yminus1 = 0.1 * randomValues[2]; // x+1 y-1
	    //odds_Xminus1_Y = randomValues[3]; // x-1 y
	    //odds_Xplus1_Y = randomValues[4]; // x+1 y
	    //odds_Xminus1_Yplus1 = 0.1 * randomValues[5]; // x-1 y+1
	    //odds_X_Yplus1 = 0;//randomValues[6]; // x y+1
	    //odds_Xplus1_Yplus1 = 0;//randomValues[7]; // x+1 y+1				
	} else if (choose == 1) { //2) { 
		// 2. MOUNTAINS
	    odds_Xminus1_YminuX1 = 0;//randomValues[0]; // x-1 y-1
	    odds_X_Yminus1 = 0.1;//randomValues[1]; // x y-1
	    odds_Xplus1_Yminus1 = 0;//randomValues[2]; // x+1 y-1
	    odds_Xminus1_Y = 0;//randomValues[3]; // x-1 y
	    odds_Xplus1_Y = 0;//randomValues[4]; // x+1 y
	    odds_Xminus1_Yplus1 = randomValues[5]; // x-1 y+1
	    odds_X_Yplus1 = 0.5;//randomValues[6]; // x y+1
	    odds_Xplus1_Yplus1 = randomValues[7]; // x+1 y+1	
	} // else { 
		// 3. DROPS
	    //odds_Xminus1_YminuX1 = 0;//randomValues[0]; // x-1 y-1
	    //odds_X_Yminus1 = 0;//randomValues[1]; // x y-1
	    //odds_Xplus1_Yminus1 = 0;//randomValues[2]; // x+1 y-1
	    //odds_Xminus1_Y = 0;//randomValues[3]; // x-1 y
	    //odds_Xplus1_Y = 0;//randomValues[4]; // x+1 y
	    //odds_Xminus1_Yplus1 = 0.1 * randomValues[5]; // x-1 y+1
	    //odds_X_Yplus1 = 1;//randomValues[6]; // x y+1
	    //odds_Xplus1_Yplus1 = 0.1 * randomValues[7]; // x+1 y+1	
	//}
}

function randomRange (min, max) {
	return Math.random() * (max - min) + min;
}

// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ 

function GridGuy(x, y, w, h, s, cc, dc, lc, rc) {
	// ~ ~ ~ colors ~ ~ ~ 
	this.c_white = [255, 255, 255, 255];
	this.c_black = [0, 0, 0, 255];
	this.c_red = [255, 0, 0, 255];
	this.c_green = [0, 255, 0, 255];
	this.c_blue = [0, 0, 255, 255];
	this.c_pink = [255, 0, 255, 255];
	this.c_yellow = [255, 190, 50, 255];
	this.c_gray50 = [50, 50, 50, 255];
	this.c_gray60 = [60, 60, 60, 255];
	this.c_gray70 = [70, 70, 70, 255];
	this.c_gray80 = [80, 80, 80, 255];
	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~

    this.debugColors = false;
    this.strokeLines = false;

    this.rulesArray = [ "NWcorner", "NEcorner", "SWcorner", "SEcorner", "Nrow", "Srow", "Wrow", "Erow" ];

    this.switchArray = [ false, false, false, false, false, false, false, false ];

    this.strokeColor = this.c_black;
    this.fillColorOrig = this.c_black;
    this.fillColor = this.fillColorOrig;
    
    this.fillColorArray = [
      this.c_red, this.c_green, this.c_blue, this.c_pink, this.c_gray50, this.c_gray60, this.c_gray70, this.c_gray80
    ];
    
    this.hoveredColor = this.c_red;
    this.clickedColor = this.c_white;

    this.hovered = false;
    this.clicked = false;
    this.userclicked = false;
    this.kaboom = false;

    this.posX = Math.floor(x);
    this.posY = Math.floor(y);
    this.guyWidth = w;
    this.guyHeight = h;
    this.applyRule = s;

    this.chaos = Math.abs(1.0 - cc);
    this.delayCountDownOrig = Math.floor(randomRange(dc * this.chaos, dc));
    this.delayCountDown = this.delayCountDownOrig;
    this.lifeCountDownOrig = Math.floor(randomRange(lc * this.chaos, lc));
    this.lifeCountDown = this.lifeCountDownOrig;
    this.respawnCountDownOrig = Math.floor(randomRange(rc * this.chaos, rc));
    this.respawnCountDown = this.respawnCountDownOrig;
    
    for (var i = 0; i < this.rulesArray.length; i++) {
        if (this.applyRule == this.rulesArray[i]) {
            this.switchArray[i] = true;
        }
    }

    this.strokeLines = true;
}

GridGuy.prototype.run = function() {
    this.update();
    this.draw();
}

GridGuy.prototype.update = function() {
    if (this.hovered && this.clicked) {
        this.mainFire();
    }

    if (this.kaboom) {
        if (this.delayCountDown > 0) {
            this.delayCountDown--;
        } else {
            this.kaboom = false;
            this.clicked = true;
            this.delayCountDown = this.delayCountDownOrig;
        }
    }

    if (this.clicked || this.userclicked) {
        if (this.lifeCountDown > 0) {
            this.lifeCountDown--;
        } else {
            this.clicked = false;
            this.userclicked = false;
            this.fillColor = this.fillColorOrig;
        }
    }

    if (this.lifeCountDown == 0 && this.respawnCountDown > 0) {
        this.respawnCountDown--;
    } else if (this.respawnCountDown == 0) {
        this.lifeCountDown = this.lifeCountDownOrig;
        this.respawnCountDown = this.respawnCountDownOrig;
    }

    if (this.userclicked) {
    	//
    }    
}

GridGuy.prototype.mainFire = function() {
    this.clicked = true;
    this.kaboom = false;
    this.delayCountDown = this.delayCountDownOrig;
    this.lifeCountDown = this.lifeCountDownOrig;
    this.respawnCountDown = this.respawnCountDownOrig;
}

GridGuy.prototype.draw = function() {
    this.fillColor = this.fillColorOrig;

    if (this.debugColors) {
        for (var i = 0; i < this.switchArray.length; i++) {
            if (this.switchArray[i]) {
                this.fillColor = this.fillColorArray[i];
            }
        }
    }

    if (this.strokeLines) {
    	//
    }

    if (this.clicked) {
       	this.fillColor = this.c_white;

       	if (this.userclicked) {
       		this.fillColor = this.c_white;
       	}
    }
}

GridGuy.prototype.drawRect = function() {
	//
}

GridGuy.prototype.highlight = function(c1, c2) {
    return [ c1[0] + c2[0], c1[1] + c2[1], c1[2] + c2[2], c1[3]  + c2[3] ];
}

GridGuy.prototype.hitDetect = function(x1, y1, w1, h1, x2, y2, w2, h2) { // float x1, float y1, float w1, float h1, float x2, float y2, float w2, float h2
    w1 /= 2;
    h1 /= 2;
    w2 /= 2;
    h2 /= 2; 
    if (x1 + w1 >= x2 - w2 && x1 - w1 <= x2 + w2 && y1 + h1 >= y2 - h2 && y1 - h1 <= y2 + h2) {
        return true;
    } else {
        return false;
    }
}

// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ 

class Logo {

    constructor() {
    	this.armed = true;
    	this.pass = 0;
    	this.passMax = 100000;
    	this.passOdds = 0.01;

        this.pixels = [
			731, 732, 733, 734, 867, 868, 869, 870, 871, 872, 873, 874, 875, 876, 877, 878, 939, 940, 941, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015, 1016, 1017, 1018, 1019, 1079, 1080, 1081, 1144, 1145, 1146, 1147, 1148, 1149, 1150, 1151, 1154, 1155, 1156, 1157, 1158, 1219, 1220, 1221, 1283, 1284, 1285, 1286, 1287, 1288, 1359, 1360, 1361, 1422, 1423, 1424, 1425, 1426, 1499, 1500, 1501, 1561, 1562, 1563, 1564, 1565, 1639, 1640, 1641, 1700, 1701, 1702, 1703, 1704, 1779, 1780, 1781, 1840, 1841, 1842, 1843, 1919, 1920, 1921, 1931, 1932, 1980, 1981, 1982, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2047, 2048, 2059, 2060, 2061, 2062, 2069, 2070, 2071, 2072, 2073, 2074, 2075, 2120, 2121, 2122, 2149, 2150, 2151, 2152, 2153, 2154, 2155, 2156, 2157, 2158, 2167, 2168, 2169, 2170, 2171, 2172, 2173, 2174, 2175, 2176, 2185, 2186, 2187, 2188, 2189, 2190, 2191, 2192, 2193, 2194, 2199, 2200, 2201, 2202, 2207, 2208, 2209, 2210, 2211, 2212, 2213, 2214, 2215, 2216, 2217, 2259, 2260, 2261, 2262, 2274, 2275, 2276, 2277, 2278, 2279, 2280, 2281, 2282, 2283, 2288, 2289, 2290, 2291, 2292, 2293, 2294, 2295, 2296, 2297, 2298, 2299, 2306, 2307, 2308, 2309, 2313, 2314, 2315, 2316, 2317, 2323, 2324, 2325, 2326, 2327, 2328, 2329, 2330, 2331, 2332, 2333, 2334, 2335, 2339, 2340, 2341, 2342, 2347, 2348, 2349, 2350, 2351, 2352, 2353, 2354, 2355, 2356, 2357, 2358, 2399, 2400, 2401, 2402, 2413, 2414, 2415, 2416, 2417, 2418, 2419, 2420, 2421, 2422, 2423, 2427, 2428, 2429, 2430, 2431, 2436, 2437, 2438, 2439, 2440, 2445, 2446, 2447, 2448, 2454, 2455, 2456, 2457, 2463, 2464, 2465, 2466, 2471, 2472, 2473, 2474, 2475, 2479, 2480, 2481, 2482, 2486, 2487, 2488, 2489, 2495, 2496, 2497, 2498, 2539, 2540, 2541, 2542, 2553, 2554, 2555, 2556, 2557, 2558, 2559, 2560, 2561, 2562, 2563, 2566, 2567, 2568, 2569, 2570, 2578, 2579, 2580, 2584, 2585, 2586, 2587, 2596, 2597, 2598, 2602, 2603, 2604, 2605, 2612, 2613, 2614, 2615, 2619, 2620, 2621, 2622, 2626, 2627, 2628, 2629, 2636, 2637, 2638, 2639, 2680, 2681, 2682, 2693, 2694, 2695, 2696, 2697, 2698, 2699, 2700, 2701, 2702, 2703, 2706, 2707, 2708, 2719, 2720, 2724, 2725, 2726, 2737, 2738, 2739, 2742, 2743, 2744, 2752, 2753, 2754, 2755, 2759, 2760, 2761, 2762, 2765, 2766, 2767, 2768, 2774, 2775, 2776, 2777, 2778, 2779, 2820, 2821, 2822, 2823, 2841, 2842, 2846, 2847, 2848, 2859, 2860, 2864, 2865, 2866, 2877, 2878, 2879, 2882, 2883, 2884, 2893, 2894, 2895, 2899, 2900, 2901, 2902, 2905, 2906, 2907, 2911, 2912, 2913, 2914, 2915, 2916, 2917, 2918, 2960, 2961, 2962, 2963, 2981, 2982, 2986, 2987, 2988, 2998, 2999, 3000, 3003, 3004, 3005, 3006, 3017, 3018, 3019, 3022, 3023, 3024, 3033, 3034, 3035, 3039, 3040, 3041, 3042, 3045, 3046, 3047, 3048, 3049, 3050, 3051, 3052, 3053, 3054, 3055, 3101, 3102, 3103, 3120, 3121, 3122, 3126, 3127, 3128, 3138, 3139, 3140, 3143, 3144, 3145, 3146, 3156, 3157, 3158, 3159, 3162, 3163, 3164, 3173, 3174, 3175, 3179, 3180, 3181, 3182, 3185, 3186, 3187, 3188, 3189, 3190, 3191, 3192, 3241, 3242, 3243, 3244, 3259, 3260, 3261, 3262, 3266, 3267, 3268, 3278, 3279, 3280, 3283, 3284, 3285, 3286, 3296, 3297, 3298, 3302, 3303, 3304, 3313, 3314, 3315, 3319, 3320, 3321, 3326, 3327, 3328, 3329, 3330, 3381, 3382, 3383, 3384, 3385, 3398, 3399, 3400, 3401, 3406, 3407, 3408, 3409, 3417, 3418, 3419, 3420, 3425, 3426, 3427, 3436, 3437, 3438, 3442, 3443, 3444, 3445, 3452, 3453, 3454, 3455, 3459, 3460, 3461, 3466, 3467, 3468, 3522, 3523, 3524, 3525, 3526, 3537, 3538, 3539, 3540, 3546, 3547, 3548, 3549, 3550, 3557, 3558, 3559, 3565, 3566, 3567, 3568, 3575, 3576, 3577, 3578, 3582, 3583, 3584, 3585, 3586, 3591, 3592, 3593, 3594, 3595, 3599, 3600, 3601, 3606, 3607, 3608, 3609, 3618, 3619, 3620, 3663, 3664, 3665, 3666, 3667, 3668, 3669, 3676, 3677, 3678, 3679, 3687, 3688, 3689, 3690, 3691, 3695, 3696, 3697, 3698, 3706, 3707, 3708, 3709, 3710, 3714, 3715, 3716, 3717, 3723, 3724, 3725, 3726, 3727, 3729, 3730, 3731, 3732, 3733, 3734, 3735, 3739, 3740, 3741, 3747, 3748, 3749, 3750, 3756, 3757, 3758, 3759, 3760, 3805, 3806, 3807, 3808, 3809, 3810, 3811, 3812, 3813, 3814, 3815, 3816, 3817, 3818, 3819, 3828, 3829, 3830, 3831, 3832, 3833, 3834, 3835, 3836, 3837, 3838, 3847, 3848, 3849, 3850, 3851, 3852, 3853, 3854, 3855, 3856, 3857, 3864, 3865, 3866, 3867, 3868, 3869, 3870, 3871, 3872, 3873, 3874, 3875, 3879, 3880, 3881, 3887, 3888, 3889, 3890, 3891, 3892, 3895, 3896, 3897, 3898, 3899, 3947, 3948, 3949, 3950, 3951, 3952, 3953, 3954, 3955, 3956, 3957, 3958, 3969, 3970, 3971, 3972, 3973, 3974, 3975, 3976, 3977, 3978, 3988, 3989, 3990, 3991, 3992, 3993, 3994, 3995, 3996, 4005, 4006, 4007, 4008, 4009, 4010, 4011, 4013, 4014, 4015, 4019, 4020, 4021, 4028, 4029, 4030, 4031, 4032, 4033, 4034, 4035, 4036, 4037, 4038, 4088, 4089, 4090, 4091, 4092, 4093, 4094, 4111, 4112, 4113, 4114, 4115, 4116, 4130, 4131, 4132, 4133, 4134, 4153, 4154, 4155, 4170, 4171, 4172, 4173, 4174, 4175, 4176, 4177, 4293, 4294, 4295, 4311, 4312, 4313, 4314, 4315, 4433, 4434, 4435, 4563, 4564, 4565, 4566, 4573, 4574, 4575, 4703, 4704, 4705, 4706, 4707, 4708, 4709, 4712, 4713, 4714, 4715, 4845, 4846, 4847, 4848, 4849, 4850, 4851, 4852, 4853, 4854, 4987, 4988, 4989, 4990, 4991, 4992, 4993, 5128, 5129, 5130, 5131, 5132 
        ];

        this.pixelSet = new Set(this.pixels);
    }

}