/**
 * Vercel Serverless Function: /api/optimize
 *
 * NOTE: This file uses ES Module syntax (import/export) to match the "type": "module"
 * setting in the project's package.json.
 */

// Use ES Module syntax for imports
import { GoogleGenAI } from '@google/genai';

// Environment variables are accessed via process.env in the Vercel environment.
const apiKey = process.env.GEMINI_API_KEY;

// 1. Initialize the AI client
let ai;
const MODEL = "gemini-2.5-flash-preview-09-2025"; 

if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
} else {
    // This function will handle the case where the key is missing gracefully
    console.error("CRITICAL ERROR: GEMINI_API_KEY is not set.");
}


// 2. Define the API route handler function (Named export)
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Check if the AI client was initialized successfully (i.e., if the key was found)
    if (!ai) {
        return res.status(500).json({ error: "Server Configuration Error: GEMINI_API_KEY is missing. Check your .env file." });
    }

    try {
        const { guests, appetizers, mainCourses, sideDishes, desserts, otherItems } = req.body;

        if (!guests || guests <= 0) {
            return res.status(400).json({ error: 'Invalid number of guests provided. Check that the request body is correctly formatted.' });
        }

        // --- Prompt Construction ---
        const menuParts = [];
        if (appetizers) menuParts.push(`Appetizers: ${appetizers}`);
        if (mainCourses) menuParts.push(`Main Courses: ${mainCourses}`);
        if (sideDishes) menuParts.push(`Side Dishes: ${sideDishes}`);
        if (desserts) menuParts.push(`Desserts: ${desserts}`);
        if (otherItems) menuParts.push(`Other Items/Notes: ${otherItems}`);

        const menuDetails = menuParts.length > 0
            ? menuParts.join('; ')
            : "No specific dishes were provided; generate a balanced, suggested menu.";

        const systemInstruction = `You are a world-class party planner and menu optimizer. Your task is to calculate the precise quantities for a party of ${guests} people based on the provided menu items. You must account for common human consumption patterns (e.g., less of each item when there are many choices). Your response MUST be a single, valid JSON array.`;

        const userQuery = `Optimize the following menu for ${guests} guests. 
            Menu details: ${menuDetails}.

            For each item, provide the estimated quantity needed and a clear unit (e.g., 'lbs', 'cups', 'units'). For example: '2.5 lbs of cheese', '50 mini quiches', '2 gallons of iced tea'.

            If the user provided no specific items, suggest a balanced, optimized menu for ${guests} guests, ensuring the quantities are explicitly calculated.

            Generate the output as a JSON array of objects, where each object has "item" (string), "quantity" (string with amount and unit), and "category" (string).`;

        // Define the JSON schema for structured output
        const responseSchema = {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    "item": { "type": "STRING", "description": "The specific food or supply item." },
                    "quantity": { "type": "STRING", "description": "The precise amount with units (e.g., 5 lbs, 2 dozen, 80 units)." },
                    "category": { "type": "STRING", "description": "The category of the item (e.g., Appetizer, Main Course, Shopping Supplies)." }
                },
                required: ["item", "quantity", "category"]
            }
        };

        // --- Call the Gemini API ---
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: {
                parts: [{ text: systemInstruction }]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.2, 
            },
        });

        // The response text is the JSON string
        const jsonResponseText = response.candidates[0].content.parts[0].text;
        const optimizedPlan = JSON.parse(jsonResponseText);

        // Success: Send the parsed JSON back to the client
        res.status(200).json(optimizedPlan);

    } catch (error) {
        console.error('Gemini API or Server Error:', error.message);
        // Return a clean JSON error response
        res.status(500).json({ error: 'Failed to generate optimized menu plan.', details: error.message });
    }
}