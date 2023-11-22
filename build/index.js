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
const webhooksUtil_1 = require("./webhooksUtil");
const axios_1 = __importDefault(require("axios"));
const alchemy_sdk_1 = require("alchemy-sdk");
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
        const discordWH = "https://discord.com/api/webhooks/1174803945168851058/-g_f2cCPML96SyewwS9qg28BxqiPr1WQd_IqapzhhFkORqJNdn1tCwgnSn1mCEX9EpwY";
        app.use(express_1.default.json({
            verify: webhooksUtil_1.addAlchemyContextToRequest,
        }));
        app.use((0, webhooksUtil_1.validateAlchemySignature)(signingKey));
        //MAIN API POST FOR WEBHOOK
        app.post("/webhook-path", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const webhookEvent = req.body;
            const data = yield alchemy.core.getTransactionReceipt(webhookEvent.event.data.hash);
            const transferTopics = data.logs.filter((dta) => dta.topics.includes("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"));
            const transferSingleTopics = data.logs.filter((dta) => dta.topics.includes("0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62"));
            const orderFulfilledTopicsSeaport = data.logs.filter((dta) => dta.topics.includes("0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31"));
            const transferBatchTopics = data.logs.filter((dta) => dta.topics.includes("0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb"));
            const NFTDATA = [];
            let tkaddress = "";
            let sum = 0;
            // checking inside of transfer topics
            if (transferTopics.length !== 0) {
                transferTopics.map((r) => {
                    // general nft transfer topics
                    if (r.topics.length === 4) {
                        const token_id = parseInt(r.topics[3]);
                        const address = r.address;
                        NFTDATA.push({
                            tokenId: token_id,
                            nftAddress: address,
                        });
                        //ERC20's transferred
                    }
                    else if (r.topics.length === 3) {
                        if (parseInt(r.topics[2]) !== 0) {
                            //erc20s
                            sum += parseInt(r.data);
                            tkaddress = r.address;
                        }
                        // else {
                        //     //nft transfer
                        //     const address = r.address;
                        //     NFTDATA.push({
                        //         // token_id: token_id,
                        //         address: address,
                        //     });
                        //     tkaddress = "ETH"
                        //     sum = webhookEvent.event.data.block.transactions[0].value
                        // }
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
                                let nft = {
                                    tokenId: offer.identifierOrCriteria,
                                    nftAddress: offer.token
                                };
                                NFTDATA.push(nft);
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
                    const token_Address = tr.address;
                    const tokenId = parseInt(tr.data);
                    let nft = {
                        tokenId: tokenId,
                        nftAddress: token_Address
                    };
                    NFTDATA.push(nft);
                });
            }
            if (transferBatchTopics.length !== 0) {
                transferBatchTopics.map((bth) => {
                    const token_address = bth.address;
                    const tokenId = bth.data.ids;
                });
            }
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
        }));
        // Listen to Alchemy Notify webhook events
        app.listen(port, () => {
            console.log(`Example Alchemy Notify app listening port:${port}`);
        });
    });
}
main();
