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

var p2 = require('p2');

/**
 * Methods for basic rendering of different shapes from p2
 */
var renderers = {};

renderers[p2.Shape.CIRCLE] = (ctx, circle) => {
    var _x = circle.body.position[0] + circle.position[0],
        _y = circle.body.position[1] + circle.position[1],
        r = circle.radius;

    //if the shape has an appended property of "color" use that
    ctx.fillStyle = circle.color ? circle.color : 'red';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.arc(_x, _y, r, 0, Math.PI * 2);
    ctx.fill();
    //ctx.stroke();

};

renderers[p2.Shape.PLANE] = ()=>{};

renderers[p2.Shape.CONVEX] = (ctx, box)=>{
    var _x = box.body.position[0] + box.position[0],
        _y = box.body.position[1] + box.position[1],
        ang = box.body.angle,
        w = box.width,
        h = box.height;

    //if the shape has an appended property of "color" use that
    ctx.fillStyle = box.color || 'white';

    ctx.save();
    ctx.translate(_x, _y);
    ctx.rotate(ang);
    ctx.fillRect(-box.width/2, -box.height/2, w, h);
    ctx.restore();
};



/**
 * Render a shape from p2
 * @param {CanvasRenderingContext2D} ctx
 * @param {p2.Shape} shape the shape to render
 */
module.exports = function shapeRenderer(ctx, shape){
    renderers[shape.type](ctx, shape);
};
