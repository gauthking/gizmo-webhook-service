import { Alchemy, Network } from "alchemy-sdk";
import axios from "axios";
import { ethers } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";
import { ERC20ABI } from "../helpers/utils";

const sdk = require('api')('@opensea/v2.0#1nqh2zlnvr1o4h');
function decodeHexAddress(hexString: any) {
    // Remove "0x" prefix if present
    hexString = hexString.replace(/^0x/, '');

    // Remove leading zeros
    hexString = hexString.replace(/^0+/, '');

    // Convert to lowercase
    return '0x' + hexString.toLowerCase();
}
const caller = async () => {
    try {
        const userAddress: string = "0xa5d0D51671645b1509A29bDD4A282940a6dE8E76"
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
            "0xa3d987ed4e9ef4349dfefe2760e8400ceefb30586ca123d4b9646e5d4e0ff555"
        );
        console.log(data)

        const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/iYu9qle1mLqmoe-Co3yxqRfTQgzMUukN")

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

        const transferBatchTopics: any[] = data.logs.filter((dta: any) =>
            dta.topics.includes(
                "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb"
            )
        );

        const NFTDATA: Array<{
            tokenInfo: Array<{ tokenId: number, media: string, name: string, txnType: string, from: string, to: string }>,
            nftAddress: string,
        }> = [];
        // let tkaddress: string | null | undefined = "";
        let sum: number = 0;
        const ERC: Array<{ tokenAddress: string, tokenName?: string, value: number }> = [];
        // let nativeTokenValue = 0;

        // checking inside of transfer topics
        if (transferTopics.length !== 0) {
            console.log("transfertopics");
            for (let i = 0; i < transferTopics.length; i++) {
                const r = transferTopics[i];
                let txnType: string = ""
                // general nft transfer topics
                if (r.topics.length === 4) {
                    const token_id = parseInt(r.topics[3]);
                    const token_address = r.address;
                    const from_address = decodeHexAddress(r.topics[1]);
                    if (from_address.toLowerCase() === userAddress.toLowerCase()) {
                        txnType = "sell";
                    } else {
                        txnType = "buy";
                    }
                    const existingTokenIndex: any = NFTDATA.findIndex((entry) => entry.nftAddress === token_address);

                    if (existingTokenIndex !== -1) {
                        const metadata = await alchemy.nft.getNftMetadata(token_address, token_id);
                        const media: any = metadata.image.pngUrl || "not available";
                        const name: any = metadata.name;
                        (NFTDATA[existingTokenIndex]).tokenInfo.push({ tokenId: token_id, media: media, name: name, txnType: txnType, from: from_address, to: decodeHexAddress(r.topics[2]) });

                    } else {
                        // Add a new entry to NFTDATA
                        const metadata = await alchemy.nft.getNftMetadata(token_address, token_id);
                        const media: any = metadata.image.pngUrl || "not available";
                        const name: any = metadata.name;
                        NFTDATA.push({
                            tokenInfo: [{ tokenId: token_id, media: media, name: name, txnType: txnType, from: from_address, to: decodeHexAddress(r.topics[2]) }],
                            nftAddress: token_address,
                        });
                    }
                    //ERC20's transferred
                } else if (r.topics.length === 3 && orderFulfilledTopicsSeaport.length === 0) {
                    if (parseInt(r.topics[2]) !== 0) {
                        //erc20s
                        sum += parseInt(r.data);
                        const erc20 = new ethers.Contract(r.address, ERC20ABI, provider);
                        const existingTokenIndex: any = ERC.findIndex((entry) => entry.tokenAddress === r.address);
                        if (existingTokenIndex !== -1) {
                            let newValue = ERC[existingTokenIndex].value + parseInt(r.data)
                            ERC[existingTokenIndex].value = newValue
                        } else {
                            ERC.push({
                                tokenAddress: r.address,
                                tokenName: await erc20.name() || "token_fallback",
                                value: parseInt(r.data)
                            });
                        }
                    }
                }
            }
        }


        // if (transferSingleTopics.length !== 0) {
        //     transferSingleTopics.map(async (tr: any) => {
        //         const token_address = tr.address;
        //         const abi = ["uint256", "uint256"]
        //         const decodeData = ethers.utils.defaultAbiCoder.decode(abi, tr.data)
        //         const token_id = parseInt(decodeData[0]._hex)

        //         const existingTokenIndex: any = NFTDATA.findIndex((entry) => entry.nftAddress === token_address);
        //         if (existingTokenIndex !== -1) {
        //             const metadata = await alchemy.nft.getNftMetadata(token_address, token_id);
        //             const media: any = metadata.image.pngUrl;
        //             const name: any = metadata.name;
        //             (NFTDATA[existingTokenIndex]).tokenInfo.push({ tokenId: token_id, media: media, name: name });
        //         } else {
        //             // Add a new entry to NFTDATA
        //             const metadata = await alchemy.nft.getNftMetadata(token_address, token_id);
        //             const media: any = metadata.image.pngUrl;
        //             const name: any = metadata.name;
        //             NFTDATA.push({
        //                 tokenInfo: [{ tokenId: token_id, media: media, name: name }],
        //                 nftAddress: token_address,
        //             });
        //         }
        //     })
        // }



        // if (transferBatchTopics.length !== 0) {
        //     transferBatchTopics.map(async (bth: any) => {
        //         const token_address = bth.address;
        //         const abi = ["uint256[]", "uint256[]"]
        //         const decodedData = defaultAbiCoder.decode(abi, bth.data);
        //         const tokenIds: any[] = decodedData[0].map((id: any) => parseInt(id._hex))
        //         // console.log(decodedData)
        //         const existingTokenIndex: any = NFTDATA.findIndex((entry) => entry.nftAddress === token_address);

        //         if (existingTokenIndex !== -1) {
        //             (NFTDATA[existingTokenIndex] as any).tokenId.push(tokenIds)
        //         } else {
        //             let medias: any = []
        //             let names: any = []
        //             for (let i = 0; i < tokenIds.length; i++) {
        //                 const metadata = await alchemy.nft.getNftMetadata(token_address, tokenIds[i])
        //                 const media = metadata.image.pngUrl
        //                 medias.push(media)
        //                 const name = metadata.name
        //                 names.push(name)
        //             }
        //             NFTDATA.push({
        //                 tokenId: tokenIds,
        //                 nftAddress: token_address,
        //                 media: medias,
        //                 name: names
        //             });
        //         }
        //     })
        // }

        // for opensea seaport logs - nfts sales through the seaport contract
        if (orderFulfilledTopicsSeaport.length !== 0) {
            console.log("order fulfilled topics");
            // Use a for...of loop instead of map to handle asynchronous operations properly
            for (const order of orderFulfilledTopicsSeaport) {
                try {
                    const hash = order.data.slice(0, 66);
                    const nftOrder = await sdk.get_order({
                        chain: 'ethereum',
                        protocol_address: '0x00000000000000adc04c56bf30ac9d3c0aaf14dc',
                        order_hash: hash
                    });
                    let txnType: string = ""
                    if (nftOrder.data.order.protocol_data.parameters.offerer === userAddress) {
                        txnType = "buy"
                    } else {
                        txnType = "sell"
                    }
                    // Use for...of loop instead of map to handle asynchronous operations properly
                    for (const offer of nftOrder.data.order.protocol_data.parameters.offer) {
                        if (offer.itemType === 2) {
                            const from_address = txnType === "sell" ? userAddress : nftOrder.data.order.protocol_data.parameters.offerer;
                            const to_address = txnType === "sell" ? nftOrder.data.order.protocol_data.parameters.offerer : userAddress
                            const token_address = offer.token;
                            const token_id = parseInt(offer.identifierOrCriteria);
                            let existingTokenIndex = -1;
                            for (let i = 0; i < NFTDATA.length; i++) {
                                if (NFTDATA[i].nftAddress === token_address) {
                                    existingTokenIndex = i;
                                    break;
                                }
                            }
                            if (existingTokenIndex !== -1) {
                                const metadata = await alchemy.nft.getNftMetadata(token_address, token_id);
                                const media: any = metadata.image.pngUrl || "not available";
                                const name: any = metadata.name;
                                (NFTDATA[existingTokenIndex]).tokenInfo.push({ tokenId: token_id, media: media, name: name, txnType: txnType, from: from_address, to: to_address });
                            } else {
                                const metadata = await alchemy.nft.getNftMetadata(token_address, token_id);
                                const media: any = metadata.image.pngUrl || "not available";
                                const name: any = metadata.name;
                                NFTDATA.push({
                                    tokenInfo: [{ tokenId: token_id, media: media, name: name, txnType: txnType, from: from_address, to: to_address }],
                                    nftAddress: token_address,
                                });
                            }
                        }

                        if (offer.itemType === 1) {
                            const erc20 = new ethers.Contract(offer.token, ERC20ABI, provider);
                            const existingTokenIndex: any = ERC.findIndex((entry) => entry.tokenAddress === offer.token);
                            if (existingTokenIndex !== -1) {
                                let newValue = ERC[existingTokenIndex].value + parseInt(offer.endAmount)
                                ERC[existingTokenIndex].value = newValue
                            } else {
                                ERC.push({
                                    tokenAddress: offer.token,
                                    tokenName: await erc20.name() || "token_fallback",
                                    value: parseInt(offer.endAmount)
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.log("Error in processing order:", error);
                }
            }
        }

        const uniqueNFTData = NFTDATA.map(entry => {
            const uniqueTokens: any = [];

            entry.tokenInfo.forEach(token => {
                const existingToken = uniqueTokens.find((t: any) => t.tokenId === token.tokenId);

                if (!existingToken) {
                    uniqueTokens.push(token);
                }
            });

            return {
                tokenInfo: uniqueTokens,
                nftAddress: entry.nftAddress,
            };
        });

        console.log(uniqueNFTData);

        for (let i = 0; i < uniqueNFTData[0].tokenInfo.length; i++) {
            console.log(uniqueNFTData[0].tokenInfo[i]);
        }

        // console.log(NFTDATA.length)
        if (ERC.length === 0) {
            const formattedNFTData = uniqueNFTData.map((nft) => {
                const formattedTokenInfo = nft.tokenInfo.map((info: any) => `Token ID: ${info.tokenId}\nMedia: ${info.media}\nName: ${info.name}\nTxnType: ${info.txnType}\nFrom: ${info.from}\nTo: ${info.to}`).join("\n\n");
                return `NFT Address: ${nft.nftAddress}\nToken Info:\n${formattedTokenInfo}\n\n`;
            }).join("\n\n");

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
            const formattedNFTData = uniqueNFTData.map((nft) => {
                const formattedTokenInfo = nft.tokenInfo.map((info: any) => `Token ID: ${info.tokenId}\nMedia: ${info.media}\nName: ${info.name}\nTxnType: ${info.txnType}\nFrom: ${info.from}\nTo: ${info.to}`).join("\n\n");
                return `NFT Address: ${nft.nftAddress}\nToken Info:\n${formattedTokenInfo}\n\n`;
            }).join("\n\n");
            const formattedERCData = ERC.map((erc) => `Token Name: ${erc.tokenName}\nToken Address: ${erc.tokenAddress}\nValue: ${erc.value / 10 ** 18}`).join("\n\n");

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
                                value: formattedERCData,
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




    } catch (error) {
        console.error("Error:");
    }
};

caller();
