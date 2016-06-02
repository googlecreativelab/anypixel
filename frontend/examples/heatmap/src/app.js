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

var gl = require('./gl');
var Texture = require('../third_party/texture');
var FBO = Texture.FBO;
var Shader = require('./shader');
var ComputeKernel = require('../third_party/compute');
var eventCanvas = require('./event-canvas');
var Geometry = require('./geometry');
var imgData = require('./img-data');
var src = require('./shader-source');

var inside, all;

var velocityFBO0,
		velocityFBO1,
		temperatureFBO,
		divergenceFBO,
		vorticityFBO,
		vorticityForceFBO,
		pressureFBO0,
		pressureFBO1,
		densityFBO0,
		densityFBO1;

var advectVelocityKernel,
		advectDensityKernel,
		copyDensityKernel,
		addDensityKernel,
		divergenceKernel,
		vorticityKernel,
		vorticityForceKernel,
		jacobiKernel,
		pressureGradientKernel,
		temperatureKernel,
		dyeCopyKernel,
		drawKernel;

var logoImage,
		paletteImage,
		logoDensityTexture,
		buttonDensityTexture,
		densityGradientTexture;

var step = 1 / 60,
		iterations = 64,
		diffusion = 0.999,
		scale = 1.0,
		alpha = -1.0,
		beta = 0.25,
		curl = 0.035,
		scaleTemp = 0.01,
		massTemp = 0.01,
		typeAmount = 0.7;

// Texture dimensions
var sizeX = anypixel.config.width + 1,
		sizeY = anypixel.config.height + 1;

var px = [1 / sizeX, 1 / sizeY];
var px1 = [1, sizeX / sizeY];

var ctx;

