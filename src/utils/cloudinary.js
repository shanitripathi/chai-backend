import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has uploaded successfully
    console.log("File has uploaded on cloudinary", response.url);
    return response;
  } catch (error) {
    // removes the locally saved temp file when the upload operation fails
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export { uploadOnCloudinary };
