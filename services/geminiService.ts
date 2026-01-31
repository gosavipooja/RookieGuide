
import { GoogleGenAI, Type } from "@google/genai";
import { GuideResponse, SportType, PersonaType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = (persona: PersonaType, gameHint?: string) => {
  const personaPrompts = {
    beginner: "Explain like a friendly relative who knows nothing about sports. Use simple analogies (e.g., 'the tennis court is like a game of keep-away'). Avoid all jargon like 'break point' or 'love' without simple explanation.",
    new_fan: "Acknowledge the user is learning. Use basic terms but explain them in context. Focus on the scoring flow and major rules.",
    hardcore: "Talk to a die-hard enthusiast. Use deep stats, player historical context (e.g., Nadal's dominance on clay), and the impact on their career legacies.",
    coach: "Analyze technical execution, footwork patterns, tactical decision-making, and biomechanics (e.g., 'forehand top-spin rpm', 'baseline positioning')."
  };

  const identificationContext = gameHint 
    ? `The match has been POSITIVELY IDENTIFIED as: "${gameHint}". STICK TO THIS MATCH. Use the same players, stats, and historical context as before.`
    : `Identify the EXACT match (tournament, year, players, round) from the input description or URL using Google Search.`;

  return `
    You are an expert Sports Analyst acting as a ${persona.toUpperCase()} guide.
    
    CRITICAL INSTRUCTION:
    1. ${identificationContext}
    2. If a YouTube URL is provided, use Google Search grounding to verify the specific match and play.
    3. For the sport of ${persona === 'beginner' ? 'the identified sport' : 'Tennis/Football/etc'}, provide 3-5 foundational rules.
    4. Provide the analysis based on the selected persona level.

    PERSONA STYLE: ${personaPrompts[persona]}

    OUTPUT FORMAT (JSON ONLY):
    {
      "identifiedGame": "Official Match Title (e.g., 2008 Roland Garros Final: Rafael Nadal vs Roger Federer)",
      "basicRules": ["Rule 1: Brief explanation", "Rule 2...", "Rule 3..."],
      "whatHappened": "A detailed but concise breakdown of the specific action based on your persona.",
      "whyReacted": "The emotional context and the historical weight of the moment.",
      "nextSteps": "What happened next in this match or the overall outcome of the tournament."
    }
  `;
};

export async function analyzeSportsMoment(
  sport: SportType,
  persona: PersonaType,
  input: string | File,
  isUrl: boolean = false,
  gameHint?: string
): Promise<GuideResponse> {
  // Upgrading to Pro for superior reasoning and grounding search accuracy
  const model = 'gemini-3-pro-preview';
  
  let contentParts: any[] = [];
  
  if (isUrl) {
    contentParts.push({ text: `Analyze the sport of ${sport}. Identify and explain the moment at this URL: ${input}. You must use googleSearch to be 100% accurate about the match details.` });
  } else if (input instanceof File) {
    const base64 = await fileToBase64(input);
    contentParts.push({
      inlineData: {
        mimeType: input.type,
        data: base64.split(',')[1],
      },
    });
    contentParts.push({ text: `Analyze this ${sport} visual for a ${persona} level viewer. Identify the match.` });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts: contentParts },
    config: {
      systemInstruction: getSystemInstruction(persona, gameHint),
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }],
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          identifiedGame: { type: Type.STRING },
          basicRules: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          whatHappened: { type: Type.STRING },
          whyReacted: { type: Type.STRING },
          nextSteps: { type: Type.STRING },
        },
        required: ["identifiedGame", "basicRules", "whatHappened", "whyReacted", "nextSteps"],
      },
    },
  });

  try {
    const result = JSON.parse(response.text);
    
    // Extract grounding URLs for the UI
    const sources: { title: string; url: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title || 'Source', url: chunk.web.uri });
        }
      });
    }

    // Safety: ensure identifiedGame doesn't drift if a hint was provided
    if (gameHint && !result.identifiedGame.toLowerCase().includes(gameHint.toLowerCase())) {
        result.identifiedGame = gameHint;
    }

    return { ...result, sources: sources.length > 0 ? sources : undefined };
  } catch (e) {
    console.error("Gemini Analysis Error:", e);
    throw new Error("I couldn't identify this specific moment accurately. Please check the URL or try another clip.");
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
