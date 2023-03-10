const { XummSdk } = require("xumm-sdk");
const xrpl = require("xrpl");
require("dotenv").config();
const Sdk = new XummSdk(process.env.API_KEY, process.env.API_SECRET);
// const prompt = require("prompt-sync")({ sigint: true });

const seller_wallet = xrpl.Wallet.fromSecret(process.env.SELLER_SEED);
const broker_wallet = xrpl.Wallet.fromSecret(process.env.TRESURE_SEED);

const client = new xrpl.Client(process.env.DEV_NET_NODE);

const main = async (req, res) => {
  console.log(req.body);
  let { nub, taxon } = req.body;
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

  // await Promise.all(
  //   change.map(async (nftokenCount) =>)
  // );
  let txarray = [];
  for (let index = 0; index < change.length; index++) {
    console.log("details", change[index], index);
    let nftokenCount = change[index];
    txarray = [...txarray, ...(await batchmint(nftokenCount, taxon))];
  }
  if (txarray) {
    res.status(200).send({
      data: { MintedTokens: txarray },
      status: true,
    });
  } else {
    res.status(404).send({
      data: null,
      status: false,
    });
  }
};

const batchmint = async (_tokencount, taxon) => {
  // try {
    client.connection.config.connectionTimeout = 180000
    await client.connect();
    // client.timeout = 18000
  // Connecting with the application which we made on developer console--
  const appInfo = await Sdk.ping();
  console.log(appInfo.application.name, broker_wallet);
  const bal = await client.getXrpBalance(broker_wallet.classicAddress);
  console.log(bal);

  var txArray = [];

  const transactionBlob = {
    TransactionType: "AccountSet",
    Account: seller_wallet.classicAddress,
    NFTokenMinter: broker_wallet.classicAddress, //(operational account )
    SetFlag: 10, //xrpl.AccountSetAsfFlags.asfAuthorizedNFTokenMinter
  };
  const Tx = await client.submit(transactionBlob, { wallet: seller_wallet });
  console.log("Account set");

  const account_info = await client.request({
    command: "account_info",
    account: broker_wallet.classicAddress,
  });
  my_sequence = account_info.result.account_data.Sequence;

  const nftokenCount = parseInt(_tokencount);

  //-------------------------------------------- Create the transaction hash.
  const ticketTransaction = await client.autofill({
    TransactionType: "TicketCreate",
    Account: broker_wallet.classicAddress,
    TicketCount: nftokenCount,
    Sequence: my_sequence,
  });

  console.log("Ticket",ticketTransaction);
  //---------------------------------------------------- Sign the transaction.
  const signedTransaction = broker_wallet.sign(ticketTransaction);

  //-------------------------- Submit the transaction and wait for the result.
  const tx = await client.submitAndWait(signedTransaction.tx_blob);
  console.log("Tickets", tx);

  
  let tickets = [];
  
  let response = await client.request({
    command: "account_objects",
    account: broker_wallet.classicAddress,
    type: "ticket",
    limit: 400
  });
  
  // console.log("response_initial",response.result);
  // console.table(response.result.account_objects);
  tickets = await new Promise((resolve, reject) => {
    try {
      // let objects = [];
      // const listing = response.result.account_objects;
      // for (let index = 0; index < listing.length; index++) {
        //   const element = listing["TicketSequence"];
        //   if (!element) {
          //     return;
          //   }
          //   objects.push(element);
          // }
          const objects = response?.result?.account_objects?.map(
            (item) => item["TicketSequence"]
            );
            // console.log("Objects");
            // console.table(objects); 
            resolve(objects);
          } catch (error) {
            console.log(error);
            reject([]);
          }
        });
        
        if (response.result.marker) {
          // let _marker = response.result.marker.split(",");
          // console.log("Marker", _marker);
          while (response.result.marker) {
            response = await client.request({
              command: "account_objects",
              account: broker_wallet.classicAddress,
              type: "ticket", 
              limit: 400,
              marker: response.result.marker,
            });
            // console.log("response", response);
            // console.table(response.result.account_objects);
            
            tickets = [
              ...tickets,
              ...(await new Promise((resolve, reject) => {
                try {
                  const objects = response.result.account_objects.map(
                    (item) => item["TicketSequence"]
                    );
                    resolve(objects);
                  } catch (error) {
                    console.log(error);
                    reject([]);
                  }
                })),
              ];
            }
          }
         
          console.log("Tickets generated");
          console.table(tickets);
          
                  
                  // const values = await Promise.all(
                    //   CVhange.map(async (value, key) => {
                      //     transactionBlob1.TicketSequence = key + 1;
                      //     //------------------------------------------------------ Submit signed blob.
                      //     return await client.submit(transactionBlob1, {
                        //       wallet: broker_wallet,
                        //     });
                        //   })
                        // );

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
                          // console.log("Transactioon", tx.result.tx_json.LastLedgerSequence);
                          txArray.push({
                            txHash: tx.result.tx_json.hash,
                            issuer: tx.result.tx_json.Issuer,
                          });
                        }
                        //
                        console.log("Transactions");
                        console.table(txArray);

                          await createSellOffer(txArray);
                                            
                        // await client.disconnect()
                        return txArray;

                      };
                      
                      // main();
