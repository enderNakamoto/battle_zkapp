import { Mina, NetworkId, PrivateKey } from 'o1js';
import { Add } from './Add';

let feepayerKey = PrivateKey.fromBase58('EKEXnEq52gL3aQDZ9W6gk8CcGTxViHhaG2MjrigUq9HrDQ2C2JNh');
let zkAppKey = PrivateKey.fromBase58('EKDoyF5QvUPZsdHXdGHWVgWzoeCtVJ1KEbLNM9ZUHondnHi1f76h');


const Network = Mina.Network({
  networkId: 'testnet' as NetworkId,
  mina: 'https://api.minascan.io/node/devnet/v1/graphql',
});

const fee = Number(0.1) * 1e9; // in nanomina (1 billion = 1.0 mina)
Mina.setActiveInstance(Network);
let feepayerAddress = feepayerKey.toPublicKey();
let zkAppAddress = zkAppKey.toPublicKey();
let zkApp = new Add(zkAppAddress);

// compile the contract to create prover keys
console.log('compile the contract...');
await Add.compile();

try {
  // call update() and send transaction
  console.log('build transaction and create proof...');
  let tx = await Mina.transaction(
    { sender: feepayerAddress, fee },
    async () => {
      await zkApp.update();
    }
  );
  await tx.prove();

  console.log('send transaction...');
  const sentTx = await tx.sign([feepayerKey]).send();
  if (sentTx.status === 'pending') {
    console.log('pending.....');
  }
} catch (err) {
  console.log(err);
}