
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


"use strict";


function PixiRenderer(b2,graphics, scale) {

  var debugDraw = new b2.Draw();
  debugDraw.DrawPolygonWithTransform = function(graphics, transform, vertices, vertexCount, fill, color) {
    graphics.lineStyle(1, color, 1);
    if(fill) graphics.beginFill(color, 1);

    for(let tmpI =0;tmpI < vertexCount;tmpI++) {
      let vert = vertices[tmpI];
      let x = (vert.x + transform.p.x) * scale;
      let y = (vert.y + transform.p.y) * scale;
      if ( tmpI === 0 ){
        graphics.moveTo(x, y);
      }else{
        graphics.lineTo(x, y);
      }
    }
    if(fill) graphics.endFill();
  }

  debugDraw.DrawParticleCTX = function(ctx, parentTransform, transform, radius, fill, color){
    ctx.beginPath();
    ctx.rect(
        (parentTransform.p.x + transform.x) * scale * 10,
        (parentTransform.p.y + transform.y) * scale * 10,
        radius * 10,
        radius * 10
    );

    ctx.fillStyle = "red";
    ctx.fill();
  }

  debugDraw.DrawParticle = function(graphics, parentTransform, transform, renderOffset, radius, fill, color){
    if(fill) graphics.beginFill(color, 1);
    graphics.lineStyle(0);
    graphics.drawCircle(
      (parentTransform.p.x + transform.x) * scale + renderOffset.x,
      (parentTransform.p.y + transform.y) * scale + renderOffset.y,
      radius
    );
    // graphics.drawRect(
    //     (parentTransform.p.x + transform.x) * scale,
    //     (parentTransform.p.y + transform.y) * scale,
    //     radius, radius);
    if(fill) graphics.endFill();
  }

  return debugDraw;
}

module.exports = PixiRenderer;
