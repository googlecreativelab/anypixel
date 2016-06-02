# Reaction
A simulation of two virtual chemicals interacting according to a set of simple rules. 

![preview](https://anypixel-storage.appspot.com/docs/preview-reaction.jpg)

**Code & Design:** Jeremy Abel

## How Does It Work?
This demo shows an interesting bit of emergent behavior called a **Reaction-Diffusion** system. A great layman's explanation can be found on Karl Sims's site [here](http://www.karlsims.com/rd.html). In this demo, the entire system is executed on the GPU, using a WebGL shader. Each time someone presses a button, a ripple is sent outwards, modifying the chemical concentrations in that area. To keep the display interesting, the values governing the simulation change slowly over time.

## Stuff To Try

#### Change the feed / kill values
In **app.js**, try changing the *f* and *k* values defined in the ```fkModes``` variable. Small changes can result in drastically different behaviors! Check out [this site](http://mrob.com/pub/comp/xmorphia/) by Robert Munafo, which catalogs the myriad changes caused by adjusting the *f* and *k* parameters.

#### Change the logo
In **app.js**, the Google logo is encoded as a base64 PNG in the ```logoImage``` variable. Any image will work, as long as the dimensions are powers of two. The default image is 256 x 64. Check out ```reactionFrag``` in **shaders.js** to see how the image is applied to the final output.

## More Info
- [Karl Sims's Reaction Diffusion Tutorial](http://www.karlsims.com/rd.html) - An outstanding tutorial on the Reaction-Diffusion system
- [Rob Munafo's Reaction-Diffusion Page](http://mrob.com/pub/comp/xmorphia/) - Fascinating in-depth look at the wide variety of behaviors seen within the Reaction-Diffusion system.
- [Emergence](https://en.wikipedia.org/wiki/Emergence) - Wikipedia article about the concept of complex patterns arising from simple systems.
