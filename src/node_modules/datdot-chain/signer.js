const map = new WeakMap()
var signature = 0

module.exports = sign

function sign (opts, myAccount) {
  const ID = myAccount.address
  console.log(`[USER ${ID}] signed: ${JSON.stringify(opts, 0, 2)}`)
  // @TODO: sign data properly
  const signature = `signature_${signature++}`
  map.set(signature, [opts, ID])
  return(signature)
}

sign.verify = (signature, opts) => {
  const [value, ID] = map.get(signature)
  return (opts === value) ? ID : void 0
}
