# DatDot
a p2p solution for hosting files with Dat protocol ([...more](https://github.com/playproject-io/datdot-substrate/issues/12))

join our [telegram](https://t.me/joinchat/CgTftxXJvp6iYayqDjP7lQ) or [gitter](https://gitter.im/playproject-io/community) chat

![](https://i.imgur.com/oGPIbZQ.jpg)

### Building

clone
`git clone https://github.com/playproject-io/datdot-service.git`

change directory
`cd service`

install dependencies
`npm install`

To run the service, you will also need to run the [datdot-substrate](https://github.com/playproject-io/datdot-substrate) chain

clone
`git clone `git clone https://github.com/playproject-io/datdot-substrate.git`

build
`cargo build -p datdot-node --release`

purge storage
`./target/release/datdot-node purge-chain --dev`

### Running

We are using scenarios to debug the flow. This scenario is part of our first milestone (Phase 1).

1. To run the chain and the service process at once use the command `node cli.js` (recommended)

2. To run the chain and the service process individually, use:

$`DEBUG=*,-hypercore-protocol node lab/scenarios/mvp-1.js` (for [datdot-service](https://github.com/playproject-io/datdot-service))
$`.target/release/datdot-node --dev` ([datdot-substrate](https://github.com/playproject-io/datdot-substrate))

3. To re-run the scenario, you will need to purge the chain storage (for `./target/release/datdot-node purge-chain --dev`)


## License

MIT
