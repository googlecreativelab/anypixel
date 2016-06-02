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

/**
 * The base class for modal windows, which are windows that are overlayed ontop of the main
 * interface and block all events outside of the window. By default, a modal window can be closed 
 * by pressing the ESC key or by clicking outside the window.
 */
var Modal = module.exports = function(id) {
	this.el = document.getElementById(id);
	this.clickBehindToHide = true;
	this.escapeToHide = true;
	this.isShowing = false;

	// Close the modal if the background is clicked
	this.el.addEventListener('click', this.onContainerClicked.bind(this));

	// Prevent clicks on the modal content from bubbling up to the container
	this.el.firstElementChild.addEventListener('click', this.onContentClicked.bind(this));

	// Close the modal if the escape key is pressed
	document.addEventListener('keydown', this.onEscapeKeyDown.bind(this));
}

/**
 * Shows the modal window
 */
Modal.prototype.show = function() {
	this.el.style.display = 'inherit';
	this.isShowing = true;
}

/**
 * Hides the modal window
 */
Modal.prototype.hide = function() {
	this.el.style.display = 'none';
	this.isShowing = false;
}

/**
 * Listener for modal container clicks. Hides the modal.
 */
Modal.prototype.onContainerClicked = function(e) {
	if (this.clickBehindToHide) {
	  e.preventDefault();
	  this.hide();
	}
}

/**
 * Listener for modal content clicks. Stops the event from bubbling up to the container.
 */
Modal.prototype.onContentClicked = function(e) {
	if (this.clickBehindToHide) {
  	e.stopPropagation();
  }
}

/**
 * Listener for escape key presses. Hides the modal.
 */
Modal.prototype.onEscapeKeyDown = function(e) {
	if (this.isShowing && this.escapeToHide && e.keyCode == 27) {
		e.preventDefault();
		this.hide();
	}
}