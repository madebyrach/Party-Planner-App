// --- Menu Optimization Handler (Serverless Function) ---
// 1. Imports
import express from 'express';
import { GoogleGenAI } from '@google/genai';

// 2. Initialization
// The API key is securely loaded by the Serverless platform (e.g., Vercel)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = "gemini-2.5-flash-preview-09-2025"; 

/**
 * Handles the incoming request for menu optimization.
 * This is the core function that the serverless platform will execute.
 */
export default async function handler(req, res) {
    // 3. CORS and Header Setup (Crucial for Serverless)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // 4. Input Validation
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    }

    // Extract body data (assuming the body has been parsed by the serverless framework)
    const { guests, mainCourses, sideDishes, dessert } = req.body;
    
    if (!guests || !mainCourses || !sideDishes || !dessert) {
        return res.status(400).json({ error: 'Missing required menu fields.' });
    }

    try {
        // 5. Prompt Construction
        const systemPrompt = "Act as an analytical chef and menu planner. Your only goal is to evaluate the user's current menu against the number of guests and generate a detailed response in the requested JSON structure. DO NOT use markdown formatting outside of the JSON structure itself."; 
        
        const userQuery = `I am planning a party for ${guests} guests. The main courses are: ${mainCourses}. The side dishes are: ${sideDishes}. The desired dessert is: ${dessert}. Please provide an optimized menu plan, detailed portions, and the required shopping list in a single JSON object.`;

        // 6. Gemini API Call
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: systemPrompt + "\n" + userQuery }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: { /* Define the JSON output structure for menu optimization here */ }
                // Note: Define a schema here to ensure reliable JSON output for your frontend.
            }
        });

        const jsonText = response.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsedJson = JSON.parse(jsonText);

        // 7. Success Response
        res.status(200).json(parsedJson);
        
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: 'Failed to process request with Gemini API.' });
    }
}