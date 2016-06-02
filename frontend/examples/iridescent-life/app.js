/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var anypixel = require('anypixel');

var sizeX = 1;
while (sizeX < anypixel.config.width) {
	sizeX *= 2;
}
var sizeY = 1;
while (sizeY < anypixel.config.height) {
	sizeY *= 2;
}

var offsetX = (sizeX - anypixel.config.width) * 0.5;
var offsetY = (sizeY - anypixel.config.height) * 0.5;

// The button matrix in a canvas

var inputMap = document.createElement("canvas");
inputMap.width = sizeX;
inputMap.height = sizeY;
var inputMatrix = inputMap.getContext('2d');

document.addEventListener('onButtonDown', function (event) {
	inputMatrix.fillStyle = "#F00";
	inputMatrix.fillRect(event.detail.x + offsetX, event.detail.y + offsetY, 1, 1);
});

document.addEventListener('onButtonUp', function (event) {
	inputMatrix.fillStyle = "#000";
	inputMatrix.fillRect(event.detail.x + offsetX, event.detail.y + offsetY, 1, 1);
});

// The Google logo in a canvas (animated)
// #logo
var googleLogo = document.createElement("canvas");
googleLogo.width = sizeX;
googleLogo.height = sizeY;
var context = googleLogo.getContext('2d');
context.translate(offsetX, offsetY);

// quadratic Bezier spline

// Richard The's type (approx.)
var controls = [
	1, 20,
	13, 19,
	30, 9,
	46, 11,
	53, 6,
	40, 9,
	34, 21,
	43, 23,
	47, 14,
	42, 19,
	42, 31,
	36, 38,
	31, 34,
	36, 28,
	45, 26,
	55, 12,
	61, 16,
	58, 24,
	52, 24,
	55, 15,
	58, 15,
	63, 20,
	70, 12,
	75, 14,
	72, 24,
	66, 24,
	70, 15,
	73, 15,
	78, 19,
	86, 15,
	83, 13,
	78, 19,
	78, 24,
	80, 26,
	85, 26,
	89, 19,
	87, 17,
	84, 22,
	82, 32,
	80, 37,
	75, 37,
	78, 30,
	87, 28,
	102, 8,
	98, 7,
	93, 18,
	93, 24,
	99, 25,
	107, 16,
	105, 13,
	102, 16,
	102, 20,
	106, 25,
	111, 25,
	124, 18,
	139, 21,
];

context.lineWidth = 2.2;
context.strokeStyle = "#FFF";

// lambda for iteration over the splines for a set of controls
function forBezier(controls, i, func) {
	var currentx = controls[i * 2 + 0];
	var currenty = controls[i * 2 + 1];
	var nextx = controls[i * 2 + 2];
	var nexty = controls[i * 2 + 3];
	var helper1x = currentx;
	var helper1y = currenty;
	if (i > 0) {
		helper1x = currentx;
		var previousx = controls[i * 2 - 2];
		var previousy = controls[i * 2 - 1];
		helper1x = currentx + (nextx - previousx) * 0.25;
		helper1y = currenty + (nexty - previousy) * 0.25;
	}
	var helper2x = nextx;
	var helper2y = nexty;
	if (i < controls.length / 2 - 2) {
		var nextnextx = controls[i * 2 + 4];
		var nextnexty = controls[i * 2 + 5];
		helper2x = nextx - (nextnextx - currentx) * 0.25;
		helper2y = nexty - (nextnexty - currenty) * 0.25;
	}
	return func(currentx, currenty, helper1x, helper1y, helper2x, helper2y, nextx, nexty, i, controls);
}

function forEachBezier(controls, func) {
	if (controls.length > 1) {
		for (var i = 0; i < controls.length / 2 - 1; i++) {
			forBezier(controls, i, func);
		}
	}
}

// see http://stackoverflow.com/a/17096947/6036193
function getCubic(normalizedDistance, a, b, c, d) {
	var t2 = normalizedDistance * normalizedDistance;
	var t3 = t2 * normalizedDistance;
	return a + (-a * 3 + normalizedDistance * (3 * a - a * normalizedDistance)) * normalizedDistance + (3 * b + normalizedDistance * (-6 * b + b * 3 * normalizedDistance)) * normalizedDistance + (c * 3 - c * 3 * normalizedDistance) * t2 + d * t3;
}

// returns the point on the spline for a normalized range value
function getPointOnSpline(controls, index) {
	index *= controls.bezierLength;
	var start = 0;
	for (var i = 0; i < controls.bezierLengths.length; i++) {
		var l = controls.bezierLengths[i];
		if (index >= start && index <= start + l) {
			return forBezier(controls, i, function (currentx, currenty, helper1x, helper1y, helper2x, helper2y, nextx, nexty) {
				return getPointOnBezier(currentx, currenty, helper1x, helper1y, helper2x, helper2y, nextx, nexty, (index - start) / l)
			});
		}
		start += l;
	}
}

function getPointOnBezier(currentx, currenty, helper1x, helper1y, helper2x, helper2y, nextx, nexty, index) {
	return [getCubic(index, currentx, helper1x, helper2x, nextx), getCubic(index, currenty, helper1y, helper2y, nexty)];
}

function getBezierLength(currentx, currenty, helper1x, helper1y, helper2x, helper2y, nextx, nexty) {
	// solve differentially with N segments
	var N = 10;
	var L = 0;
	var start = getPointOnBezier(currentx, currenty, helper1x, helper1y, helper2x, helper2y, nextx, nexty, 0);
	for (var i = 1; i <= N; i++) {
		var end = getPointOnBezier(currentx, currenty, helper1x, helper1y, helper2x, helper2y, nextx, nexty, i / N);
		L += Math.sqrt((start[0] - end[0]) * (start[0] - end[0]) + (start[1] - end[1]) * (start[1] - end[1]));
		start = end;
	}
	return L;
}

function attachBezierLengths(controls) {
	controls.bezierLengths = [];
	forEachBezier(controls, function (currentx, currenty, helper1x, helper1y, helper2x, helper2y, nextx, nexty, i, controls) {
		controls.bezierLengths[i] = getBezierLength(currentx, currenty, helper1x, helper1y, helper2x, helper2y, nextx, nexty);
	});
	controls.bezierLength = controls.bezierLengths.reduce(function (a, b) { return a + b }, 0);
}

attachBezierLengths(controls);

var animationFrameCount = Math.floor(controls.bezierLength / Math.sqrt(2)); // line drawing animation #speed
var animationFrame = 0;

