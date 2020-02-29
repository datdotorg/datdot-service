const spawn = require('cross-spawn')
const path = require('path')

const command1 = path.join(__dirname, '../substrate/target/release/substrate')
const child1 = spawn(command1, ['--dev'], { stdio: 'inherit' })

const args = [path.join(__dirname, 'lab/scenarios/index5.js')]
const child2 = spawn('node', args, { stdio: 'inherit' })
