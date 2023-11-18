import { Alchemy, Network } from "alchemy-sdk";
const config = {
  apiKey: "thZ6Uov_nnjBegiTs5aXqlqLHHOjEXII",
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(config);

const data = await alchemy.core.getTransactionReceipt(
  "0xe87bddc323dd10a10f451eb93d7038a20c3e9de41c9bc47891ea6bf5c06091ba"
);

const res = data.logs.filter((dta) =>
  dta.topics.includes(
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
  )
);

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
console.log("Token Details", tkaddress,"   ",sum);
