const { XummSdk } = require("xumm-sdk");
const xrpl = require("xrpl");
require("dotenv").config();
const Sdk = new XummSdk(process.env.API_KEY, process.env.API_SECRET);

const main = async () => {
  let results;
  // Connecting with the application which we made on developer console--
  const appInfo = await Sdk.ping();
  //   const IPFS = await import("ipfs-core");
  console.log(appInfo.application.name);
  const standby_wallet = "rwKUvvUhJ1pTHrJFvQJ2VgDL57E4x1ienT";

  // const standby_wallet = xrpl.Wallet.fromSecret(
  //   "sEd7XKra4i7kBmD3PUR7vagEURwsSE6"
  // );
  // const issuer_wallet = xrpl.Wallet.fromSeed("sEdVSaAar8cCtGXSqW5SMprZiikzX2E");

  // console.log("Wallet details", standby_wallet)

  // Connection with "XRPL" client--------------------------------------
  const client = new xrpl.Client("wss://xls20-sandbox.rippletest.net:51233");
  await client.connect();
  let nfts = await client.request({
    method: "account_nfts",
    account: standby_wallet,
  });

  // console.log("transaction data \n", tx.result.meta.TransactionResult);
  // console.log('json', J(nfts, null, 2))
  console.log("nft object", nfts.result);

  // *******************************************************
  // ******************** Get Offers ***********************
  // *******************************************************

  console.log("\n\n***Sell Offers***\n");
  let nftSellOffers;
  try {
    nftSellOffers = await client.request({
      method: "nft_sell_offers",
      nft_id:
        "0008013A662A93E411D5FB5D5ED23E2116B5A0F6D8B218C60000099A00000000",
    });
  } catch (err) {
    nftSellOffers = "No sell offers.";
  }
  results += JSON.stringify(nftSellOffers, null, 2);
  console.log(results);

  console.log("\n\n***BUY Offers***\n");
  let nftBuyOffers;
  try {
    nftBuyOffers = await client.request({
      method: "nft_buy_offers",
      nft_id:
        "0008013A662A93E411D5FB5D5ED23E2116B5A0F6D8B218C60000099A00000000",
    });
  } catch (err) {
    nftBuyOffers = "No BUY offers.";
  }
  results += JSON.stringify(nftBuyOffers, null, 2);
  console.log(results);

  // nfts = await client.request({
  //   method: "account_nfts",
  //   account: process.env.WALLET_ADDRESS,
  // });

  const balance = await client.getXrpBalance(standby_wallet);
  console.log("Balance", balance);
  client.disconnect();
};
main();
