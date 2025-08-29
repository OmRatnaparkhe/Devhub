"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToCloudinary = void 0;
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const fs_1 = require("fs"); // Using the promise-based version of fs
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const upload = (0, multer_1.default)({ dest: "uploads/" });
const uploadFileToCloudinary = async (file, folder = "uploads", resizeOptions) => {
    let tempOriginalPath = file.path;
    let finalUploadPath = tempOriginalPath;
    let tempResizedPath = null;
    try {
        // 1. Resize the image if options are provided
        if (resizeOptions) {
            tempResizedPath = `uploads/resized-${file.filename}`;
            await (0, sharp_1.default)(tempOriginalPath)
                // Corrected order: width, then height
                .resize(resizeOptions.width, resizeOptions.height)
                .toFile(tempResizedPath);
            finalUploadPath = tempResizedPath;
        }
        // 2. Upload the final file (either original or resized) to Cloudinary
        const result = await cloudinary_1.default.uploader.upload(finalUploadPath, { folder });
        return result.secure_url;
    }
    catch (error) {
        // 3. If anything fails, log the error and re-throw it
        console.error("Error during file upload process:", error);
        throw new Error("Failed to upload file to Cloudinary.");
    }
    finally {
        // 4. Cleanup ALL temporary files, regardless of success or failure
        try {
            if (tempOriginalPath) {
                await fs_1.promises.unlink(tempOriginalPath); // Delete original multer file
            }
            if (tempResizedPath) {
                await fs_1.promises.unlink(tempResizedPath); // Delete resized file if it was created
            }
        }
        catch (cleanupError) {
            console.error("Error during file cleanup:", cleanupError);
        }
    }
};
exports.uploadFileToCloudinary = uploadFileToCloudinary;
exports.default = upload;
