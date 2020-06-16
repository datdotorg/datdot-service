const spawn = require('cross-spawn')
const path = require('path')

const command1 = path.join(__dirname, '../substrate/target/datdot-node')
const child1 = spawn(command1, ['--dev'], { stdio: 'inherit' })

const args = [path.join(__dirname, 'lab/scenarios/service-mvp.js')] // work in progress
const child2 = spawn('node', args, { stdio: 'inherit' })
