/** Fund  Transfer for Batchminting in Treasure wallet */

const {XummSdk} = require('xumm-sdk')
const xrpl = require("xrpl");
const Sdk = new XummSdk('5c9e4bd1-0f7a-4a7a-97c0-e2d7592a4e7d', 'd51f7b5f-d9da-4ffe-a06d-4a9e073171c0')


const main = async () => {
    const client = new xrpl.Client("wss://s.devnet.rippletest.net:51233");
  await client.connect();

    const appInfo = await Sdk.ping()
    console.log(appInfo.application.name)
const seller_wallet = xrpl.Wallet.fromSecret("sEd7mbggmnj1Qp82Pd3EWGqNqKedHb7");

const request = {
    "TransactionType": "Payment",
    "Account" : seller_wallet.classicAddress,
    "Destination": "rJyc9swV3AmsJCAfKhWn98iymxtX9rrRH8",
    "Amount": xrpl.xrpToDrops(988),
    
    
}

const Tx = await client.submit(request, { wallet: seller_wallet });
const bal = await client.getXrpBalance(seller_wallet.classicAddress);
console.log("Transactionn",Tx);
console.log(bal);
client.disconnect();

// const subscription = await Sdk.payload.createAndSubscribe(request, event =>{
//     console.log('New payload event:', event.data)

//     //  The event data contains a property 'signed' (true or false), return :)
//     if (Object.keys(event.data).indexOf('signed') > -1) {
//         return event.data
//     }

// })

// console.log('New payload created,URL:', subscription.created.next.always)
// console.log('  > Pushed:', subscription.created.pushed ? 'yes' : 'no')


// const resolveData = await subscription.resolved

// // (resolveData.signed)? console.log('Woohoo! The sign request was signed :)') : console.log(' The sign request was rejected :(');
// if (resolveData.signed === false) {
//     console.log(' The sign request was rejected :(')
// } else {
//     console.log('Woohoo! The sign request was signed :)')

//  const result = await Sdk.payload.get(resolveData.payload_uuidv4)
//  console.log('On ledger TX hash:', result.response.txid)
// }


}

main()








