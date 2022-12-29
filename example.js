const prompt = require("prompt-sync")({ sigint: true });
// const prompt = require("prompt");
// console
function main() {
  let nub = Number(prompt("Enter the number"));
  let change = [];
  //   console.log(nub % 200);
  if (nub % 200) {
    let number = nub % 200;
    const n = nub - number;
    const q = n / 200;
    for (let index = 0; index < q; index++) {
      change.push(200);
    }
    change.push(number);
    console.log(change);
  } else {
    let number = nub;
    for (let index = 0; index < parseInt(nub / 200); index++) {
      change.push(200);
    }
    console.log(change);
  }
}
main();

const main = async () => {
  const nub = 500;

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
    let nftokenCount = change[index];
    await batchmint(nftokenCount);
    console.log("details", change[index], index);
  }
};
