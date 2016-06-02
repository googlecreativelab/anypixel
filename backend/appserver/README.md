# Backend - AppServer
AppServer is a node.js app which runs Anypixel apps from an [Express](http://expressjs.com/) server. This is what holds the canvas that your Anypixel app will draw on. Each frame it will send the pixel data from this canvas to ChromeBridge, where it will be sent on to the physical display itself. It also provides a RESTful API for changing the current app and for listing the available apps.

![img](https://github.com/googlecreativelab/anypixel/blob/master/backend/appserver/flow.png)

## Getting Started

1. **Install node components** - `$ npm install`

2. **Start the server** - `$ npm start`

To stop the server, do `$ npm stop` <br />

**To add your own apps:** <br />
Copy your app folder into `/public/apps` and make sure you have an index.js file in your root app directory.

## API

### Get App
Renders an HTML page containing the requested app.

* **URL:** <br />
  /app/:app_name

* **Method:** <br />
  `GET`

* **URL Parameters:** <br />
  `app_name=[string]`

* **Success Response:**
  * **Code:** 200 <br />
    **Content:** Rendered EJS template HTML containing the requested app.
    
* **Error Response:**
  * **Code:** 404 <br />
    **Content:** `Invalid app name`

### Get Available Apps
Returns an array of the valid app names and directories

* **URL:** <br />
  /api/apps

* **Method:** <br />
  `GET`

* **URL Parameters:** <br />
  None

* **Success Response:**
  * **Code:** 200 <br />
   **Content:** <br />
   ```
   {
	    success: true,
	    apps: [
		    {
			    name: "My App",
			    path: "myApp"
		    }
	   ]
   }
   ```

* **Error Response:** <br />
None
