# Backend - UDP Manager
UDP Manager is a node.js app which receives pixel data from ChromeBridge and distributes it to each [display unit](#).

![img](https://github.com/googlecreativelab/anypixel/blob/master/backend/udp-manager/flow.png)

Multiple display unit data is bundled into the packets from ChromeBridge, and these packets are unbundled and sent off to the correct display unit here.


## Getting Started

1. **Install node components** - `$npm install`

2. **Start the manager** - `$ npm start`

To stop the manager, do `$ npm stop`
