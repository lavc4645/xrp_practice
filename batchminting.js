const { XummSdk } = require("xumm-sdk");
const xrpl = require("xrpl");
require("dotenv").config();
const Sdk = new XummSdk(process.env.API_KEY, process.env.API_SECRET);
const prompt = require("prompt-sync")({ sigint: true });

const main = async () => {
  const nub = Number(prompt("Enter number of copies :"));
  const taxon = Number(prompt("Enter taxon number :"));


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

    await batchmint(nftokenCount, taxon);
   
  }
};

const batchmint = async (_tokencount,taxon) => {
  try {
  let results;
  // Connecting with the application which we made on developer console--
  const appInfo = await Sdk.ping();
  console.log(appInfo.application.name);

  const seller_wallet = xrpl.Wallet.fromSecret(process.env.SELLER_SEED);
  const broker_wallet = xrpl.Wallet.fromSecret(process.env.TRESURE_SEED);

  const client = new xrpl.Client(process.env.DEV_NET_NODE);
  await client.connect();
  var txArray = [];

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
    type: "ticket",
    limit: 400,
  });
  // console.table(response.result.account_objects);

  //------------------------------------ Populate the tickets array variable.
  let tickets = [];

  for (let i = 0; i < nftokenCount; i++) {
    tickets[i] = response.result.account_objects[i].TicketSequence;
  }

  //-------------------------------------------------------- Report progress.

  console.log("Tickets generated");
  console.table(tickets);

  // ###################################
  // Mint NFTokens

  for (let i = 0; i < nftokenCount; i++) {
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
      NFTokenTaxon: taxon,
      Fee: "10",
    };
    //------------------------------------------------------ Submit signed blob.
    transactionBlob.Memos = [
      {
        Memo: {
          MemoData: xrpl.convertStringToHex("Buddies"),
        },
      },
    ];
    const tx = await client.submit(transactionBlob, { wallet: broker_wallet });
    txArray.push({
      txHash: tx.result.tx_json.hash,
      issuer: tx.result.tx_json.Issuer,
    });
  }

  console.log("Transactions",);
  console.table(txArray);
    setTimeout(async () => {
        createSellOffer(txArray);
    }, 5000);
  // let nfts = await client.request({
  //   method: "account_nfts",
  //   account: broker_wallet.classicAddress,
  //   limit: 400,
  // });

  // console.log("lav", nfts);
  // while (nfts.result.marker) {
  //   nfts = await client.request({
  //     method: "account_nfts",
  //     account: broker_wallet.classicAddress,
  //     limit: 400,
  //     marker: nfts.result.marker,
  //   });
  //   // console.table(nfts.result.account_nfts);
  // }
  // console.table(nfts.result.account_nfts);
  // client.disconnect();
      }
     catch (e) {
    console.log("eeee::: ", e);
  }
};
main();
// batchmint(112);

const getbatch = async () => {
  const broker_wallet = xrpl.Wallet.fromSecret(process.env.TRESURE_SEED);

  const client = new xrpl.Client(process.env.DEV_NET_NODE);
  await client.connect();

  // let account_tx = await client.request({
  //   id: 2,
  //   command: "account_tx",
  //   account: broker_wallet.classicAddress,
  //   ledger_index_min: -1,
  //   ledger_index_max: -1,
  //   binary: false,
  //   limit: 400,
  //   forward: false,
  //   ledger_index: "validated",
  // });
  // console.log("account_tx.result.marker: ", account_tx);
  // console.table(account_tx.result.transactions);
  // account_tx.result.transactions.map((e) => {
  //   console.log(e);
  //   //  e.map((p)=> {console.log(`\n\n${p}`);})
  // });


   let nfts = await client.request({
     method: "account_nfts",
     account: broker_wallet.classicAddress,
     limit: 400,
   });
   console.log("lav", nfts);
};

// getbatch();



const createSellOffer = async (txArray) => {
  // try {
  const client = new xrpl.Client(process.env.DEV_NET_NODE);
  await client.connect();
  console.log("Connected to NFT dev net for create sell offer..");
  const broker_wallet = xrpl.Wallet.fromSecret(process.env.TRESURE_SEED);

     var nftids = []
     let selloffers = [];


     for (let index = 0; index < txArray.length; index++) {
      // console.log("hash:",txArray[index].txHash)
      let nfttokenId =await getToken(client, txArray[index].txHash);
      // console.log("TokenID\n\n ", nfttokenId);
      nftids.push(nfttokenId);
    
    // console.log('\n\nNFT Tokenids')
    // console.table(nftids);
    

    let transactionBlob = {};
    let nftSellOffers = {};
    let offerIndex = "";


    // for (let i = 0; i < nftids.length; i++) {
    // console.log("Inside for loop");
    transactionBlob = {
      TransactionType: "NFTokenCreateOffer",
      Account: broker_wallet.classicAddress,
      NFTokenID: await getToken(client, txArray[index].txHash),
      Amount: "0",
      Flags: 1, // 1 => sell offer
    };

    // console.log("Sell offer blob created..");
    const tx = await client.submitAndWait(transactionBlob, {
      wallet: broker_wallet,
    });
    nftSellOffers = await client.request({
      method: "nft_sell_offers",
      nft_id: nftids[index],
    });

    selloffers.push(nftSellOffers);
   
     if (nftSellOffers.result && nftSellOffers.result.offers.length) {
       offerIndex =
         nftSellOffers.result.offers[nftSellOffers.result.offers.length - 1][
           "nft_offer_index"
         ];
       //offerIndex = nftSellOffers.result.offers[0]['nft_offer_index'];
     }

     if (nftSellOffers.result && nftSellOffers.result.offers.length) {
       nftSellOffers.result.offers.forEach((offer) => {
         offerIndex = offer.nft_offer_index;
       });
     }
  }
  console.log("\n\nSelloffers");
 console.table(selloffers);
 client.disconnect();
};


const getToken = async (client, transaction) => {
  // console.log("Getting NFTtoken IDs")
  let nfts = await client.request({
    method: "tx",
    transaction: transaction,
  });

  // console.log(nfts);
  // console.log(nfts.result.meta)

  return await new Promise((resolve, reject) => {
    try {
      let token = "";

      const node = nfts?.result?.meta?.AffectedNodes.find(
        (n) =>
          n.CreatedNode?.NewFields?.NFTokens ||
          n.ModifiedNode?.FinalFields?.NFTokens
      );
        // console.log("node", node);

      let nftResult = {};

      if (node) {
        let tokens = node.CreatedNode?.NewFields?.NFTokens?.map(
          (token) => token?.NFToken
        );

        if (!tokens) {
          tokens = node.ModifiedNode?.FinalFields?.NFTokens?.map(
            (token) => token?.NFToken
          );

          const prevTokens = node.ModifiedNode?.PreviousFields?.NFTokens?.map(
            (token) => token?.NFToken
          );

          if (prevTokens) {
            nftResult = tokens.filter(
              (t) => !prevTokens.some((pt) => pt.NFTokenID === t.NFTokenID)
            );
          }
        } else {
          nftResult = tokens.map((token) => token);
        }
      }
      // console.log("NFT----", nftResult);
      if (nftResult && nftResult.length) {
        if (nftResult[0]?.NFTokenID) {
          token = nftResult[0]?.NFTokenID;
        }
      }

      resolve(token);
    } catch (error) {
      reject(error);
    }
  })
    .then((data) => data)
    .catch((err) => {
      console.log("err", err);
      return false;
    });
};