document.addEventListener('DOMContentLoaded', function() {
	gl.viewport(0, 0, sizeX, sizeY);

	ctx = anypixel.canvas.getContext2D();

	// Enable floating point textures
	gl.getExtension('OES_texture_float');
	gl.getExtension('OES_texture_float_linear');

	// Geometry: 1 grid cell inside the borders
	inside = new Geometry(new Geometry.FullscreenQuad(1 - px[0] * 2, 1 - px[1] * 2));

	// Geometry: everything
	all = new Geometry(new Geometry.FullscreenQuad(1, 1));

	velocityFBO0   		= new FBO(sizeX, sizeY, gl.FLOAT);
	velocityFBO1   		= new FBO(sizeX, sizeY, gl.FLOAT);
	temperatureFBO 		= new FBO(sizeX, sizeY, gl.FLOAT);
	pressureFBO0   		= new FBO(sizeX, sizeY, gl.FLOAT);
	pressureFBO1   		= new FBO(sizeX, sizeY, gl.FLOAT);
	divergenceFBO  		= new FBO(sizeX, sizeY, gl.FLOAT);
	vorticityFBO   		= new FBO(sizeX, sizeY, gl.FLOAT);
	vorticityForceFBO = new FBO(sizeX, sizeY, gl.FLOAT);
	densityFBO0 	 		= new FBO(sizeX, sizeY, gl.FLOAT);
	densityFBO1 	 		= new FBO(sizeX, sizeY, gl.FLOAT);

	// Load logo image
	logoImage = new Image();
	logoImage.src = imgData.logo;

	// Load palette
	paletteImage = new Image();
	paletteImage.src = imgData.scaleRainbow3;

	eventCanvas.init(0.97);

	densityGradientTexture = new Texture(paletteImage);
	buttonDensityTexture = new Texture(eventCanvas.getCanvas());
	logoDensityTexture = new Texture(logoImage, {
		mag_filter: gl.NEAREST,
		min_filter: gl.NEAREST
	});

	// Advect the velocity 
	advectVelocityKernel = new ComputeKernel({
		shader: new Shader(src.kernelVert, src.advectFrag),
		geometry: inside,
		uniforms: {
			'velocity': {type: 't', value: velocityFBO0},
			'source': {type: 't', value: velocityFBO0},
			'scale': {type: '1f', value: scale * diffusion},
			'px': {type: '2f', value: px1},
			'dt': {type: '1f', value: step}
		},
		output: velocityFBO1
	});

	copyDensityKernel = new ComputeKernel({
		shader: new Shader(src.kernelVert, src.copyFrag),
		geometry: inside,
		uniforms: {
			'source': {type: 't', value: densityFBO0},
		},
		output: densityFBO1
	});

	addDensityKernel = new ComputeKernel({
		shader: new Shader(src.kernelVert, src.cursorTempFrag),
		geometry: inside,
		uniforms: {
			'density': {type: 't', value: densityFBO1},
			'cursor': {type: 't', value: buttonDensityTexture}
		},
		output: densityFBO0
	});

	temperatureKernel = new ComputeKernel({
		shader: new Shader(src.kernelVert, src.temperatureFrag),
		geometry: inside,
		blend: 'add',
		uniforms: {
			'typeImage': {type: 't', value: logoDensityTexture},
			'density': {type: 't', value: densityFBO0},
			'scale': {type: '1f', value: scaleTemp},
			'mass': {type: '1f', value: massTemp}
		},
		output: velocityFBO1
	});

	vorticityKernel = new ComputeKernel({
		shader: new Shader(src.kernelVert, src.vorticityFrag),
		geometry: inside,
		uniforms: {
			'velocity': {type: 't', value: velocityFBO1},
			'px': {type: '2f', value: px}
		},
		output: vorticityFBO
	});

	vorticityForceKernel = new ComputeKernel({
		shader: new Shader(src.kernelVert, src.vorticityForceFrag),
		geometry: inside,
		uniforms: {
			'vorticity': {type: 't', value: vorticityFBO},
			'velocity': {type: 't', value: velocityFBO1},
			'px': {type: '2f', value: px},
			'dx': {type: '2f', value: [curl, curl]},
			'dt': {type: '1f', value: step}
		},
		output: vorticityForceFBO
	});

	divergenceKernel = new ComputeKernel({
		shader: new Shader(src.kernelVert, src.divergenceFrag),
		geometry: all,
		uniforms: {
			'velocity': {type: 't', value: vorticityForceFBO},
			'px': {type: '2f', value: px}
		},
		output: divergenceFBO
	});

	jacobiKernel = new ComputeKernel({
		shader: new Shader(src.kernelVert, src.jacobiFrag),
		geometry: all,
		unbind: false,
		uniforms: {
			'pressure': {type: 't', value: pressureFBO0},
			'divergence': {type: 't', value: divergenceFBO},
			'alpha': {type: '1f', value: alpha},
			'beta': {type: '1f', value: beta},
			'px': {type: '2f', value: px}
		},
		output: pressureFBO1
	});

	pressureGradientKernel = new ComputeKernel({
		shader: new Shader(src.kernelVert, src.pressureFrag),
		geometry: all,
		uniforms: {
			'pressure': {type: 't', value: pressureFBO0},
			'velocity': {type: 't', value: velocityFBO1},
			'scale': {type: '1f', value: scale},
			'px': {type: '2f', value: px}
		},
		output: velocityFBO0
	});

	advectDensityKernel = new ComputeKernel({
		shader: new Shader(src.kernelVert, src.advectFrag),
		geometry: inside,
		uniforms: {
			'velocity': {type: 't', value: velocityFBO0},
			'source': {type: 't', value: densityFBO0},
			'scale': {type: '1f', value: scale},
			'px': {type: '2f', value: px1},
			'dt': {type: '1f', value: step}
		},
		output: densityFBO1
	});

	dyeCopyKernel = new ComputeKernel({
		shader: new Shader(src.kernelVert, src.copyFrag),
		geometry: all,
		uniforms: {
			'source': {type: 't', value: densityFBO1},
		},
		output: densityFBO0
	});

	drawKernel = new ComputeKernel({
		shader: new Shader(src.kernelVert, src.visualizeFrag),
		geometry: all,
		uniforms: {
			'source': {type: 't', value: densityFBO0},
			'typeImage': {type: 't', value: logoDensityTexture},
			'colorLookup': {type: 't', value: densityGradientTexture},
			'typeAmount': {type: '1f', value: typeAmount},
			'px': {type: '2f', value: px}
		},
		output: null
	});

	window.requestAnimationFrame(update);
});


function update(t) {
	buttonDensityTexture.update(eventCanvas.getCanvas());
	logoDensityTexture.update(logoImage);

	advectVelocityKernel.run();
	copyDensityKernel.run();
	addDensityKernel.run();
	temperatureKernel.run();

	vorticityKernel.run();
	vorticityForceKernel.run();

	divergenceKernel.run();

	var p0 = pressureFBO0,
			p1 = pressureFBO1,
			p = p0;

	for (var i = 0; i < iterations; i++) {
		jacobiKernel.uniforms.pressure.value = p0
		jacobiKernel.outputFBO = p1;
		jacobiKernel.run();

		p = p0;
		p0 = p1;
		p1 = p;
	}

	pressureGradientKernel.run();
	advectDensityKernel.run();
	dyeCopyKernel.run();
	drawKernel.run();

	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(gl.canvas, -1, -1, gl.canvas.width + 2, gl.canvas.height + 3);

	window.requestAnimationFrame(update);
}
