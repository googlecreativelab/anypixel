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

var DisplayController = require('./display-controller');
var DisplayConfig = require('../../config/config.display');

/**
 * Class which manages the state and communication of the current Anypixel App being served by the
 * AppServer. This consists of a webview which displays the current app, and functionality for 
 * listing the available apps and switching the current app.
 *
 * All methods and properties here are static.
 */
var AppController = module.exports = {}

AppController.baseAppUrl = 'http://localhost:8000';

AppController.webviewEl = null;

AppController.ready = false;

AppController.availableApps = [];

AppController.currentApp = null;

AppController.pixelStreamingEnabled = true;

/**
 * Gets the webview that is used to display the current app and sets up listeners for communicating
 * with the webview
 */
AppController.initWebview = function(webviewID, debugApps) {
  AppController.webviewEl = document.getElementById(webviewID);
  
  if (AppController.webviewEl === null) {
    console.error('No webview with that ID found');
    return;
  }

  // Send a handshake message on successful load
  AppController.webviewEl.addEventListener('loadstop', function(e) {
    AppController.ready = true;
    AppController.sendMessage('handshake');
  });

  // For debugging, forward app messages to the console
  if (debugApps) {
    console.log('===== DEBUG MODE =====');

    AppController.webviewEl.addEventListener('loadabort', function(e) {
      console.log('Guest page logged a message: ', e.message);
    });
    
    AppController.webviewEl.addEventListener('consolemessage', function(e) {
      console.log("Line: " + e.line + "\nSource: " + e.sourceId + "\nMessage: " + e.message);
    });
  }

  // Subscribe to app post messages
  window.addEventListener('message', AppController.messageHandler);
};

/**
 * Pulls the list of apps from the AppServer at the endpoint url /api/apps, and triggers the 
 * ViewController to update the app list drop-down.
 */
AppController.getAvailableApps = function(switchToFirstApp) {
  fetch(AppController.baseAppUrl + '/api/apps', {
    method: 'get'
  }).then(function(response) {
    return response.json();
  }).then(function(json) {
    if (typeof json.success !== 'undefined' && json.success === true) {
      console.log('AppController: found ' + json.apps.length + ' apps');
      
      if (json.apps.length === 0) return;

      AppController.availableApps = json.apps;

      // Use an inline require here to avoid circular dependencies
      require('./view-controller').updateAppList();

      // If set, switch to the first app in the list
      if (switchToFirstApp) {
        var firstApp = AppController.availableApps[0];
        AppController.switchToApp(firstApp);
      }
    }
  });
}

/**
 * Loads a given app into the webview and updates the currentApp property
 */
AppController.switchToApp = function(app) {
  var appUrl = AppController.baseAppUrl + '/app/' + app.path;
  AppController.currentApp = app;
  AppController.webviewEl.setAttribute('src', appUrl);
  console.log('AppController: switching: ' + app.name + ', url: ' + appUrl);
}

/**
 * Returns an app object with a given path from the list of available apps. If no matching app is 
 * found, returns undefined.
 */
AppController.getAppFromPath = function(path) {
  return AppController.availableApps.find(function(app) {
    return app.path === path;
  });
}

/**
 * Reloads the current app
 */
AppController.reloadApp = function() {
  var appUrl = AppController.webviewEl.getAttribute('src');
  AppController.webviewEl.setAttribute('src', appUrl);
  console.log('AppController: reloading');
}

/**
 * Sends a given message to the webview via postMessage()
 */
AppController.sendMessage = function(message) {
  if (AppController.ready) {
    AppController.webviewEl.contentWindow.postMessage(message, '*');
  }
};

/**
 * Handles incoming messages
 */
AppController.messageHandler = function(event) {
  if (event && event.data) {
    var data8v = new Uint8Array(event.data);

    // Check that the header = 0 - pixel data
    if (data8v[0] == 0) {
      AppController.pixelHandler(event.data);
    }
  }
};

/**
 * Trys to update the DisplayController with given pixel data
 */
AppController.pixelHandler = function(data) {
  if (DisplayController && AppController.pixelStreamingEnabled) {
    DisplayController.updateFrame(data);
  }
};
