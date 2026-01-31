
import { GoogleGenAI, Type } from "@google/genai";
import { GuideResponse, SportType, PersonaType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = (persona: PersonaType, initialSport: SportType, gameHint?: string) => {
  const personaPrompts = {
    beginner: "Explain like a friendly relative who knows nothing about sports. Use simple analogies. Avoid all technical jargon.",
    new_fan: "Acknowledge the user is learning. Use basic terms but explain them in context of the specific match rules.",
    hardcore: "Talk to a die-hard enthusiast. Use deep stats, player career context, and advanced tactical analysis found in the search results."
  };

  return `
    You are an elite Sports Fact-Checker and Multi-Modal Analyst acting as a ${persona.toUpperCase()} guide.
    
    STRICT IDENTITY & SPORT LOCK PROTOCOL:
    
    STEP 1: METADATA ANCHORING (MANDATORY)
    - If a URL is provided (e.g., https://www.youtube.com/watch?v=nQ6I2PdpzJI), your FIRST ACTION is to search Google for the exact Video ID: "nQ6I2PdpzJI".
    - Find the OFFICIAL VIDEO TITLE, UPLOADER, and DATE.
    - Search for the "Play-by-Play" or "Match Transcript" of the game identified in that title.
    
    STEP 2: THE "VISUAL GHOST" STRATEGY
    - Since you are analyzing a URL, you must "watch" the video by retrieving its textual equivalent: find the exact sequence of events from news reports or official league play-logs.
    - If the title is "NFL's Best Mic'd Up Moments", the sport is AMERICAN FOOTBALL. 
    - CRITICAL: If the verified sport is different from "${initialSport}", you MUST ignore the "${initialSport}" selection and analyze it as the CORRECT sport.
    
    STEP 3: MULTI-MODAL RECONCILIATION
    - Match the "Mic'd Up" audio snippets or highlights described in the video's metadata/comments with the actual game stats.
    - If analyzing a FILE, use your vision to identify gear (helmets, pads) and field markings.
    - DO NOT HALLUCINATE. If you see an NFL helmet, do not talk about a soccer penalty.

    PERSONA STYLE: ${personaPrompts[persona]}

    OUTPUT FORMAT (JSON ONLY):
    {
      "identifiedGame": "Official Match or Video Title (e.g., NFL 2023: Best Mic'd Up Moments)",
      "basicRules": ["Rules explaining the specific sport/play identified"],
      "whatHappened": "A factually verified breakdown of the video content. If you corrected a misidentified sport, explain the actual sport here.",
      "whyReacted": "The real-world importance of these players or this season context.",
      "nextSteps": "The historical outcome of that season or the specific players' achievements."
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
  const model = 'gemini-3-pro-preview';
  
  let contentParts: any[] = [];
  
  if (isUrl) {
    const videoId = typeof input === 'string' ? input.split('v=')[1]?.split('&')[0] : '';
    contentParts.push({ text: `
      DEEP VERIFICATION REQUEST:
      1. Search for: "YouTube video ${videoId} title and transcript".
      2. Find the official play-by-play log for the match described in that video.
      3. Confirm the sport. If it is NOT ${sport}, pivot to the correct sport.
      4. Use the specific events found in the search results (scorers, big plays) to explain the video content to a ${persona}.
    ` });
  } else if (input instanceof File) {
    const base64 = await fileToBase64(input);
    contentParts.push({
      inlineData: {
        mimeType: input.type,
        data: base64.split(',')[1],
      },
    });
    contentParts.push({ text: `
      VISION ANALYSIS REQUEST:
      1. Analyze the gear, ball, and field in this file.
      2. Identify the sport and search for the specific teams/players shown.
      3. Verify the date/season by looking at kit sponsors and styles.
      4. Provide a ${persona}-level explanation.
    ` });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts: contentParts },
    config: {
      systemInstruction: getSystemInstruction(persona, sport, gameHint),
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }],
      // Adding thinking budget for complex cross-referencing
      thinkingConfig: { thinkingBudget: 4000 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          identifiedGame: { 
            type: Type.STRING,
            description: "Verified title. Must match search results exactly."
          },
          basicRules: { 
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Rules for the sport actually found in the video."
          },
          whatHappened: { 
            type: Type.STRING,
            description: "Factual breakdown of the specific video content."
          },
          whyReacted: { 
            type: Type.STRING,
            description: "Contextual significance of this moment."
          },
          nextSteps: { 
            type: Type.STRING,
            description: "Historical aftermath."
          },
        },
        required: ["identifiedGame", "basicRules", "whatHappened", "whyReacted", "nextSteps"],
      },
    },
  });

  try {
    const result = JSON.parse(response.text);
    
    const sources: { title: string; url: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title || 'Official Record', url: chunk.web.uri });
        }
      });
    }

    return { ...result, sources: sources.length > 0 ? sources : undefined };
  } catch (e) {
    console.error("Gemini Analysis Error:", e);
    throw new Error("Match verification failed. The video content didn't match official records. Please ensure the link is public.");
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
