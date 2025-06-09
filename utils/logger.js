import fs from "fs";
const logThreadId = JSON.parse(fs.readFileSync("./config.json")).logThreadId;

export async function log(client, content) {
    try {
        const logChannel = await client.channels.fetch(logThreadId);
        if (logChannel?.isTextBased()) {
            await logChannel.send({ content });
        }
    } catch (e) {
        console.error("ログ送信失敗:", e);
    }
}
