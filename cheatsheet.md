# Cheat sheet
* [Substrate IDE](https://polkadot.js.org/apps/)
* [Substrate: The platform for blockchain innovators](https://github.com/paritytech/substrate)
* [Dat Protocol](https://www.datprotocol.com/)

### Building
to build the datdot dev runtime, run:

`cargo build -p node-runtime`

to build the test node, run:

`cargo build -p node-cli`

add the `--release` flag to either of those commands to create a release build - debug and release builds will be located in ./target/release or ./target/debug

### Running
currently, executing `./target/release/substrate --dev` (or `./target/debug/substrate --dev` if you didn't use a --release flag) runs a dev node. You can interact with this node by using the Polkadot.js Apps UI - selecting "local node" as your endpoint in the settings page should connect you to your node; however, until you specify the additional types in the developer tab, all functionality of the Apps UI will remain disabled.

### Useful

- remove DB and recover (remove all the blocks and start with genesis again)

`./target/debug/substrate purge-chain --dev`

### Interaction (JS/IDE)

1. Run your node & open https://polkadot.js.org/apps

2. Under General tab set endopoint (first dropdown) to `Local Node (Own, 127.0.0.1:9944)`

3. Under Developer tab update with custom types & click save
https://raw.githubusercontent.com/playproject-io/datdot-substrate/master/bin/node/runtime/types.json

4. Refresh the page

5. In the menu on the left select `Javascript`

6. See the logic of our chain `https://github.com/playproject-io/datdot-substrate/tree/master/bin/node/runtime/src`


### Polkadot.js (runtime/src/phost.rs)
```javascript
const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

// Create a extrinsic
const transfer = api.tx.phost.registerBackup(23);

// Sign and Send the transaction
transfer.signAndSend(ALICE, ({ events = [], status }) => {
  if (status.isFinalized) {
    console.log('Successful transfer of ' + randomAmount + ' with hash ' + status.asFinalized.toHex());
  } else {
    console.log('Status of transfer: ' + status.type);
  }

  events.forEach(({ phase, event: { data, method, section } }) => {
    console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString());
  });
});
```

```javascript
const root = '0x0000000000000000000000000000000000000000000000000000000000000000'
const size = 1

const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

// Create a extrinsic
const transfer = api.tx.phost.registerData(root, size);

// Sign and Send the transaction
transfer.signAndSend(ALICE, ({ events = [], status }) => {
  if (status.isFinalized) {
    console.log('Successful transfer of ' + randomAmount + ' with hash ' + status.asFinalized.toHex());
  } else {
    console.log('Status of transfer: ' + status.type);
  }

  events.forEach(({ phase, event: { data, method, section } }) => {
    console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString());
  });
});
```
