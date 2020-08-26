const spawn = require('cross-spawn')
const path = require('path')

process.env.DEBUG = '*,-hypercore-protocol'

const all = [process]

const config = {
  chain: ['ws://localhost', '8080'],
  chat: ['ws://localhost', '8000'],
}
// const command1 = path.join(__dirname, '../datdot-substrate/target/release/datdot-node')
// const child = spawn(command1, ['--dev'], { stdio: 'inherit' })

const args2 = [path.join(__dirname, 'lab/scenarios/fakechain.js'), config.chain.join(':')]
const fakechain = spawn('node', args2, { stdio: 'inherit' })
captureFailures(fakechain)
//
const args3 = [path.join(__dirname, 'lab/scenarios/chatserver.js'), config.chat.join(':')]
const chatserver = spawn('node', args3, { stdio: 'inherit' })
captureFailures(chatserver)


const users = [
  { name: 'alice', roles: ['peer', 'sponsor', 'publisher', 'attestor'] },
  { name: 'bob', roles: ['peer', 'hoster', 'attestor', 'encoder'] },
  { name: 'charlie', roles: ['peer', 'encoder', 'hoster', 'attestor'] },
  { name: 'dave', roles: ['peer', 'encoder', 'hoster', 'attestor'] },
  { name: 'eve', roles: ['peer', 'author', 'encoder', 'hoster', 'attestor'] },
]

const file = path.join(__dirname, 'lab/scenarios/user.js')
for (var i = 0, len = users.length; i < len; i++) {
  const scenario = JSON.stringify(users[i])
  const args = [file, scenario, JSON.stringify(config)]
  const child = spawn('node', args, { stdio: 'inherit' })
  captureFailures(child)
}

function captureFailures (process) {
  all.push(process)
  process.on('unhandledRejection', error => {
    console.log('unhandledRejection', error)
    end()
  })
  process.on('uncaughtException', (err, origin) => {
    console.log('uncaughtException', err, origin)
    end()
  })
}
function end () {
  all.forEach(child => child.exit(1))
}
