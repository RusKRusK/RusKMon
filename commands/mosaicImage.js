import { SlashCommandBuilder } from "discord.js";
import { mosaicImageFromUrl } from "../utils/mosaic.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  data: new SlashCommandBuilder()
    .setName("mosaic")
    .setDescription("指定されたメッセージの画像にモザイクをかけて投稿します")
    .addStringOption(option =>
      option.setName("message")
        .setDescription("モザイクをかける対象メッセージのリンク")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("count")
        .setDescription("短辺のドット数")
        .setRequired(true)
    ),

  async execute(interaction) {
    const messageUrl = interaction.options.getString("message");
    const count = interaction.options.getInteger("count");

    // URLパース（形式: https://discord.com/channels/guildId/channelId/messageId）
    const match = messageUrl.match(/channels\/(\d+)\/(\d+)\/(\d+)/);
    if (!match) {
      return interaction.reply({ content: "メッセージリンクの形式が不正です。", ephemeral: true });
    }

    const [_, guildId, channelId, messageId] = match;

    try {
      const channel = await interaction.client.channels.fetch(channelId);
      const message = await channel.messages.fetch(messageId);

      const imageAttachments = message.attachments.filter(att => att.contentType?.startsWith("image/"));
      if (imageAttachments.size === 0) {
        return interaction.reply({ content: "指定されたメッセージには画像が含まれていません。", ephemeral: true });
      }

      const outputFiles = [];

      for (const [, attachment] of imageAttachments) {
        const imageUrl = attachment.url;
        const fileName = `mosaic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.png`;
        const outputPath = path.join(__dirname, fileName);

        await mosaicImageFromUrl(imageUrl, outputPath, count);
        outputFiles.push(outputPath);
      }

      await interaction.reply({
        content: `${message.url}\nドット数(短辺): ${count}`,
        files: outputFiles
      });

      for (const f of outputFiles) fs.unlinkSync(f);
    } catch (err) {
      console.error("モザイクコマンドエラー:", err);
      await interaction.reply({ content: "画像の取得または処理中にエラーが発生しました。", ephemeral: true });
    }
  }
};
