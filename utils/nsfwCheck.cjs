const nsfwjs = require("nsfwjs");
const { createCanvas, loadImage } = require("canvas");

let model = null;

// モデルのロード
async function loadModel() {
    if (!model) {
        model = await nsfwjs.load();
    }
}

async function isImageNSFWWithScores(imagePath) {
    await loadModel();

    const image = await loadImage(imagePath);
    const canvas = createCanvas(299, 299);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, 299, 299);

    const predictions = await model.classify(canvas);

    const nsfwProb = predictions
        .filter(p => ["Porn", "Hentai", "Sexy"].includes(p.className))
        .reduce((sum, p) => sum + p.probability, 0);

    const isNSFW = nsfwProb > 0.7;

    return { isNSFW, nsfwProb, predictions };
}

async function isImageNSFW(imagePath) {
    const result = await isImageNSFWWithScores(imagePath);
    return result.isNSFW;
}

module.exports = { isImageNSFWWithScores, isImageNSFW };
