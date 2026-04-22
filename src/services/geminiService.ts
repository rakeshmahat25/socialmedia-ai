import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateSocialContent(prompt: string, platform: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `As an expert social media manager, generate a post for ${platform} based on this: ${prompt}. Include relevant hashtags and emojis. Make it engaging.`,
  });
  return response.text;
}

export async function suggestReply(originalContent: string, platform: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `As a social media engagement assistant, suggest a polite and concise reply to this ${platform} message: "${originalContent}".`,
  });
  return response.text;
}

export async function analyzeTone(content: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the tone of this text and return a one-word description (e.g., Happy, Angry, Professional, Inquisitive): "${content}".`,
  });
  return response.text?.trim() || "Neutral";
}
