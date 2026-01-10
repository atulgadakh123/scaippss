const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Configure Cloudinary storage for posts
// const postStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "scaips/posts", // Folder in Cloudinary
//     allowedFormats: ["jpg", "jpeg", "png", "webp", "mp4", "webm", "mov"],
//     resource_type: "auto", // Automatically detect if it's image, video, or raw
//     transformation: [
//       {
//         quality: "auto:good",
//         fetch_format: "auto",
//       },
//     ],
//   },
// });

// Configure Cloudinary storage for profile images
// const profileStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "scaips/profiles",
//     allowedFormats: ["jpg", "jpeg", "png", "webp"],
//     resource_type: "image",
//     transformation: [
//       {
//         width: 400,
//         height: 400,
//         crop: "fill",
//         quality: "auto:good",
//         fetch_format: "auto",
//       },
//     ],
//   },
// });

// Create multer upload middleware for posts
// const uploadPostMedia = multer({
//   storage: postStorage,
//   limits: {
//     fileSize: 50 * 1024 * 1024, // 50MB limit
//   },
//   fileFilter: function (req, file, cb) {
//     const allowedImageTypes = [
//       "image/jpeg",
//       "image/jpg",
//       "image/png",
//       "image/webp",
//     ];
//     const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
//     const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(
//         new Error(
//           "Only .jpg, .jpeg, .png, .webp, .mp4, .webm files are allowed!"
//         ),
//         false
//       );
//     }
//   },
// });

// Create multer upload middleware for profile images
// const uploadProfileImage = multer({
//   storage: profileStorage,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit for profile images
//   },
//   fileFilter: function (req, file, cb) {
//     const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(
//         new Error(
//           "Only .jpg, .jpeg, .png, .webp files are allowed for profile images!"
//         ),
//         false
//       );
//     }
//   },
// });

// Helper function to delete files from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("File deleted from Cloudinary:", result);
    return result;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    throw error;
  }
};

// Helper function to extract public ID from Cloudinary URL
const extractPublicId = (url) => {
  try {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    const publicId = filename.split(".")[0];
    return publicId;
  } catch (error) {
    console.error("Error extracting public ID from URL:", error);
    return null;
  }
};

// module.exports = {
//   cloudinary,
//   uploadPostMedia,
//   uploadProfileImage,
//   deleteFromCloudinary,
//   extractPublicId,
// };
