export interface PdfCompressionResult {
    buffer: Buffer;
    encoding?: "gzip";
}
/**
 * Compresses a PDF buffer using gzip when it leads to a smaller payload.
 * Returns the original buffer if compression is ineffective or fails.
 */
export declare function compressPdfBuffer(buffer: Buffer): Promise<PdfCompressionResult>;
//# sourceMappingURL=pdfCompression.d.ts.map