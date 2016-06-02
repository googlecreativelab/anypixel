
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
const Anypixel          = require('anypixel');
const b2                = require ( 'lucy-b2' );
const ease              = require('./util/easing');
const CTXRenderer       = require('./rendering/CTXRenderer');
const SquishyLetters    = require('./display/SquishyLetters');


//---------------------------------------------------------------------------------
const ctx               = Anypixel.canvas.getContext2D();
const DRAW_FIXTURES     = false;
const DRAW_PARTICLES    = true;
const UPDATE_PHYSICS    = true;
const DRAW_LOOP         = true;
const PARTICLE_SIZE     = 1;
const THROW_MULTIPLIER  = 10;
const RESET_TIME        = 60 * 1000;
const BUTTON_EXEC       = 500;
const GRAVITY           = new b2.Vec2(0,0);

//---------------------------------------------------------------------------------

var app = new (function(){

    console.log('yo');


    var isLiquid = false;

	// ---------------------------------------------------------------------------------------
	var _self = this,
        _windowWidth    = Anypixel.config.widcth,
        _windowHeight   =  Anypixel.config.height;

	// Pixi
	// ---------------------------------------------------------------------------------------
	var modifier   = 1;
	var world      = new b2.World ( GRAVITY );
    this.mouseVec  = undefined;
    this.seekHome  = true;
    this.buttonPresses = 0;
    this.renderOffset = {x:0,y:-42};
    this.easeTime = 0;
    ctx.canvas.style = "image-rendering: pixelated;";

	var squishyLetters = new SquishyLetters(b2,world);

	var debugDraw = new CTXRenderer(b2,ctx,10 * modifier);

    this.returnParticleCollisionGroup = function(group){
        if(group != undefined){
            this.clickGroup = group;
            return true;
        }
        return false;
    }

    this.getBodyAtMouse = function(mousePos){
        let _aabb = new b2.AABB();
            _aabb.lowerBound.Set(mousePos.x - 0.1, mousePos.y - 0.1);
            _aabb.upperBound.Set(mousePos.x + 0.1, mousePos.y + 0.1);
        this.clickGroup = undefined;
        squishyLetters.particleSystem.QueryAABB(new _self.getBodyCB(),_aabb);
    }

    this.getBodyCB = function(){
        this.ReportParticle = function(a,b,c){
            _self.returnParticleCollisionGroup( a.m_groupBuffer[b]);
            return true;
        }
    }

	this.draw = function(){
        if(UPDATE_PHYSICS){
    		world.Step ( 1/30, 1, 1 ); // normal speed
    		world.ClearForces();
        }

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = "black";
    	ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);

		// Draw Fixtures ––––––––––––––––––––––––––––––––––––––––––––––––––––––-
		if(DRAW_FIXTURES){
			for(let b = world.GetBodyList(); b != undefined; b = b.GetNext()){
				let transform = b.GetTransform();
				let pos = b.GetPosition();
				for(let f = b.GetFixtureList(); f != undefined; f = f.GetNext()){
					let s = f.GetShape();
					debugDraw.DrawPolygonWithTransform(
                        _graphics,transform,
                        s.m_vertices,
                        s.m_count,
                        0xffffff,
                        0xffffff
                    );
				}
			}
		}

		// Draw Particles ––––––––––––––––––––––––––––––––––––––––––––––––––––––
		if(DRAW_PARTICLES){
			for(let p = world.GetParticleSystemList(); p != undefined; p = p.GetNext()){
				for(let pg = 0; pg < p.m_count; pg++){
					let pgg = p.m_groupBuffer[pg];
					let pgTransform = pgg.GetTransform();
					let particle =	p.m_positionBuffer.data[pg];
					let color = pgg.GetUserData().color;
					debugDraw.DrawParticle(
                        pgTransform,
                        particle,
                        _self.renderOffset,
                        PARTICLE_SIZE * modifier,
                        true,
                        color
                    );
				}
			}
		}

        if(_self.renderOffset.y < 0){
            _self.renderOffset.y = -42 + (42 * ease('easeOutQuart',_self.easeTime));
            _self.easeTime += .08;
            if(_self.easeTime > 1) _self.easeTime = 1;
        }
	}

    this.checkIdlePos = function(){
        // if(_self.dragging !== true){
            for(let i=0; i < squishyLetters.letterBuffer.length; ++i){

                let _letter  = squishyLetters.letterBuffer[i];
                let _center  = _letter.GetCenter();
                let _sCenter = _letter.GetUserData().startCenter;
                if(_center.x != _sCenter.x || _center.y != _sCenter.y ){
                    let _xDif = (_sCenter.x - _center.x );
                    let _yDif = (_sCenter.y - _center.y);
                    _letter.ApplyLinearImpulse( new b2.Vec2(_xDif,_yDif));

                }
            }
        // }
    }

    this.startDrag = function(){
        _self.getBodyAtMouse(_self.mouseVec);
        _self.startMouse = _self.mouseVec;
        _self.dragging = true;
    }
    this.doDrag = function(){}
    this.stopDrag = function(){
        _self.dragging = false;
        if(this.clickGroup != undefined){
            var multiplier = THROW_MULTIPLIER
            if(isLiquid) multiplier = multiplier * 5;
            let _xDif = (_self.mouseVec.x - _self.startMouse.x) * multiplier;
            let _yDif = (_self.mouseVec.y - _self.startMouse.y) * multiplier;
            let _totalForce = Math.abs(_xDif) + Math.abs(_yDif);
            // console.log('_totalForce',_totalForce);
            console.log('isLiquid',isLiquid);
            if(_totalForce > 10){}
            if(_totalForce < 1){
                if(isLiquid){
                    this.clickGroup.ApplyLinearImpulse(
                        new b2.Vec2(1 - (Math.random() * 20),1 - (Math.random() * 40))
                    );
                }else{
                    this.clickGroup.ApplyLinearImpulse(
                        new b2.Vec2(1 - (Math.random() * 2),1 - (Math.random() * 2))
                    );
                }

            }else{
                this.clickGroup.ApplyLinearImpulse(
                    new b2.Vec2(_xDif,_yDif)
                );
            }
        }
    }
    this.clearScreen = function(){
        this.drawClear = true;
        this.clearCirc1 = 0;
        this.clearCirc2 = 0;
        this.clearCirc3 = 0;
        this.speed = 1;
        this.lettersNeedReset = true;
    }
    this.resetLetters = function(){
        isLiquid = false;
        world.SetGravity(new b2.Vec2(0,0));
        squishyLetters.destroy();
        squishyLetters = new SquishyLetters(b2,world);
        this.seekHome = true;
        this.lettersNeedReset = false;
        _self.buttonPresses = 0;
    }
    this.resetGraphics = function(){
        _clearGraphics.clear();
        this.drawClear = false;
    }

    this.makeItRain = function(){
        isLiquid = true;
        _self.buttonPresses = 0;
        squishyLetters.particleSystem.m_allParticleFlags = b2.ParticleFlag.waterParticle;
        world.SetGravity(new b2.Vec2(0,10));
        this.seekHome = false;
        for(let i=0; i < squishyLetters.letterBuffer.length; ++i) squishyLetters.letterBuffer[i].SetUserData({color:"#ffffff"});
    }

    this.dropLetters = function(){
        world.SetGravity(new b2.Vec2(0,10));
        world.DestroyBody(squishyLetters.wallsBody);
        this.seekHome = false;
        window.setTimeout(function(){
            _self.renderOffset.y = -42;
            _self.easeTime = 0;
            _self.resetLetters();
        },700);
    }

	document.addEventListener('onButtonDown', function(event) {
        _self.mouseVec = new b2.Vec2(event.detail.x * 0.1,event.detail.y * 0.1);
        _self.buttonPresses += 1;
        if(_self.dragging) _self.doDrag();
        else _self.startDrag();

        window.clearTimeout(window.upTimer);
        window.clearTimeout(window.resetWatchTimer);
        event.preventDefault();

        if(_self.buttonPresses > BUTTON_EXEC) _self.makeItRain();
	});

    document.addEventListener('onButtonUp', function(event) {
        window.upTimer = window.setTimeout(function(){
            _self.stopDrag();
            window.clearTimeout(window.resetWatchTimer);
            window.resetWatchTimer = window.setTimeout(function(){
                _self.dropLetters();
            },RESET_TIME);
        },100);
    });
    document.addEventListener("keydown", function(e){
        // Reset on R
        if(e.keyCode === 82) _self.clearScreen();
        // Make it rain on M
        if(e.keyCode === 77) _self.makeItRain();
        // Drop letters on G
        if(e.keyCode === 71) _self.dropLetters();
        // console.log('e.keyCode',e.keyCode);
    });




// Update Loop
// ---------------------------------------------------------------------------------------
    this.checkCount = 0;
    this.updateLoop = function(){
		if(DRAW_LOOP) requestAnimationFrame(function(){ _self.updateLoop(); });
        _self.checkCount += 1
        if(_self.checkCount > 10 && _self.seekHome){
            _self.checkIdlePos();
            _self.checkCount = 0;
        }
        this.draw();
	}
	return this;
})();

app.updateLoop();
