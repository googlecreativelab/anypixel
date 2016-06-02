# Hyperspace
A leisurely flight through the cosmos, where you'll occasionally encounter a mysterious Google logo. Tap a button to generate a shower of stars. Hold the button for a few seconds, and you'll enter hyper speed!

![preview](https://anypixel-storage.appspot.com/docs/preview-hyperspace.jpg)

**Code:** Jeremy Abel

## How Does It Work?
The starfield effect is created by a rolling "treadmill" of very flat cylinders. When engaging the hyperspace effect, these cylinders are scaled on the z-axis to create the illusion of stars being [stretched](https://45.media.tumblr.com/4016d1d845c36f5a656cd1f5a66802cd/tumblr_nziwfc5qOG1sumfc7o1_500.gif).

The exploding letters are simple flat textured planes, but a special piece of geometry is used for each letter to determine where its exploding particles are placed. Each vertex of this geometry generates one exploding particle.

## Stuff To Try

#### Change the shape / material of the stars
In **star.js**, you can change the ```geo``` and ```mat``` variables to any [threejs](threejs.org) geometry or material object. 

#### Change the logo
In **letter-manager.js**, you can change the properties in ```letterProperties``` to change the images and meshes used for the letter textures and explosion meshes.
