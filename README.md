# DatDot
a p2p solution for hosting files with Dat protocol ([...more](https://github.com/playproject-io/datdot-substrate/issues/12))

join our [telegram](https://t.me/joinchat/CgTftxXJvp6iYayqDjP7lQ) or [gitter](https://gitter.im/playproject-io/community) chat

![](https://i.imgur.com/oGPIbZQ.jpg)

### Building

clone
`git clone https://github.com/ninabreznik/service.js.git`

change directory
`cd service`

install dependencies
`npm install`

### Running

Currently you can only run the scenarios, stored in /lab folder.

To run a scenario, run `node lab/scenarios/<some-scenario>`, for example `DEBUG=*,-hypercore-protocol node lab/scenarios/mvp-1.js `.

We are using scenarios to debug the flow. Current scenarios are working only with the chain simulation (simulate-chain.js).


## License

MIT
