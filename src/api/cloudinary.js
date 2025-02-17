// src/api/cloudinary.js

/**
 * Uploads a file directly to Cloudinary and returns the secure URL.
 * Make sure to set your unsigned upload preset and cloud name.
 */
export async function uploadFileToCloudinary(file) {
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', 'ml_default'); // Replace with your Cloudinary unsigned upload preset
  
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/dnde4xq0y/image/upload`, // Replace with your Cloudinary cloud name
      {
        method: 'POST',
        body: data
      }
    );
  
    if (!res.ok) {
      throw new Error('Failed to upload file');
    }
  
    const json = await res.json();
    return json.secure_url; // Return the secure URL of the uploaded file
  }
  