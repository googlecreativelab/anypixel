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

var path       = require('path');
var http       = require('http');
var fs         = require('fs');
var express    = require('express');
var bodyParser = require('body-parser');
var app        = express();

/**
 * An Express server which hosts the current Anypixel app and provides a RESTful api with functions 
 * for changing the current app and getting a list of all available apps.
 */

// Express config
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Start the server on port 8000
var server = http.createServer(app).listen(8000, function() {
  console.log('AnyPixel AppServer | Listening on port ' + server.address().port);
});


/**
 * Serves a requested app with a given app_name
 */
app.get('/app/:app_name', function(req, res) {
  // Check if app exists
  var dir_name = req.params.app_name;
  var filename = path.join(__dirname, 'public', 'apps', dir_name, 'index.js');
  if (!fs.existsSync(filename)) {
    console.log('Invalid app name: ' + dir_name);
    return res.status(404).send('Invalid app name');
  }

  console.log('Serving: ' + req.params.app_name);

  // Render
  res.render('app', {
    layout: false,
    app: {
      name: req.params.app_name,
      base: '/apps/' + dir_name + '/',
      path: 'index.js'
    }
  });
});

/**
 * Returns an alphabetical list of all valid apps in the /public/apps directory
 * Valid apps must contain a package.json file with the display_name parameter set.
 */
app.get('/api/apps', function(req, res) {
  // List all available apps
  var apps_root_path = path.join(__dirname, 'public', 'apps');
  
  fs.readdir(apps_root_path, function(err, dirs) {
    
    // Filter out system directories (/.git, for example)
    dirs = dirs.filter(function(val) {
      return !(val.substr(0, 1) == '.');
    });

    // For each directory, get the app name from the package.json file
    var apps = [];
    dirs.forEach(function(dir) {
      var package_json_path = path.join(apps_root_path, dir, 'package.json');
      try {
        var app_desc = JSON.parse(fs.readFileSync(package_json_path, 'utf8'));
        apps.push({
          name: app_desc.display_name,
          path: dir
        });
      } catch(e) {}
    });

    // Sort alphabetically
    apps = apps.sort(function(a, b) {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });

    // Return success
    res.json({
      success: true, 
      apps: apps
    });
  });
});