import { Alchemy, Network } from "alchemy-sdk";
import { ethers } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";

const sdk = require('api')('@opensea/v2.0#1nqh2zlnvr1o4h');

const caller = async () => {
    try {
        await sdk.auth('8532fa9c5bdb49d78fb20d8c5bf1059d');
        await sdk.server('https://api.opensea.io');

        const config = {
            apiKey: "thZ6Uov_nnjBegiTs5aXqlqLHHOjEXII",
            network: Network.ETH_MAINNET,
        };

        const alchemy = new Alchemy(config);
        const data: any = await alchemy.core.getTransactionReceipt(
            "0xfd818fa90e25092b6219fa7f7125f4a3bcade7d5bb302573da4bdb36c691ab1e"
        );

        const transferSingleTopics: any[] = data.logs.filter((dta: any) =>
            dta.topics.includes(
                "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62"
            )
        );

        const transferTopics: any[] = data.logs.filter((dta: any) =>
            dta.topics.includes(
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
            )
        );

        const orderFulfilledTopicsSeaport: any[] = data.logs.filter((dta: any) =>
            dta.topics.includes(
                "0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31"
            )
        );

        const NFTDATA: Array<{
            tokenId: number[] | null | undefined,
            nftAddress: string | null | undefined,
        }> = [];
        let tkaddress: string | null | undefined = "";
        let sum: number = 0;
        const ERC: any = [];

        // checking inside of transfer topics
        if (transferTopics.length !== 0) {
            await Promise.all(transferTopics.map(async (r: any) => {
                // general nft transfer topics
                if (r.topics.length === 4) {
                    const token_id = parseInt(r.topics[3]);
                    const token_address = r.address;
                    const existingTokenIndex: any = NFTDATA.findIndex((entry) => entry.nftAddress === token_address);
                    if (existingTokenIndex !== -1) {
                        (NFTDATA[existingTokenIndex] as any).tokenId.push(token_id);
                    } else {
                        // Add a new entry to NFTDATA
                        NFTDATA.push({
                            tokenId: [token_id],
                            nftAddress: token_address,
                        });
                    }
                    //ERC20's transferred
                } else if (r.topics.length === 3) {
                    if (parseInt(r.topics[2]) !== 0) {
                        //erc20s
                        sum += parseInt(r.data);
                        tkaddress = r.address;
                    }
                }
            }));
        }

        if (transferSingleTopics.length !== 0) {
            transferSingleTopics.map((tr: any) => {

            
                const token_address = tr.address;
                const abi = ["uint256", "uint256"]

                
            const decodeData = ethers.utils.defaultAbiCoder.decode(abi,tr.data)
            const token_id = parseInt(decodeData[0]._hex)

                const existingTokenIndex: any = NFTDATA.findIndex((entry) => entry.nftAddress === token_address);
                if (existingTokenIndex !== -1) {
                    (NFTDATA[existingTokenIndex] as any).tokenId.push(token_id);
                } else {
                    // Add a new entry to NFTDATA
                    NFTDATA.push({
                        tokenId: [token_id],
                        nftAddress: token_address,
                    });
                }
            })
        }

        const transferBatchTopics: any[] = data.logs.filter((dta: any) =>
            dta.topics.includes(
                "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb"
            )
        );


        if (transferBatchTopics.length !== 0) {
            
            transferBatchTopics.map((bth: any) => {
                const token_address = bth.address;
                const abi = ["uint256[]", "uint256[]"]
                const decodedData = defaultAbiCoder.decode(abi, bth.data);
                const tokenIds = decodedData[0].map((id: any) => parseInt(id._hex))
                console.log(decodedData)
                const existingTokenIndex: any = NFTDATA.findIndex((entry) => entry.nftAddress === token_address);

                if (existingTokenIndex !== -1) {
                    (NFTDATA[existingTokenIndex] as any).tokenId.push(tokenIds)
                } else {
                    NFTDATA.push({
                        tokenId: tokenIds,
                        nftAddress: token_address,
                    });
                }
            })
        }

        // for opensea seaport logs - nfts sales through the seaport contract
        if (orderFulfilledTopicsSeaport.length !== 0) {
            await Promise.all(orderFulfilledTopicsSeaport.map(async (order: any) => {
                try {
                    const hash = order.data.slice(0, 66)
                    console.log(hash);
                    const nftOrder = await sdk.get_order({
                        chain: 'ethereum',
                        protocol_address: '0x00000000000000adc04c56bf30ac9d3c0aaf14dc',
                        order_hash: hash
                    })

                    await Promise.all(nftOrder.data.order.protocol_data.parameters.offer.map(async (offer: any) => {
                        if (offer.itemType === 2) {
                            const token_address = offer.token;
                            const token_id = parseInt(offer.identifierOrCriteria)
                            const existingTokenIndex: any = NFTDATA.findIndex((entry) => entry.nftAddress === token_address);
                            if (existingTokenIndex !== -1) {
                                (NFTDATA[existingTokenIndex] as any).tokenId.push(token_id);
                            } else {
                                // Add a new entry to NFTDATA
                                NFTDATA.push({
                                    tokenId: [token_id],
                                    nftAddress: token_address,
                                });
                            }
                        }
                        if (offer.itemType === 1) {
                            ERC.push({
                                tokenAddress: offer.token,
                                value: offer.endAmount
                            });
                        }
                    }));

                } catch (error) {
                    console.log("Error in processing order:");
                }

            }));
        }

       console.log(NFTDATA, ERC);

    } catch (error) {
        console.error("Error:");
    }
};

caller();
