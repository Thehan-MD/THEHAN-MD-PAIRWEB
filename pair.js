const express = require('express');
const fs = require('fs');
const { makeid } = require('./id');
const pino = require("pino");
const {
    default: Gifted_Tech,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore
} = require("maher-zubair-baileys");

let router = express.Router();

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;

    async function AlanXD_PairingProcess() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

        try {
            let AlanXD = Gifted_Tech({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: ["Chrome (Linux)", "", ""]
            });

            if (!AlanXD.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await AlanXD.requestPairingCode(num);

                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            AlanXD.ev.on('creds.update', saveCreds);
            AlanXD.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    await delay(5000);
                    let credsPath = __dirname + `/temp/${id}/creds.json`;

                    if (fs.existsSync(credsPath)) {
                        await AlanXD.sendMessage(
                            AlanXD.user.id,
                            { document: { url: credsPath }, mimetype: "application/json", fileName: "creds.json" }
                        );
                    }

                    await delay(100);
                    await AlanXD.ws.close();
                    return await removeFile('./temp/' + id);
                } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {
                    await delay(10000);
                    AlanXD_PairingProcess();
                }
            });

        } catch (err) {
            console.log("Service restarted due to error:", err);
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: "Service Unavailable" });
            }
        } 
    }

    return await AlanXD_PairingProcess();
});

module.exports = router;
