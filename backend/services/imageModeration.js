import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

export async function checkImageModeration(file) {
  try {
    if (!process.env.IMAGE_MODERATION_URL) {
      throw new Error("IMAGE_MODERATION_URL not defined in env");
    }

    const formData = new FormData();
    formData.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const response = await axios.post(
      process.env.IMAGE_MODERATION_URL,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 15000, // optional but recommended
      }
    );

    const { verdict, soft_score, sexual_score } = response.data;

    const isSafe = verdict === "SAFE";

    return {
      isSafe,
      verdict,
      reason:
        verdict === "SAFE"
          ? "Image is safe"
          : verdict === "REVIEW"
          ? "Sensitive content detected"
          : "Unsafe image",
      scores: {
        soft: soft_score ?? null,
        sexual: sexual_score ?? null,
      },
    };
  } catch (err) {
    console.error(
      "Image moderation error:",
      err.response?.data || err.message
    );

    return {
      isSafe: false,
      verdict: "ERROR",
      reason: "Image moderation failed",
      scores: {
        soft: null,
        sexual: null,
      },
    };
  }
}


// import axios from "axios";
// import FormData from "form-data";

// export async function checkImageModeration(file) {
//   try {
//     const formData = new FormData();
//     formData.append("file", file.buffer, {
//       filename: file.originalname,
//       contentType: file.mimetype,
//     });

//     const response = await axios.post(
//       "https://image-modration-production.up.railway.app/classify-image",
//       formData,
//       {
//         headers: formData.getHeaders(),
//         timeout: 15000,
//       }
//     );

//     console.log(response);

//     const { verdict, reason } = response.data;

//     return {
//       isSafe: verdict === "SAFE",
//       verdict,
//       reason,
//     };
//   } catch (error) {
//     console.error("Image moderation error:", error.message);

//     return {
//       isSafe: false,
//       verdict: "ERROR",
//       reason: "Image moderation failed",
//     };
//   }
// }
