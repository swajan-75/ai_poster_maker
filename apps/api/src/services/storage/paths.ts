export const ROOT_FOLDER = 'poster-maker';
export const uploadFolder = (userId: string) => `${ROOT_FOLDER}/uploads/${userId}`;
export const generatedFolder = (userId: string) => `${ROOT_FOLDER}/generated/${userId}`;
export const BACKGROUND_FOLDER = `${ROOT_FOLDER}/backgrounds`;

/** True if the user may read this stored file: their own uploads/generated posters, or shared backgrounds. */
export function canReadFile(publicId: string, userId: string): boolean {
  if (publicId.includes('..')) return false;
  return [`${uploadFolder(userId)}/`, `${generatedFolder(userId)}/`, `${BACKGROUND_FOLDER}/`].some((p) => publicId.startsWith(p));
}

export function isOwnedUpload(publicId: string, userId: string): boolean {
  const prefix = `${uploadFolder(userId)}/`;
  if (!publicId.startsWith(prefix)) return false;
  const rest = publicId.slice(prefix.length);
  return /^[A-Za-z0-9_-]{1,100}$/.test(rest);
}
