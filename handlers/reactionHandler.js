import {
    handleStarReaction,
    handleStarReactionRemove
} from "../utils/starboard.js";
import {
    handleMosaicReaction
} from "../utils/mosaic.js";

export async function handleReactionAdd(reaction, user, client) {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
    if (user.bot) return;

    if (reaction.emoji.name === "💥") {
        await handleStarReaction(reaction, client);
    }

    if (reaction.emoji.name === "🇭") {
        await handleMosaicReaction(reaction, client);
    }
}

export async function handleReactionRemove(reaction, user, client) {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
    if (user.bot) return;

    if (reaction.emoji.name === "💥") {
        await handleStarReactionRemove(reaction, client);
    }
}
