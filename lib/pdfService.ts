
import fs from "fs/promises";

// Polyfill for DOMMatrix and other browser globals if needed by pdf-parse
if (typeof global.DOMMatrix === "undefined") {
    // specific valid minimal implementation if possible
    (global as any).DOMMatrix = class DOMMatrix { };
}
if (typeof global.ImageData === "undefined") {
    (global as any).ImageData = class ImageData { };
}
if (typeof global.Path2D === "undefined") {
    (global as any).Path2D = class Path2D { };
}

// @ts-ignore
const pdf = require("pdf-parse");

export async function parsePdfText(absolutePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(absolutePath);
    // @ts-ignore
    const Parser = pdf.PDFParse || pdf;

    // Check if it's a class or function
    try {
        // @ts-ignore
        const parser = new Parser(new Uint8Array(fileBuffer));
        return await parser.getText();
    } catch (e) {
        // Fallback
        const data = await Parser(fileBuffer);
        return data.text;
    }
}
