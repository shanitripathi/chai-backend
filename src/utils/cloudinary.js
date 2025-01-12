import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadOnCloudinary = async (localFilePath) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET, // Click 'View API Keys' above to copy your API secret
  });
  try {
    if (!localFilePath) return null;
    // upload the file on cloudinary
    console.log("this is the local file path", cloudinary.config());
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has uploaded successfully
    console.log("File has uploaded on cloudinary", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    // removes the locally saved temp file when the upload operation fails
    console.log(error);
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export { uploadOnCloudinary };
