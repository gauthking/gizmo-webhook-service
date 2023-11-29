import { Alchemy, Network } from "alchemy-sdk";
import axios from "axios";
import { ethers } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";

const sdk = require('api')('@opensea/v2.0#1nqh2zlnvr1o4h');

const caller = async () => {
    try {
        await sdk.auth('8532fa9c5bdb49d78fb20d8c5bf1059d');
        await sdk.server('https://api.opensea.io');
        const discordWH = "https://discord.com/api/webhooks/1174257039153823775/M_6lCC30d8bMhP7aqHGHAKePt5rVCfgJ7zZqO8ajZTS2tIhnNDJ3AfJJ8vdabtU4fA7Q"
        let tkaddress = ""
        const config = {
            apiKey: "thZ6Uov_nnjBegiTs5aXqlqLHHOjEXII",
            network: Network.ETH_MAINNET,
        };

        const alchemy = new Alchemy(config);
        const data: any = await alchemy.core.getTransactionReceipt(
            "0xd2060aad32bc09072fb3dd876058e2208a01a0d750a91443115b4f2012541658"
        );

        // console.log("data -", data)

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
            media: string | null | undefined,
            name: string | null | undefined
        }> = [];
        // let tkaddress: string | null | undefined = "";
        let sum: number = 0;
        const ERC: any[] = [];
        let nativeTokenValue = 0;

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
                        const metadata = await alchemy.nft.getNftMetadata(token_address,token_id)
                   const media = metadata.image.pngUrl
                   const name = metadata.name
                        NFTDATA.push({
                            tokenId: [token_id],
                            nftAddress: token_address,
                            media,
                            name
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
            transferSingleTopics.map(async(tr: any) => {
                const token_address = tr.address;
                const abi = ["uint256", "uint256"]
                const decodeData = ethers.utils.defaultAbiCoder.decode(abi, tr.data)
                const token_id = parseInt(decodeData[0]._hex)

                const existingTokenIndex: any = NFTDATA.findIndex((entry) => entry.nftAddress === token_address);
                if (existingTokenIndex !== -1) {
                    (NFTDATA[existingTokenIndex] as any).tokenId.push(token_id);
                } else {
                    // Add a new entry to NFTDATA
                   const metadata = await alchemy.nft.getNftMetadata(token_address,token_id)
                   const media = metadata.image.pngUrl
                   const name = metadata.name
                    NFTDATA.push({
                        tokenId: [token_id],
                        nftAddress: token_address,
                        media,
                        name
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
            transferBatchTopics.map(async(bth: any) => {
                const token_address = bth.address;
                const abi = ["uint256[]", "uint256[]"]
                const decodedData = defaultAbiCoder.decode(abi, bth.data);
                const tokenIds = decodedData[0].map((id: any) => parseInt(id._hex))
                // console.log(decodedData)
                const existingTokenIndex: any = NFTDATA.findIndex((entry) => entry.nftAddress === token_address);

                if (existingTokenIndex !== -1) {
                    (NFTDATA[existingTokenIndex] as any).tokenId.push(tokenIds)
                } else {
            
                    const metadata = await alchemy.nft.getNftMetadata(token_address,token_id)
                    const media = metadata.image.pngUrl
                    const name = metadata.name
                    NFTDATA.push({
                        tokenId: tokenIds,
                        nftAddress: token_address,
                        media,
                        name
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
                                const metadata = await alchemy.nft.getNftMetadata(token_address,token_id)
                    const media = metadata.image.pngUrl
                    const name = metadata.name
                                NFTDATA.push({
                                    tokenId: [token_id],
                                    nftAddress: token_address,
                                    media,
                                    name
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

        console.log(NFTDATA.length)
        if (ERC.length === 0) {
            const formattedNFTData = NFTDATA.map((nft) => `Token IDs: ${(nft.tokenId as number[]).join(', ')}\nNFT Address: ${nft.nftAddress}`).join("\n\n");

            const example = {
                username: "BOLT",
                avatar_url: "https://i.imgur.com/4M34hi2.png",
                content: "",
                embeds: [
                    {
                        title: "NFT and Token Data Notification",
                        color: 15258703,
                        fields: [
                            {
                                name: "NFT Data",
                                value: formattedNFTData,
                                inline: true,
                            },
                            {
                                name: "Txn Value",
                                value: `ETH Value: `,
                                inline: true,
                            },
                        ],
                        thumbnail: {
                            url: "https://upload.wikimedia.org/wikipedia/commons/3/38/4-Nature-Wallpapers-2014-1_ukaavUI.jpg",
                        },
                        footer: {
                            text: "Woah! So cool! :smirk:",
                            icon_url: "https://i.imgur.com/fKL31aD.jpg",
                        },
                    },
                ],
            };
            await axios.post(discordWH, example).then(response => {
                console.log('Message posted to Discord successfully:', response.data);
            })
                .catch(error => {
                    console.error('Error posting message to Discord:', error);
                });
        } else {
            const formattedNFTData = NFTDATA.map((nft) => `Token IDs: ${(nft.tokenId as number[]).join(', ')}\nNFT Address: ${nft.nftAddress}`).join("\n\n");

            const example = {
                username: "BOLT",
                avatar_url: "https://i.imgur.com/4M34hi2.png",
                content: "",
                embeds: [
                    {
                        title: "NFT and Token Data Notification",
                        color: 15258703,
                        fields: [
                            {
                                name: "NFT Data",
                                value: formattedNFTData,
                                inline: true,
                            },
                            {
                                name: "Token Data",
                                value: `Token Address: ${tkaddress}\nTotal Sum: ${sum / 10 ** 18}`,
                                inline: true,
                            },
                            // {
                            //     name: "Txn Value",
                            //     value: `ETH Value: ${webhookEvent.event.data.value}`,
                            //     inline: true,
                            // },
                        ],
                        thumbnail: {
                            url: "https://upload.wikimedia.org/wikipedia/commons/3/38/4-Nature-Wallpapers-2014-1_ukaavUI.jpg",
                        },
                        footer: {
                            text: "Woah! So cool! :smirk:",
                            icon_url: "https://i.imgur.com/fKL31aD.jpg",
                        },
                    },
                ],
            };
            await axios.post(discordWH, example).then(response => {
                console.log('Message posted to Discord successfully:', response.data);
            })
                .catch(error => {
                    console.error('Error posting message to Discord:', error);
                });
            // res.send("Alchemy Notify is the best!");
        }
        console.log(NFTDATA, ERC);



    } catch (error) {
        console.error("Error:");
    }
};

caller();