function animatePointOnSpline() {
	requestAnimationFrame(animatePointOnSpline);
	if (animationFrame > animationFrameCount) {
		animationFrame = 0;
	}
	var index = animationFrame / animationFrameCount;

	context.globalCompositeOperation = "source-over";

	context.fillStyle = "#000";
	context.fillRect(0, 0, sizeX, sizeY);

	context.strokeStyle = "#F00";
	drawSpline(context, controls);

	var point = getPointOnSpline(controls, index);

	context.fillStyle = "#0F0";
	context.fillRect(point[0] - 1.25, point[1] - 1.25, 2.5, 2.5);

	updateGoogleLogo();

	animationFrame++;
}

animatePointOnSpline();

function drawSpline(context, controls) {
	//draw beziers
	forEachBezier(controls, function (currentx, currenty, helper1x, helper1y, helper2x, helper2y, nextx, nexty) {
		context.beginPath();
		context.moveTo(currentx, currenty);
		context.bezierCurveTo(helper1x, helper1y, helper2x, helper2y, nextx, nexty);
		context.stroke();
	});
	// draw control points
	context.globalCompositeOperation = "lighten";

	for (var i = 0; i < controls.length / 2; i++) {
		context.fillStyle = "#00F";
		context.fillRect(controls[i * 2] - 1, controls[i * 2 + 1] - 1, 2, 2);
	}
}

// #webgl setup

var webGLCanvas = anypixel.canvas;

var simScale = 4; // reduction factor for the fluid simulation (power of two)

var gl = anypixel.canvas.getContext3D();

// 16 bit floating point extensions

["OES_texture_half_float", "OES_texture_half_float_linear"].forEach(function (name) {
	try {
		ext = gl.getExtension(name);
		gl[name] = ext;
		if (ext) {
			console.info(name + " is supported. :)");
		} else {
			console.error(name + " is not supported. :(");
			return;
		}
	} catch (e) {
		console.log("error: " + e);
	}
});

// shaders galore

var shaders = [];

