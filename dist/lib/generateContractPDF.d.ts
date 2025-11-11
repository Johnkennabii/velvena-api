/**
 * Génère un PDF contractuel à partir de la réponse JSON du backend /sign-links/:token
 */
interface GenerateContractPdfOptions {
    includeSignatureBlock?: boolean;
}
export declare function generateContractPDF(token: string | null, contractId: string, existingContract?: any, options?: GenerateContractPdfOptions): Promise<string>;
export {};
//# sourceMappingURL=generateContractPDF.d.ts.map