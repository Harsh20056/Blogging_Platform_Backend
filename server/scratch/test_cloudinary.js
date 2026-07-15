import { v2 as cloudinary } from "cloudinary";
import 'dotenv/config';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testCloudinary() {
  console.log("Testing Cloudinary connection with credentials:");
  console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
  console.log("API Key:", process.env.CLOUDINARY_API_KEY);
  
  try {
    // Attempt a ping
    const pingResult = await cloudinary.api.ping();
    console.log("\n✅ Cloudinary Ping successful!", pingResult);
    
    // Attempt uploading a 1x1 transparent PNG pixel to make sure upload stream works
    const transparentPixelBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64"
    );
    
    console.log("Attempting a test upload...");
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "blogging_platform/test",
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(transparentPixelBuffer);
    });
    
    console.log("✅ Cloudinary Test Upload successful!");
    console.log("Uploaded Image URL:", uploadResult.secure_url);
    console.log("Public ID:", uploadResult.public_id);
    
    // Clean up the uploaded test image
    console.log("Cleaning up test image from Cloudinary...");
    const destroyResult = await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log("✅ Cleanup result:", destroyResult);
    
  } catch (error) {
    console.error("\n❌ Cloudinary Test failed!");
    console.error("Error details:", error.message || error);
  }
}

testCloudinary();
