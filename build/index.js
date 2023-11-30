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
const express_1 = __importDefault(require("express"));
const webhooksUtil_1 = require("./helpers/webhooksUtil");
const axios_1 = __importDefault(require("axios"));
const alchemy_sdk_1 = require("alchemy-sdk");
const ethers_1 = require("ethers");
const utils_1 = require("./helpers/utils");
const utils_2 = require("./helpers/utils");
const sdk = require('api')('@opensea/v2.0#1nqh2zlnvr1o4h');
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        const signingKey = "whsec_D3V8jPiaLyF3GnKAgqUo2G22";
        const port = 8001;
        const config = {
            apiKey: "thZ6Uov_nnjBegiTs5aXqlqLHHOjEXII",
            network: alchemy_sdk_1.Network.ETH_MAINNET,
        };
        sdk.auth('8532fa9c5bdb49d78fb20d8c5bf1059d');
        sdk.server('https://api.opensea.io');
        const alchemy = new alchemy_sdk_1.Alchemy(config);
        const provider = new ethers_1.ethers.providers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/iYu9qle1mLqmoe-Co3yxqRfTQgzMUukN");
        const discordWH = "https://discord.com/api/webhooks/1174257039153823775/M_6lCC30d8bMhP7aqHGHAKePt5rVCfgJ7zZqO8ajZTS2tIhnNDJ3AfJJ8vdabtU4fA7Q";
        app.use(express_1.default.json({
            verify: webhooksUtil_1.addAlchemyContextToRequest,
        }));
        app.use((0, webhooksUtil_1.validateAlchemySignature)(signingKey));
        //MAIN API POST FOR WEBHOOK
        app.post("/webhook-path", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const webhookEvent = req.body;
            const data = yield alchemy.core.getTransactionReceipt(webhookEvent.event.data.hash);
            const transferTopics = data.logs.filter((dta) => dta.topics.includes(utils_1.transferTopic));
            const transferSingleTopics = data.logs.filter((dta) => dta.topics.includes(utils_1.transferSingleTopic));
            const orderFulfilledTopicsSeaport = data.logs.filter((dta) => dta.topics.includes(utils_1.orderFulfilledTopic));
            const NFTDATA = [];
            // let tkaddress: string | null | undefined = "";
            let sum = 0;
            const ERC = [];
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
                            const erc20 = new ethers_1.ethers.Contract(r.address, utils_2.ERC20ABI, provider);
                            const existingTokenIndex = ERC.findIndex((entry) => entry.tokenAddress === r.address);
                            if (existingTokenIndex !== -1) {
                                let newValue = ERC[existingTokenIndex].value + parseInt(r.data);
                                ERC[existingTokenIndex].value = newValue;
                            }
                            else {
                                ERC.push({
                                    tokenAddress: r.address,
                                    tokenName: (yield erc20.name()) || "token_fallback",
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
                                const erc20 = new ethers_1.ethers.Contract(offer.token, utils_2.ERC20ABI, provider);
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
            // checking inside of transferSingle topics
            if (transferSingleTopics.length !== 0) {
                transferSingleTopics.map((tr) => __awaiter(this, void 0, void 0, function* () {
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
            const uniqueNFTData = NFTDATA.map(entry => {
                const uniqueTokens = Array.from(new Set(entry.tokenInfo.map(token => JSON.stringify(token))))
                    .map(str => JSON.parse(str));
                return {
                    tokenInfo: uniqueTokens,
                    nftAddress: entry.nftAddress,
                };
            });
            console.log(uniqueNFTData);
            // checking inside of transferBatch topics
            if (ERC.length === 0) {
                const formattedNFTData = uniqueNFTData.map((nft) => {
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
                yield axios_1.default.post(discordWH, example).then(response => {
                    console.log('Message posted to Discord successfully:', response.data);
                })
                    .catch(error => {
                    console.error('Error posting message to Discord:', error);
                });
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
        }));
        // Listen to Alchemy Notify webhook events
        app.listen(port, () => {
            console.log(`Example Alchemy Notify app listening port:${port}`);
        });
    });
}
main();
