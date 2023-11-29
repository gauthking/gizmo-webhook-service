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
const sdk = require('api')('@opensea/v2.0#1nqh2zlnvr1o4h');

async function main(): Promise<void> {
    const app = express();
    const signingKey = "whsec_PAptc926BnXV6LBmbMfPevJ0"
    const port = 8001;
    const config = {
        apiKey: "thZ6Uov_nnjBegiTs5aXqlqLHHOjEXII",
        network: Network.ETH_MAINNET,
    };
    sdk.auth('8532fa9c5bdb49d78fb20d8c5bf1059d');
    sdk.server('https://api.opensea.io');

    const alchemy = new Alchemy(config);
    const discordWH = "https://discord.com/api/webhooks/1174257039153823775/M_6lCC30d8bMhP7aqHGHAKePt5rVCfgJ7zZqO8ajZTS2tIhnNDJ3AfJJ8vdabtU4fA7Q"


    app.use(
        express.json({
            verify: addAlchemyContextToRequest,
        })
    );
    app.use(validateAlchemySignature(signingKey));


    //MAIN API POST FOR WEBHOOK
    app.post("/webhook-path", async (req, res) => {
        const webhookEvent = req.body as AlchemyWebhookEvent;
        const data: any = await alchemy.core.getTransactionReceipt(
            webhookEvent.event.data.hash
        );

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

        const transferBatchTopics: any[] = data.logs.filter((dta: any) =>
            dta.topics.includes(
                transferBatchTopic
            )
        );

        const NFTDATA: Array<{ tokenId: number[] | null | undefined, nftAddress: string | null | undefined }> = [];
        let tkaddress: string | null | undefined = "";
        let sum: number = 0;
        let ERC: any[] = [];

        // checking inside of transfer topics
        if (transferTopics.length !== 0) {
            transferTopics.map((r: any) => {
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
            });
        }
        // for opensea seaport logs - nfts sales through the seaport contract
        if (orderFulfilledTopicsSeaport.length !== 0) {
            orderFulfilledTopicsSeaport.map(async (order: any) => {
                try {
                    const nftOrder = await sdk.get_order({
                        chain: 'ethereum',
                        protocol_address: '0x00000000000000adc04c56bf30ac9d3c0aaf14dc',
                        order_hash: order.data.slice(0, 66)
                    })
                    console.log(nftOrder)
                    nftOrder.order.protocol_data.parameters.offer.map((offer: any) => {
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
                        // for getting erc20s from seaport
                        if (offer.itemType === 1) {
                            ERC.push({
                                tokenAddress: offer.token,
                                value: offer.endAmount
                            });
                        }
                    })
                } catch (error) {
                    console.log("an err occured at fetching nftorder");
                }
            })
        }

        // checking inside of transferSingle topics
        if (transferSingleTopics.length !== 0) {
            transferSingleTopics.map((tr: any) => {
                const token_address = tr.address;
                const abi = ["uint256", "uint256"]
                const decodeData = ethers.utils.defaultAbiCoder.decode(abi, tr.data)
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

        // checking inside of transferBatch topics
        if (transferBatchTopics.length !== 0) {
            transferBatchTopics.map((bth: any) => {
                const token_address = bth.address;
                const abi = ["uint256[]", "uint256[]"]
                const decodedData = defaultAbiCoder.decode(abi, bth.data);
                const tokenIds = decodedData[0].map((id: any) => parseInt(id._hex))
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

        if (ERC.length === 0) {
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
                                value: NFTDATA.map((nft: any) => `Token ID: ${nft.token_id}, Address: ${nft.address}`).join("\n"),
                                inline: true,
                            },
                            {
                                name: "Token Data",
                                value: `ETH Value: ${webhookEvent.event.data.value}`,
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
            res.send("Alchemy Notify is the best!");
        } else {
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
                                value: NFTDATA.map((nft: any) => `Token ID: ${nft.token_id}, Address: ${nft.address}`).join("\n"),
                                inline: true,
                            },
                            {
                                name: "Token Data",
                                value: `Token Address: ${tkaddress}\nTotal Sum: ${sum}`,
                                inline: true,
                            },
                            {
                                name: "Txn Value",
                                value: `ETH Value: ${webhookEvent.event.data.value}`,
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
            res.send("Alchemy Notify is the best!");
        }
    });

    // Listen to Alchemy Notify webhook events
    app.listen(port, () => {
        console.log(`Example Alchemy Notify app listening port:${port}`);
    });
}

main();
