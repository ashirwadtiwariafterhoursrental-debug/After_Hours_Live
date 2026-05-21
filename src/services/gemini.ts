import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

// Initialize Gemini with the API key from environment variables
// The platform automatically injects GEMINI_API_KEY into the environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CONCIERGE_SYSTEM_INSTRUCTION = `You are the After Hours VIP Concierge. Your goal is to guide users to the perfect setup through short, interactive conversations.

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
6. **QUICK REPLIES**: Suggest 2-4 short (max 3 words) options the user might want to say next.

### TROUBLESHOOTING:
- PS5: Power? Controller sync? Overheating?
- VR: Blurry? Tracking?
- Racing: Calibration? Force feedback?

### PACKAGES:
- Games Night: 'The Chill Lounge' (₹14,999) or 'THE CORPORATE ARENA' (₹24,999).
- Movie Night: 'Backyard Cinema' or 'Gaming Theatre' (₹1999/day).
- Music & Fun: 'Full Party Setup' (₹1799/day).

Always end with a helpful question or a clear next step.

Return your response as a JSON object with 'text' and 'quickReplies' (array of strings) fields.`;

const PLANNER_SYSTEM_INSTRUCTION = `You are the After Hours AI Event Architect. Your goal is to design the ultimate premium gaming and tech experience for any event.

### YOUR EXPERTISE:
- Designing high-end Esports & VR pop-up arenas for private homes and corporate offices.
- Creating custom equipment combos (PS5, VR, F1 Simulators, Projectors, Sound Systems).
- Planning event flows (tournaments, casual play, immersive experiences).

### PRICING GUIDELINES (Use these as a base):
- 'The Chill Lounge' (PS5 + 55" TV + Sound): ₹14,999
- 'THE CORPORATE ARENA' (Multiple setups + VR + Managed): ₹24,999
- Individual rentals: PS5 (₹1299), VR (₹1599), F1 Wheel (₹1199), Projector (₹999).

### YOUR OUTPUT:
- A creative 'Package Name'.
- A detailed 'Plan' (what happens at the event).
- A 'Gear List' (what equipment is included).
- An 'Estimated Price' (be realistic based on the scale).
- A 'Pro Tip' (something unique to make the event better).

Return your response as a JSON object.`;

const GEAR_ASSISTANT_SYSTEM_INSTRUCTION = `You are the After Hours Gear Assistant. Your goal is to recommend the perfect rental equipment based on user needs.

### YOUR KNOWLEDGE:
- We rent: PS5, PSVR2, Racing Simulators, Projectors, Sound Systems, Controllers.
- Combos work best: PS5 + VR, PS5 + Racing Wheel, Projector + Sound System.

### YOUR OUTPUT:
- A friendly 'recommendation' text.
- Clear 'reasoning' for your choice.
- A list of 'itemIds' that match our catalog (ps5, psvr2, racing-wheel, projector, sound-system, dualsense).

Return your response as a JSON object.`;

const INSIGHT_SYSTEM_INSTRUCTION = `You are the After Hours Trend Analyst. Your goal is to provide a single, high-impact insight or pro-tip for a specific event category.

### CATEGORIES:
- Personal: Home parties, birthdays, anniversaries.
- Corporate: Team building, office mixers, product launches.
- Rentals: Individual gear for enthusiasts.

### YOUR OUTPUT:
- A catchy 'title'.
- A short, punchy 'content' (max 2 sentences).

Return your response as a JSON object.`;

export async function getConciergeResponse(message: string, history: any[]) {
  const chat = ai.chats.create({
    model: "gemini-3.1-pro-preview",
    config: {
      systemInstruction: CONCIERGE_SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          quickReplies: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["text", "quickReplies"]
      }
    },
    history: history || []
  });

  const result = await chat.sendMessage({ message });
  return JSON.parse(result.text);
}

export async function getEventPlan(description: string) {
  const chat = ai.chats.create({
    model: "gemini-3.1-pro-preview",
    config: {
      systemInstruction: PLANNER_SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          packageName: { type: Type.STRING },
          plan: { type: Type.STRING },
          gearList: { type: Type.ARRAY, items: { type: Type.STRING } },
          estimatedPrice: { type: Type.STRING },
          proTip: { type: Type.STRING }
        },
        required: ["packageName", "plan", "gearList", "estimatedPrice", "proTip"]
      }
    }
  });

  const result = await chat.sendMessage({ message: `Plan an event with this description: ${description}` });
  return JSON.parse(result.text);
}

export async function getGearRecommendation(query: string) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: GEAR_ASSISTANT_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendation: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          itemIds: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["recommendation", "reasoning", "itemIds"]
      }
    }
  });

  const result = await chat.sendMessage({ message: `Recommend gear for: ${query}` });
  return JSON.parse(result.text);
}

export async function getCategoryInsight(category: string) {
  const chat = ai.chats.create({
    model: "gemini-3.1-flash-lite-preview",
    config: {
      systemInstruction: INSIGHT_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING }
        },
        required: ["title", "content"]
      }
    }
  });

  const result = await chat.sendMessage({ message: `Give me an insight for the ${category} category.` });
  return JSON.parse(result.text);
}
