import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'dhsuta4gh', 
  api_key: '686912748553973', 
  api_secret: 'tw91PcrlW6wpg-meCjPr9NTbNlI'
});

/**
 * Upload an image file to Cloudinary
 * @param fileBuffer The image file buffer
 * @param folder The folder to upload to (e.g., 'vehicles', 'manufacturers')
 * @param publicId Custom public ID (optional)
 * @returns The upload result with URL and other details
 */
export async function uploadImage(
  fileBuffer: Buffer, 
  folder: string = 'vehicles',
  publicId?: string
): Promise<{ url: string, publicId: string }> {
  return new Promise((resolve, reject) => {
    // Create an upload stream to Cloudinary
    const uploadOptions = {
      folder,
      resource_type: 'image' as 'image',
      ...(publicId && { public_id: publicId })
    };
    
    // Use the upload stream with a Buffer
    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error('Upload failed without error message'));
          return;
        }
        
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    ).end(fileBuffer);
  });
}

/**
 * Delete an image from Cloudinary by its public ID
 * @param publicId The public ID of the image to delete
 * @returns A promise resolving to the deletion result
 */
export async function deleteImage(publicId: string): Promise<any> {
  return cloudinary.uploader.destroy(publicId);
}

/**
 * Generate an optimized image URL with transformations
 * @param publicId The public ID of the image
 * @param width The desired width
 * @param height The desired height
 * @returns The transformed image URL
 */
export function getOptimizedImageUrl(publicId: string, width: number = 800, height: number = 600): string {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  });
}