import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function checkTextModeration(text) {
  console.log("text moderation");

  if (!text || !text.trim()) {
    return { isSafe: true, reason: "Empty content" };
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const prompt = `
You are a strict content moderation system.

Rules:
- UNSAFE if sexual, erotic, pornographic, explicit, or suggestive.
- SAFE only if neutral and appropriate.

Return ONLY valid JSON:
{
  "isSafe": true | false,
  "reason": "short reason"
}

Text:
"""${text}"""
`;    

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    });

    let raw = result.response.text().trim();

    // 🔥 Clean markdown formatting
    raw = raw.replace(/```json|```/g, "").trim();

    console.log("by nikhil", raw);

    const parsed = JSON.parse(raw);

    if (typeof parsed.isSafe !== "boolean") {
      throw new Error("Invalid moderation response");
    }

    return parsed;
  } catch (error) {
    console.error("Text moderation error:", error.message);

    // ✅ FAIL OPEN — DO NOT BLOCK USERS
    return {
      isSafe: true,
      reason: "Text moderation unavailable",
    };
  }
}

// import { GoogleGenerativeAI } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// export async function checkTextModeration(text) {
//   if (!text || !text.trim()) {
//     return { isSafe: false, reason: "Empty content" };
//   }

//   const model = genAI.getGenerativeModel({
//     model: "gemini-flash-lite-latest",
//   });

//   const prompt = `
// Classify the following content.

// Rules:
// - SAFE: No sexual, nude, pornographic, explicit, abusive, or adult content
// - NOT_SAFE: Anything sexual, nudity, adult solicitation, explicit language

// Respond ONLY with valid JSON:
// {
//   "isSafe": true | false,
//   "reason": "short reason"
// }

// Content:
// """
// ${text}
// """
// `;

//   try {
//     const result = await model.generateContent(prompt);
//     let output = result.response.text();

//     output = output.replace(/```json|```/g, "").trim();

//     const parsed = JSON.parse(output);

//     if (typeof parsed.isSafe !== "boolean") {
//       throw new Error("Invalid Gemini response");
//     }

//     return parsed;
//   } catch (err) {
//     console.error("Gemini moderation error:", err);
//     return {
//       isSafe: false,
//       reason: "Moderation failed",
//     };
//   }
// }
