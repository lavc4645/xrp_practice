const {XummSdk} = require('xumm-sdk')  
require("dotenv").config();
const Sdk = new XummSdk(process.env.API_KEY, process.env.API_SECRET);  

const main = async () => {  
  const request = {
    TransactionType: "NFTokenCreateOffer",
    Account: "rMFC2iftHKUj9mSS1rSFeFkbNUspb4r7k7",
    Owner: "rwKUvvUhJ1pTHrJFvQJ2VgDL57E4x1ienT",
    NFTokenID:
      "0008013A662A93E411D5FB5D5ED23E2116B5A0F6D8B218C60000099A00000000",
    Amount: "5250000",        // amount in drops
    TransferFee: 1500,
    Flags: 0,
  };
  const subscription = await Sdk.payload.createAndSubscribe(request, event => {  
          // console.log('New payload event',event.data)  
          if(Object.keys(event.data).indexOf('signed') > -1)  
          {  
              return event.data  
          }  
  })  
      console.log('sign request URL',subscription.created.next.always)  
      console.log('Pushed ',subscription.created.pushed ? 'Yes' : 'No')  
  
      const resolveData = await subscription.resolved  
      if(resolveData.signed == false)  
      {  
          console.log('The sign request was rejected!')  
      }  
      else  
      {  
        console.log('The sign request was Signed!!')  
        const result = await Sdk.payload.get(resolveData.payload_uuidv4)  
        console.log('User_token: ',result.application)  
      }  
}  
  
main()
