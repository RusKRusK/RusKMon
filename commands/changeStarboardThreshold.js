import { SlashCommandBuilder, PermissionsBitField } from "discord.js";
import { reactionThreshold, setStarboardReactionThreshold } from "../config/state.js";


export default {
    data: new SlashCommandBuilder()
        .setName("changestarboardthreshold")
        .setDescription("Starboardに転送するために必要なリアクションの個数を設定（管理者のみ）")
        .addNumberOption((option) =>
            option.setName("threshold")
                .setDescription("閾値")
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

        const newThreshold = interaction.options.getNumber("threshold");
        if (newThreshold <= 0) {
            return interaction.reply({
                content: "正の整数で指定してください。",
                ephemeral: true,
            });
        }

        setStarboardReactionThreshold(newThreshold);

        return interaction.reply({
            content: `リアクションの必要個数を **${newThreshold}** に変更しました。`,
            ephemeral: true
        });
    },
};
