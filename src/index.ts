import express from "express";
import {
    addAlchemyContextToRequest,
    validateAlchemySignature,
    AlchemyWebhookEvent,
} from "./webhooksUtil";
import axios from "axios";
import { Alchemy, Network } from "alchemy-sdk";

async function main(): Promise<void> {
    const app = express();
    const signingKey = "whsec_PAptc926BnXV6LBmbMfPevJ0"
    const port = 8001;
    const config = {
        apiKey: "thZ6Uov_nnjBegiTs5aXqlqLHHOjEXII",
        network: Network.ETH_MAINNET,
    };
    const alchemy = new Alchemy(config);
    const discordWH = "https://discord.com/api/webhooks/1174803945168851058/-g_f2cCPML96SyewwS9qg28BxqiPr1WQd_IqapzhhFkORqJNdn1tCwgnSn1mCEX9EpwY"
    app.use(
        express.json({
            verify: addAlchemyContextToRequest,
        })
    );
    app.use(validateAlchemySignature(signingKey));

    app.post("/webhook-path", async (req, res) => {
        const webhookEvent = req.body as AlchemyWebhookEvent;
        const data: any = await alchemy.core.getTransactionReceipt(
            webhookEvent.event.data.hash
        );

        const transferTopics = data.logs.filter((dta: any) =>
            dta.topics.includes(
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
            )
        );

        const NFTDATA: any = [];
        let tkaddress = "";
        let sum = 0;

        transferTopics.map((r: any) => {
            if (r.topics.length === 4) {
                const token_id = parseInt(r.topics[3]);
                const address = r.address;

                NFTDATA.push({
                    token_id: token_id,
                    address: address,
                });
            } else if (r.topics.length === 3) {
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
                            value: NFTDATA.map((nft: any) => `Token ID: ${nft.token_id}, Address: ${nft.address}`).join("\n"),
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


        await axios.post(discordWH, example).then(response => {
            console.log('Message posted to Discord successfully:', response.data);
        })
            .catch(error => {
                console.error('Error posting message to Discord:', error);
            });
        res.send("Alchemy Notify is the best!");
    });

    // Listen to Alchemy Notify webhook events
    app.listen(port, () => {
        console.log(`Example Alchemy Notify app listening port:${port}`);
    });
}

main();