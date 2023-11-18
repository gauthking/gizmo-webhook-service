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
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        const signingKey = "whsec_PAptc926BnXV6LBmbMfPevJ0";
        const port = 8001;
        const config = {
            apiKey: "thZ6Uov_nnjBegiTs5aXqlqLHHOjEXII",
            network: alchemy_sdk_1.Network.ETH_MAINNET,
        };
        const alchemy = new alchemy_sdk_1.Alchemy(config);
        const discordWH = "https://discord.com/api/webhooks/1174803945168851058/-g_f2cCPML96SyewwS9qg28BxqiPr1WQd_IqapzhhFkORqJNdn1tCwgnSn1mCEX9EpwY";
        app.use(express_1.default.json({
            verify: webhooksUtil_1.addAlchemyContextToRequest,
        }));
        app.use((0, webhooksUtil_1.validateAlchemySignature)(signingKey));
        app.post("/webhook-path", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const webhookEvent = req.body;
            const data = yield alchemy.core.getTransactionReceipt(webhookEvent.event.data.hash);
            const transferTopics = data.logs.filter((dta) => dta.topics.includes("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"));
            const NFTDATA = [];
            let tkaddress = "";
            let sum = 0;
            transferTopics.map((r) => {
                if (r.topics.length === 4) {
                    const token_id = parseInt(r.topics[3]);
                    const address = r.address;
                    NFTDATA.push({
                        token_id: token_id,
                        address: address,
                    });
                }
                else if (r.topics.length === 3) {
                    sum += parseInt(r.data);
                    tkaddress = r.address;
                }
            });
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
