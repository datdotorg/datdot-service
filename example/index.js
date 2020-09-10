const spawn = require('cross-spawn')
const path = require('path')

process.env.DEBUG = '*,-hypercore-protocol,-CHATSERVER'

const config = { chat: ['ws://localhost', '8000'] }

const args1 = [path.join(__dirname, './peer1.js'), config.chat.join(':')]
spawn('node', args1, { stdio: 'inherit' })


const args2 = [path.join(__dirname, './peer2.js'), config.chat.join(':')]
spawn('node', args2, { stdio: 'inherit' })

const args3 = [path.join(__dirname, './chatserver.js'), config.chat.join(':')]
spawn('node', args3, { stdio: 'inherit' })
