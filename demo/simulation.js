#!/usr/bin/env node

process.env.DEBUG = '*,-hypercore-protocol'
const spawn = require('cross-spawn')
const path = require('path')
const createTestnet = require('@hyperswarm/testnet')

run()

async function run () {

  const [scenarioName, flag] = process.argv.slice(2)
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

  const all = [process]
  const url = 'ws://localhost'

  const config = { chain: [url, 3399], chat: [url, 6697], bootstrap: null }

   if (flag === 'production') {
    const { bootstrap } = await createTestnet(20) 
    config.bootstrap = bootstrap 
    await new Promise(resolve => setTimeout(resolve, 250))

    throw new Error('"--production" is currently unsuported (datdot-node-rust) in substrate is not ready')
    // const command1 = path.join(__dirname, '../datdot-substrate/target/release/datdot-node')
    // const child = spawn(command1, ['--dev'], { stdio: 'inherit' })
    // all.push(child)
  
  } else if (flag === 'testnet-private') {
    const { bootstrap } = await createTestnet(20) 
    config.bootstrap = bootstrap 

    const [, port] = config.chain
    const glitch_url = 'https://foo-bar-baz.glitch.com'
    config.chain = [glitch_url, port]
  } else if (flag === 'testnet-public') {
    const [, port] = config.chain
    const glitch_url = 'https://foo-bar-baz.glitch.com'
    config.chain = [glitch_url, port]

    throw new Error('glitch not yet running')
  } else {
    const { bootstrap } = await createTestnet(20) 
    config.bootstrap = bootstrap 
    await new Promise(resolve => setTimeout(resolve, 250))

    // @TODO: switch to separate module in the future:

    // const filename = require.resolve('datdot-node-javascript')
    const filename = path.join(__dirname, '../src/node_modules/datdot-node-javascript-internal/chain.js')

    const args1 = [filename, JSON.stringify(config), /*logkeeper*/9001]
    const chain = spawn('node', args1, { stdio: 'inherit' })
    all.push(chain)    
  }



  const args2 = [path.join(__dirname, '../src/node_modules/_chat/server.js'), JSON.stringify(config), /*logkeeper*/ 9002]
  const chatserver = spawn('node', args2, { stdio: 'inherit' })
  all.push(chatserver)

  const users = scenario
  const PORTS = [9001, 9002]
  const file = path.join(__dirname, '../src/node_modules/datdot-simulate-user/user.js')
  for (var i = 0, len = users.length; i < len; i++) {
    const scenario = JSON.stringify(users[i])
    const logkeeper_port = 9003 + i
    PORTS.push(logkeeper_port)
    const args = [file, scenario, JSON.stringify(config), logkeeper_port]
    const child = spawn('node', args, { stdio: 'inherit' })
    all.push(child)
  }

  const args3 = [path.join(__dirname, '../src/node_modules/datdot-explorer/demo/registry.js'), JSON.stringify(PORTS)]
  const logkeeper = spawn('node', args3, { stdio: 'inherit' })
  all.push(logkeeper)

  process.on('SIGINT', () => {
    console['log']("\n Terminating all processes")
    const [main, ...processes] = all
    for (var i = 0, len = processes.length; i < len; i++) {
      const child = processes[i]
      child.kill()
    }
    console['log']('done')
    main.exit(0)
  })
}