// batchmint(112);

const getbatch = async () => {
  const broker_wallet = xrpl.Wallet.fromSecret(process.env.TRESURE_SEED);

  const client = new xrpl.Client(process.env.DEV_NET_NODE);
  await client.connect();

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

  var nftids = [];
  let selloffers = [];
 
  for (let index = 0; index < txArray.length; index++) {
    const { txHash } = txArray[index];
    // console.log("txHash", txHash, index);
    nftids.push({
      txhash: txHash,
      tokenId: await getToken(client, txHash),
    });
  }
  console.table(nftids);
  for (let index = 0; index < nftids.length; index++) {
   
    selloffers = [...selloffers, ...await gettxhash(broker_wallet, nftids[index].tokenId)];
    console.log("Offer created", index);
    // console.log("*************************************************************");
  }
  /** This will broke  the  websocket
   * DisconnectedError: websocket was closed, Policy error: client is too slow.
   */
  // await Promise.all(nftids.map(async (nfttoken) => {
  //   selloffers = [...selloffers, ...await gettxhash(broker_wallet, nfttoken.tokenId)];
  // }))
  console.table(selloffers);
};

const getToken = async (client, transaction) => {
  // console.log("trans====", transaction);

  let nfts = await client.request({
    method: "tx",
    transaction: transaction,
  });
  // console.log("NFTS", nfts.result.meta.AffectedNodes);
  // console.table(nfts);

  return await new Promise(async (resolve, reject) => {
    try {
      let token;

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

          // console.table(tokens);
          // console.table(prevTokens);

          if (prevTokens) {
            nftResult = tokens.filter(
              (t) => !prevTokens.some((pt) => pt.NFTokenID === t.NFTokenID)
            );
            // console.log("abcd----", nftResult);
          } else {
            //logic to find previous tokens from nextminpage
            // console.log("xyz----", node);
            nfts = await client.request({
              command: "ledger_entry",
              index: node.ModifiedNode?.PreviousFields?.NextPageMin,
              ledger_index: "validated",
            });
            tokens = node.ModifiedNode?.FinalFields?.NFTokens?.map(
              (token) => token?.NFToken
            );

            const prevTokens = nfts.result.node.NFTokens?.map(
              (token) => token?.NFToken
            );
            nftResult = tokens.filter(
              (t) => !prevTokens.some((pt) => pt.NFTokenID === t.NFTokenID)
            );
            // console.log("Else part", nftResult);
          }
        } else {
          nftResult = tokens.map((token) => token);
          // console.log("abcd else----", nftResult);
        }
      }
      // console.log("NFT----", nftResult);
      if (nftResult && nftResult.length) {
        if (nftResult[0]?.NFTokenID) {
          token = nftResult[0]?.NFTokenID;
        }
      }
      // console.log(`Token ==> ${token}  Hash ==> ${transaction}`);
      // have to wait the code
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

const getTickets = async (account_object) => {
  setTimeout(() => {
    nftids.push({ txhash: txArray[index].txHash, tokenId: nfttokenId });
  }, 1000);
};

const account_info = async (req, res) => {
  try {
    await client.connect();
    const account_info = await client.request({
      command: "account_info",
      account: broker_wallet.classicAddress,
    });
    // console.log("Done\n", account_info);
    my_sequence = account_info.result.account_data.Sequence;
    console.log(my_sequence);
    res.send({
      data: my_sequence,
      status: true,
    });
  } catch (error) {
    res.send(error);
  }
};

const gettxhash = async (broker_wallet, tokenid) => {
  let nftSellOffers = {};
  let selloffers = [];
  transactionBlob = {
    TransactionType: "NFTokenCreateOffer",
    Account: broker_wallet.classicAddress,
    NFTokenID: tokenid,
    Amount: "0",
    Flags: 1, // 1 => sell offer
  };
  console.log(
    // "***************************************************************"
  );
  // console.table(transactionBlob);
  const tx = await client.submitAndWait(transactionBlob, {
    wallet: broker_wallet,
  });
  // console.log("Transaction",tx)
  nftSellOffers = await client.request({
    method: "nft_sell_offers",
    nft_id: tokenid,
  });
  console.log(nftSellOffers.result.offers);
  
  selloffers.push(...nftSellOffers.result.offers);

  return selloffers;
};

// account_info()

const transaction = async (txhash) => {
  await client.connect();
  let nfts = await client.request({
    method: "tx",
    transaction: txhash,
  });

  let token;

  let node = nfts?.result?.meta?.AffectedNodes.find(
    (n) =>
      n.CreatedNode?.NewFields?.NFTokens ||
      n.ModifiedNode?.FinalFields?.NFTokens
  );
  nfts = await client.request({
    command: "ledger_entry",
    index: node.ModifiedNode?.PreviousFields?.NextPageMin,
    ledger_index: "validated",
  });
  console.log(
    "node+++++++++++++",
    node.ModifiedNode?.PreviousFields?.NextPageMin
  );
  console.table(nfts.result.node.NFTokens);


  while (node.ModifiedNode?.PreviousFields?.NextPageMin) {
    console.log("node2", nfts);
    break;
    node = nfts?.result?.meta?.AffectedNodes.find(
      (n) =>
        n.CreatedNode?.NewFields?.NFTokens ||
        n.ModifiedNode?.FinalFields?.NFTokens
    );
  }
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

      console.table(tokens);
      console.table(prevTokens);

      if (prevTokens) {
        nftResult = tokens.filter(
          (t) => !prevTokens.some((pt) => pt.NFTokenID === t.NFTokenID)
        );
        console.log("abcd----", nftResult);
      } else {
        //logic to find previous tokens from nextminpage
        console.log("xyz----", node);
        nfts = await client.request({
          method: "tx",
          transaction: transaction,
          NextPageMin: node.ModifiedNode?.PreviousFields.NextPageMin,
        });
        tokens = node.ModifiedNode?.FinalFields?.NFTokens?.map(
          (token) => token?.NFToken
        );

        const prevTokens = node.ModifiedNode?.PreviousFields?.NFTokens?.map(
          (token) => token?.NFToken
        );
        nftResult = tokens.filter(
          (t) => !prevTokens.some((pt) => pt.NFTokenID === t.NFTokenID)
        );
      }
    } else {
      nftResult = tokens.map((token) => token);
      console.log("abcd else----", nftResult);
    }
  }
  console.log("NFT----", nftResult);
  if (nftResult && nftResult.length) {
    if (nftResult[0]?.NFTokenID) {
      token = nftResult[0]?.NFTokenID;
    }
  }
};

// transaction("BC8ACE38FF2C234CC82FA708DB3590DE9D24CED2F1E2EF915277D0D13A6F7372");

module.exports = { main };
