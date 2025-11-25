export const getCloudinaryThumbnail = (url: string) => {
    if (!url) return null;
    // Check if it's a video extension
    if (url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.avi')) {
        // Replace extension with .jpg to get Cloudinary's auto-generated thumbnail
        return url.replace(/\.(mp4|mov|avi)$/i, '.jpg');
    }
    return url;
};