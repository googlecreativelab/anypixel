// From https://github.com/jwagner/fluidwebgl/blob/master/src/compute.js

var gl = require('../src/gl');

var ComputeKernel = module.exports = function(options) {
  this.shader = options.shader;
  this.geometry = options.geometry;
  this.uniforms = options.uniforms;
  this.outputFBO = options.output;
  this.blend = options.blend;
  this.unbind = options.unbind === undefined ? true : options.unbind;

  var uniformsArr = Object.keys(this.uniforms).map(function(k) { return this.uniforms[k]; }, this);
  this.textures = uniformsArr.filter(function(u) { return u.type === 't'; });
}

ComputeKernel.prototype.run = function() {
  // Bind FBO
  if (this.outputFBO) {
    this.outputFBO.bind();
  }

  // Bind textures
  this.textures.forEach(function(t, i) {
    t.value.bindTexture(i);
  });

  // Set shader uniforms
  this.shader.setUniforms(this.uniforms);

  // Set blend mode
  if (this.blend === 'add') {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);
  } else {
    gl.disable(gl.BLEND);
  }

  // Render
  this.geometry.renderWithShader(this.shader);

  // Unbind FBO
  if (this.outputFBO && !this.nounbind) {
    this.outputFBO.unbind();
  }

  // Unbind textures
  this.textures.forEach(function(t) {
    t.value.unbindTexture();
  });
};