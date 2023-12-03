import express from "express";
import {
    addAlchemyContextToRequest,
    validateAlchemySignature,
    AlchemyWebhookEvent,
} from "./helpers/webhooksUtil";
import axios from "axios";
import { Alchemy, Network } from "alchemy-sdk";
import { defaultAbiCoder } from "ethers/lib/utils";
import { ethers } from "ethers";
import { orderFulfilledTopic, transferBatchTopic, transferSingleTopic, transferTopic } from "./helpers/utils";
import { ERC20ABI } from "./helpers/utils";
import addresses from "../src/helpers/addresses.json";


const sdk = require('api')('@opensea/v2.0#1nqh2zlnvr1o4h');

function decodeHexAddress(hexString: any) {
    // Remove "0x" prefix if present
    hexString = hexString.replace(/^0x/, '');

    // Remove leading zeros
    hexString = hexString.replace(/^0+/, '');

    // Convert to lowercase
    return '0x' + hexString.toLowerCase();
}


async function main(): Promise<void> {
    const app = express();
    const signingKey = "whsec_rANmhiVFHwMZ7oHqpJdhTenE"
    const port = 8001;
    const config = {
        apiKey: "rZC3EwTnyb4_nr9mH2wQJSk5goVHvVv0",
        network: Network.MATIC_MUMBAI,
    };

    await sdk.auth('8532fa9c5bdb49d78fb20d8c5bf1059d');
    await sdk.server('https://api.opensea.io');

    const alchemy = new Alchemy(config);
    const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/iYu9qle1mLqmoe-Co3yxqRfTQgzMUukN")

    const discordWH = "https://discord.com/api/webhooks/1174257039153823775/M_6lCC30d8bMhP7aqHGHAKePt5rVCfgJ7zZqO8ajZTS2tIhnNDJ3AfJJ8vdabtU4fA7Q"


    app.use(
        express.json({
            verify: addAlchemyContextToRequest,
        })
    );
    app.use(validateAlchemySignature(signingKey));


    var asset : any;
    var value : any;
    var userAddresses : any[] =[];
    //MAIN API POST FOR WEBHOOK
    addresses.map((addres)=>{
        userAddresses.push(addres.address.toLowerCase())
    })

    const test = "0xcCac4DeDB8071A54Be6e5C4C4319965D33450a82"
    userAddresses.push(test.toLowerCase())
    app.post("/webhook-path", async (req, res) => {
        try{
        const webhookEvent = req.body as AlchemyWebhookEvent;
        var userAddress;
        console.log(userAddresses)
        console.log(webhookEvent.event.activity[0].fromAddress)
        if(userAddresses.includes(webhookEvent.event.activity[0].fromAddress))
        {
             userAddress = userAddresses[userAddresses.indexOf(webhookEvent.event.activity[0].fromAddress)]
        }
        else if(userAddresses.includes(webhookEvent.event.activity[0].toAddress))
        {
             userAddress = userAddresses[userAddresses.indexOf(webhookEvent.event.activity[0].toAddress)]
        }


        if(webhookEvent.event.activity[0].hasOwnProperty('asset'))
        {
             asset = webhookEvent.event.activity[0].asset
             value = webhookEvent.event.activity[0].value
        }

        // if (webhookEvent.event.data.block.transactions.length === 0) {
        //     return
        // }
        const data: any = await alchemy.core.getTransactionReceipt(
            webhookEvent.event.activity[0].hash);

            console.log(webhookEvent.event.activity[0].hash);
            console.log(data)

        const transferTopics: any[] = data.logs.filter((dta: any) =>
            dta.topics.includes(
                transferTopic
            )
        );

        const transferSingleTopics: any[] = data.logs.filter((dta: any) =>
            dta.topics.includes(
                transferSingleTopic
            )
        );

        const orderFulfilledTopicsSeaport: any[] = data.logs.filter((dta: any) =>
            dta.topics.includes(
                orderFulfilledTopic
            )
        );

        const NFTDATA: Array<{
            tokenInfo: Array<{ tokenId: number, media: string, name: string, txnType: string, from: string, to: string }>,
            nftAddress: string,
        }> = [];
        // let tkaddress: string | null | undefined = "";
        let sum: number = 0;
        const ERC: Array<{ tokenAddress: string, tokenName?: string, value: number }> = [];

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
                    console.log(userAddress)
                    if (from_address.toLowerCase() === userAddress.toLowerCase()) {
                        txnType = "sold";
                    } else {
                        txnType = "bought";
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
                        txnType = "bought"
                    } else {
                        txnType = "sold"
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


        // checking inside of transferSingle topics
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



        if (ERC.length === 0) { 
            var example;
            (uniqueNFTData)
            const formattedNFTData =  `${userAddress} just ${(uniqueNFTData[0].tokenInfo.length > 1) ? `swept ${uniqueNFTData[0].tokenInfo.length}` : uniqueNFTData[0].tokenInfo[0].txnType}  ${uniqueNFTData[0].tokenInfo[0].name} for ${value} ${asset}`;
            example = {
                username: "BOLT",
                avatar_url: "https://i.imgur.com/4M34hi2.png",
                content: "",
                embeds: [
                    {
                        title: "NFT and Token Data Notification",
                        color: 15258703,
                        fields: [
                            {
                                name: formattedNFTData,
                                value: "",
                                inline: true,
                            },
                            {
                                name: "Txn hash",
                                value: `${webhookEvent.event.activity[0].hash}`,
                                inline: false,
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
            }
            
            await axios.post(discordWH, example).then(response => {
                console.log('Message posted to Discord successfully:', response.data);
            })
                .catch(error => {
                    console.error('Error posting message to Discord:', error);
            });
        } 
        
        else {
                const formattedNFTData =  `${userAddress} just ${(uniqueNFTData[0].tokenInfo.length > 1) ? `swept ${uniqueNFTData[0].tokenInfo.length}` : uniqueNFTData[0].tokenInfo[0].txnType}  ${uniqueNFTData[0].tokenInfo[0].name} for ${ERC[0].value} ${ERC[0].tokenName}`;
                example = {
                    username: "BOLT",
                    avatar_url: "https://i.imgur.com/4M34hi2.png",
                    content: "",
                    embeds: [
                        {
                            title: "NFT and Token Data Notification",
                            color: 15258703,
                            fields: [
                                {
                                    name: formattedNFTData,
                                    value: "",
                                    inline: true,
                                },
                                {
                                    name: "Txn hash",
                                    value: `${webhookEvent.event.activity[0].hash}`,
                                    inline: false,
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
                }
            await axios.post(discordWH, example).then(response => {
                console.log('Message posted to Discord successfully:', response.data);
                return
            })
                .catch(error => {
                    console.error('Error posting message to Discord:', error);
                });
                
        }   
        res.send("Alchemy Notify is the best!");
    }
    catch(err){
        console.log("ERROR: ",err)
    }
});


    // Listen to Alchemy Notify webhook events
    app.listen(port, () => {
        console.log(`Example Alchemy Notify app listening port:${port}`);
    });
}

main();
