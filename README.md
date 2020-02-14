# DatDot
a p2p solution for hosting files with Dat protocol ([...more](https://github.com/playproject-io/datdot-substrate/issues/12))

join our [telegram](https://t.me/joinchat/CgTftxXJvp6iYayqDjP7lQ) or [gitter](https://gitter.im/playproject-io/community) chat

![](https://i.imgur.com/oGPIbZQ.jpg)

### Building

Before running the service part of the datdot,
make sure you have [datdot-substrate](https://github.com/playproject-io/datdot-substrate) running first.
After that, open a new tab in your CLI
install and build the datdot service:

first run `git clone https://github.com/playproject-io/datdot-service.git`

after that run `cd datdot-service` and then install the dependencies by running

`npm install`

### Running

Currently you can run the scenarios, stored in /lab folder.

To try out encoding, run `npm start`

To run other scenarios, run `node/lab/scenarios/1` or `node/lab/scenarios/2`
and so on.

But what is each scenario about? You may ask.

On top of each scenario file you will find a description and observed behavior.

Why do we need scenarios?

We are using scenarios to debug the flow. Once our code works as expected, the final scenario will be copied in index.js and this will be the main datdot-service code, which will be used in the DatDot app.


## License

MIT
