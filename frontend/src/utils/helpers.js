/**
 * Returns the primary photo from a photos array (where is_primary is true).
 * Falls back to the first photo if no primary is found, or null if the array is empty.
 *
 * @param {Array} photos - Array of photo objects
 * @returns {object|null} The primary photo object, or null
 */
export const getPrimaryPhoto = (photos = []) => {
  if (!Array.isArray(photos) || photos.length === 0) return null;
  return photos.find(photo => photo.is_primary) ?? photos[0];
};
