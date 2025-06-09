import { log } from "../utils/logger.js";

export async function handleInteraction(interaction, client) {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
        await log(client, `スラッシュコマンド: ${interaction.commandName}が実行されました`);
    } catch (err) {
        console.error("コマンド実行エラー:", err);
        const reply = { content: "コマンド実行中にエラーが発生しました。", ephemeral: true };
        interaction.replied || interaction.deferred
            ? await interaction.followUp(reply)
            : await interaction.reply(reply);
    }
}
