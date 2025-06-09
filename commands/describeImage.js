import { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } from "discord.js";
import { describeImageWithUpload } from "../utils/gemini.js";
import { mosaicImageFromUrl } from "../utils/mosaic.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { isImageNSFW } = require("../utils/nsfwCheck.cjs");
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  data: new SlashCommandBuilder()
    .setName("describeimage")
    .setDescription("画像を説明します。")
    .addAttachmentOption(option =>
      option
        .setName("image")
        .setDescription("説明してほしい画像を添付してください。")
        .setRequired(true)
    ),
  async execute(interaction) {
    let tempFilePath;

    try {
      await interaction.deferReply();

      const attachment = interaction.options.getAttachment("image");
      if (!attachment) {
        return await interaction.editReply("画像が添付されていません。");
      }

      const allowedExt = [".png", ".jpg", ".jpeg", ".webp"];
      const ext = path.extname(attachment.name).toLowerCase();
      if (!allowedExt.includes(ext)) {
        return await interaction.editReply("対応している画像形式は PNG, JPG, JPEG, WEBP のみです。");
      }

      const maxFileSize = 25 * 1024 * 1024;
      if (attachment.size > maxFileSize) {
        return await interaction.editReply("画像ファイルサイズが大きすぎます（25MB超）。別の画像で試してください。");
      }

      tempFilePath = path.join(os.tmpdir(), `discord-img-${Date.now()}${ext}`);

      // 画像をダウンロード
      const response = await axios.get(attachment.url, {
        responseType: "arraybuffer",
        timeout: 15000,
      });
      await fs.promises.writeFile(tempFilePath, response.data);

      // NSFW チェック
      const isNSFW = await isImageNSFW(tempFilePath);
      if (isNSFW) {
        const mosaicFileName = "mosaicimage.png";
        const mosaicOutputPath = path.join(__dirname, mosaicFileName);

        await interaction.editReply("……？");
        try {
          await mosaicImageFromUrl(attachment.url, mosaicOutputPath, 30);
          
          const mosaicBuffer = await fs.promises.readFile(mosaicOutputPath);
          const mosaicAttachment = new AttachmentBuilder(mosaicBuffer, { name: mosaicFileName });

          const embed = new EmbedBuilder()
            .setTitle("エッチなのはダメ！")
            .setDescription("死刑！")
            .setImage(`attachment://${mosaicFileName}`)
            .setColor(0xff0000);
          
          await interaction.editReply({ content: "", embeds: [embed], files: [mosaicAttachment] });
          await fs.promises.unlink(mosaicOutputPath);
        } catch (nsfwErr) {
          console.error("モザイク処理中にエラー:", nsfwErr);
          try {
            await interaction.editReply("NSFW画像処理中にエラーが発生しました。");
          } catch (editErr) {
            console.error("モザイク結果の送信失敗:", editErr);
          }
        }
        return;
      }

      let description;
      description = await describeImageWithUpload(tempFilePath);

      const embed = new EmbedBuilder()
        .setTitle("画像の説明")
        .setDescription(description || "画像の説明を取得できませんでした。")
        .setImage(attachment.url)
        .setColor(0x00bfff);

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("describeImage 実行時エラー:", error);

      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply("画像の説明中にエラーが発生しました。もう一度試してください。");
        } else {
          await interaction.reply({ content: "画像の説明中にエラーが発生しました。", ephemeral: true });
        }
      } catch (innerError) {
        console.error("レスポンスエラー（重複防止）:", innerError);
      }
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          await fs.promises.unlink(tempFilePath);
        } catch (err) {
          console.warn("一時ファイル削除失敗:", err);
        }
      }
    }
  }
}