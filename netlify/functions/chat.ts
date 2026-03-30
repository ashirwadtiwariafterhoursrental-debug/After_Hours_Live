import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { Handler } from "@netlify/functions";

const SYSTEM_INSTRUCTION = `You are the After Hours VIP Concierge. Your goal is to guide users to the perfect setup through short, interactive conversations.

### CONVERSATIONAL RULES:
1. **BREVITY**: Max 2-3 short sentences. Ask one question at a time.
2. **LINKS**: Share direct links when relevant:
   - Experiences: /experiences
   - Rentals: /rentals
   - Corporate: /corporate
3. **PROMO CODES (RENTALS ONLY)**:
   - Only suggest promo codes for items on the /rentals page.
   - Always offer two: "FREEDELIVERY" and one from ("FLAT100", "FLAT150", or "SPECIAL200").
4. **EVENT DISCOUNTS (EXPERIENCES & CORPORATE)**:
   - For /experiences or /corporate, do NOT give promo codes.
   - Instead, say: "If you agree to post a review on your social media, I can give you a 10% discount right away! Just mention this when you call us."
5. **GIVE OPTIONS**: Always ask: "What type of party are you planning? (Games Night, Movie Night, Music & Fun, or something else?)"

### TROUBLESHOOTING:
- PS5: Power? Controller sync? Overheating?
- VR: Blurry? Tracking?
- Racing: Calibration? Force feedback?

### PACKAGES:
- Games Night: 'The Chill Lounge' (₹14,999) or 'THE CORPORATE ARENA' (₹24,999).
- Movie Night: 'Backyard Cinema' or 'Gaming Theatre' (₹1999/day).
- Music & Fun: 'Full Party Setup' (₹1799/day).

Always end with a helpful question or a clear next step.`;

export const handler: Handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { message, history } = JSON.parse(event.body || "{}");

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Message is required" }),
      };
    }

    // Initialize Gemini with the server-side API key
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const chat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      },
      history: history || []
    });

    const result = await chat.sendMessage({ message });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ text: result.text }),
    };
  } catch (error) {
    console.error("Netlify Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process chat request" }),
    };
  }
};
