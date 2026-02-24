import multer from "multer";
import sharp from "sharp";
import { promises as fs } from "fs"; // Using the promise-based version of fs
import cloudinary from "../utils/cloudinary";

const upload = multer({ dest: "uploads/" });

export const uploadFileToCloudinary = async (
  file: Express.Multer.File,
  folder: string = "uploads",
  resizeOptions?: { width: number; height: number }
): Promise<string> => {
  let tempOriginalPath = file.path;
  let finalUploadPath = tempOriginalPath;
  let tempResizedPath: string | null = null;

  try {
    // 1. Resize the image if options are provided
    if (resizeOptions) {
      tempResizedPath = `uploads/resized-${file.filename}`;
      await sharp(tempOriginalPath)
        // Corrected order: width, then height
        .resize(resizeOptions.width, resizeOptions.height)
        .toFile(tempResizedPath);
      
      finalUploadPath = tempResizedPath;
    }

    // 2. Upload the final file (either original or resized) to Cloudinary
    const result = await cloudinary.uploader.upload(finalUploadPath, { folder });

    return result.secure_url;

  } catch (error) {
    console.error("Error during file upload process:", error);
    throw new Error("Failed to upload file to Cloudinary.");
  } finally {
    try {
      if (tempOriginalPath) {
        await fs.unlink(tempOriginalPath); // Delete original multer file
      }
      if (tempResizedPath) {
        await fs.unlink(tempResizedPath); // Delete resized file if it was created
      }
    } catch (cleanupError) {
      console.error("Error during file cleanup:", cleanupError);
    }
  }
};

export default upload;