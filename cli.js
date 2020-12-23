const spawn = require('cross-spawn')
const path = require('path')
const scenario = require('./lab/scenarios/scenario_2')

process.env.DEBUG = '*,-hypercore-protocol'

const [flag] = process.argv.slice(2)

const all = [process]
const url = 'ws://localhost'
const config = JSON.stringify({ chain: [url, '8080'], chat: [url, '8000'] })

if (flag === '--production') {
  const command1 = path.join(__dirname, '../datdot-substrate/target/release/datdot-node')
  const child = spawn(command1, ['--dev'], { stdio: 'inherit' })
} else {
  const args1 = [path.join(__dirname, 'lab/simulations/chain.js'), config, 9001]
  const chain = spawn('node', args1, { stdio: 'inherit' })
}

const args2 = [path.join(__dirname, 'lab/simulations/chatserver.js'), config, 9002]
const chatserver = spawn('node', args2, { stdio: 'inherit' })

const users = scenario
const PORTS = [9001, 9002]
const file = path.join(__dirname, 'lab/scenarios/user.js')
for (var i = 0, len = users.length; i < len; i++) {
  const scenario = JSON.stringify(users[i])
  const port = 9003 + i
  PORTS.push(port)
  const child = spawn('node', [file, scenario, config, port], { stdio: 'inherit' })
}

const args3 = [path.join(__dirname, 'lab/scenarios/datdot-explorer.js'), JSON.stringify(PORTS), 9000]
const logkeeper = spawn('node', args3, { stdio: 'inherit' })
