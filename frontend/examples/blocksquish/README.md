# Blocksquish
The Google logo, rendered as giant squishy rectangles.

![preview](https://anypixel-storage.appspot.com/docs/preview-blocksquish.jpg)


**Code:** Jeremy Abel
<br />
**Typography:** Andrew Herzog

## How Does It Work?
Each rectangle is defined as a width, a height, and a set of lines. The width of each rectangle is normalized between 0..1 such that the group of all rectangles can be scaled to fit any width. Increasing the size of one rectangle will cause the others to shrink to compensate. 

If someone is touching one of the rectangles, the height of that rectangle is determined by the most-vertical touch point within that rectangle. The height of untouched rectangles is the average of the heights of that rectangle's direct neighbors. The width and height values are attached to springs, which give a nice bouncy motion. 

The line coordinates are stored as ratios of the original width and height. By storing the lines as ratios, they can be draw in the right position regardless of any changes to the rectangle's width and height caused by the springs.

## Stuff To Try

#### Change the letters
In **app.js**, you can change the number of rectangles, their widths, colors, and the lines that are drawn inside each rectangle. The lines are given as coordinates on a 140 x 42 grid, like so: ```[ [start x, start y], [end x, end y] ]```.

## More Info
- [Hooke's Law](https://en.wikipedia.org/wiki/Hooke%27s_law) - Wikipedia entry for Hooke's Law, which describes the mathematics behind springs.
