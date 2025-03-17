const express = require("express");
const fs = require("fs");
const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/drive"];
const app = express();
const PORT = 3000;

async function authorize() {
    const credentials = JSON.parse(fs.readFileSync("credentials.json"));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const auth = new google.auth.OAuth2(client_id, client_secret, "http://localhost:3000/callback");

    const authUrl = auth.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
    });

    console.log("\nAuthorize this app by visiting this URL:\n", authUrl);

    app.get("/callback", async (req, res) => {
        const code = req.query.code;
        const { tokens } = await auth.getToken(code);
        auth.setCredentials(tokens);
        fs.writeFileSync("token.json", JSON.stringify(tokens, null, 2));
        res.send("Authentication successful! You can close this window.");
        console.log("Token saved to token.json");
        process.exit();
    });

    app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
}

authorize();
