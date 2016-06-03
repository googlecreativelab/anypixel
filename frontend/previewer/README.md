# Anypixel - Previewer
An in-browser previewer which simulates the look and feel of the physical LED button wall. 
It emulates button events using both mouse and touch inputs, including multi-touch.

### Installation
```sh
$ npm install -g browserify
$ npm install -g https://anypixel-storage.appspot.com/npm/anypixel-previewer.tar.gz
```

### Check out the examples 
We've included 12 example apps written by Googlers and friends for the 8th Avenue lobby display in NYC. After installing the previewer, run one of the [examples](https://github.com/googlecreativelab/anypixel/tree/master/frontend/examples).

### Usage
```
Usage:
  preview [OPTIONS] [ARGS]
  
Options: 
  -f, --file [FILE]        Use this file as the entry point. File path is relative 
                           to the current working directory  (Default is index.js)
  -p, --port [NUMBER]      Run the server on this port  (Default is 9000)
  -b, --background [FILE]  Use this file as the background image. File path is 
                           relative to the current working directory  (Default is lobby.jpg)
  -s, --spacing [NUMBER]   Space between the centers of each button, in pixels  (Default is 14)
  -r, --radius [NUMBER]    Radius of each button, in pixels  (Default is 4.4)
  -x [NUMBER]              Horizontal starting position for the button grid, in 
                           pixels  (Default is 418)
  -y [NUMBER]              Vertical starting position for the button grid, in 
                           pixels  (Default is 470)
  -h, --help               Displays this message
```

### In The Browser

- The page will automatically refresh when the entry file is changed.

- The **Pointer** button is the default input mode: one cursor, one button input at a time.

- The **Hand** button simulates a flat hand pushing against the wall. The shape of the hand is 
randomly generated in a 5x5 grid, and the timing of the inputs is fuzzed to simulate the variations 
of human behavior.

- The **Eye** button toggles an overlay which displays the button events as black squares.
