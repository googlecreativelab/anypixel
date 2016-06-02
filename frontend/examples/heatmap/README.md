# Heatmap
An interactive fluid and convection simulation. Touch a button to increase the temperature and watch the fluid curl around the Google logo.

![preview](https://anypixel-storage.appspot.com/docs/preview-heatmap.jpg)

**Code:** Jeremy Abel
<br />
**Typography:** Andrew Herzog

## How Does It Work?
#### The Simulation
The simulation an implementation of the work done by Mark Harris, outlined in his chapter *"[Fast Fluid Dynamics Simulation on the GPU](http://http.developer.nvidia.com/GPUGems/gpugems_ch38.html)"* in nVidia's [GPU Gems](https://developer.nvidia.com/gpugems) book, which in turn is based on Jos Stam's 1999 paper, *"[Stable Fluids](http://www.dgp.toronto.edu/people/stam/reality/Research/pdf/ns.pdf)"*.

#### Color
The colormaps are inspired by gradients used in scientific data visualization. After some tests, the [cubehelix](http://www.mrao.cam.ac.uk/~dag/CUBEHELIX/) palette and a grayscale palette looked the best. One of these is chosen randomly when the demo starts.

## Stuff To Try
#### Change the simulation parameters
In **app.js**, the parameters governing the simulation start with the ```step``` variable. These variables all work together, so changing one will probably cause some strange results unless the others are changed as well.

#### Change the color palette
In **img-data.js**, the color palettes are stored as a base64-encoded pngs. Image size doesn't matter, but the given palettes have a 1px height, since that's all that's needed. You can replace the logo image here as well.

## More Info
- [GPU Gems Ch. 38](http.developer.nvidia.com/GPUGems/gpugems_ch38.html) - Great article about the mathematics and code techniques behind shader-based fluid simulations. 
- [A Better Default Colormap for Matplotlib](https://www.youtube.com/watch?v=xAoljeRJ3lU) - Really interesting talk on colormaps in scientific data.
