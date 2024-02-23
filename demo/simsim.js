const spawn = require('cross-spawn')
const path = require('path')

process.on('SIGINT', kill_processes)
process.on('SIGTERM', kill_processes)
process.on('exit', kill_processes)

const all_processes = [process]

run()
/**********************************************************
  RUN
**********************************************************/
async function run (params) {
  // const default_delay = 3000
  // console.log('0. ===== start `bootstrap nodes` =====')
  // init()
  // await new Promise(resolve => setTimeout(resolve, default_delay))
  params = []
  console.log('1. ===== start `one` =====')
  const pos1 = one(params)
  console.log('2. ===== start `two` =====')
  const delay1 = 0 // 2000
  var pos2 = await new Promise(resolve => setTimeout(() => resolve(two(params)), delay1))
  console.log('3. ===== start `three` =====')
  const delay2 = 0
  var pos3 = await new Promise(resolve => setTimeout(() => resolve(three(params)), delay2))
  
  console.log('3. ===== stop `two` =====')
  // console.log('4. ===== just end everything =====')
  const delay3 = 10000
  // setTimeout(() => all_processes[pos2].kill('SIGINT'), delay3)
}
/**********************************************************
  SCENARIOS
**********************************************************/
function init () {
  // run bootstrap nodes
  const file = path.join(__dirname, 'bootstrapper.js')
  const child = spawn('node', [file], { stdio: 'inherit' })
  return all_processes.push(child) - 1
}
function one () {
  const file = path.join(__dirname, 'simulation.js')
  const scenario = '-s 1 -p bootstrap.json'.split(' ')
  const args = [file].concat(scenario)
  const child = spawn('node', args, { stdio: 'inherit' })
  return all_processes.push(child) - 1
}
function two () {
  const file = path.join(__dirname, 'simulation.js')
  const scenario = '-s 2 -c 10000 -p bootstrap.json -t'.split(' ')
  const args = [file].concat(scenario)
  const child = spawn('node', args, { stdio: 'inherit' })
  return all_processes.push(child) - 1
}
function three () {
  const file = path.join(__dirname, 'simulation.js')
  const scenario = '-s 3 -c 20000 -p bootstrap.json -t'.split(' ')
  const args = [file].concat(scenario)
  const child = spawn('node', args, { stdio: 'inherit' })
  return all_processes.push(child) - 1
}
/**********************************************************
  HELPERS
**********************************************************/
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
