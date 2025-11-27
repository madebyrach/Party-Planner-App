// --- Serverless Function for Vercel ---
// This file is deployed under the /api/optimize route and uses the Vercel Runtime.

// 1. Load Google Gen AI SDK (Using CommonJS 'require')
const { GoogleGenAI } = require('@google/genai');

// 2. Initialize the AI client
// The GEMINI_API_KEY is automatically loaded from the Vercel Environment Variables.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = "gemini-2.5-flash"; 

/**
 * Main handler function for the Vercel serverless environment.
 * @param {import('http').IncomingMessage} req - The request object.
 * @param {import('http').ServerResponse} res - The response object.
 */
module.exports = async (req, res) => {
    // --- CORS Headers (Standard Vercel Function Setup) ---
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
        return;
    }

    // --- Data Parsing (Standard Vercel way to handle JSON body) ---
    let formData;
    try {
        // Vercel's req object often requires parsing the stream manually or using helper methods.
        // We will stick to the standard stream reading for maximum compatibility.
        formData = await new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => {
                data += chunk;
            });
            req.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Invalid JSON body provided.'));
                }
            });
            req.on('error', reject);
        });
    } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
        return;
    }


    const { guests, partyDetails, appetizers, mainCourses, sideDishes, desserts, beverages, otherItems } = formData;

    // --- Input Validation ---
    if (!guests || typeof guests !== 'number' || guests < 1) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'The "guests" field is required and must be a number greater than 0.' }));
        return;
    }

    // --- Prompt Construction ---
    const prompt = `
        You are an expert party planner and food quantity calculator.
        The party has ${guests} guests.
        
        Party Context: ${partyDetails || 'None provided.'}
        
        The menu items planned are:
        - Appetizers: ${appetizers || 'None'}
        - Main Courses: ${mainCourses || 'None'}
        - Side Dishes: ${sideDishes || 'None'}
        - Desserts: ${desserts || 'None'}
        - Beverages: ${beverages || 'None'}
        - Other Supplies: ${otherItems || 'None'}
        
        Calculate the exact quantity needed for each item based on the guest count and context.
        
        Your final output MUST be a single JSON object structured as follows:
        {
            "plan": [
                { "category": "Appetizers", "item": "Name of Item 1", "quantity": "Calculated amount/unit" },
                { "category": "Appetizers", "item": "Name of Item 2", "quantity": "Calculated amount/unit" },
                // ... continue for all items ...
            ],
            "summary": "A concise, single paragraph explaining the general assumptions and rationale you used for the calculation (e.g., portions, time, dietary considerations)."
        }
        
        Ensure the response is STRICTLY valid JSON and contains only the JSON object.
    `;

    // --- Gemini API Call ---
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        plan: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    category: { type: "STRING" },
                                    item: { type: "STRING" },
                                    quantity: { type: "STRING" }
                                }
                            }
                        },
                        summary: { type: "STRING" }
                    }
                },
            }
        });

        // The JSON response from the model is returned as a string in response.text
        const jsonString = response.text.trim();
        const finalData = JSON.parse(jsonString);

        // --- Success Response ---
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(finalData));

    } catch (error) {
        console.error("Gemini API Invocation Error:", error);
        // This detail will now be sent back to your index.html's error box
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'AI Function Crash: Check Vercel logs for missing dependencies or API Key issue.', 
            details: error.message 
        }));
    }
};