# DatDot
a p2p solution for hosting files with Hypercore protocol ([...more](https://datdot.org))

## Community
Join our [discord](https://discord.gg/Wf8wc2scCs)

## Build

This version is work in progress (to try previous verisons of the code, see milestone-1 and milestone-2 branches)

### Clone
`git clone https://github.com/datdotorg/datdot-service.git`
`cd datdot-service`

### Install dependencies
`npm install`

### Run
`npm run bootstrap` start the bootstrapping nodes
`npm run simulation -- -s 1 -p bootstrap.json` run the scenario which also spawns the chain
`npm run simulation -- -s 2 -c 10000 -p bootstrap.json -t` run the additional scenario and connect to already running chain (optional)

or run a simsim.js where you can customize the tests

`npm run bootstrap` start the bootstrapping nodes
`node demo/simsim.js`

## Research

See our [research repo](https://github.com/playproject-io/datdot-research/)

## Organization

https://github.com/datdotorg

## License

MIT


