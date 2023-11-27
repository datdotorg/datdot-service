const createTestnet = require('@hyperswarm/testnet')
const fs = require('fs').promises
const goodbye = require('graceful-goodbye')

bootstrappers()
goodbye()

var path_to_json

async function bootstrappers () {
  const { bootstrap } = await createTestnet(20) 
  await new Promise(resolve => setTimeout(resolve, 250))
  path_to_json = 'bootstrap.json'
  await fs.writeFile(path_to_json, JSON.stringify(bootstrap), 'utf-8')// bootstrap.json
}

goodbye(async function () {
  console.log('i am run before exit')
  await fs.unlink(path_to_json)
})