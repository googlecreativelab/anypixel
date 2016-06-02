
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

var SquishyParticles = function(b2,world) {

  const colors = [ 0x5c7cf4, 0xc94533, 0xeac008, 0x5c7cf4, 0x68a952, 0xc94533 ];

  // Start Static Body Creation --- --- --- --- --- --- ---
  var bodyDef = new b2.BodyDef();
  var floor = world.CreateBody(bodyDef);
      floor.SetPosition(new b2.Vec2(7,2.2));

  let shape1 = new b2.PolygonShape();
  let yOffset = 2.1;
  let vertices1 = [
        new b2.Vec2(-10, -.2 + yOffset),
        new b2.Vec2(10, -.2 + yOffset),
        new b2.Vec2(10, .2 + yOffset),
        new b2.Vec2(-10, .2 + yOffset)
      ];
  shape1.Set(vertices1, 4);

  var fixture1 = floor.CreateFixture(shape1, 0.0);

  // Start Particle System Creation ------------------------------
  var particalSysDef = new b2.ParticleSystemDef();
      particalSysDef.radius = 0.1;
  var particleSystem = world.CreateParticleSystem(particalSysDef);

  //TODO: Make a rain drop version of the simulator

  let pShape1 = new b2.CircleShape();
      pShape1.m_p.Set(1, 0);
      pShape1.m_radius = 1.5;
  let pd1 = new b2.ParticleGroupDef();
      pd1.flags =  b2.ParticleFlag.elasticParticle;
      pd1.groupFlags = b2.ParticleGroupFlag.solidParticleGroup;
      pd1.shape = pShape1;
  let ps1 = particleSystem.CreateParticleGroup(pd1);
      ps1.SetUserData({color:colors[0]});

  let pShape2 = new b2.CircleShape();
      pShape2.m_p.Set(3, 0);
      pShape2.m_radius = 1;
  let pd2 = new b2.ParticleGroupDef();
      pd2.flags =  b2.ParticleFlag.elasticParticle;
      pd2.groupFlags = b2.ParticleGroupFlag.solidParticleGroup;
      pd2.shape = pShape2;
  let ps2 = particleSystem.CreateParticleGroup(pd2);
      ps2.SetUserData({color:colors[1]});
      // ps2.ApplyLinearImpulse(new b2.Vec2(7,0));


  let pShape3 = new b2.CircleShape();
      pShape3.m_p.Set(5, -10);
      pShape3.m_radius = 1;
  let pd3 = new b2.ParticleGroupDef();
      pd3.flags =  b2.ParticleFlag.elasticParticle;
      pd3.groupFlags = b2.ParticleGroupFlag.solidParticleGroup;
      pd3.shape = pShape3;
  let ps3 = particleSystem.CreateParticleGroup(pd3);
      ps3.SetUserData({color:colors[2]});
      // ps3.ApplyLinearImpulse(new b2.Vec2(4,0));

  let pShape4 = new b2.CircleShape();
      pShape4.m_p.Set(8, -4);
      pShape4.m_radius = 1.2;
  let pd4 = new b2.ParticleGroupDef();
      pd4.flags =  b2.ParticleFlag.elasticParticle;
      pd4.groupFlags = b2.ParticleGroupFlag.solidParticleGroup;
      pd4.shape = pShape4;
  let ps4 = particleSystem.CreateParticleGroup(pd4);
      ps4.SetUserData({color:colors[3]});
      // ps4.ApplyLinearImpulse(new b2.Vec2(-19,10));

  let pShape5 = new b2.CircleShape();
      pShape5.m_p.Set(11, -2);
      pShape5.m_radius = 1;
  let pd5 = new b2.ParticleGroupDef();
      pd5.flags =  b2.ParticleFlag.elasticParticle;
      pd5.groupFlags = b2.ParticleGroupFlag.solidParticleGroup;
      pd5.shape = pShape5;
  let ps5 = particleSystem.CreateParticleGroup(pd5);
      ps5.SetUserData({color:colors[4]});
      // ps5.ApplyLinearImpulse(new b2.Vec2(-2,0));

  let pShape6 = new b2.CircleShape();
      pShape6.m_p.Set(13, -2);
      pShape6.m_radius = 1;
  let pd6 = new b2.ParticleGroupDef();
      pd6.flags =  b2.ParticleFlag.elasticParticle;
      pd6.groupFlags = b2.ParticleGroupFlag.solidParticleGroup;
      pd6.shape = pShape6;
  let ps6 = particleSystem.CreateParticleGroup(pd6);
      ps6.SetUserData({color:colors[5]});
      // ps6.ApplyLinearImpulse(new b2.Vec2(0,0));
}

module.exports = SquishyParticles;
