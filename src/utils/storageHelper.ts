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

export type StorageFolder =
  | 'dresses'
  | 'contracts'
  | 'customers/documents'
  | 'profiles/avatars';

/**
 * Construit le path complet pour un fichier dans le bucket
 * @param organizationId - ID de l'organisation
 * @param folder - Dossier cible
 * @param filename - Nom du fichier (optionnel)
 * @returns Path complet (ex: "org-uuid/dresses/image.jpg")
 */
export function buildStoragePath(
  organizationId: string,
  folder: StorageFolder,
  filename?: string
): string {
  const basePath = `${organizationId}/${folder}`;
  return filename ? `${basePath}/${filename}` : basePath;
}

/**
 * Extrait l'organization ID d'un path de stockage
 * @param path - Path complet (ex: "org-uuid/dresses/image.jpg")
 * @returns Organization ID ou null
 */
export function extractOrganizationIdFromPath(path: string): string | null {
  const parts = path.split('/');
  return parts[0] || null;
}

/**
 * Vérifie si un path appartient à une organisation
 * @param path - Path à vérifier
 * @param organizationId - ID de l'organisation
 * @returns true si le path appartient à l'organisation
 */
export function pathBelongsToOrganization(
  path: string,
  organizationId: string
): boolean {
  return path.startsWith(`${organizationId}/`);
}

/**
 * Construit l'URL publique pour un fichier
 * @param bucketUrl - URL de base du bucket
 * @param path - Path du fichier
 * @returns URL complète
 */
export function buildPublicUrl(bucketUrl: string, path: string): string {
  // S'assurer qu'il n'y a pas de double slash
  const cleanBucketUrl = bucketUrl.endsWith('/')
    ? bucketUrl.slice(0, -1)
    : bucketUrl;
  return `${cleanBucketUrl}/${path}`;
}

/**
 * Extrait le path relatif depuis une URL complète
 * @param url - URL complète du fichier
 * @param bucketUrl - URL de base du bucket
 * @returns Path relatif (ex: "org-uuid/dresses/image.jpg")
 */
export function extractPathFromUrl(url: string, bucketUrl: string): string {
  const cleanBucketUrl = bucketUrl.endsWith('/')
    ? bucketUrl.slice(0, -1)
    : bucketUrl;

  if (url.startsWith(cleanBucketUrl)) {
    return url.slice(cleanBucketUrl.length + 1);
  }

  // Fallback: essayer d'extraire depuis l'URL
  try {
    const parsed = new URL(url);
    return parsed.pathname.slice(1); // Enlever le premier /
  } catch {
    return url;
  }
}

/**
 * Construit le prefix pour lister les fichiers d'une organisation
 * @param organizationId - ID de l'organisation
 * @param folder - Dossier optionnel
 * @returns Prefix pour ListObjectsV2Command
 */
export function buildListPrefix(
  organizationId: string,
  folder?: StorageFolder
): string {
  return folder
    ? `${organizationId}/${folder}/`
    : `${organizationId}/`;
}
