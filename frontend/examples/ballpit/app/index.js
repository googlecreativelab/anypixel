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

"use strict";


//All in seconds
const FLOOR_INTERVAL = 60;          //how often to drop floor
const FLOOR_DURATION_INTERVAL = 8;   //how long to keep it dropped
const LOGO_INTERVAL = 90;           //how often to repair logo
const BALL_DROP_DURATION = 30;      //how long to auto-fill the pit with balls

const BALL_DROP_FREQUENCY = 60;     //int value between 1-60, how many balls to drop per second


var anypixel      = require('anypixel'),
    p2            = require('p2'),
    animitter     = require('animitter'),
    colors        = require('./colors'),
    shapeRenderer = require('./shape-renderer'),
    floorDrop     = require('./floor-drop'),
    logo          = require('./logo'),
    autoBallFill  = require('./auto-ball-fill'),
    rand          = require('./random-range');


var loop              = animitter(),
    ctx               = anypixel.canvas.getContext2D(),
    dim               = anypixel.config,
    down              = [],
    ballBodies        = [],
    aliasingTolerance = 128,
    floorDropping,
    world,
    isShapeCenter,
    pitFiller,
    google;


world = new p2.World({
    gravity     : [0, 15],
    islandSplit : false
});


isShapeCenter = (shape, x, y)=> shape.startPosition[0] === x && shape.startPosition[1] === y;



/*var debugView = require('./debug-view');
debugView.domElement.style.transform = 'scale(2, 2) translate(50%, 50%)';
debugView.show();*/


function perpindicular(vec){
    var t = vec[0];
    vec[0] = -vec[1];
    vec[1] = t;
    return vec;
}



function circlesIntersect(vec1, r1, vec2, r2){

    var res,
        delta = p2.vec2.sub([], vec2, vec1),
        d = p2.vec2.length(delta);

    if (d <= r1 + r2 && d >= Math.abs(r1 - r2)) {
        var a = (r1 * r1 - r2 * r2 + d * d) / (2.0 * d);
        d = 1 / d;
        var p = p2.vec2.scale([], p2.vec2.add([], vec1, delta), a * d);
        var h = Math.sqrt(r1 * r1 - a * a);
        p2.vec2.scale(delta, perpindicular(delta), h * d);
        var i1 = p2.vec2.add([], p, delta);
        var i2 = p2.vec2.sub([], p, delta);
        res = [i1, i2 ];
    }
    return !!res;

}



var px = new Uint8ClampedArray(3);
/**
 * to improve the appearance of aliasing on the buttons,
 * check all pixels on the canvas, if they aren't within the threshold
 * to a color in the experience, set it to black
 */
