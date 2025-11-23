import { promisify } from "node:util";
import { gzip } from "node:zlib";
import logger from "./logger.js";

const gzipAsync = promisify(gzip);

export interface PdfCompressionResult {
  buffer: Buffer;
  encoding?: "gzip";
}

/**
 * Compresses a PDF buffer using gzip when it leads to a smaller payload.
 * Returns the original buffer if compression is ineffective or fails.
 */
export async function compressPdfBuffer(buffer: Buffer): Promise<PdfCompressionResult> {
  try {
    const compressed = await gzipAsync(buffer);
    if (compressed.length < buffer.length) {
      logger.debug({ original: buffer.length, compressed: compressed.length }, "PDF compressed with gzip");
      return { buffer: compressed, encoding: "gzip" };
    }
    logger.debug(
      { original: buffer.length, compressed: compressed.length },
      "Skipping gzip compression (no size benefit)"
    );
  } catch (error) {
    logger.warn({ error }, "Failed to compress PDF buffer, using original payload");
  }

  return { buffer };
}
