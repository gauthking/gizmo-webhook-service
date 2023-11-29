import { Alchemy, Network } from "alchemy-sdk";
const config = {
  apiKey: "thZ6Uov_nnjBegiTs5aXqlqLHHOjEXII",
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(config);
const data = await alchemy.core.getTransactionReceipt(
  "0xa3d987ed4e9ef4349dfefe2760e8400ceefb30586ca123d4b9646e5d4e0ff555"
);

const res = data.logs.filter((dta) =>
  dta.topics.includes(
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
  )
);

console.log(data);

const NFTDATA = [];
var tkaddress;
var sum = 0;

res.map((r) => {
  if (r.topics.length === 4) {
    const token_id = parseInt(r.topics[3]);
    const address = r.address;

    NFTDATA.push({
      token_id: token_id,
      address: address,
    });
  } else if (r.topics.length === 3) {
    sum += parseInt(r.data);
    tkaddress = r.address;
  }
});

console.log("NFT DATA-", NFTDATA);
console.log("Token Details", tkaddress, "   ", sum);
