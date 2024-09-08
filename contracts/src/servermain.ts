import { Mina, PrivateKey, PublicKey } from 'o1js';
import { Add } from './Add.js';

import fs from 'fs';
import { deploy, loopUntilAccountExists } from './serverutils.js';

const Network = Mina.Network('https://api.minascan.io/node/devnet/v1/graphql');
Mina.setActiveInstance(Network);

const transactionFee = 100_000_000;

// const deployAlias = process.argv[2];
// const deployerKeysFileContents = fs.readFileSync(
//   'keys/' + deployAlias + '.json',
//   'utf8'
// );

// const deployerPrivateKeyBase58 = JSON.parse(
//   deployerKeysFileContents
// ).privateKey;

const DEPLOYER_PRIVATE_KEY = 'EKEXnEq52gL3aQDZ9W6gk8CcGTxViHhaG2MjrigUq9HrDQ2C2JNh'
const deployerPrivateKey = PrivateKey.fromBase58(DEPLOYER_PRIVATE_KEY);
const deployerPublicKey = deployerPrivateKey.toPublicKey();

// const zkAppPrivateKey = PrivateKey.fromBase58(
//   'EKFTMuvTirzrwpeHP8RKe7bGufBGiKs27nTMzD5XyMV8NcK3upt2'
// );

// ----------------------------------------------------

// let account = await loopUntilAccountExists({
//   account: deployerPublicKey,
//   eachTimeNotExist: () => {
//     console.log(
//       'Deployer account does not exist. ' +
//         'Request funds at faucet ' +
//         'https://faucet.minaprotocol.com/?address=' +
//         deployerPublicKey.toBase58()
//     );
//   },
//   isZkAppAccount: false,
// });

// console.log(
//   `Using fee payer account with nonce ${account.nonce}, balance ${account.balance}`
// );

// ----------------------------------------------------

// console.log('Compiling smart contract...');
// let { verificationKey } = await Square.compile();

// const zkAppPublicKey = zkAppPrivateKey.toPublicKey();
const ZKAPP_ADDRESS = 'B62qorDusg88bMiZwaXQb1cVVPPKzQxVyUizoApAr6uBXzoMacem6gL';
const zkappPublicKey = PublicKey.fromBase58(ZKAPP_ADDRESS);
let zkapp = new Add(zkappPublicKey);

// compile the contract to create prover keys
console.log('compile the contract...');
await Add.compile();

// Programmatic deploy:
//   Besides the CLI, you can also create accounts programmatically. This is useful if you need
//   more custom account creation - say deploying a zkApp to a different key than the fee payer
//   key, programmatically parameterizing a zkApp before initializing it, or creating Smart
//   Contracts programmatically for users as part of an application.

// await deploy(deployerPrivateKey, zkAppPrivateKey, zkapp, verificationKey);

// await loopUntilAccountExists({
//   account: zkAppPublicKey,
//   eachTimeNotExist: () =>
//     console.log('waiting for zkApp account to be deployed...'),
//   isZkAppAccount: true,
// });

let num = (await zkapp.num.fetch())!;
console.log(`current value of num is ${num}`);

// ----------------------------------------------------

let transaction = await Mina.transaction(
  { sender: deployerPublicKey, fee: transactionFee },
  async () => {
    await zkapp.update();
  }
);

// fill in the proof - this can take a while...
console.log('Creating an execution proof...');
let time0 = performance.now();
await transaction.prove();
let time1 = performance.now();
console.log(`creating proof took ${(time1 - time0) / 1e3} seconds`);

// sign transaction with the deployer account
transaction.sign([deployerPrivateKey]);

console.log('Sending the transaction...');
let pendingTransaction = await transaction.send();

// ----------------------------------------------------

if (pendingTransaction.status === 'rejected') {
  console.log('error sending transaction (see above)');
  process.exit(0);
}

console.log(
  `See transaction at https://minascan.io/devnet/tx/${pendingTransaction.hash}
Waiting for transaction to be included...`
);
await pendingTransaction.wait();

console.log(`updated state! ${await zkapp.num.fetch()}`);