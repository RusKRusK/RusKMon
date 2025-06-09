import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { handleInteraction } from "./handlers/interactionHandler.js";
import { handleMessageCreate, handleMessageUpdate } from "./handlers/messageHandler.js";
import { handleReactionAdd, handleReactionRemove } from "./handlers/reactionHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const config = JSON.parse(fs.readFileSync("./config.json"));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Reaction, Partials.User]
});

client.commands = new Collection();

client.once("ready", () => {
    console.log(`${client.user.tag} 起動完了`);
});

(async () => {
    const commandsPath = path.join(__dirname, "commands");
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = await import(`file://${filePath}`);
        client.commands.set(command.default.data.name, command.default);
    }
})();

client.on("interactionCreate", i => handleInteraction(i, client));
client.on("messageCreate", m => handleMessageCreate(m, client));
client.on("messageUpdate", (oldMessage, newMessage) => handleMessageUpdate(oldMessage, newMessage, client));
client.on("messageReactionAdd", (r, u) => handleReactionAdd(r, u, client));
client.on("messageReactionRemove", (r, u) => handleReactionRemove(r, u, client));

client.login(config.token);