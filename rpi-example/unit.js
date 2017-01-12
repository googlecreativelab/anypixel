/*
  
  example header (in hex bytes)
  010000000000000000007f0000010bb9
   =
  x01 x00 x00 x00 ...... 0000000000007f0000010bb9

  so breaking it up...
  01 = 8 bit color flag
  00000000000000 = reserved
  00 = unit address (starts with 0)
  00 = sequence number (only used for debug)
  7f000001 = 127, 0, 0, 1
  0bb9 = port 3001

 
*/

require('buffer');

var dgram = require('dgram');
var light = require('rpi-ws281x-native');
var wpi = require('wiring-pi');

var PORTS = [];
var PORTS_START = 3001;
var PORTS_NUM = 1; 
var sockets = [];

var BUTTON_COUNT = 1;
var BUTTON_RPI_PIN = 7;

var HOST_COMPUTER_IP = '10.0.1.2'; // this is the computer that's running the udp manager
// port for sending button presses back to server
// found in config/config.udp.js
UDP_CONTROLLER_PORT = 27482;

//make ports 3001 to 3030
for(var i=0; i<PORTS_NUM; i++){
  PORTS[i] = PORTS_START+i;
}

var HOST = '0.0.0.0';

// set up 1 light
// see options here: https://www.npmjs.com/package/rpi-ws281x-native
light.init(1, {});
light.setBrightness(255);

var servers = [];
//just for visualizing the hex
var padder = function(inn){
  if(inn.length < 2){
    return "0"+inn;
  }
  return inn;
}

for(var i=0; i< PORTS.length; i++){
  servers[i] = dgram.createSocket('udp4');
  var t = i;
  servers[i].on('message', function (message, remote) {
    var converted = "";
    var firstColor = "";
    for(var j=0; j<message.length; j++){
      var messageByte = padder(message[j].toString(16));
      converted += messageByte;
      // each message byte in the payload (after the 16 byte header) is the R, G, or B value
      // so to grab the first pixel's RGB value, you need to grab index 16, 17, and 18
      if(j > 15 && j < 19){
        firstColor += messageByte;
      }else if(j === 19){
        // let's assign the first pixel's color
        light.render(['0x' + firstColor]);
      }
    }
    // console.log(converted);

  });
  servers[i].bind(PORTS[i], HOST);
}

// setup the button
var started = false;
wpi.setup('wpi');
wpi.pinMode(BUTTON_RPI_PIN, wpi.INPUT);
wpi.pullUpDnControl(BUTTON_RPI_PIN, wpi.PUD_UP);
wpi.wiringPiISR(BUTTON_RPI_PIN, wpi.INT_EDGE_BOTH, function(){
  if(wpi.digitalRead(BUTTON_RPI_PIN)){
    if(!started){
      // on button up
      started = true;
      onButtonUp();
    }
  }
  else{
    // on button down
    started = false;
    onButtonDown();
  }
})

//packet format
//[0x20, module position hack byte, empty, empty] [payload bytes]
//[32, i, 0, 0] [payload]

//header. if you want unit 1 (0 index) to send the packet, change the second byte to 1. 
var packet = [32,0,0,0];
//build the packet, set them all to 0 for now.
for(var j=4; j<Math.ceil((BUTTON_COUNT/8))+4; j++){
 packet[j] = 0;
}

function onButtonDown(){
  // this is 1 in dec, in hex its 0x01, in bin its 00000001, so pixel 0,7 is being pressed ON. If I set on_packet[5]=128, the next button would turn on etc. 
  // packet[4] = 1;
  packet[4] = 128; // 10000000, or index 0 button
  var buffer = new Buffer(packet);

  for(var i = 0; i < servers.length; i++){
    servers[i].send(buffer, 0, buffer.length, UDP_CONTROLLER_PORT, HOST_COMPUTER_IP, function(resp, bytes){
      console.log('button down complete, response code: ' + resp + ' bytes sent: ' + bytes);
    });
  }

}

function onButtonUp(){
  if(wpi.digitalRead(BUTTON_RPI_PIN)){ 
    // turn the first position back off
    packet[4] = 0;
    var offBuffer = new Buffer(packet);
    for(var j = 0; j < servers.length; j++){
      servers[j].send(offBuffer, 0, offBuffer.length, UDP_CONTROLLER_PORT, HOST_COMPUTER_IP, function(resp, bytes){
        console.log('button up complete, response code: ' + resp + ' bytes sent: ' + bytes);
      });
    }
  }
}