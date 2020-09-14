const spawn = require('cross-spawn')
const path = require('path')
const scenario = require('./lab/scenarios/scenario_2')

process.env.DEBUG = '*,-chain:*,-hypercore-protocol,-chatserver'
// process.env.DEBUG = '*,-hypercore-protocol'

// const [flag] = process.argv.slice(2)
const all = [process]
const server = 'ws://localhost'
const config = JSON.stringify({ chain: [server, '8080'], chat: [server, '8000'], log: [server, '8888'] })
// const command1 = path.join(__dirname, '../datdot-substrate/target/release/datdot-node')
// const child = spawn(command1, ['--dev'], { stdio: 'inherit' })
const args2 = [path.join(__dirname, 'lab/scenarios/chain.js'), config]
const chain = spawn('node', args2, { stdio: 'inherit' })
// captureFailures(chain)
const args3 = [path.join(__dirname, 'lab/scenarios/chatserver.js'), config]
const chatserver = spawn('node', args3, { stdio: 'inherit' })
// captureFailures(chatserver)
const args4 = [path.join(__dirname, 'lab/scenarios/logserver.js'), config]
const logserver = spawn('node', args4, { stdio: 'inherit' })
// captureFailures(chatserver)

const users = scenario
const file = path.join(__dirname, 'lab/scenarios/user.js')
for (var i = 0, len = users.length; i < len; i++) {
  const scenario = JSON.stringify(users[i])
  const child = spawn('node', [file, scenario, config], { stdio: 'inherit' })
  // captureFailures(child)
}

// function captureFailures (process) {
//   all.push(process)
//   process.on('unhandledRejection', error => {
//     console.log('unhandledRejection', error)
//     end()
//   })
//   process.on('uncaughtException', (err, origin) => {
//     console.log('uncaughtException', err, origin)
//     end()
//   })
//   process.on('warning', error => {
//     const stack = error.stack
//     console.log('warning', error)
//     console.log(stack)
//     end()
//   })
// }
// function end () {
//   all.forEach(child => child.exit(1))
// }


//
// process.on('unhandledRejection', error => {
//   console.log('unhandledRejection', error)
// })
// process.on('uncaughtException', (err, origin) => {
//   console.log('uncaughtException', err, origin)
// })
// process.on('warning', error => {
//   const stack = error.stack
//   console.log('warning', error)
//   console.log(stack)
// })
// process.setMaxListeners(0)
