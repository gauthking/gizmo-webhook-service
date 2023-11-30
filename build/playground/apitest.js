"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const alchemy_sdk_1 = require("alchemy-sdk");
const axios_1 = __importDefault(require("axios"));
const ethers_1 = require("ethers");
const utils_1 = require("../helpers/utils");
const sdk = require('api')('@opensea/v2.0#1nqh2zlnvr1o4h');
const caller = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield sdk.auth('8532fa9c5bdb49d78fb20d8c5bf1059d');
        yield sdk.server('https://api.opensea.io');
        const discordWH = "https://discord.com/api/webhooks/1174257039153823775/M_6lCC30d8bMhP7aqHGHAKePt5rVCfgJ7zZqO8ajZTS2tIhnNDJ3AfJJ8vdabtU4fA7Q";
        let tkaddress = "";
        const config = {
            apiKey: "thZ6Uov_nnjBegiTs5aXqlqLHHOjEXII",
            network: alchemy_sdk_1.Network.ETH_MAINNET,
        };
        const alchemy = new alchemy_sdk_1.Alchemy(config);
        const data = yield alchemy.core.getTransactionReceipt("0xe87bddc323dd10a10f451eb93d7038a20c3e9de41c9bc47891ea6bf5c06091ba");
        const provider = new ethers_1.ethers.providers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/iYu9qle1mLqmoe-Co3yxqRfTQgzMUukN");
        // console.log("data -", data)
        const transferSingleTopics = data.logs.filter((dta) => dta.topics.includes("0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62"));
        const transferTopics = data.logs.filter((dta) => dta.topics.includes("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"));
        const orderFulfilledTopicsSeaport = data.logs.filter((dta) => dta.topics.includes("0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31"));
        const transferBatchTopics = data.logs.filter((dta) => dta.topics.includes("0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb"));
        const NFTDATA = [];
        // let tkaddress: string | null | undefined = "";
        let sum = 0;
        const ERC = [];
        // let nativeTokenValue = 0;
        // checking inside of transfer topics
        if (transferTopics.length !== 0) {
            console.log("transfertopics");
            for (let i = 0; i < transferTopics.length; i++) {
                const r = transferTopics[i];
                // general nft transfer topics
                if (r.topics.length === 4) {
                    const token_id = parseInt(r.topics[3]);
                    const token_address = r.address;
                    const existingTokenIndex = NFTDATA.findIndex((entry) => entry.nftAddress === token_address);
                    if (existingTokenIndex !== -1) {
                        const metadata = yield alchemy.nft.getNftMetadata(token_address, token_id);
                        const media = metadata.image.pngUrl;
                        const name = metadata.name;
                        (NFTDATA[existingTokenIndex]).tokenInfo.push({ tokenId: token_id, media: media, name: name });
                    }
                    else {
                        // Add a new entry to NFTDATA
                        const metadata = yield alchemy.nft.getNftMetadata(token_address, token_id);
                        const media = metadata.image.pngUrl;
                        const name = metadata.name;
                        NFTDATA.push({
                            tokenInfo: [{ tokenId: token_id, media: media, name: name }],
                            nftAddress: token_address,
                        });
                    }
                    //ERC20's transferred
                }
                else if (r.topics.length === 3 && orderFulfilledTopicsSeaport.length === 0) {
                    if (parseInt(r.topics[2]) !== 0) {
                        //erc20s
                        sum += parseInt(r.data);
                        tkaddress = r.address;
                    }
                }
            }
        }
        if (transferSingleTopics.length !== 0) {
            transferSingleTopics.map((tr) => __awaiter(void 0, void 0, void 0, function* () {
                const token_address = tr.address;
                const abi = ["uint256", "uint256"];
                const decodeData = ethers_1.ethers.utils.defaultAbiCoder.decode(abi, tr.data);
                const token_id = parseInt(decodeData[0]._hex);
                const existingTokenIndex = NFTDATA.findIndex((entry) => entry.nftAddress === token_address);
                if (existingTokenIndex !== -1) {
                    const metadata = yield alchemy.nft.getNftMetadata(token_address, token_id);
                    const media = metadata.image.pngUrl;
                    const name = metadata.name;
                    (NFTDATA[existingTokenIndex]).tokenInfo.push({ tokenId: token_id, media: media, name: name });
                }
                else {
                    // Add a new entry to NFTDATA
                    const metadata = yield alchemy.nft.getNftMetadata(token_address, token_id);
                    const media = metadata.image.pngUrl;
                    const name = metadata.name;
                    NFTDATA.push({
                        tokenInfo: [{ tokenId: token_id, media: media, name: name }],
                        nftAddress: token_address,
                    });
                }
            }));
        }
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
                    const nftOrder = yield sdk.get_order({
                        chain: 'ethereum',
                        protocol_address: '0x00000000000000adc04c56bf30ac9d3c0aaf14dc',
                        order_hash: hash
                    });
                    // Use for...of loop instead of map to handle asynchronous operations properly
                    for (const offer of nftOrder.data.order.protocol_data.parameters.offer) {
                        if (offer.itemType === 2) {
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
                                const metadata = yield alchemy.nft.getNftMetadata(token_address, token_id);
                                const media = metadata.image.pngUrl;
                                const name = metadata.name;
                                (NFTDATA[existingTokenIndex]).tokenInfo.push({ tokenId: token_id, media: media, name: name });
                            }
                            else {
                                const metadata = yield alchemy.nft.getNftMetadata(token_address, token_id);
                                const media = metadata.image.pngUrl;
                                const name = metadata.name;
                                NFTDATA.push({
                                    tokenInfo: [{ tokenId: token_id, media: media, name: name }],
                                    nftAddress: token_address,
                                });
                            }
                        }
                        if (offer.itemType === 1) {
                            const erc20 = new ethers_1.ethers.Contract(offer.token, utils_1.ERC20ABI, provider);
                            const existingTokenIndex = ERC.findIndex((entry) => entry.tokenAddress === offer.token);
                            if (existingTokenIndex !== -1) {
                                let newValue = ERC[existingTokenIndex].value + parseInt(offer.endAmount);
                                ERC[existingTokenIndex].value = newValue;
                            }
                            else {
                                ERC.push({
                                    tokenAddress: offer.token,
                                    tokenName: (yield erc20.name()) || "token_fallback",
                                    value: parseInt(offer.endAmount)
                                });
                            }
                        }
                    }
                }
                catch (error) {
                    console.log("Error in processing order:", error);
                }
            }
        }
        const uniqueNFTData = NFTDATA.map(entry => {
            const uniqueTokens = Array.from(new Set(entry.tokenInfo.map(token => JSON.stringify(token))))
                .map(str => JSON.parse(str));
            return {
                tokenInfo: uniqueTokens,
                nftAddress: entry.nftAddress,
            };
        });
        // console.log(uniqueNFTData[0].tokenInfo.length)
        // for (let i = 0; i < uniqueNFTData[0].tokenInfo.length; i++) {
        //     console.log(uniqueNFTData[0].tokenInfo[i])
        // }
        // console.log(NFTDATA.length)
        if (ERC.length === 0) {
            const formattedNFTData = NFTDATA.map((nft) => {
                const formattedTokenInfo = nft.tokenInfo.map((info) => `Token ID: ${info.tokenId}\nMedia: ${info.media}\nName: ${info.name}`).join("\n\n");
                return `NFT Address: ${nft.nftAddress}\nToken Info:\n${formattedTokenInfo}`;
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
            // await axios.post(discordWH, example).then(response => {
            //     console.log('Message posted to Discord successfully:', response.data);
            // })
            //     .catch(error => {
            //         console.error('Error posting message to Discord:', error);
            //     });
        }
        else {
            const formattedNFTData = NFTDATA.map((nft) => {
                const formattedTokenInfo = nft.tokenInfo.map((info) => `Token ID: ${info.tokenId}\nMedia: ${info.media}\nName: ${info.name}`).join("\n\n");
                return `NFT Address: ${nft.nftAddress}\nToken Info:\n${formattedTokenInfo}`;
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
            yield axios_1.default.post(discordWH, example).then(response => {
                console.log('Message posted to Discord successfully:', response.data);
            })
                .catch(error => {
                console.error('Error posting message to Discord:', error);
            });
            // res.send("Alchemy Notify is the best!");
        }
    }
    catch (error) {
        console.error("Error:");
    }
});
caller();
