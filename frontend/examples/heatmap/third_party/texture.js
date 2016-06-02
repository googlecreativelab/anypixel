// From https://github.com/jwagner/fluidwebgl/blob/master/src/engine/gl/texture.js

var gl = require('../src/gl');
var extend = require('./utils').extend;

var Texture2D = module.exports = function(data, options) {
    this.texture = gl.createTexture();
    this.unit = -1;
    this.bound = false;

    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

    options = options || {};
    var format = options.format || gl.RGBA;
    var type = options.type || gl.FLOAT;

    gl.texImage2D(gl.TEXTURE_2D, 0, format, format, type, data);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.mag_filter || gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.min_filter || gl.LINEAR);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.wrap_s || gl.CLAMP_TO_EDGE);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.wrap_t || gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, null);
};


Texture2D.prototype = {
    bindTexture: function(unit) {
        if (!this.bound) {
            if (unit !== undefined) {
                this.unit = unit;
                gl.activeTexture(gl.TEXTURE0 + this.unit);
                
            }
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            this.bound = true;
        }
    },

    unbindTexture: function() { 
        if (this.bound) {
            gl.activeTexture(gl.TEXTURE0 + this.unit);
            gl.bindTexture(gl.TEXTURE_2D, null);
            this.unit = -1;
            this.bound = false;
        }
    },

    update: function(image) {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.FLOAT, image);
    },

    uniform: function(location) {
        gl.uniform1i(location, this.unit);
    },

    equals: function(value) {
        return this.unit === value;
    },

    set: function(obj, name) {
        obj[name] = this.unit;
    }
};


var FBO = module.exports.FBO = function(width, height, type, format, data) {
    this.width = width;
    this.height = height;

    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, format || gl.RGBA, width, height, 0, format || gl.RGBA, type || gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.depth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depth);
    this.supported = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.unit = -1;
};


FBO.prototype = extend({}, Texture2D.prototype, {
    bind: function() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    },

    unbind: function() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
});