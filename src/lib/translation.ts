import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient() {
  if (client) {
    return client;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  client = new OpenAI({ apiKey });
  return client;
}

export async function translateToEnglish(text: string) {
  const openai = getClient();
  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const prompt = `You are a professional Chinese-to-English B2B website localization editor. Translate the following Simplified Chinese text into natural, concise, business English. Keep original meaning, structure, and terminology for tax/finance software context. Return only translated text.\n\n${text}`;

  const response = await openai.responses.create({
    model: process.env.OPENAI_TRANSLATION_MODEL || "gpt-4.1-mini",
    input: prompt,
  });

  const output = response.output_text?.trim();
  if (!output) {
    throw new Error("Translation failed: empty output");
  }
  return output;
}
