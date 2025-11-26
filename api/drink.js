// --- Drink Estimation Handler (Serverless Function) ---

// 1. Imports
import express from 'express';
import { GoogleGenAI } from '@google/genai';

// 2. Initialization
// The API key is securely loaded by the Serverless platform (e.g., Vercel)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = "gemini-2.5-flash-preview-09-2025";

/**
 * Handles the incoming request for drink estimation.
 * This is the core function that the serverless platform will execute.
 * The function is designed to work with platforms like Vercel.
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
    const { guests, eventType, durationHours, drinksList } = req.body;
    
    if (!guests || !eventType || !durationHours || !drinksList) {
        return res.status(400).json({ error: 'Missing required drink fields.' });
    }

    try {
        // 5. Prompt Construction
        const systemPrompt = "Act as an expert sommelier and bartender who specializes in large-scale event planning. Your only goal is to accurately calculate the required quantity of beverages and return the results in the requested JSON structure. DO NOT use markdown formatting outside of the JSON structure itself."; 
        
        const userQuery = `I have ${guests} guests attending a ${eventType} event lasting ${durationHours} hours. The available drinks are: ${drinksList}. Please estimate the total volume and quantity of each item needed to comfortably cover all guests, and return the response in a single JSON object.`;

        // 6. Gemini API Call
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: systemPrompt + "\n" + userQuery }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: { /* ... your JSON schema definition goes here ... */ }
                // Note: The schema is omitted for brevity, but this is where it would control the output format.
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