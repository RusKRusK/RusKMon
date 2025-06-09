import { SlashCommandBuilder, PermissionsBitField } from "discord.js";
import { mosaicCount, setMosaicCount } from "../config/state.js";


export default {
    data: new SlashCommandBuilder()
        .setName("changemosaiccount")
        .setDescription("短辺のモザイクの個数を変更（管理者のみ）")
        .addNumberOption((option) =>
            option.setName("mosaiccount")
                .setDescription("短辺のモザイクの個数")
                .setRequired(true)
        ),
    async execute(interaction) {
        // 管理者権限のチェック
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: "このコマンドは管理者のみ使用できます。",
                ephemeral: true,
            });
        }

        const newCount = interaction.options.getNumber("mosaiccount");
        if (newCount <= 0) {
            return interaction.reply({
                content: "モザイク数は正の整数で指定してください。",
                ephemeral: true,
            });
        }

        setMosaicCount(newCount);

        return interaction.reply({
            content: `モザイクの粒数を **${newCount}** に変更しました。`,
            ephemeral: true
        });
    },
};
