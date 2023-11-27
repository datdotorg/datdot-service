#!/usr/bin/env node

process.env.DEBUG = '*,-hypercore-protocol'
const spawn = require('cross-spawn')
const path = require('path')
const fs = require('fs').promises
const { parseArgs } = require('node:util')

run()

async function run () {

  // 3 processes
  // npm run bootstrap
  // npm run simulation -- -s 1 -p bootstrap.json 
  // npm run simulation -- -s 2 -c 10000 -p bootstrap.json -t

  const args = process.argv.slice(2)
  console.log({args})
  const options = {
    scenarioName: { type: 'string', short: 's' },
    counter: { type: 'string', default: '9000', short: 'c' },
    chain_exists: { type: 'boolean', short: 't' },
    bootstrap_path: { type: 'string', short: 'p' },
    flag: { type: 'string', short: 'f' }
  }
  const {
    values,
    positionals,
  } = parseArgs({ args, options })
  console.log({values, positionals})

  const { scenarioName, counter, chain_exists, bootstrap_path, flag } = values
  if (!scenarioName || !path) throw new Error('ERROR_MISSING_SCENARIO_NAME_AND_PATH') 
  const string = await fs.readFile(bootstrap_path)
  const bootstrap = JSON.parse(string)
  console.log({bootstrap})
  // @TODO: check official nodejs docs for port args to change this into:
  // scenarioName, flag, chainport, port
  // => where flag, chainport, port are all optional

  process.env.REPORT = `*
   +**,-
   +*:*:**@bar#xxx;

   alice:chain

   asdf@fooo#x
   asdf@fooo
   asdf#x
   @fooo#x
   asdf
   @fooo
   #x
  `

  if (!scenarioName) return console['log'](`
    USAGE:    run-datdot-simulation <scenario-filename>

              (To customise logs,
               edit "demo/simulation.js"
               and change "process.env.REPORT")

    SCENARIOS:
      ./demo/scenarios/1.js
      ./demo/scenarios/2.js
      ./demo/scenarios/foo.js

    EXAMPLE 1
      > run-datdot-simulation 1

    EXAMPLE 2
      > run-datdot-simulation foo.js
  `)

  const scenario = require(`./scenarios/${scenarioName}`)

  const all_processes = [process]
  const url = 'ws://localhost'

  var port = counter
  const chatport = port++
  const chainlogport = port++
  const chatlogport = port++
  const regport = port++
  const chainport = 3399

  const config = { chain: [url, chainport], chat: [url, chatport], bootstrap }

   if (flag === 'production') {

    throw new Error('"--production" is currently unsuported (datdot-node-rust) in substrate is not ready')
    // const command1 = path.join(__dirname, '../datdot-substrate/target/release/datdot-node')
    // const child = spawn(command1, ['--dev'], { stdio: 'inherit' })
    // all.push(child)
  
  } else if (flag === 'testnet-private') {
    const [, port] = config.chain
    const glitch_url = 'https://foo-bar-baz.glitch.com'
    config.chain = [glitch_url, port]
  } else if (flag === 'testnet-public') {
    const [, port] = config.chain
    const glitch_url = 'https://foo-bar-baz.glitch.com'
    config.chain = [glitch_url, port]

    throw new Error('glitch not yet running')
  } else {
    if (!chain_exists) {
      // @TODO: switch to separate module in the future:

      // const filename = require.resolve('datdot-node-javascript')
      const filename = path.join(__dirname, '../src/node_modules/datdot-node-javascript-internal/chain.js')

      const args1 = [filename, JSON.stringify(config), /*logkeeper*/chainlogport]
      const chain = spawn('node', args1, { stdio: 'inherit' })
      all_processes.push(chain)    
    }
  }



  const args2 = [path.join(__dirname, '../src/node_modules/_chat/server.js'), JSON.stringify(config), /*logkeeper*/ chatlogport]
  const chatserver = spawn('node', args2, { stdio: 'inherit' })
  all_processes.push(chatserver)

  const users = scenario
  const PORTS = [chainlogport, chatlogport]
  const file = path.join(__dirname, '../src/node_modules/datdot-simulate-user/user.js')
  for (var i = 0, len = users.length; i < len; i++) {
    const scenario = JSON.stringify(users[i])
    const logkeeper_port = port + i
    PORTS.push(logkeeper_port)
    const args = [file, scenario, JSON.stringify(config), logkeeper_port]
    const child = spawn('node', args, { stdio: 'inherit' })
    all_processes.push(child)
  }

  process.exitcode = 1
  // todo: define exit codes (i.e. child process fails)
  
  const args3 = [path.join(__dirname, '../src/node_modules/datdot-explorer/demo/registry.js'), JSON.stringify(PORTS), regport]
  const logkeeper = spawn('node', args3, { stdio: 'inherit' })
  all_processes.push(logkeeper)
  
  process.on('SIGINT', kill_processes)
  process.on('SIGTERM', kill_processes)

  function kill_processes () {
    console['log']("\n Terminating all processes")
    const [main, ...processes] = all_processes
    for (var i = 0, len = processes.length; i < len; i++) {
      const child = processes[i]
      child.kill()
    }
    console['log']('done')
    main.exit()
  }
}
