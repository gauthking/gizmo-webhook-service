import { Alchemy, Network } from "alchemy-sdk";
import ethers from "ethers"
import { defaultAbiCoder } from "ethers/lib/utils";
const sdk = require('api')('@opensea/v2.0#1nqh2zlnvr1o4h');

const caller = async () => {
    const config = {
        apiKey: "thZ6Uov_nnjBegiTs5aXqlqLHHOjEXII",
        network: Network.ETH_MAINNET,
    };
    const alchemy = new Alchemy(config);
    const data: any = await alchemy.core.getTransactionReceipt(
        "0xfd818fa90e25092b6219fa7f7125f4a3bcade7d5bb302573da4bdb36c691ab1e"
    );

    const transferTopics = data.logs.filter((dta: any) =>
        dta.topics.includes(
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        )
    );

    // console.log("transferTopics - ", transferTopics)


    const orderFulfilledTopicsSeaport = data.logs.filter((dta: any) =>
        dta.topics.includes(
            "0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31"
        )
    );
    const transferSingleTopics: any[] = data.logs.filter((dta: any) =>
        dta.topics.includes(
            "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62"
        )
    );

    const transferBatchTopics: any[] = data.logs.filter((dta: any) =>
        dta.topics.includes(
            "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb"
        )
    );
    const abi = ["uint256[]", "uint256[]"]
    const decodedData = defaultAbiCoder.decode(abi, transferBatchTopics[0].data);
    console.log(decodedData)

    // if (orderFulfilledTopicsSeaport.length !== 0) {
    //     sdk.auth('8532fa9c5bdb49d78fb20d8c5bf1059d');
    //     sdk.server('https://api.opensea.io');

    //     const nftOrder = await sdk.get_order({
    //         chain: 'ethereum',
    //         protocol_address: '0x00000000000000adc04c56bf30ac9d3c0aaf14dc',
    //         order_hash: orderFulfilledTopicsSeaport[0].data.slice(0, 66)
    //     })

    //     console.log("nft order - ", nftOrder.data)
    //     console.log("protocol data - ", nftOrder.data.order.protocol_data.parameters.offer)
    // }




    // console.log(transferTopics);
    // const NFTDATA: any = [];
    // let tkaddress = "";
    // let sum = 0;
    // transferTopics.map((r: any) => {
    //     if (r.topics.length === 4) {
    //         // const token_id Ss= parseInt(r.topics[3]);
    //         const address = r.address;
    //         NFTDATA.push({
    //             // token_id: token_id,
    //             address: address,
    //         });

    //     } else if (r.topics.length === 3) {
    //         if (parseInt(r.topics[2]) !== 0) {
    //             //erc20s
    //             sum += parseInt(r.data);
    //             tkaddress = r.address;
    //         }
    //         else {
    //             //nft transfer
    //             const address = r.address;
    //             NFTDATA.push({
    //                 // token_id: token_id,
    //                 address: address,
    //             });
    //             tkaddress = "ETH"
    //             // sum = webhookEvent.event.data.block.transactions[0].value
    //         }
    //     }
    // });
    // console.log(NFTDATA)
}

caller()



