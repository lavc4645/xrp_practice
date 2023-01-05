const { XummSdk } = require("xumm-sdk");
const xrpl = require("xrpl");
require("dotenv").config();
// import { create } from "ipfs-http-client";
3;

const Sdk = new XummSdk(process.env.API_KEY, process.env.API_SECRET);

const main = async () => {
  let results;
  // Connecting with the application which we made on developer console
  const appInfo = await Sdk.ping();
  //   const IPFS = await import("ipfs-core");
  console.log(appInfo.application.name);

  const standby_wallet = xrpl.Wallet.fromSecret(
    "sEd7XKra4i7kBmD3PUR7vagEURwsSE6"
  );
  // const issuer_wallet = xrpl.Wallet.fromSeed("sEdVSaAar8cCtGXSqW5SMprZiikzX2E");

  // console.log("Wallet details", standby_wallet)

  // Connection with "XRPL" client
  const client = new xrpl.Client("wss://xls20-sandbox.rippletest.net:51233");
  await client.connect();
  let nfts = await client.request({
    method: "account_nfts",
    account: standby_wallet.classicAddress,
  });

  // console.log("transaction data \n", tx.result.meta.TransactionResult);
  // console.log('json', J(nfts, null, 2))
  console.log("nft object", nfts.result);
  return;

  // Converting the ipfs metadata to hexadecimal format
  // const uri = xrpl.convertStringToHex(
  //   "ipfs://QmR7AALJaHx8Qv48SCHnHTnqCmB8u7JQiH6qPbELB9ofWD"
  // );
  const uri =
    "697066733A2F2F516D63347A6D395A534A7744437858784E32374C52396E54797565464C775162595539384235384C3646706D4B63";
  // console.log("This is our URI for the NFT \n", uri)

  /************** Set NFT mint account ************ */
  tx_json = {
    TransactionType: "AccountSet",
    Account: process.env.WALLET_ADDRESS,
    NFTokenMinter: standby_wallet.classicAddress,
    SetFlag: 10,
  };

  // creating the payload
  const request = {
    TransactionType: "NFTokenMint",
    Account: standby_wallet.classicAddress,
    Issuer: process.env.WALLET_ADDRESS,
    TransferFee: 314,
    NFTokenTaxon: 0,
    Flags: 13,
    Fee: "10",
    URI: uri,
  };

  //   const prepared = await client.autofill(raman2);
  //   const signed = standby_wallet.sign(prepared);

  const subscription = await Sdk.payload.createAndSubscribe(
    tx_json,
    (event) => {
      console.log("New payload event:", event.data);

      //  The event data contains a property 'signed' (true or false), return :)
      if (Object.keys(event.data).indexOf("signed") > -1) {
        return event.data;
      }
    }
  );

  console.log("New payload created,URL:", subscription.created.next.always);
  console.log("  > Pushed:", subscription.created.pushed ? "yes" : "no");

  const resolveData = await subscription.resolved;

  if (resolveData.signed === false) {
    console.log(" The sign request was rejected :(");
  } else {
    console.log("Woohoo! The sign request was signed :)");

    const result = await Sdk.payload.get(resolveData.payload_uuidv4);
    console.log("On ledger TX hash:", result.response.txid);
  }
  // console.log(standby_wallet);
  // const tx = await client.submitAndWait(raman, { wallet: standby_wallet });
  // console.log(tx);
  const result = await client.submitAndWait(request, {
    wallet: standby_wallet,
  });
  console.log("Result============>\n", result);

  nfts = await client.request({
    method: "account_nfts",
    account: process.env.WALLET_ADDRESS,
  });

  // console.log("transaction data \n", tx.result.meta.TransactionResult);
  // console.log('json', J(nfts, null, 2))
  console.log("nft object", nfts);

  const balance = await client.getXrpBalance(standby_wallet.address);
  console.log("Balance", balance);
  client.disconnect();
};
main();
