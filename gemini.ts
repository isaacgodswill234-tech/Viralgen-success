
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Niche, ScriptIdea } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateViralScript = async (niche: Niche): Promise<ScriptIdea> => {
  const ai = getAI();
  const prompt = `Generate a high-retention viral video script for the niche: ${niche}. 
  The script MUST follow the psychological "Hook-Value-Loop" model.
  
  Return a JSON object with: 
  - hook: A high-energy opening line.
  - visualPrompt: Detailed cinematic description for a high-quality visual.
  - narration: Short, punchy narration (max 18 words).
  - title: A click-optimized title.
  - description: A keyword-rich description.
  - tags: 5 trending hashtags.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hook: { type: Type.STRING },
          visualPrompt: { type: Type.STRING },
          narration: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["hook", "visualPrompt", "narration", "title", "description", "tags"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateViralImage = async (prompt: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A cinematic vertical image for social media: ${prompt}. 9:16 aspect ratio.` }],
    },
    config: {
      imageConfig: { aspectRatio: "9:16" }
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Visual generation failed");
};

export const generateViralVideo = async (prompt: string): Promise<string> => {
  return await generateViralImage(prompt);
};

export const generateNarrationAudio = async (text: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Professional voiceover: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
};

export function decodeBase64(base64: string): Uint8Array {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Base64 Decode Error", e);
    return new Uint8Array(0);
  }
}

/**
 * Creates a valid WAV file from raw PCM data returned by Gemini TTS
 */
export async function createAudioBlob(base64: string): Promise<string> {
  if (!base64) return '';
  
  const data = decodeBase64(base64);
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  
  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  // File length
  view.setUint32(4, 36 + data.length, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // Format chunk identifier
  view.setUint32(12, 0x666d7420, false); // "fmt "
  // Format chunk length (16 for PCM)
  view.setUint32(16, 16, true);
  // Sample format (1 for PCM)
  view.setUint16(20, 1, true);
  // Channel count
  view.setUint16(22, numChannels, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate (sampleRate * numChannels * bitsPerSample/8)
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  // Block align (numChannels * bitsPerSample/8)
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  // Bits per sample
  view.setUint16(34, bitsPerSample, true);
  // Data chunk identifier
  view.setUint32(36, 0x64617461, false); // "data"
  // Data chunk length
  view.setUint32(40, data.length, true);
  
  const blob = new Blob([header, data], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}
