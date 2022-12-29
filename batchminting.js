const { XummSdk } = require("xumm-sdk");
const xrpl = require("xrpl");
require("dotenv").config();
const Sdk = new XummSdk(process.env.API_KEY, process.env.API_SECRET);
const prompt = require("prompt-sync")({ sigint: true });

const main = async () => {
  const nub = Number(prompt("Enter number of copies"));;

  let change = [];

  if (nub % 200) {
    let number = nub % 200;
    const n = nub - number;
    const q = n / 200;
    for (let index = 0; index < q; index++) {
      change.push(200);
    }
    change.push(number);
  } else {
    for (let index = 0; index < parseInt(nub / 200); index++) {
      change.push(200);
    }
  }

  for (let index = 0; index < change.length; index++) {
    console.log("details", change[index], index);
    let nftokenCount = change[index];
    await batchmint(nftokenCount);
  }
};

const batchmint = async (_tokencount) => {
    // try {
      let results;
      // Connecting with the application which we made on developer console--
      const appInfo = await Sdk.ping();
      console.log(appInfo.application.name);

      const seller_wallet = xrpl.Wallet.fromSecret(process.env.SELLER_SEED);
      const broker_wallet = xrpl.Wallet.fromSecret(process.env.TRESURE_SEED);

      const client = new xrpl.Client(process.env.DEV_NET_NODE);
      await client.connect();

       console.log("Accountset");
      const transactionBlob = {
          TransactionType: "AccountSet",
          Account: seller_wallet.classicAddress,
          NFTokenMinter: broker_wallet.classicAddress, //(operational account )
          SetFlag: 10, //xrpl.AccountSetAsfFlags.asfAuthorizedNFTokenMinter
      };
      console.log(transactionBlob);
    const Tx = await client.submit(transactionBlob, { wallet: seller_wallet });
      console.log("Account set");

      const account_info = await client.request({
        command: "account_info",
        account: broker_wallet.address,
      });
      my_sequence = account_info.result.account_data.Sequence;
      const nftokenCount = parseInt(_tokencount);

      //-------------------------------------------- Create the transaction hash.
      const ticketTransaction = await client.autofill({
        TransactionType: "TicketCreate",
        Account: broker_wallet.address,
        TicketCount: nftokenCount,
        Sequence: my_sequence,
      });

      // console.log("Ticket",ticketTransaction);
      //---------------------------------------------------- Sign the transaction.
      const signedTransaction = broker_wallet.sign(ticketTransaction);

      //-------------------------- Submit the transaction and wait for the result.
      const tx = await client.submitAndWait(signedTransaction.tx_blob);
      // console.log("Signed ticket", tx);

      let response = await client.request({
        command: "account_objects",
        account: broker_wallet.address,
        // type: "ticket",
        limit: 1000,
      });
      // console.table(response.result.account_objects);

      //------------------------------------ Populate the tickets array variable.
      let tickets = [];

      for (let i = 0; i < nftokenCount; i++) {
        tickets[i] = response.result.account_objects[i].TicketSequence;
      }

      //-------------------------------------------------------- Report progress.
      
      console.log("Tickets generated");
    
      // ###################################
// Mint NFTokens
  
  for (let i=0; i < nftokenCount; i++) {
    const transactionBlob = {
      TransactionType: "NFTokenMint",
      Account: broker_wallet.classicAddress,
      URI: xrpl.convertStringToHex("Helllo"),
      Flags: parseInt("9"),
      TransferFee: parseInt("314"),
      Sequence: 0,
      Issuer: seller_wallet.classicAddress,
      TicketSequence: tickets[i],
      LastLedgerSequence: null,
      NFTokenTaxon: 212,
      Fee: "10"
    };
    //------------------------------------------------------ Submit signed blob.
    transactionBlob.Memos = [
      {
        Memo: {
          MemoData: xrpl.convertStringToHex("Buddies"),
        },
      },
    ];
    const tx =await client.submit(transactionBlob, { wallet: broker_wallet });
  }


  console.log("NFT Listing")
   let nfts = await client.request({
     method: "account_nfts",
     account: broker_wallet.classicAddress,
     limit: 400,
   });
   console.log("lav", nfts.result.marker);
     while (nfts.result.marker) {
       nfts = await client.request({
         method: "account_nfts",
         account: broker_wallet.classicAddress,
         limit: 400,
         marker: nfts.result.marker,
       });
      //  results += "\n" + JSON.stringify(nfts, null, 2);
      console.table(nfts.result.account_nfts);
    }
    // console.table(nfts.result.account_nfts);
      client.disconnect();
  //     }
  //    catch (e) {
  //   console.log("eeee::: ", e);
  // }
}
main();
// batchmint(112);
