
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

function CTXRenderer(b2,ctx,scale) {

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



  debugDraw.DrawParticle = function( parentTransform, transform, renderOffset, radius, fill, color){

    ctx.fillStyle = color;
	ctx.fillRect(
        Math.round((parentTransform.p.x + transform.x) * scale - (radius * 0.5 ) + renderOffset.x),
        Math.round((parentTransform.p.y + transform.y) * scale - (radius * 0.5 ) + renderOffset.y),
        Math.round(radius * 2),
        Math.round(radius * 2)
     );
  }

  return debugDraw;
}

module.exports = CTXRenderer;
