import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const SENDER_EMAIL = process.env.SENDER_EMAIL;

export async function generateEmailTemplates(prompt) {
  if (!SENDER_EMAIL) {
    throw new Error("SENDER_EMAIL is not defined in environment variables");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const result = await model.generateContent(`
Generate 3 professional email templates for business communication.

Requirements:
- Each template must include:
  - name: short descriptive template name
  - subject: short, compelling subject line
  - intro: greeting paragraph using {{name}}
  - mainBody: clear and concise main message
  - footer: polite closing with sender email ${SENDER_EMAIL}
- Use {{name}} and {{email}} placeholders
- Sender email MUST be "${SENDER_EMAIL}" and appear in the footer
- Tone: professional, polite, and actionable
- Keep mainBody under 150 words

Return the result ONLY as valid JSON in this exact format:

[
  {
    "name": "Template Name",
    "subject": "Email subject",
    "intro": "Intro text using {{name}}",
    "mainBody": "Main message content",
    "footer": "Footer with sender email ${SENDER_EMAIL}"
  }
]

User prompt:
${prompt}
  `);

  const text = result.response.text();

  const cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  return JSON.parse(cleanText);
}
