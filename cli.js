run()
async function run (){
  await new Promise(resolve => setTimeout(resolve, 250))

  const spawn = require('cross-spawn')
  const path = require('path')
  const scenario = require('./lab/scenarios/scenario_1')
  
  process.env.DEBUG = '*,-hypercore-protocol'
  
  const [flag] = process.argv.slice(2)
  
  const all = [process]
  const url = 'ws://localhost'
  const config = JSON.stringify({ chain: [url, '8080'], chat: [url, '8000'] })
  
  if (flag === '--production') {
    const command1 = path.join(__dirname, '../datdot-substrate/target/release/datdot-node')
    const child = spawn(command1, ['--dev'], { stdio: 'inherit' })
    all.push(child)
  } else {
    const args1 = [path.join(__dirname, 'lab/simulations/chain.js'), config, 9001]
    const chain = spawn('node', args1, { stdio: 'inherit' })
    all.push(chain)
  }
  
  const args2 = [path.join(__dirname, 'lab/simulations/chatserver.js'), config, 9002]
  const chatserver = spawn('node', args2, { stdio: 'inherit' })
  all.push(chatserver)
  
  const users = scenario
  const PORTS = [9001, 9002]
  const file = path.join(__dirname, 'lab/scenarios/user.js')
  for (var i = 0, len = users.length; i < len; i++) {
    const scenario = JSON.stringify(users[i])
    const port = 9003 + i
    PORTS.push(port)
    const child = spawn('node', [file, scenario, config, port], { stdio: 'inherit' })
    all.push(child)
  }
  
  const args3 = [path.join(__dirname, 'lab/scenarios/datdot-explorer.js'), JSON.stringify(PORTS), 9000]
  const logkeeper = spawn('node', args3, { stdio: 'inherit' })
  all.push(logkeeper)
  
  
  process.on('SIGINT', () => {
    console.log("\n Terminating all processes")
    const [main, ...processes] = all
    for (var i = 0, len = processes.length; i < len; i++) {
      const child = processes[i]
      child.kill()
    }
    console.log('done')
    main.exit(0)
  })
  
}
