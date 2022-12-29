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

  const broker_wallet = xrpl.Wallet.fromSecret(process.env.TRESURE_SEED);
  const client = new xrpl.Client(process.env.DEV_NET_NODE);
  await client.connect();
  console.log(
    "Broker balance ",
    await client.getXrpBalance(broker_wallet.address)
  );

  // Prepare transaction -------------------------------------------------------
  const transactionBlob = {
    TransactionType: "NFTokenAcceptOffer",
    Account: broker_wallet.classicAddress,
    NFTokenSellOffer:
      "55885B20943235958EE4586A7DEA6548844DE072B207B6EC2D5EBB811253EBE0",
    NFTokenBuyOffer:
      "74A2FBFEF8521887DD60647654C38A4F5C5BA087CFFEAA69CDAC408538A6531B",
    NFTokenBrokerFee: "40000",
  };
  // Submit transaction --------------------------------------------------------
  const tx = await client.submitAndWait(transactionBlob, {
    wallet: broker_wallet,
  });
  console.log("Transaction completed \n",tx);

  console.log(
    "Broker balance ",
    await client.getXrpBalance(broker_wallet.address)
  );
  client.disconnect();
};
main();