shaders['vertex'] = (function () {/*  
			attribute vec3 aPos;
			attribute vec2 aTexCoord;
			varying vec2 uv;
			varying vec2 uv_orig;
			void main(void) {
				gl_Position = vec4(aPos, 1.);
				uv = aTexCoord;
				uv_orig = uv;
			}*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]; // no comment

shaders['init'] = (function () {/*  
			void main(void) {
				gl_FragColor = vec4(0);
			}
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

shaders['copy'] = (function () {/*  
			uniform sampler2D src_tex;
			void main(void) {
				gl_FragColor = texture2D(src_tex, uv);
			}
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

shaders['includes'] = (function () {/*  
			// #include definitions shared by all programs
			#ifdef GL_ES
			precision mediump float;
			#endif
			
			uniform sampler2D sampler_prev;
			uniform sampler2D sampler_blur;
			uniform sampler2D sampler_blur2;
			uniform sampler2D sampler_blur3;
			uniform sampler2D sampler_blur4;
			uniform sampler2D sampler_noise;
			uniform sampler2D sampler_fluid;
			uniform sampler2D sampler_fluid_p;
			uniform sampler2D sampler_input_matrix;
			uniform sampler2D sampler_processed_input;
			uniform sampler2D sampler_processed_input_blur;
			uniform sampler2D sampler_processed_input_blur2;
			uniform sampler2D sampler_processed_input_blur3;
			uniform sampler2D sampler_processed_input_blur4;
			uniform sampler2D sampler_google_logo;

			varying vec2 uv;
			varying vec2 uv_orig;
			uniform vec2 texSize;
			uniform vec2 pixelSize;
			uniform vec2 aspect;
			uniform vec2 offset;
			uniform vec2 scale;
			uniform vec4 rnd;
			uniform float time;
			uniform float frame;

			vec2 gradient(sampler2D sampler, vec2 uv, vec2 d, vec4 selector){
				vec4 dX = 0.5*texture2D(sampler, uv + vec2(1.,0.)*d) - 0.5*texture2D(sampler, uv - vec2(1.,0.)*d);
				vec4 dY = 0.5*texture2D(sampler, uv + vec2(0.,1.)*d) - 0.5*texture2D(sampler, uv - vec2(0.,1.)*d);
				return vec2( dot(dX, selector), dot(dY, selector) );
			}

			vec2 rot90(vec2 vector){
				return vector.yx*vec2(1,-1);
			}

			float border(vec2 uv, float border, vec2 texSize){
				uv*=texSize;
				return (uv.x<border || uv.x>texSize.x-border || uv.y<border || uv.y >texSize.y-border) ? 1.:.0;
			}
			
			vec2 wrap_flip(vec2 uv){
				return vec2(1.)-abs(fract(uv*.5)*2.-1.);
			}

			float wrap_flip(float uv){
				return 1.-abs(fract(uv*.5)*2.-1.);
			}

			// HSL to RGB converter code from http://www.gamedev.net/topic/465948-hsl-shader-glsl-code/
			float Hue_2_RGB(float v1, float v2, float vH )
			{
				float ret;
				 if ( vH < 0.0 )
					 vH += 1.0;
				 if ( vH > 1.0 )
					 vH -= 1.0;
				 if ( ( 6.0 * vH ) < 1.0 )
					 ret = ( v1 + ( v2 - v1 ) * 6.0 * vH );
				 else if ( ( 2.0 * vH ) < 1.0 )
					 ret = ( v2 );
				 else if ( ( 3.0 * vH ) < 2.0 )
					 ret = ( v1 + ( v2 - v1 ) * ( ( 2.0 / 3.0 ) - vH ) * 6.0 );
				 else
					 ret = v1;
				 return ret;
			}

			vec3 hsl2rgb(float H, float S, float L){
				float var_2, var_1, R, G, B;	
				if (S == 0.0)
				{
					 R = L;
					 G = L;
					 B = L;
				}
				else
				{
					 if ( L < 0.5 )
					 {
						 var_2 = L * ( 1.0 + S );
					 }
					 else
					 {
						 var_2 = ( L + S ) - ( S * L );
					 }

					 var_1 = 2.0 * L - var_2;

					 R = Hue_2_RGB( var_1, var_2, H + ( 1.0 / 3.0 ) );
					 G = Hue_2_RGB( var_1, var_2, H );
					 B = Hue_2_RGB( var_1, var_2, H - ( 1.0 / 3.0 ) );
				}
				return vec3(R,G,B);
			}
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

shaders['process_input'] = (function () {/* 
			// #process
			void main(void){
				float button = texture2D(sampler_input_matrix, uv).x;
				vec4 pre = texture2D(sampler_processed_input, uv);
				float pre_button = pre.x;

				// memorize previous state in red
				gl_FragColor.x = button;

				// integral memory with a slow decay in green
				gl_FragColor.y = pre.y - 0.002; // decay previous memory
				gl_FragColor.y = mix(gl_FragColor.y, 1., button*0.15); // integrate input
				gl_FragColor.y = clamp(gl_FragColor.y, 0., 1.); // prevent overflow

				// button down event in blue
				gl_FragColor.z = button * (1.-pre_button);

				// button up event in alpha
				gl_FragColor.a = (1.-button) * pre_button;
			}		
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

shaders['blurH'] = (function () {/*  
			uniform sampler2D src_tex;
			// Gaussian factors kindly suggested by https://github.com/mattdesl/lwjgl-basics/wiki/ShaderLesson5
			void main(void) // fragment
			{
				vec4 sum = vec4(0);
				sum += texture2D(src_tex, vec2(-4,0) * pixelSize + uv ) * 0.0162162162;
				sum += texture2D(src_tex, vec2(-3,0) * pixelSize + uv ) * 0.0540540541;
				sum += texture2D(src_tex, vec2(-2,0) * pixelSize + uv ) * 0.1216216216;
				sum += texture2D(src_tex, vec2(-1,0) * pixelSize + uv ) * 0.1945945946;
				sum += texture2D(src_tex, vec2( 0,0) * pixelSize + uv ) * 0.2270270270;
				sum += texture2D(src_tex, vec2( 1,0) * pixelSize + uv ) * 0.1945945946;
				sum += texture2D(src_tex, vec2( 2,0) * pixelSize + uv ) * 0.1216216216;
				sum += texture2D(src_tex, vec2( 3,0) * pixelSize + uv ) * 0.0540540541;
				sum += texture2D(src_tex, vec2( 4,0) * pixelSize + uv ) * 0.0162162162;
				gl_FragColor = sum;
			}
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

shaders['blurV'] = (function () {/*  
			uniform sampler2D src_tex;
			// Gaussian factors kindly suggested by https://github.com/mattdesl/lwjgl-basics/wiki/ShaderLesson5
			void main(void)
			{
				vec4 sum = vec4(0.0);
				sum += texture2D(src_tex, vec2(0,-4) * pixelSize + uv ) * 0.0162162162;
				sum += texture2D(src_tex, vec2(0,-3) * pixelSize + uv ) * 0.0540540541;
				sum += texture2D(src_tex, vec2(0,-2) * pixelSize + uv ) * 0.1216216216;
				sum += texture2D(src_tex, vec2(0,-1) * pixelSize + uv ) * 0.1945945946;
				sum += texture2D(src_tex, vec2(0, 0) * pixelSize + uv ) * 0.2270270270;
				sum += texture2D(src_tex, vec2(0, 1) * pixelSize + uv ) * 0.1945945946;
				sum += texture2D(src_tex, vec2(0, 2) * pixelSize + uv ) * 0.1216216216;
				sum += texture2D(src_tex, vec2(0, 3) * pixelSize + uv ) * 0.0540540541;
				sum += texture2D(src_tex, vec2(0, 4) * pixelSize + uv ) * 0.0162162162;
				gl_FragColor = sum/0.98;
			}
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

shaders['advect'] = (function () {/*
			// The fluid simulation was originally copied from https://www.ibiblio.org/e-notes/webgl/gpu/fluid.htm
			// Props to Evgeny Demidov, demidov@ipm.sci-nnov.ru 

			const float dt = .001;

			void main(void){
				vec2 v = texture2D(sampler_fluid, uv).xz;

				vec2 D = -texSize*vec2(v.x, v.y)*dt;

				vec2 Df = floor(D),   Dd = D - Df;
				vec2 uv = uv + Df*pixelSize;

				vec2 uv0, uv1, uv2, uv3;

				uv0 = uv + pixelSize*vec2(0.,0.);
				uv1 = uv + pixelSize*vec2(1.,0.);
				uv2 = uv + pixelSize*vec2(0.,1.);
				uv3 = uv + pixelSize*vec2(1.,1.);

				vec2 v0 = texture2D(sampler_fluid, uv0).xz;
				vec2 v1 = texture2D(sampler_fluid, uv1).xz;
				vec2 v2 = texture2D(sampler_fluid, uv2).xz;
				vec2 v3 = texture2D(sampler_fluid, uv3).xz;

				v = mix( mix( v0, v1, Dd.x), mix( v2, v3, Dd.x), Dd.y);

				gl_FragColor.xz = v*(1.-border(uv, 1., texSize));
			}
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

shaders['p'] = (function () {/*  			
			uniform sampler2D sampler_v;
			uniform sampler2D sampler_p;
			const float h = 1./1024.;

			void main(void){

				vec2 v = texture2D(sampler_v, uv).xz;
				float v_x = texture2D(sampler_v, uv - vec2(1.,0.)*pixelSize).r;
				float v_y = texture2D(sampler_v, uv - vec2(0.,1.)*pixelSize).b;

				float n = texture2D(sampler_p, uv- pixelSize*vec2(0.,1.)).r;
				float w = texture2D(sampler_p, uv + pixelSize*vec2(1.,0.)).r;
				float s = texture2D(sampler_p, uv + pixelSize*vec2(0.,1.)).r;
				float e = texture2D(sampler_p, uv - pixelSize*vec2(1.,0.)).r;

				float p = ( n + w + s + e - (v.x - v_x + v.y - v_y)*h ) * .25;

				gl_FragColor.r = p;
				gl_FragColor.ba = vec2(0.); // unused
			}
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

shaders['div'] = (function () {/*  			
			uniform sampler2D sampler_v;
			uniform sampler2D sampler_p;

			void main(void){
				float p = texture2D(sampler_p, uv).r;
				vec2 v = texture2D(sampler_v, uv).xz;
				float p_x = texture2D(sampler_p, uv + vec2(1.,0.)*pixelSize).r;
				float p_y = texture2D(sampler_p, uv + vec2(0.,1.)*pixelSize).r;

				v -= (vec2(p_x, p_y)-p)*512.;

				gl_FragColor.xz = v;
			}
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

shaders['add_fluid_input'] = (function () {/*  
			uniform float simScale;

			void main(void){
				vec2 v = texture2D(sampler_fluid, uv).xz;
				
				float buttonDownEvent = texture2D(sampler_processed_input_blur, uv).z*48.;

				vec2 flow = gradient(sampler_processed_input_blur, uv, pixelSize*2., vec4(0.,-24.,0.,0.))*simScale;

				if(buttonDownEvent > 0.8){
					v = flow;
				}
				
				gl_FragColor.xz = v*0.9965; // linear friction so that the movement stops after about two line drawing animation cycles
			}	
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

shaders['advance'] = (function () {/*
			// #advance
			void main(void) {
				vec4 noise = texture2D(sampler_noise, uv + rnd.zw)*2.-1.;
				vec4 input_matrix = texture2D(sampler_input_matrix, uv);
				vec4 processed_input = texture2D(sampler_processed_input, uv);
				
				vec2 fluid = -texture2D(sampler_fluid, uv).xz*pixelSize;

				// fade out animated point in red
				vec2 uv_zoom = 0.5 + (uv - 0.5)*0.9994 + fluid + noise.xy*pixelSize*0.0;
				gl_FragColor.x = texture2D(sampler_prev, uv_zoom).x - 1.25/2048.;
				gl_FragColor.x = mix(gl_FragColor.x, 1., texture2D(sampler_google_logo, uv).y);

				// starfield in green
				uv_zoom = 0.5 + (uv - 0.5)*0.998 + fluid*8.;
				vec4 sparkle = texture2D(sampler_noise, uv + floor(rnd.xy*texSize)*pixelSize);
				gl_FragColor.y = max(texture2D(sampler_prev, uv).y,texture2D(sampler_prev, uv_zoom).y)*0.985 - 0.5/256.;
				gl_FragColor.y = mix(gl_FragColor.y, 1., float( sparkle.x+sparkle.y+sparkle.z > 2.88));
				
				// Conway's Game of Life in blue
				float c = texture2D(sampler_prev, uv).b;
				float thresh = 0.92;
				int s = 0;
				float gol = 0.;
				if (texture2D(sampler_prev, uv + pixelSize*vec2(0, 1)).b > thresh) s++;
				if (texture2D(sampler_prev, uv - pixelSize*vec2(0, 1)).b > thresh) s++;
				if (texture2D(sampler_prev, uv + pixelSize*vec2(1, 0)).b > thresh) s++;
				if (texture2D(sampler_prev, uv - pixelSize*vec2(1, 0)).b > thresh) s++;
				if (texture2D(sampler_prev, uv + pixelSize*vec2(1, 1)).b > thresh) s++;
				if (texture2D(sampler_prev, uv - pixelSize*vec2(1, 1)).b > thresh) s++;
				if (texture2D(sampler_prev, uv + pixelSize*vec2(1,-1)).b > thresh) s++;
				if (texture2D(sampler_prev, uv - pixelSize*vec2(1,-1)).b > thresh) s++;
				if (c > thresh) {
					if ((s == 2) || (s == 3))
						gol = 1.;
					else 
						gol = 0.;
				}
				else if (s == 3)
					gol = 1.;
				else
					gol = 0.;

				if(mod(frame, 6.) != 0.) // apply Conway's rule only on every 6th frame (#throttle)
					gol = c;

				gol = mix(gol, 1., texture2D(sampler_google_logo, uv).y);
				gol = mix(gol, 1., processed_input.a); // button up

				gl_FragColor.b = gol;

				// reaction-diffusion simulation in alpha
				vec2 uvr = 0.5 + (uv - 0.5)*0.9991 + fluid*16.
					+ gradient(sampler_blur, uv, pixelSize*3., vec4(0.,0.,0.,-1.75))*pixelSize
					- gradient(sampler_processed_input_blur2, uv, pixelSize*8., vec4(0.,96.,0.,0))*pixelSize;
				gl_FragColor.a = texture2D(sampler_prev, uvr).a + noise.w*0.15/256. + 0.2/256.;
				gl_FragColor.a += (texture2D(sampler_prev, uvr).a - texture2D(sampler_blur, uvr).a)*0.25;
				gl_FragColor.a += texture2D(sampler_processed_input_blur, uv).y;

				if(frame == 0.){
					gl_FragColor.a = noise.x;
				}

				// prevent overflow
				gl_FragColor = clamp(gl_FragColor, 0., 1.);
			}
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

shaders['composite'] = (function () {/*  
			// #composite
			void main(void) {

				// crop pixel-accurate rectangle from power-of-two texture
				vec2 sub_region = texSize - offset*2.;
				vec2 scale = sub_region / texSize;
				vec2 uv = 0.5 + (uv - 0.5) * scale; // here we crop the (140 x 42) subregion from the power of two texture (256 x 64)

				vec2 fluid = -texture2D(sampler_fluid, uv).xz;

				vec4 input_matrix = texture2D(sampler_input_matrix, uv);
				vec4 alpha_pattern = vec4(hsl2rgb(fract(time*0.05 + texture2D(sampler_prev, uv).w*1.), 2., 0.5),1);
				
				// start
				gl_FragColor = vec4(0);

				// currently pressed button area
				// gl_FragColor = mix(gl_FragColor, vec4(0.5), texture2D(sampler_processed_input_blur2, uv).x*32.);
	
				// the reaction-diffusion pattern
				float net = max(texture2D(sampler_prev, uv).a,  texture2D(sampler_processed_input, uv).y);
				vec4 netCol = vec4(hsl2rgb(fract(uv.x/aspect.y+uv.y/aspect.x-time*0.125 + 0.5), 2., 0.66),0); // much like gol, but on the opposite side of the color wheel
//				gl_FragColor = mix(gl_FragColor, netCol*0. +vec4(0.2), net);

				// google logo stroke
				float stroke_intensity = texture2D(sampler_prev, uv 
				+ gradient(sampler_processed_input_blur2, uv, pixelSize*4., vec4(0,1,0,0))
//				+ gradient(sampler_blur, uv, pixelSize*3., vec4(-1,0,0,0))*pixelSize
				).x;
				vec3 strokeColor = hsl2rgb(fract(stroke_intensity*1.5+time*0.25), 2., 0.5);
				gl_FragColor = mix(gl_FragColor, vec4(strokeColor, 1.), pow(stroke_intensity*1.,1.8));

				// circling the diffuse area of the memorized button presses
				float thresh = 1./512.;
				float processed_input_blur = texture2D(sampler_processed_input_blur2, uv + fluid*pixelSize*20.).y;
				float circle = clamp(1.-abs(processed_input_blur-thresh)/thresh, 0., 1.);
				gl_FragColor = mix(gl_FragColor, netCol, pow(clamp(circle-net*0.,0.,1.), 2.5));

				// game of life
				float gol = max(texture2D(sampler_prev, uv).b, texture2D(sampler_processed_input, uv).x);
				vec4 golCol = vec4(hsl2rgb(fract(uv.x/aspect.y+uv.y/aspect.x-time*0.125), 2., 0.5),0);
				gl_FragColor = mix(gl_FragColor, golCol*0.45, gol*(1.-stroke_intensity));

				// starfield
				// gl_FragColor = mix(gl_FragColor, vec4(1.), texture2D(sampler_prev, uv).y*0.55 - gol*0.33*(1.-stroke_intensity));
			
				// gol debug view
				// gl_FragColor = gol * golCol;

				// net debug view
				// gl_FragColor = net * netCol;

				// Bezier spline debug view
				// gl_FragColor = texture2D(sampler_google_logo, uv).x*vec4(1);
				// gl_FragColor = mix(gl_FragColor, vec4(0,0,0.04,0), texture2D(sampler_google_logo, uv).y);
				// gl_FragColor = mix(gl_FragColor, vec4(1,0,0,0), texture2D(sampler_google_logo, uv).z);

				// color correction (activate during development to simulate bright environment)
				// gl_FragColor = vec4(0.75) + gl_FragColor * 0.25;
				
				gl_FragColor = clamp(gl_FragColor, 0., 1.);
				gl_FragColor.a = 1.;
			}
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]; // no comment

// compile programs

function compileShader(id) {
	var glsl = shaders[id];

	var shader;
	if (id == 'vertex') {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		glsl = shaders['includes'] + glsl;
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	}
	gl.shaderSource(shader, glsl);
	gl.compileShader(shader);
	if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) == 0) {
		console.error("error compiling shader '" + id + "'\n\n" + gl.getShaderInfoLog(shader));
	}
	return shader;
}

function createAndLinkProgram(fsId) {
	var program = gl.createProgram();
	gl.attachShader(program, compileShader('vertex'));
	gl.attachShader(program, compileShader(fsId));
	gl.linkProgram(program);
	var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (!linked) {
		console.error("error linking program " + fsId + ": " + gl.getProgramInfoLog(program));
	} else {
		console.info("shader program " + fsId + " linked");
	}
	return program;
}

var prog_init = createAndLinkProgram("init");
var prog_copy = createAndLinkProgram("copy");
var prog_blur_horizontal = createAndLinkProgram("blurH");
var prog_blur_vertical = createAndLinkProgram("blurV");
var prog_fluid_advect = createAndLinkProgram("advect");
var prog_fluid_div = createAndLinkProgram("div");
var prog_fluid_p = createAndLinkProgram("p");
var prog_process_input = createAndLinkProgram("process_input");
var prog_fluid_add_input = createAndLinkProgram("add_fluid_input");
var prog_advance = createAndLinkProgram("advance");
var prog_composite = createAndLinkProgram("composite");

// geometry

var triangleStripGeometry = {
	vertices: new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]),
	texCoords: new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
	vertexSize: 3,
	vertexCount: 4,
	type: gl.TRIANGLE_STRIP
};

function createTexturedGeometryBuffer(geometry) {
	geometry.buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, geometry.buffer);
	geometry.aPosLoc = gl.getAttribLocation(prog_advance, "aPos");
	gl.enableVertexAttribArray(geometry.aPosLoc);
	geometry.aTexLoc = gl.getAttribLocation(prog_advance, "aTexCoord");
	gl.enableVertexAttribArray(geometry.aTexLoc);
	geometry.texCoordOffset = geometry.vertices.byteLength;
	gl.bufferData(gl.ARRAY_BUFFER, geometry.texCoordOffset + geometry.texCoords.byteLength, gl.STATIC_DRAW);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, geometry.vertices);
	gl.bufferSubData(gl.ARRAY_BUFFER, geometry.texCoordOffset, geometry.texCoords);
	setGeometryVertexAttribPointers(geometry);
}

function setGeometryVertexAttribPointers(geometry) {
	gl.vertexAttribPointer(geometry.aPosLoc, geometry.vertexSize, gl.FLOAT, gl.FALSE, 0, 0);
	gl.vertexAttribPointer(geometry.aTexLoc, 2, gl.FLOAT, gl.FALSE, 0, geometry.texCoordOffset);
}

createTexturedGeometryBuffer(triangleStripGeometry);

// framebuffers and textures

var FBO_main = gl.createFramebuffer();
var FBO_main2 = gl.createFramebuffer();
var FBO_noise = gl.createFramebuffer();
var FBO_blur = gl.createFramebuffer();
var FBO_blur2 = gl.createFramebuffer();
var FBO_blur3 = gl.createFramebuffer();
var FBO_blur4 = gl.createFramebuffer();
var FBO_helper = gl.createFramebuffer();
var FBO_helper2 = gl.createFramebuffer();
var FBO_helper3 = gl.createFramebuffer();
var FBO_helper4 = gl.createFramebuffer();
var FBO_google_logo = gl.createFramebuffer();
var FBO_input_matrix = gl.createFramebuffer();
var FBO_processed_input = gl.createFramebuffer();
var FBO_processed_input2 = gl.createFramebuffer();
var FBO_processed_input_blur = gl.createFramebuffer();
var FBO_processed_input_blur2 = gl.createFramebuffer();
var FBO_processed_input_blur3 = gl.createFramebuffer();
var FBO_processed_input_blur4 = gl.createFramebuffer();
var FBO_fluid_v = gl.createFramebuffer();
var FBO_fluid_p = gl.createFramebuffer();
var FBO_fluid_backbuffer = gl.createFramebuffer();

var toHalf = (function () {
	var floatView = new Float32Array(1);
	var int32View = new Int32Array(floatView.buffer);

	return function toHalf(fval) {
		floatView[0] = fval;
		var fbits = int32View[0];
		var sign = (fbits >> 16) & 0x8000;
		var val = (fbits & 0x7fffffff) + 0x1000;
		if (val >= 0x47800000) {
			if ((fbits & 0x7fffffff) >= 0x47800000) {
				if (val < 0x7f800000) {
					return sign | 0x7c00;
				}
				return sign | 0x7c00 |
						(fbits & 0x007fffff) >> 13;
			}
			return sign | 0x7bff;
		}
		if (val >= 0x38800000) {
			return sign | val - 0x38000000 >> 13;
		}
		if (val < 0x33000000) {
			return sign;
		}
		val = (fbits & 0x7fffffff) >> 23;
		return sign | ((fbits & 0x7fffff | 0x800000)
				 + (0x800000 >>> val - 102)
				 >> 126 - val);
	};
}());

var noisePixels = [], pixels = [], pixels2 = [], pixels3 = [], pixels4 = [], simpixels = [];
for (var j = 0; j < sizeY; j++) {
	for (var i = 0; i < sizeX; i++) {
		noisePixels.push(toHalf(Math.random()), toHalf(Math.random()), toHalf(Math.random()), toHalf(Math.random()));
		pixels.push(0, 0, 0, 1);
		if (i < sizeX / simScale && j < sizeY / simScale)
			simpixels.push(0, 0, 0, 1);
		if (i < sizeX / 2 && j < sizeY / 2)
			pixels2.push(0, 0, 0, 1);
		if (i < sizeX / 4 && j < sizeY / 4)
			pixels3.push(0, 0, 0, 1);
		if (i < sizeX / 8 && j < sizeY / 8)
			pixels4.push(0, 0, 0, 1);
	}
}

function createAndBindTexture(glPixels, scale, fbo, filter) {
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sizeX / scale, sizeY / scale, 0, gl.RGBA, gl.OES_texture_half_float.HALF_FLOAT_OES, glPixels);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	return texture;
}

function createAndBindSimulationTexture(glPixels, fbo) {
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sizeX / simScale, sizeY / simScale, 0, gl.RGBA, gl.OES_texture_half_float.HALF_FLOAT_OES, glPixels);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	return texture;
}

var texture_main = createAndBindTexture(new Uint16Array(pixels), 1, FBO_main, gl.LINEAR);
var texture_main2 = createAndBindTexture(new Uint16Array(pixels), 1, FBO_main2, gl.LINEAR);
var texture_blur = createAndBindTexture(new Uint16Array(pixels), 1, FBO_blur, gl.LINEAR);
var texture_blur2 = createAndBindTexture(new Uint16Array(pixels2), 2, FBO_blur2, gl.LINEAR);
var texture_blur3 = createAndBindTexture(new Uint16Array(pixels3), 4, FBO_blur3, gl.LINEAR);
var texture_blur4 = createAndBindTexture(new Uint16Array(pixels4), 8, FBO_blur4, gl.LINEAR);
var texture_google_logo = createAndBindTexture(new Uint16Array(pixels), 1, FBO_google_logo, gl.LINEAR);
var texture_input_matrix = createAndBindTexture(new Uint16Array(pixels), 1, FBO_input_matrix, gl.LINEAR);
var texture_processed_input = createAndBindTexture(new Uint16Array(pixels), 1, FBO_processed_input, gl.LINEAR);
var texture_processed_input2 = createAndBindTexture(new Uint16Array(pixels), 1, FBO_processed_input2, gl.LINEAR);
var texture_processed_input_blur = createAndBindTexture(new Uint16Array(pixels), 1, FBO_processed_input_blur, gl.LINEAR);
var texture_processed_input_blur2 = createAndBindTexture(new Uint16Array(pixels2), 2, FBO_processed_input_blur2, gl.LINEAR);
var texture_processed_input_blur3 = createAndBindTexture(new Uint16Array(pixels3), 4, FBO_processed_input_blur3, gl.LINEAR);
var texture_processed_input_blur4 = createAndBindTexture(new Uint16Array(pixels4), 8, FBO_processed_input_blur4, gl.LINEAR);
var texture_fluid_v = createAndBindSimulationTexture(new Uint16Array(simpixels), FBO_fluid_v);
var texture_fluid_p = createAndBindSimulationTexture(new Uint16Array(simpixels), FBO_fluid_p);
var texture_fluid_backbuffer = createAndBindSimulationTexture(new Uint16Array(simpixels), FBO_fluid_backbuffer);
var texture_helper = createAndBindTexture(new Uint16Array(pixels), 1, FBO_helper, gl.NEAREST);
var texture_helper2 = createAndBindTexture(new Uint16Array(pixels2), 2, FBO_helper2, gl.NEAREST);
var texture_helper3 = createAndBindTexture(new Uint16Array(pixels3), 4, FBO_helper3, gl.NEAREST);
var texture_helper4 = createAndBindTexture(new Uint16Array(pixels4), 8, FBO_helper4, gl.NEAREST);
var texture_noise = createAndBindTexture(new Uint16Array(noisePixels), 1, FBO_noise, gl.LINEAR);

gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, texture_blur);
gl.activeTexture(gl.TEXTURE2);
gl.bindTexture(gl.TEXTURE_2D, texture_blur2);
gl.activeTexture(gl.TEXTURE3);
gl.bindTexture(gl.TEXTURE_2D, texture_blur3);
gl.activeTexture(gl.TEXTURE4);
gl.bindTexture(gl.TEXTURE_2D, texture_blur4);

gl.activeTexture(gl.TEXTURE6);
gl.bindTexture(gl.TEXTURE_2D, texture_processed_input_blur);
gl.activeTexture(gl.TEXTURE7);
gl.bindTexture(gl.TEXTURE_2D, texture_processed_input_blur2);
gl.activeTexture(gl.TEXTURE8);
gl.bindTexture(gl.TEXTURE_2D, texture_processed_input_blur3);
gl.activeTexture(gl.TEXTURE9);
gl.bindTexture(gl.TEXTURE_2D, texture_processed_input_blur4);

gl.activeTexture(gl.TEXTURE10);
gl.bindTexture(gl.TEXTURE_2D, texture_noise);

gl.activeTexture(gl.TEXTURE11);
gl.bindTexture(gl.TEXTURE_2D, texture_fluid_v);
gl.activeTexture(gl.TEXTURE12);
gl.bindTexture(gl.TEXTURE_2D, texture_fluid_p);

gl.activeTexture(gl.TEXTURE13);
gl.bindTexture(gl.TEXTURE_2D, texture_input_matrix);

gl.activeTexture(gl.TEXTURE14);
gl.bindTexture(gl.TEXTURE_2D, texture_google_logo);

// rendering

function blacken(fbo) {
	gl.viewport(0, 0, sizeX, sizeY);
	gl.useProgram(prog_black);
	renderAsTriangleStrip(fbo);
}

function fluidInit(fbo) {
	gl.viewport(0, 0, sizeX / simScale, sizeY / simScale);
	gl.useProgram(prog_black);
	renderAsTriangleStrip(fbo);
}

function setUniforms(program) {
	gl.uniform4f(gl.getUniformLocation(program, "rnd"), Math.random(), Math.random(), Math.random(), Math.random());
	gl.uniform2f(gl.getUniformLocation(program, "texSize"), sizeX, sizeY);
	gl.uniform2f(gl.getUniformLocation(program, "pixelSize"), 1. / sizeX, 1. / sizeY);
	gl.uniform2f(gl.getUniformLocation(program, "aspect"), aspectx, aspecty);
	gl.uniform1f(gl.getUniformLocation(program, "simScale"), simScale);
	gl.uniform2f(gl.getUniformLocation(program, "offset"), offsetX, offsetY);
	gl.uniform1f(gl.getUniformLocation(program, "time"), time / 1000);
	gl.uniform1f(gl.getUniformLocation(program, "frame"), framecount);
	gl.uniform1i(gl.getUniformLocation(program, "sampler_prev"), 0);
	gl.uniform1i(gl.getUniformLocation(program, "sampler_blur"), 1);
	gl.uniform1i(gl.getUniformLocation(program, "sampler_blur2"), 2);
	gl.uniform1i(gl.getUniformLocation(program, "sampler_blur3"), 3);
	gl.uniform1i(gl.getUniformLocation(program, "sampler_blur4"), 4);
	gl.uniform1i(gl.getUniformLocation(program, "sampler_processed_input"), 5);
	gl.uniform1i(gl.getUniformLocation(program, "sampler_processed_input_blur"), 6);
	gl.uniform1i(gl.getUniformLocation(program, "sampler_processed_input_blur2"), 7);
	gl.uniform1i(gl.getUniformLocation(program, "sampler_processed_input_blur3"), 8);
	gl.uniform1i(gl.getUniformLocation(program, "sampler_processed_input_blur4"), 9);
	gl.uniform1i(gl.getUniformLocation(program, "sampler_noise"), 10);
	gl.uniform1i(gl.getUniformLocation(program, "sampler_fluid"), 11);
	gl.uniform1i(gl.getUniformLocation(program, "sampler_fluid_p"), 12);
	gl.uniform1i(gl.getUniformLocation(program, "sampler_input_matrix"), 13);
	gl.uniform1i(gl.getUniformLocation(program, "sampler_google_logo"), 14);
}

function useGeometry(geometry) {
	gl.bindBuffer(gl.ARRAY_BUFFER, geometry.buffer);
	setGeometryVertexAttribPointers(geometry);
}

function renderGeometry(geometry, targetFBO) {
	useGeometry(geometry);
	gl.bindFramebuffer(gl.FRAMEBUFFER, targetFBO);
	gl.drawArrays(geometry.type, 0, geometry.vertexCount);
	gl.flush();
}

function renderAsTriangleStrip(targetFBO) {
	renderGeometry(triangleStripGeometry, targetFBO);
}

function calculateInputBlurTextures() {
	var srcTex = (bufferToggle < 0) ? texture_processed_input2 : texture_processed_input;
	calculateBlurTexture(srcTex, texture_processed_input_blur, FBO_processed_input_blur, texture_helper, FBO_helper, 1);
	calculateBlurTexture(texture_processed_input_blur, texture_processed_input_blur2, FBO_processed_input_blur2, texture_helper2, FBO_helper2, 2);
	calculateBlurTexture(texture_processed_input_blur2, texture_processed_input_blur3, FBO_processed_input_blur3, texture_helper3, FBO_helper3, 4);
	calculateBlurTexture(texture_processed_input_blur3, texture_processed_input_blur4, FBO_processed_input_blur4, texture_helper4, FBO_helper4, 8);
}

function calculateMainBlurTextures() {
	var srcTex = (bufferToggle < 0) ? texture_main2 : texture_main;
	calculateBlurTexture(srcTex, texture_blur, FBO_blur, texture_helper, FBO_helper, 1);
	calculateBlurTexture(texture_blur, texture_blur2, FBO_blur2, texture_helper2, FBO_helper2, 2);
	calculateBlurTexture(texture_blur2, texture_blur3, FBO_blur3, texture_helper3, FBO_helper3, 4);
	calculateBlurTexture(texture_blur3, texture_blur4, FBO_blur4, texture_helper4, FBO_helper4, 8);
}

function calculateBlurTexture(sourceTex, targetTex, targetFBO, helperTex, helperFBO, scale) {
	// copy source
	gl.viewport(0, 0, sizeX / scale, sizeY / scale);
	gl.useProgram(prog_copy);
	gl.uniform1i(gl.getUniformLocation(prog_copy, "src_tex"), 0);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, sourceTex);
	renderAsTriangleStrip(targetFBO);

	// blur vertically
	gl.viewport(0, 0, sizeX / scale, sizeY / scale);
	gl.useProgram(prog_blur_vertical);
	gl.uniform1i(gl.getUniformLocation(prog_blur_vertical, "src_tex"), 0);
	gl.uniform2f(gl.getUniformLocation(prog_blur_vertical, "pixelSize"), scale / sizeX, scale / sizeY);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, targetTex);
	renderAsTriangleStrip(helperFBO);

	// blur horizontally
	gl.viewport(0, 0, sizeX / scale, sizeY / scale);
	gl.useProgram(prog_blur_horizontal);
	gl.uniform1i(gl.getUniformLocation(prog_blur_horizontal, "src_tex"), 0);
	gl.uniform2f(gl.getUniformLocation(prog_blur_horizontal, "pixelSize"), scale / sizeX, scale / sizeY);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, helperTex);
	renderAsTriangleStrip(targetFBO);
}

// fluid simulation
function fluidSimulationStep() {
	add_fluid_input();
	advect();
	diffuse();
}

function add_fluid_input() {
	gl.viewport(0, 0, (sizeX / simScale), (sizeY / simScale));
	gl.useProgram(prog_fluid_add_input);
	setUniforms(prog_fluid_add_input);
	renderAsTriangleStrip(FBO_fluid_backbuffer);
}

function advect() {
	gl.viewport(0, 0, (sizeX / simScale), (sizeY / simScale));
	gl.useProgram(prog_fluid_advect);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture_fluid_backbuffer);
	gl.uniform2f(gl.getUniformLocation(prog_fluid_advect, "pixelSize"), 1. / (sizeX / simScale), 1. / (sizeY / simScale));
	gl.uniform2f(gl.getUniformLocation(prog_fluid_advect, "texSize"), (sizeX / simScale), (sizeY / simScale));
	gl.uniform1i(gl.getUniformLocation(prog_fluid_advect, "sampler_fluid"), 0);
	renderAsTriangleStrip(FBO_fluid_v);
}

function diffuse() {
	for (var i = 0; i < 8; i++) {
		gl.viewport(0, 0, (sizeX / simScale), (sizeY / simScale));
		gl.useProgram(prog_fluid_p);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture_fluid_v);
		gl.activeTexture(gl.TEXTURE15);
		gl.bindTexture(gl.TEXTURE_2D, texture_fluid_p);
		gl.uniform2f(gl.getUniformLocation(prog_fluid_p, "texSize"), (sizeX / simScale), (sizeY / simScale));
		gl.uniform2f(gl.getUniformLocation(prog_fluid_p, "pixelSize"), 1. / (sizeX / simScale), 1. / (sizeY / simScale));
		gl.uniform1i(gl.getUniformLocation(prog_fluid_p, "sampler_v"), 0);
		gl.uniform1i(gl.getUniformLocation(prog_fluid_p, "sampler_p"), 15);
		renderAsTriangleStrip(FBO_fluid_backbuffer);

		gl.viewport(0, 0, (sizeX / simScale), (sizeY / simScale));
		gl.useProgram(prog_fluid_p);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture_fluid_v);
		gl.activeTexture(gl.TEXTURE15);
		gl.bindTexture(gl.TEXTURE_2D, texture_fluid_backbuffer);
		gl.uniform2f(gl.getUniformLocation(prog_fluid_p, "texSize"), (sizeX / simScale), (sizeY / simScale));
		gl.uniform2f(gl.getUniformLocation(prog_fluid_p, "pixelSize"), 1. / (sizeX / simScale), 1. / (sizeY / simScale));
		gl.uniform1i(gl.getUniformLocation(prog_fluid_p, "sampler_v"), 0);
		gl.uniform1i(gl.getUniformLocation(prog_fluid_p, "sampler_p"), 15);
		renderAsTriangleStrip(FBO_fluid_p);
	}
	gl.viewport(0, 0, (sizeX / simScale), (sizeY / simScale));
	gl.useProgram(prog_fluid_div);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture_fluid_v);
	gl.activeTexture(gl.TEXTURE15);
	gl.bindTexture(gl.TEXTURE_2D, texture_fluid_p);
	gl.uniform2f(gl.getUniformLocation(prog_fluid_div, "texSize"), (sizeX / simScale), (sizeY / simScale));
	gl.uniform2f(gl.getUniformLocation(prog_fluid_div, "pixelSize"), 1. / (sizeX / simScale), 1. / (sizeY / simScale));
	gl.uniform1i(gl.getUniformLocation(prog_fluid_div, "sampler_v"), 0);
	gl.uniform1i(gl.getUniformLocation(prog_fluid_div, "sampler_p"), 15);
	renderAsTriangleStrip(FBO_fluid_backbuffer);

	gl.viewport(0, 0, (sizeX / simScale), (sizeY / simScale));
	gl.useProgram(prog_copy);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture_fluid_backbuffer);
	gl.uniform1i(gl.getUniformLocation(prog_copy, "src_tex"), 0);
	renderAsTriangleStrip(FBO_fluid_v);
}

// animation

function processInput() {
	gl.viewport(0, 0, sizeX, sizeY);
	gl.useProgram(prog_process_input);
	setUniforms(prog_process_input);
	if (bufferToggle > 0) {
		gl.activeTexture(gl.TEXTURE5);
		gl.bindTexture(gl.TEXTURE_2D, texture_processed_input);
		renderAsTriangleStrip(FBO_processed_input2);
	} else {
		gl.activeTexture(gl.TEXTURE5);
		gl.bindTexture(gl.TEXTURE_2D, texture_processed_input2);
		renderAsTriangleStrip(FBO_processed_input);
	}
	calculateInputBlurTextures();
}

function advance() {
	gl.viewport(0, 0, sizeX, sizeY);
	gl.useProgram(prog_advance);
	setUniforms(prog_advance);
	if (bufferToggle > 0) {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture_main);
		renderAsTriangleStrip(FBO_main2);
	} else {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture_main2);
		renderAsTriangleStrip(FBO_main);
	}
	bufferToggle = -bufferToggle;
	calculateMainBlurTextures();
}

function composite() {
	gl.viewport(0, 0, anypixel.config.width, anypixel.config.height);
	gl.useProgram(prog_composite);
	setUniforms(prog_composite);
	if (bufferToggle < 0) {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture_main);
		gl.activeTexture(gl.TEXTURE5);
		gl.bindTexture(gl.TEXTURE_2D, texture_processed_input);
	} else {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture_main2);
		gl.activeTexture(gl.TEXTURE5);
		gl.bindTexture(gl.TEXTURE_2D, texture_processed_input2);
	}
	renderAsTriangleStrip(null);
}

function updateInputTexture() {
	gl.activeTexture(gl.TEXTURE13);
	gl.bindTexture(gl.TEXTURE_2D, texture_input_matrix);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, inputMap);
	gl.bindTexture(gl.TEXTURE_2D, texture_input_matrix);
	gl.bindFramebuffer(gl.FRAMEBUFFER, FBO_input_matrix);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture_input_matrix, 0);
}

function updateGoogleLogo() {
	if (gl) {
		gl.activeTexture(gl.TEXTURE14);
		gl.bindTexture(gl.TEXTURE_2D, texture_google_logo);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, googleLogo);
		gl.bindTexture(gl.TEXTURE_2D, texture_google_logo);
		gl.bindFramebuffer(gl.FRAMEBUFFER, FBO_google_logo);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture_google_logo, 0);
	}
}

var aspectx = Math.max(1, sizeX / sizeY);
var aspecty = Math.max(1, sizeY / sizeX);

var framecount = 0;
var bufferToggle = 1;
var time, starttime = new Date().getTime();

function advanceWebGL() {
	time = new Date().getTime() - starttime;
	updateInputTexture();
	processInput();
	fluidSimulationStep();
	advance();
	composite();
	framecount++;
}

// Main Loop

(function anim() {
	requestAnimationFrame(anim);
	advanceWebGL();
})();