import { log } from "../utils/logger.js";
import { handleStarMessageUpdate } from "../utils/starboard.js";

export async function handleMessageCreate(msg, client) {
    if (
        msg.attachments.size &&
        [...msg.attachments.values()].some(a => a.contentType?.startsWith("image/"))
    ) {
        return
    }
}

export async function handleMessageUpdate(oldMessage, newMessage, client) {
    await handleStarMessageUpdate(oldMessage, newMessage, client);
}