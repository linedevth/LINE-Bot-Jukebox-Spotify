const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const lineApp = require("./lineapp");
const spotify = require("./spotify");
const bodyParser = require("body-parser");
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server available on port ${port}`);
});

app.post("/webhook", async (req, res) => {
    const text = JSON.stringify(req.body);
    const signature = crypto.createHmac('SHA256', process.env.LINE_CHANNEL_SECRET).update(text).digest('base64').toString();
    if (signature !== req.headers['x-line-signature']) {
        return res.status(401).send('Unauthorized');
    }
    
    let event = req.body.events[0];
    let message;
    if (event.type === 'message' && event.message.type === 'text') {
        // ค้นหาเพลงจากข้อความที่ผู้ใช้พิมพ์ชื่อเพลง หรือชื่อศิลปินเข้ามา
        let searchInput = event.message.text;
        message = await lineApp.searchMusic(searchInput);

    } else if (event.type === 'postback') {
        // กรณีผู้ใช้กดปุ่ม Add (เพื่อเพิ่มเพลง) หรือกดปุ่ม More (เพื่อค้นหาเพลงเพิ่มเติม)
        message = await lineApp.receivedPostback(event)
    }

    await lineApp.replyMessage(event.replyToken, message);
    return res.status(200).send(req.method);
});

app.get("/spotify", (req, res) => {
    // รอรับ Callbak URL หลังจากผู้ใช้ทำการ Login ก็ให้เริ่มเชื่อมต่อกับ Spotify
    spotify.receivedAuthCode(req.query.code);
    res.status(200).send("Login Successfully!");
});
