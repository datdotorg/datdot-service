const spawn = require('cross-spawn')
const path = require('path')

process.env.DEBUG = '*,-hypercore-protocol'

const command1 = path.join(__dirname, '../datdot-substrate/target/release/datdot-node')
const child1 = spawn(command1, ['--dev'], { stdio: 'inherit' })

const args = [path.join(__dirname, 'lab/scenarios/mvp-1.js')] // work in progress
const child2 = spawn('node', args, { stdio: 'inherit' })
