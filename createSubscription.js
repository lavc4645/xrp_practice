const { XummSdk } = require("xumm-sdk");
require("dotenv").config();

const Sdk = new XummSdk(process.env.API_KEY, process.env.API_SECRET);

const main = async () => {
  const appInfo = await Sdk.ping();
  console.log(appInfo.application.name);

  /**
   * Please change the desination account to the account
   * you own or you'll be testing sending the small amount of XRP to XRPL team
   */

  const request = {
    TransactionType: "Payment",
    Destination: "rHqjcvgDtH8qCR9uQcBxeiJmdpjvgsVKAx",
    Amount: "100",
    Memos: [
      {
        Memo: {
          MemoData: "F09F988E20596F7520726F636B21",
        },
      },
    ],
  };

  const subscription = await Sdk.payload.createAndSubscribe(
    request,
    (event) => {
      console.log("event response code", event.data);

      // it is used to hold the node untill the request get signed
      if (Object.keys(event.data).indexOf("signed") > -1) {
        return event.data;
      }
    }
  );
  console.log(subscription.created);
  const resolved = await subscription.resolved;
  console.log(resolved);

  // console.log("Subscription\n",subscription.created)

  /**
   * Now let's wait until the subscription resolved (by returning something)
   * in the callback function
   */

  // const resolveData = await subscription.resolved

  // if (resolveData.signed === false) {
  //     console.log(' The sign request was rejected :(')
  // }

  // if (resolveData.signed === true) {
  //     console.log('Woohoo! The sign request was signed')

  //     /**
  //      * Let's fetch the full payload end result, and get the issued
  //      * user token, we can use to send our next payload per push notification
  //      */

  const result = await Sdk.payload.get(resolved.payload_uuidv4);
  console.log("User token:", result.application.issued_user_token);
  // }
};

main();
