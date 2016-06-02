
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
//---------------------------------------------------------------------------------
var SquishyLetters = function(b2,world) {

    const CENTER_VEC2       = new b2.Vec2(7,2.2);
    const FLOOR_OFFSET_Y    = 2.1;
    const COLOR_BUFFER      = [ "#3761ff", "#e83a23", "#fdce00", "#3761ff", "#4dce22", "#e83a23" ];
    const LETTER_RADIUS     = 1;
    // const PARTIICLE_RADIUS = 0.09;
    const PARTIICLE_RADIUS = 0.08;
    // Create Empty letterBuffer

    this.letterBuffer = [];

    // Create Wall Body
    let _wallBodyDef = new b2.BodyDef();
    this.wallsBody = world.CreateBody(_wallBodyDef);
    this.wallsBody.SetPosition(CENTER_VEC2);

    //Create Wall Body Shapes
    let _floorShape = new b2.PolygonShape();
        _floorShape.SetAsBox(10,0.2, new b2.Vec2( 0,FLOOR_OFFSET_Y),0);
    this.wallsBody.CreateFixture(_floorShape, 0.0);

    let _leftWall = new b2.PolygonShape();
        _leftWall.SetAsBox(0.2,5, new b2.Vec2( -7.2,0),0);
    this.wallsBody.CreateFixture(_leftWall, 0.0);

    let _rightWall = new b2.PolygonShape();
        _leftWall.SetAsBox(0.2,5, new b2.Vec2( 7.2,0),0);
    this.wallsBody.CreateFixture(_leftWall, 0.0);

    let _roof = new b2.PolygonShape();
        _roof.SetAsBox(10,0.1, new b2.Vec2( 0,-FLOOR_OFFSET_Y),0);
    this.wallsBody.CreateFixture(_roof, 0.0);

    //Create Liquid Particle System
    let _particleSystemDef = new b2.ParticleSystemDef();
        _particleSystemDef.radius = PARTIICLE_RADIUS;
    this.particleSystem = world.CreateParticleSystem(_particleSystemDef);




    //Create Letters
    // -------------------------------------------------------------------------
    // G
    let _gScale = 0.5;
    let _gXOffset = 1.35;
    let _gYOffset = 2.2;

    let _gVerts1 = [
        new b2.Vec2((0  * _gScale) + _gXOffset,(0   * _gScale) + _gYOffset),
        new b2.Vec2((0  * _gScale) + _gXOffset,(-2  * _gScale) + _gYOffset),
        new b2.Vec2((-1 * _gScale) + _gXOffset ,(-2 * _gScale) + _gYOffset),
        new b2.Vec2((-2 * _gScale) + _gXOffset,(-1  * _gScale) + _gYOffset),
        new b2.Vec2((-2 * _gScale) + _gXOffset,(0   * _gScale) + _gYOffset)
    ];
    let _gOneShape1 = new b2.PolygonShape();
        _gOneShape1.Set(_gVerts1,_gVerts1.length);

    let _gVerts2 = [
        new b2.Vec2((2  * _gScale) + _gXOffset,(0 * _gScale) + _gYOffset),
        new b2.Vec2((-2 * _gScale) + _gXOffset,(0 * _gScale) + _gYOffset),
        new b2.Vec2((-2 * _gScale) + _gXOffset,(1 * _gScale) + _gYOffset),
        new b2.Vec2((-1 * _gScale) + _gXOffset,(2 * _gScale) + _gYOffset),
        new b2.Vec2((1  * _gScale) + _gXOffset,(2 * _gScale) + _gYOffset),
        new b2.Vec2((2  * _gScale) + _gXOffset,(1 * _gScale) + _gYOffset),
        new b2.Vec2((2  * _gScale) + _gXOffset,(0 * _gScale) + _gYOffset)
    ];
    let _gOneShape2 = new b2.PolygonShape();
        _gOneShape2.Set(_gVerts2,_gVerts2.length);


    let _gOneParticleDef = new b2.ParticleGroupDef();
        _gOneParticleDef.flags = b2.ParticleFlag.elasticParticle;
        _gOneParticleDef.groupFlags = b2.ParticleGroupFlag.solidParticleGroup;
        _gOneParticleDef.shapes = [_gOneShape1,_gOneShape2];
        _gOneParticleDef.shapeCount = _gOneParticleDef.shapes.length;
    this.gOneParticleGroup = this.particleSystem.CreateParticleGroup(_gOneParticleDef);
    this.gOneParticleGroup.SetUserData({
        color:COLOR_BUFFER[0],
        letter:'g1',
        startCenter: new b2.Vec2(this.gOneParticleGroup.GetCenter().x,this.gOneParticleGroup.GetCenter().y)
    });
    this.letterBuffer.push(this.gOneParticleGroup);

    // O
    let _oOneShape = new b2.CircleShape();
        _oOneShape.m_p.Set(3.6,1.9);
        _oOneShape.m_radius = LETTER_RADIUS;
    let _oOneParticleDef = new b2.ParticleGroupDef();
        _oOneParticleDef.flags = b2.ParticleFlag.elasticParticle;
        _oOneParticleDef.groupFlags = b2.ParticleGroupFlag.solidParticleGroup;
        _oOneParticleDef.shape = _oOneShape;
    this.oOneParticleGroup = this.particleSystem.CreateParticleGroup(_oOneParticleDef);
    this.oOneParticleGroup.SetUserData({
        color:COLOR_BUFFER[1],
        letter:'o1',
        startCenter: new b2.Vec2(this.oOneParticleGroup.GetCenter().x,this.oOneParticleGroup.GetCenter().y)
    });
    this.letterBuffer.push(this.oOneParticleGroup);

    // O
    let _oTwoShape = new b2.CircleShape();
        _oTwoShape.m_p.Set(5.9,2.2);
        _oTwoShape.m_radius = LETTER_RADIUS;
    let _oTwoParticleDef = new b2.ParticleGroupDef();
        _oTwoParticleDef.flags = b2.ParticleFlag.elasticParticle;
        _oTwoParticleDef.groupFlags = b2.ParticleGroupFlag.solidParticleGroup;
        _oTwoParticleDef.shape = _oTwoShape;
    this.oTwoParticleGroup = this.particleSystem.CreateParticleGroup(_oTwoParticleDef);
    this.oTwoParticleGroup.SetUserData({
        color:COLOR_BUFFER[2],
        letter:'o2',
        startCenter: new b2.Vec2(this.oTwoParticleGroup.GetCenter().x,this.oTwoParticleGroup.GetCenter().y)
    });
    this.letterBuffer.push(this.oTwoParticleGroup);

    // G

    let _g2Scale = 0.5;
    let _g2XOffset = 8.31;
    let _g2YOffset = 1.9;

    let _g2Verts1 = [
        new b2.Vec2((0  * _g2Scale) + _g2XOffset,(0   * _g2Scale) + _g2YOffset),
        new b2.Vec2((0  * _g2Scale) + _g2XOffset,(-2  * _g2Scale) + _g2YOffset),
        new b2.Vec2((-1 * _g2Scale) + _g2XOffset ,(-2 * _g2Scale) + _g2YOffset),
        new b2.Vec2((-2 * _g2Scale) + _g2XOffset,(-1  * _g2Scale) + _g2YOffset),
        new b2.Vec2((-2 * _g2Scale) + _g2XOffset,(0   * _g2Scale) + _g2YOffset)
    ];
    let _gTwoShape1 = new b2.PolygonShape();
        _gTwoShape1.Set(_g2Verts1,_gVerts1.length);

    let _g2Verts2 = [
        new b2.Vec2((2  * _g2Scale) + _g2XOffset,(0 * _g2Scale) + _g2YOffset),
        new b2.Vec2((-2 * _g2Scale) + _g2XOffset,(0 * _g2Scale) + _g2YOffset),
        new b2.Vec2((-2 * _g2Scale) + _g2XOffset,(1 * _g2Scale) + _g2YOffset),
        new b2.Vec2((-1 * _g2Scale) + _g2XOffset,(2 * _g2Scale) + _g2YOffset),
        new b2.Vec2((1  * _g2Scale) + _g2XOffset,(2 * _g2Scale) + _g2YOffset),
        new b2.Vec2((2  * _g2Scale) + _g2XOffset,(1 * _g2Scale) + _g2YOffset),
        new b2.Vec2((2  * _g2Scale) + _g2XOffset,(0 * _g2Scale) + _g2YOffset)
    ];
    let _gTwoShape2 = new b2.PolygonShape();
        _gTwoShape2.Set(_g2Verts2,_gVerts2.length);

    let _gTwoParticleDef = new b2.ParticleGroupDef();
        _gTwoParticleDef.flags = b2.ParticleFlag.elasticParticle;
        _gTwoParticleDef.groupFlags = b2.ParticleGroupFlag.solidParticleGroup;
        _gTwoParticleDef.shapes = [_gTwoShape1,_gTwoShape2];
        _gTwoParticleDef.shapeCount = _gOneParticleDef.shapes.length;
    this.gTwoParticleGroup = this.particleSystem.CreateParticleGroup(_gTwoParticleDef);
    this.gTwoParticleGroup.SetUserData({
        color:COLOR_BUFFER[3],
        letter:'g2',
        startCenter: new b2.Vec2(this.gTwoParticleGroup.GetCenter().x,this.gTwoParticleGroup.GetCenter().y)
    });
    this.letterBuffer.push(this.gTwoParticleGroup);

    // L
    let _lShape1 = new b2.PolygonShape();
        _lShape1.SetAsBox(0.3,1, new b2.Vec2( 10,2.2),0);
    let _lShape2 = new b2.PolygonShape();
        _lShape2.SetAsBox(0.5,0.3, new b2.Vec2( 10.6,2.9),0);

    let _lParticleDef = new b2.ParticleGroupDef();
        _lParticleDef.flags = b2.ParticleFlag.elasticParticle;
        _lParticleDef.groupFlags = b2.ParticleGroupFlag.solidParticleGroup;
        _lParticleDef.shapes = [_lShape1,_lShape2];
        _lParticleDef.shapeCount = _lParticleDef.shapes.length;
    this.lParticleGroup = this.particleSystem.CreateParticleGroup(_lParticleDef);
    this.lParticleGroup.SetUserData({
        color:COLOR_BUFFER[4],
        letter:'l',
        startCenter: new b2.Vec2(this.lParticleGroup.GetCenter().x,this.lParticleGroup.GetCenter().y)
    });
    this.letterBuffer.push(this.lParticleGroup);


    // E
    let _eShape1 = new b2.PolygonShape();
        _eShape1.SetAsBox(0.3,0.4, new b2.Vec2( 11.8,1.1),0);
    let _eShape2 = new b2.PolygonShape();
        _eShape2.SetAsBox(0.6,0.4, new b2.Vec2( 12.1,1.7),0);
    let _eShape3 = new b2.PolygonShape();
        _eShape3.SetAsBox(0.9,0.4, new b2.Vec2( 12.4,2.4),0);

    let _eParticleDef = new b2.ParticleGroupDef();
        _eParticleDef.flags = b2.ParticleFlag.elasticParticle;
        _eParticleDef.groupFlags = b2.ParticleGroupFlag.solidParticleGroup;
        _eParticleDef.shapes = [_eShape1,_eShape2,_eShape3];
        _eParticleDef.shapeCount = _eParticleDef.shapes.length;
    this.eParticleGroup = this.particleSystem.CreateParticleGroup(_eParticleDef);
    this.eParticleGroup.SetUserData({
        color:COLOR_BUFFER[5],
        letter:'e',
        startCenter: new b2.Vec2(this.eParticleGroup.GetCenter().x,this.eParticleGroup.GetCenter().y)
    });
    this.letterBuffer.push(this.eParticleGroup);


    this.gOneParticleGroup.ApplyLinearImpulse(new b2.Vec2(0,-.7));
    this.oOneParticleGroup.ApplyLinearImpulse(new b2.Vec2(0,.7));
    this.oTwoParticleGroup.ApplyLinearImpulse(new b2.Vec2(0,-.7));
    this.gTwoParticleGroup.ApplyLinearImpulse(new b2.Vec2(0,.7));
    this.lParticleGroup.ApplyLinearImpulse(new b2.Vec2(0,-.7));
    this.eParticleGroup.ApplyLinearImpulse(new b2.Vec2(0,.7));

    this.destroy = function(){
        for(let i=0; i < this.letterBuffer.length; ++i){
            this.particleSystem.DestroyParticleGroup(this.letterBuffer[i]);
        }
        world.DestroyParticleSystem(this.particleSystem);
        world.DestroyBody(this.wallsBody);
    }


    // let _waterShape = new b2.PsolygonShape();
    //     _waterShape.SetAsBox(14,0.8, new b2.Vec2(0,4),0);
    // let _waterParticleDef = new b2.ParticleGroupDef();
    //     _waterParticleDef.flags = b2.ParticleFlag.repusliveParticle;
    //     _waterParticleDef.groupFlags = b2.ParticleGroupFlag.solidParticleGroup;
    //     _waterParticleDef.shape = _waterShape;
    // this.waterParticleGroup = this.particleSystem.CreateParticleGroup(_waterParticleDef);
    // this.waterParticleGroup.SetUserData({color:0xffffff});

}

module.exports = SquishyLetters;
