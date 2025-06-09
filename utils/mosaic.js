import axios from "axios";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import {
    reactionThreshold,
    mosaicCount
} from "../config/state.js";
import { fileURLToPath } from "url";
import { log } from "./logger.js";
import { EmbedBuilder } from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));
const forwardThreadId = config.forwardThreadId;
const processingMessages = new Set(); // グローバルまたはモジュール内スコープ

export async function isImageUrl(url) {
    try {
        const res = await axios.head(url, { timeout: 3000 });
        return res.headers["content-type"]?.startsWith("image/");
    } catch {
        return false;
    }
}

export async function mosaicImageFromUrl(url, outputPath, cnt = mosaicCount) {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    const inputBuffer = Buffer.from(res.data);
    const image = sharp(inputBuffer);
    const { width, height } = await image.metadata();

    const shortSide = cnt;
    const targetWidth = width < height
        ? shortSide
        : Math.round((width / height) * shortSide);
    const targetHeight = height < width
        ? shortSide
        : Math.round((height / width) * shortSide);

    const resized = await image.resize(targetWidth, targetHeight, { kernel: sharp.kernel.nearest }).toBuffer();

    await sharp(resized)
        .resize(width, height, { kernel: sharp.kernel.nearest })
        .toFile(outputPath);
}

export async function handleMosaicReaction(reaction, client) {
    const messageId = reaction.message.id;
    if (processingMessages.has(messageId)) return; // すでに処理中
    processingMessages.add(messageId);
    const { message } = reaction;
    if (message.channel.nsfw || message.author?.id === client.user.id) return;
    if (Date.now() - message.createdTimestamp > 24 * 3600000) return;
    if (reaction.count < reactionThreshold) return;

    const urls = [
        ...[...message.attachments.values()].filter(a => a.contentType?.startsWith("image/")).map(a => a.url),
        ...[...message.content.matchAll(/https?:\/\/\S+\.(?:png|jpe?g|gif|webp)(\?\S*)?/gi)]
            .map(m => m[0])
            .filter(await isImageUrl)
    ];

    if (!urls.length) return;

    const files = [];
    for (const url of urls) {
        const out = path.join(__dirname, `mosaic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`);
        try {
            await mosaicImageFromUrl(url, out);
            files.push(out);
        } catch (err) {
            console.error("画像処理失敗:", err);
            await log(client, `画像処理失敗: ${err}`);
        }
    }

    if (files.length) {
        try {
            const forward = await client.channels.fetch(forwardThreadId);
            const forwardedMessage = forward?.isTextBased()
                ? await forward.send({ content: message.content, files: message.attachments.map(a => a.url), flags: [4096] })
                : null;

            const authorIcon = message.member?.avatarURL({ extension: "png", dynamic: true })
                ?? message.author.displayAvatarURL({ extension: "png", dynamic: true });
            const displayName = message.member?.displayName || message.author.username;
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: displayName,
                    iconURL: authorIcon
                })
                .setDescription(message.content || "\u200b")
                .setColor(0xff0000)
                .setTimestamp(message.createdAt);

            if (forwardedMessage) {
                embed.addFields({ name: "元画像", value: `[こちら](${forwardedMessage.url})` });
            }

            const mosaicMsg = await message.channel.send({ embeds: [embed], files, flags: [4096] });

            if (forwardedMessage) {
                await forwardedMessage.edit({ content: `${forwardedMessage.content}\n\n該当メッセージへ: ${mosaicMsg.url}` });
            }
        } catch (err) {
            console.error("モザイク転送エラー:", err);
            await log(client, `モザイク転送エラー: ${err}`);
        }

        files.forEach(fp => fs.unlinkSync(fp));
    }
    processingMessages.delete(messageId);
    await message.delete().catch(console.error);
}