function cleanCanvasColors(){
    var imageData = ctx.getImageData(0,0, ctx.canvas.width, ctx.canvas.height);
    var pixels = imageData.data;
    var isMatch = false;
    for(var i=0; i<pixels.length; i+=4){
        px[0] = pixels[i];
        px[1] = pixels[i+1];
        px[2] = pixels[i+2];
        //we dont care about alpha, since we are on black
        isMatch = false;
        for(var j=0; j<colors.list.length; j++){
            var c = colors.list[j];
            if(colors.equalWithTolerance(c, px, aliasingTolerance)){
                isMatch = true;
                break;
            }
        }

        if(!isMatch){
            pixels[i] = pixels[i+1] = pixels[i+2] = 0;
            pixels[i+3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}


document.addEventListener('onButtonDown', (event)=>{

    var circleBody = new p2.Body({
        mass: 0,
        allowSleep: false,
        position: [ event.detail.x, event.detail.y ]
    });

    var circleShape = new p2.Circle({
        radius: rand(1, 3)
    });

    //add this property for shapeRenderer
    circleShape.color = colors.toCSS(colors.getRandom());
    //add this property for isShapeCenter
    circleShape.startPosition = new Float32Array(2);
    circleShape.startPosition[0] = event.detail.x;
    circleShape.startPosition[1] = event.detail.y;

    circleBody.addShape(circleShape);

    world.addBody(circleBody);

    down.push(circleShape);
    ballBodies.push(circleBody);

});


document.addEventListener('onButtonUp', (event)=>{
    //remove it from "down"
    for(let i=0; i<down.length; i++){

        if( isShapeCenter(down[i], event.detail.x, event.detail.y) ){

            //update the body from having a mass of 0
            let shape = down[i];
            var body = new p2.Body({
                mass: Math.PI * shape.radius * shape.radius,
                position: shape.body.position
            });

            world.removeBody(shape.body);
            ballBodies.splice(ballBodies.indexOf(shape.body), 1);
            ballBodies.push(body);

            shape.body = null;

            body.addShape(shape);
            world.addBody(body);

            down.splice(i, 1);
            break;
        }
    }
});


var floor = new p2.Body({
    mass: 0,
    position: [dim.width/2, dim.height + 50]
});

floor.addShape(
    new p2.Box({
        width: dim.width,
        height: 100
    })
);

world.addBody(floor);

var leftWall = new p2.Body({
    angle: -Math.PI / 2,
    position: [-1, -dim.height/2]
});

leftWall.addShape(new p2.Plane());

world.addBody(leftWall);

var rightWall = new p2.Body({
    angle: Math.PI / 2,
    position: [dim.width + 1, - dim.height/2]
});

rightWall.addShape(new p2.Plane());


world.addBody(rightWall);


function renderAllShapes() {
    var skipped = 0;
    var floorY = floor.position[1] - (floor.height / 2);

    for (let i = 0; i < world.bodies.length; i++) {

        let body = world.bodies[i];

        for (let j = 0; j < body.shapes.length; j++) {

            let shape = body.shapes[j];
            let y = body.position[1] + shape.position[1];
            if(y + shape.radius > 0 || y - shape.radius < floorY){
                shapeRenderer(ctx, shape);
            } else {
                skipped++;
            }
        }
    }
}

function renderAllBodies(){
    world.bodies.forEach(renderBody);
}

function renderBody(body){
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(body.position[0], body.position[1], 1, 0, Math.PI * 2);
    ctx.fill();
}

function intersects(){
    var letterShapes = google.getLetterShapes();
    var pos = [];
    for(var i=0; i<letterShapes.length; i++){
        pos[0] = letterShapes[i].position[0] + letterShapes[i].body.position[0];
        pos[1] = letterShapes[i].position[1] + letterShapes[i].body.position[1];

        for(var j=0; j<ballBodies.length; j++){
            var ball = ballBodies[j];
            if(!ball.isLetter && ball !== letterShapes[i] && circlesIntersect(pos, letterShapes[i].radius, ball.position, ball.shapes[0].radius)){
                return true;
            }
        }
    }

    return false;
}





//if there is any activity, keep resetting the counter
google = logo(world, ballBodies)
    .set({
        cycleWait: LOGO_INTERVAL * 1000,
        cycleDuration: 20 * 1000
    })
    .on('start', ()=>console.log('logo start'))
    //if any buttons are down then reset so it doesnt go off
    .on('update',()=>down.length && google.clearCycle())
    //.on('update',()=>intersects() && google.clearCycle())
    .on('stop', ()=>console.log('logo stop'))
    .on('stop', ()=>google.reset().start());


/**
 * drop the floor for `cycleDuration` milliseconds
 * after waiting `cycleWait` miliseconds
 */
floorDropping = floorDrop(world, floor, ballBodies)
    .set({
        minSurfaceArea: dim.width * dim.height / 6,
        maxSurfaceArea: dim.width * dim.height * 0.66,
        cycleWait: FLOOR_INTERVAL * 1000,
        cycleDuration: FLOOR_DURATION_INTERVAL * 1000
    })
    .on('start',()=>console.log(new Date() + ' Floor drop!'))
    .on('start', ()=>pitFiller.stop())
    .on('complete', ()=>console.log(new Date() + ' Balls have fallen, reset!'))
    .on('complete', ()=>google.removeTorn())
    .on('complete', ()=>pitFiller.reset().start());


function getBallOptions(i){
    var opts = {};

    opts.radius = Math.random() > 0.92 ? rand(3,5) : rand(2, 3);
    //anywhere on the the left 30 pixels
    opts.position = [Math.random() * 30, -opts.radius];

    if(i%2===0){
        //anywhere on the right
        opts.position[0] = dim.width - opts.position[0];
    }
    opts.color = colors.toCSS(colors.getRandom());
    opts.velocity = [0,0];

    return opts;
}

pitFiller = autoBallFill(world, ballBodies, getBallOptions)
    .set({
        addBallFrameInterval: (BALL_DROP_FREQUENCY|0),
        cycleWait: 5 * 1000,
        cycleDuration: BALL_DROP_DURATION * 1000
    });

//start the google logo right away
loop.on('start', ()=>google.start())

loop.on('update',(delta, elapsed, frameCount)=>{

    if(floorDropping.shouldCycle()){
        //drop floor
        if(floorDropping.isCompleted()){
            floorDropping.reset();
        }
        floorDropping.start();
    }

    if(!floorDropping.isRunning() && pitFiller.shouldCycle()){
        pitFiller
            .reset()
            .start();
    }


    //update down items
    for(let i=0; i<down.length; i++){
        let shape = down[i];
        shape.radius += 0.125;
        shape.updateBoundingRadius();
        shape.updateArea();
    }

    try {
        world.step(Math.max(1, Math.min(24, delta)) / 1000);
    } catch(e){
        //rare bug in p2's islandManager.split function
        //should be mitigated with world.islandSplit = false
        console.warn(e);
    }

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, dim.width, dim.height);

    renderAllShapes();

    //helpful for debugging
    //renderAllBodies();

    cleanCanvasColors();

});

loop.start();

