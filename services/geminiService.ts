
import { GoogleGenAI } from "@google/genai";
import { GroundingChunk, ParsedVenueMetadata } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface VenueSearchResponse {
  text: string;
  chunks: GroundingChunk[];
  parsedMetadata?: Record<string, ParsedVenueMetadata>;
}

interface LocationParams {
  lat?: number;
  lng?: number;
  query?: string;
  radius?: number;
}

export const findLocalVenues = async (location: LocationParams): Promise<VenueSearchResponse> => {
  try {
    const modelId = "gemini-2.5-flash";
    const radius = location.radius || 10;
    
    const formattingInstruction = `
    CRITICAL OUTPUT FORMAT: 
    For each venue found, you MUST include a specific line in your text response following this exact pipe-delimited format:
    "VENUE_NAME | [INDOOR/OUTDOOR] | RATING_OUT_OF_5 | ONE_SENTENCE_VIBE | LATITUDE | LONGITUDE | SURFACE_TYPE | HAS_LIGHTS | ACCESS_TYPE"
    
    Details for new fields:
    - SURFACE_TYPE: 'Hardwood', 'Concrete', 'Asphalt', or 'Rubber'
    - HAS_LIGHTS: 'Yes' or 'No' (Do they have lights for night games?)
    - ACCESS_TYPE: 'Public', 'Private', or 'Paid' (Is it free or membership based?)

    Example:
    "Rucker Park | [OUTDOOR] | 4.8/5 | Legendary streetball court. | 40.8296 | -73.9362 | Asphalt | Yes | Public"
    "Downtown Rec | [INDOOR] | 4.2/5 | Clean hardwood floors. | 34.0522 | -118.2437 | Hardwood | Yes | Paid"
    
    Ensure you provide the most accurate Latitude and Longitude possible for the venue.
    `;

    let prompt = "";
    let toolConfig = undefined;

    if (location.query) {
       prompt = `Find the top 5 active basketball courts within ${radius} miles of "${location.query}". ${formattingInstruction}`;
    } else if (location.lat !== undefined && location.lng !== undefined) {
       prompt = `Find the top 5 active basketball courts within ${radius} miles of my current location (${location.lat}, ${location.lng}). ${formattingInstruction}`;
       toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location.lat,
            longitude: location.lng
          }
        }
      };
    } else {
        throw new Error("Location criteria missing");
    }
    
    // Config with Google Maps Grounding
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: toolConfig
      }
    });

    const text = response.text || "No venues found.";
    // Extract grounding chunks which contain the structured map data (URIs, titles)
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Parse the text for our custom metadata
    const parsedMetadata: Record<string, ParsedVenueMetadata> = {};
    
    const lines = text.split('\n');
    lines.forEach(line => {
        if (line.includes('|')) {
            // Clean line of markdown bolding, extra whitespace, and leading/trailing pipes (markdown tables)
            const cleanLine = line.replace(/^\s*\|\s*/, '').replace(/\s*\|\s*$/, '').replace(/\*\*/g, '').trim();
            const parts = cleanLine.split('|').map(s => s.trim());
            
            if (parts.length >= 6) {
                const name = parts[0];
                const typeRaw = parts[1].toUpperCase();
                const type = typeRaw.includes('INDOOR') ? 'Indoor' : typeRaw.includes('OUTDOOR') ? 'Outdoor' : 'Unknown';
                const rating = parts[2];
                const desc = parts[3];
                const lat = parseFloat(parts[4]);
                const lng = parseFloat(parts[5]);
                
                // New Suitability Factors
                const surfaceRaw = parts[6] || 'Unknown';
                let surface: any = 'Unknown';
                if (surfaceRaw.toLowerCase().includes('wood')) surface = 'Hardwood';
                else if (surfaceRaw.toLowerCase().includes('concrete')) surface = 'Concrete';
                else if (surfaceRaw.toLowerCase().includes('asphalt')) surface = 'Asphalt';
                else if (surfaceRaw.toLowerCase().includes('rubber')) surface = 'Rubber';

                const lighting = parts[7]?.toLowerCase().includes('yes') || false;
                
                const accessRaw = parts[8] || 'Public';
                let access: any = 'Public';
                if (accessRaw.toLowerCase().includes('private')) access = 'Private';
                else if (accessRaw.toLowerCase().includes('paid') || accessRaw.toLowerCase().includes('membership')) access = 'Paid';

                // Basic normalization and validation
                if (name && !isNaN(lat) && !isNaN(lng)) {
                    parsedMetadata[name.toLowerCase()] = { 
                        type, 
                        rating, 
                        desc, 
                        lat, 
                        lng,
                        surface,
                        lighting,
                        access
                    };
                }
            }
        }
    });

    return {
      text,
      chunks: chunks as GroundingChunk[],
      parsedMetadata
    };

  } catch (error) {
    console.error("Error fetching venues:", error);
    return {
      text: "Sorry, I couldn't fetch venues at the moment. Please try again.",
      chunks: [],
      parsedMetadata: {}
    };
  }
};

export const generateGameDescription = async (venueName: string, level: string, time: string) => {
    try {
      const modelId = "gemini-2.5-flash";
      const response = await ai.models.generateContent({
        model: modelId,
        contents: `Write a short, 1-sentence, hype invitation message for a ${level} basketball pickup game at ${venueName} at ${time}. Keep it energetic.`,
      });
      return response.text;
    } catch (e) {
      return "Join us for a game!";
    }
}
