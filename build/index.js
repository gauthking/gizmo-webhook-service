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
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        const signingKey = "whsec_PAptc926BnXV6LBmbMfPevJ0";
        const port = 8001;
        const discordWH = "https://discord.com/api/webhooks/1174803945168851058/-g_f2cCPML96SyewwS9qg28BxqiPr1WQd_IqapzhhFkORqJNdn1tCwgnSn1mCEX9EpwY";
        app.use(express_1.default.json({
            verify: webhooksUtil_1.addAlchemyContextToRequest,
        }));
        app.use((0, webhooksUtil_1.validateAlchemySignature)(signingKey));
        app.post("/webhook-path", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const webhookEvent = req.body;
            const dt = JSON.stringify(webhookEvent);
            const data = JSON.parse(dt);
            console.log(data);
            const example = {
                "username": "BOLT",
                "avatar_url": "https://i.imgur.com/4M34hi2.png",
                "content": "",
                "embeds": [
                    {
                        "author": {
                            "name": "Birdie♫",
                            "url": "https://www.reddit.com/r/cats/",
                            "icon_url": "https://i.imgur.com/R66g1Pe.jpg"
                        },
                        "title": "Title",
                        "url": "https://google.com/",
                        "description": "Text message. You can use Markdown here. *Italic* **bold** __underline__ ~~strikeout~~ [hyperlink](https://google.com) `code`",
                        "color": 15258703,
                        "fields": [
                            {
                                "name": "Text",
                                "value": "More text",
                                "inline": true
                            },
                            {
                                "name": "Even more text",
                                "value": "Yup",
                                "inline": true
                            },
                            {
                                "name": "Use `\"inline\": true` parameter, if you want to display fields in the same line.",
                                "value": "okay..."
                            },
                            {
                                "name": "Thanks!",
                                "value": "You're welcome :wink:"
                            }
                        ],
                        "thumbnail": {
                            "url": "https://upload.wikimedia.org/wikipedia/commons/3/38/4-Nature-Wallpapers-2014-1_ukaavUI.jpg"
                        },
                        "image": {
                            "url": "https://upload.wikimedia.org/wikipedia/commons/5/5a/A_picture_from_China_every_day_108.jpg"
                        },
                        "footer": {
                            "text": "Woah! So cool! :smirk:",
                            "icon_url": "https://i.imgur.com/fKL31aD.jpg"
                        }
                    }
                ]
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
