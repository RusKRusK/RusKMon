import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { REST, Routes } from "discord.js";
import config from "./config.json" assert { type: "json" };

const { token, clientId, guildId } = config;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// commands フォルダの .js ファイルを取得
const commandFiles = fs.readdirSync(path.join(__dirname, "commands"))
    .filter(file => file.endsWith(".js"));

// コマンド配列
const commands = [];

for (const file of commandFiles) {
    console.log(file);

    const filePath = path.join(__dirname, "commands", file);
    const fileUrl = pathToFileURL(filePath).href;
    
    const command = await import(fileUrl);
    commands.push(command.default.data.toJSON());
}

const rest = new REST().setToken(token);

try {
    await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
    );
    console.log("Command registration completed!");
} catch (error) {
    console.error("Failed to register commands:", error);
}
