import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { isImageNSFWWithScores } = require("../utils/nsfwCheck.cjs");

export default {
    data: new SlashCommandBuilder()
        .setName("checknsfw")
        .setDescription("この画像が NSFW（不適切）かどうかを判定します。")
        .addAttachmentOption(option =>
            option
                .setName("image")
                .setDescription("判定したい画像を添付してください。")
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const attachment = interaction.options.getAttachment("image");

            if (!attachment) {
                await interaction.editReply("画像が添付されていません。");
                return;
            }

            const allowedExt = [".png", ".jpg", ".jpeg", ".webp"];
            const ext = path.extname(attachment.name).toLowerCase();
            if (!allowedExt.includes(ext)) {
                await interaction.editReply("対応画像形式は PNG, JPG, JPEG, WEBP のみです。");
                return;
            }

            const maxFileSize = 25 * 1024 * 1024;
            if (attachment.size > maxFileSize) {
                await interaction.editReply("画像ファイルサイズが大きすぎます（25MB超）。");
                return;
            }

            const tempFilePath = path.join(os.tmpdir(), `checknsfw-${Date.now()}${ext}`);
            const response = await axios.get(attachment.url, { responseType: "arraybuffer" });
            await fs.promises.writeFile(tempFilePath, response.data);

            const { isNSFW, predictions, nsfwProb } = await isImageNSFWWithScores(tempFilePath);
            await fs.promises.unlink(tempFilePath);

            const embed = new EmbedBuilder()
                .setTitle("判決")
                .setImage(attachment.url)
                .setColor(isNSFW ? 0xff0000 : 0x00ff99)
                .setDescription(
                    `**総合死刑スコア:** ${(nsfwProb * 100).toFixed(2)}%\n` +
                    (isNSFW
                        ? "エッチなのはダメ！死刑！"
                        : "無罪")
                )
                .addFields(
                    predictions.map(p => ({
                        name: p.className,
                        value: `${(p.probability * 100).toFixed(2)}%`,
                        inline: true
                    }))
                );

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Error in /checknsfw:", error);
            await interaction.editReply("画像の判定中にエラーが発生しました。もう一度お試しください。");
        }
    },
};
