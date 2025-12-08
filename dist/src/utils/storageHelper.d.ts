/**
 * Storage Helper - Gestion des paths multi-tenant pour le stockage S3
 *
 * Structure du bucket:
 * {bucket}/
 *   ├── {organization-id}/
 *   │   ├── dresses/
 *   │   │   └── {uuid}.jpg
 *   │   ├── contracts/
 *   │   │   ├── {uuid}.pdf
 *   │   │   └── {uuid}-signed.pdf
 *   │   ├── customers/
 *   │   │   └── documents/
 *   │   └── profiles/
 *   │       └── avatars/
 */
export type StorageFolder = 'dresses' | 'contracts' | 'customers/documents' | 'profiles/avatars';
/**
 * Construit le path complet pour un fichier dans le bucket
 * @param organizationId - ID de l'organisation
 * @param folder - Dossier cible
 * @param filename - Nom du fichier (optionnel)
 * @returns Path complet (ex: "org-uuid/dresses/image.jpg")
 */
export declare function buildStoragePath(organizationId: string, folder: StorageFolder, filename?: string): string;
/**
 * Extrait l'organization ID d'un path de stockage
 * @param path - Path complet (ex: "org-uuid/dresses/image.jpg")
 * @returns Organization ID ou null
 */
export declare function extractOrganizationIdFromPath(path: string): string | null;
/**
 * Vérifie si un path appartient à une organisation
 * @param path - Path à vérifier
 * @param organizationId - ID de l'organisation
 * @returns true si le path appartient à l'organisation
 */
export declare function pathBelongsToOrganization(path: string, organizationId: string): boolean;
/**
 * Construit l'URL publique pour un fichier
 * @param bucketUrl - URL de base du bucket
 * @param path - Path du fichier
 * @returns URL complète
 */
export declare function buildPublicUrl(bucketUrl: string, path: string): string;
/**
 * Extrait le path relatif depuis une URL complète
 * @param url - URL complète du fichier
 * @param bucketUrl - URL de base du bucket
 * @returns Path relatif (ex: "org-uuid/dresses/image.jpg")
 */
export declare function extractPathFromUrl(url: string, bucketUrl: string): string;
/**
 * Construit le prefix pour lister les fichiers d'une organisation
 * @param organizationId - ID de l'organisation
 * @param folder - Dossier optionnel
 * @returns Prefix pour ListObjectsV2Command
 */
export declare function buildListPrefix(organizationId: string, folder?: StorageFolder): string;
//# sourceMappingURL=storageHelper.d.ts.map