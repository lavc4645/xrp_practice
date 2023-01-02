const getToken = async (client, transaction) => {
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
