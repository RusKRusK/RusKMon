import path from "path";
import fs from "fs";
import { EmbedBuilder } from "discord.js";
import { log } from "./logger.js";
import {
    starboardReactionThreshold
} from "../config/state.js";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const starboardChannelId = JSON.parse(fs.readFileSync("./config.json")).starboardChannelId;
const starboardMapPath = path.join(__dirname, "../config/starboard.json");

function loadStarboardMap() {
    try {
        return JSON.parse(fs.readFileSync(starboardMapPath, "utf-8"));
    } catch {
        return {};
    }
}

function saveStarboardMap(map) {
    fs.writeFileSync(starboardMapPath, JSON.stringify(map, null, 2), "utf-8");
}

function buildStarboardEmbed(message, count) {
    const authorIcon = message.member?.avatarURL({ extension: "png", dynamic: true })
        ?? message.author.displayAvatarURL({ extension: "png", dynamic: true });
    const displayName = message.member?.displayName || message.author.username;
    const embed = new EmbedBuilder()
        .setAuthor({
            name: displayName,
            iconURL: authorIcon
        })
        .setDescription(message.content || "\u200b")
        .setColor(0xf1c40f)
        .setTimestamp(message.createdAt)
        .setFooter({ text: `💥 ${count} | #${message.channel.name}` })
        .setURL(message.url);

    const image = message.attachments.find(a => a.contentType?.startsWith("image/"));
    if (image) embed.setImage(image.url);
    return embed;
}

export async function handleStarReaction(reaction, client) {
    const { message } = reaction;
    if (message.channel.id === starboardChannelId) return;
    if (reaction.count < starboardReactionThreshold) return;

    const starboardMap = loadStarboardMap();
    const channel = await client.channels.fetch(starboardChannelId);
    if (!channel?.isTextBased()) return;

    const embed = buildStarboardEmbed(message, reaction.count);
    const id = starboardMap[message.id];

    try {
        if (id) {
            const msg = await channel.messages.fetch(id);
            await msg.edit({ embeds: [embed] });
        } else {
            const newMsg = await channel.send({ content: message.url, embeds: [embed] });
            starboardMap[message.id] = newMsg.id;
            saveStarboardMap(starboardMap);
        }
    } catch (err) {
        console.error("Starboard送信エラー:", err);
        await log(client, `Starboard送信エラー: ${err}`);
    }
}

export async function handleStarReactionRemove(reaction, client) {
    const { message } = reaction;
    const starboardMap = loadStarboardMap();
    const id = starboardMap[message.id];
    if (!id) return;

    const channel = await client.channels.fetch(starboardChannelId);
    if (!channel?.isTextBased()) return;

    try {
        const starboardMessage = await channel.messages.fetch(id);

        if (reaction.count >= starboardReactionThreshold) {
            const embed = buildStarboardEmbed(message, reaction.count);
            await starboardMessage.edit({ embeds: [embed] });
        } else {
            await starboardMessage.delete();
            delete starboardMap[message.id];
            saveStarboardMap(starboardMap);
        }
    } catch (err) {
        console.error("Starboard更新/削除失敗:", err);
        await log(client, `Starboard更新/削除失敗: ${err}`);
    }
}

export async function handleStarMessageUpdate(_oldMessage, newMessage, client) {
    try {
        if (newMessage.partial) await newMessage.fetch();
        if (newMessage.author?.bot) return;

        const starboardMap = loadStarboardMap();
        const id = starboardMap[newMessage.id];
        if (!id) return;

        const channel = await client.channels.fetch(starboardChannelId);
        if (!channel?.isTextBased()) return;

        const starboardMessage = await channel.messages.fetch(id);
        const reaction = newMessage.reactions.cache.find(r => r.emoji.name === "💥");
        const starCount = reaction?.count ?? 1;

        const embed = buildStarboardEmbed(newMessage, starCount);
        await starboardMessage.edit({ embeds: [embed] });
    } catch (err) {
        console.error("messageUpdate処理エラー:", err);
        await log(client, `messageUpdate処理エラー: ${err}`);
    }
}
