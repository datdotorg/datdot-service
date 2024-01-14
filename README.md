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

1. Run bootstrapping nodes and each scenario separately

#### Start the bootstrapping nodes
`npm run bootstrap` 

#### Run the scenario which also spawns the chain

`npm run simulation -- -s 1 -p bootstrap.json` 

#### Run the additional scenario and connect to already running chain (optional)
`npm run simulation -- -s 2 -c 10000 -p bootstrap.json -t` 

2. Or simply run a simsim.js where you can customize how many simulations you want to run and when

#### Start the bootstrapping nodes
`npm run bootstrap` 

#### Run custom logic
`node demo/simsim.js`

### Monitoring

#### Start the bootstrapping nodes
`npm run bootstrap` 

#### Save logs in a logs.txt file
`node demo/simsim.js &>> logs/logs.txt` 

#### Monitor i.e.:

- successfully completed performance challenges

`tail -f logs/logs.txt | grep -i 'Hoster successfully completed performance challenge' -C 2`

- succesfully completed storage challenges

`tail -f logs/logs.txt | grep -i 'Storage challenge analysis' -C 4`

- errors

`tail -f logs/logs.txt | grep -i 'error' -C 5`

For custom commands:

- use -A number_of_lines to print the lines after the match

- use -B number_of_lines to print the lines before the match

- use -C number_of_lines to print the lines before and after the match (context)

## Research

See our [research repo](https://github.com/playproject-io/datdot-research/)

## Organization

https://github.com/datdotorg

## License

MIT


