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
const utils_1 = require("ethers/lib/utils");
const ethers_1 = require("ethers");
const utils_2 = require("./helpers/utils");
const sdk = require('api')('@opensea/v2.0#1nqh2zlnvr1o4h');
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        const signingKey = "whsec_PAptc926BnXV6LBmbMfPevJ0";
        const port = 8001;
        const config = {
            apiKey: "thZ6Uov_nnjBegiTs5aXqlqLHHOjEXII",
            network: alchemy_sdk_1.Network.ETH_MAINNET,
        };
        sdk.auth('8532fa9c5bdb49d78fb20d8c5bf1059d');
        sdk.server('https://api.opensea.io');
        const alchemy = new alchemy_sdk_1.Alchemy(config);
        const discordWH = "https://discord.com/api/webhooks/1174257039153823775/M_6lCC30d8bMhP7aqHGHAKePt5rVCfgJ7zZqO8ajZTS2tIhnNDJ3AfJJ8vdabtU4fA7Q";
        app.use(express_1.default.json({
            verify: webhooksUtil_1.addAlchemyContextToRequest,
        }));
        app.use((0, webhooksUtil_1.validateAlchemySignature)(signingKey));
        //MAIN API POST FOR WEBHOOK
        app.post("/webhook-path", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const webhookEvent = req.body;
            const data = yield alchemy.core.getTransactionReceipt(webhookEvent.event.data.hash);
            const transferTopics = data.logs.filter((dta) => dta.topics.includes(utils_2.transferTopic));
            const transferSingleTopics = data.logs.filter((dta) => dta.topics.includes(utils_2.transferSingleTopic));
            const orderFulfilledTopicsSeaport = data.logs.filter((dta) => dta.topics.includes(utils_2.orderFulfilledTopic));
            const transferBatchTopics = data.logs.filter((dta) => dta.topics.includes(utils_2.transferBatchTopic));
            const NFTDATA = [];
            let tkaddress = "";
            let sum = 0;
            let ERC = [];
            // checking inside of transfer topics
            if (transferTopics.length !== 0) {
                transferTopics.map((r) => {
                    // general nft transfer topics
                    if (r.topics.length === 4) {
                        const token_id = parseInt(r.topics[3]);
                        const token_address = r.address;
                        const existingTokenIndex = NFTDATA.findIndex((entry) => entry.nftAddress === token_address);
                        if (existingTokenIndex !== -1) {
                            NFTDATA[existingTokenIndex].tokenId.push(token_id);
                        }
                        else {
                            // Add a new entry to NFTDATA
                            NFTDATA.push({
                                tokenId: [token_id],
                                nftAddress: token_address,
                            });
                        }
                        //ERC20's transferred
                    }
                    else if (r.topics.length === 3) {
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
                orderFulfilledTopicsSeaport.map((order) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const nftOrder = yield sdk.get_order({
                            chain: 'ethereum',
                            protocol_address: '0x00000000000000adc04c56bf30ac9d3c0aaf14dc',
                            order_hash: order.data.slice(0, 66)
                        });
                        console.log(nftOrder);
                        nftOrder.order.protocol_data.parameters.offer.map((offer) => {
                            if (offer.itemType === 2) {
                                const token_address = offer.token;
                                const token_id = parseInt(offer.identifierOrCriteria);
                                const existingTokenIndex = NFTDATA.findIndex((entry) => entry.nftAddress === token_address);
                                if (existingTokenIndex !== -1) {
                                    NFTDATA[existingTokenIndex].tokenId.push(token_id);
                                }
                                else {
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
                        });
                    }
                    catch (error) {
                        console.log("an err occured at fetching nftorder");
                    }
                }));
            }
            // checking inside of transferSingle topics
            if (transferSingleTopics.length !== 0) {
                transferSingleTopics.map((tr) => {
                    const token_address = tr.address;
                    const abi = ["uint256", "uint256"];
                    const decodeData = ethers_1.ethers.utils.defaultAbiCoder.decode(abi, tr.data);
                    const token_id = parseInt(decodeData[0]._hex);
                    const existingTokenIndex = NFTDATA.findIndex((entry) => entry.nftAddress === token_address);
                    if (existingTokenIndex !== -1) {
                        NFTDATA[existingTokenIndex].tokenId.push(token_id);
                    }
                    else {
                        // Add a new entry to NFTDATA
                        NFTDATA.push({
                            tokenId: [token_id],
                            nftAddress: token_address,
                        });
                    }
                });
            }
            // checking inside of transferBatch topics
            if (transferBatchTopics.length !== 0) {
                transferBatchTopics.map((bth) => {
                    const token_address = bth.address;
                    const abi = ["uint256[]", "uint256[]"];
                    const decodedData = utils_1.defaultAbiCoder.decode(abi, bth.data);
                    const tokenIds = decodedData[0].map((id) => parseInt(id._hex));
                    const existingTokenIndex = NFTDATA.findIndex((entry) => entry.nftAddress === token_address);
                    if (existingTokenIndex !== -1) {
                        NFTDATA[existingTokenIndex].tokenId.push(tokenIds);
                    }
                    else {
                        NFTDATA.push({
                            tokenId: tokenIds,
                            nftAddress: token_address,
                        });
                    }
                });
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
                                    value: NFTDATA.map((nft) => `Token ID: ${nft.token_id}, Address: ${nft.address}`).join("\n"),
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
                yield axios_1.default.post(discordWH, example).then(response => {
                    console.log('Message posted to Discord successfully:', response.data);
                })
                    .catch(error => {
                    console.error('Error posting message to Discord:', error);
                });
                res.send("Alchemy Notify is the best!");
            }
            else {
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
                                    value: NFTDATA.map((nft) => `Token ID: ${nft.token_id}, Address: ${nft.address}`).join("\n"),
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
                yield axios_1.default.post(discordWH, example).then(response => {
                    console.log('Message posted to Discord successfully:', response.data);
                })
                    .catch(error => {
                    console.error('Error posting message to Discord:', error);
                });
                res.send("Alchemy Notify is the best!");
            }
        }));
        // Listen to Alchemy Notify webhook events
        app.listen(port, () => {
            console.log(`Example Alchemy Notify app listening port:${port}`);
        });
    });
}
main();
