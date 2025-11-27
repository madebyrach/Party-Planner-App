// --- Serverless Function for Vercel ---
// This file is deployed under the /api/optimize route and uses the Vercel Runtime.

// 1. Load Google Gen AI SDK (Using dynamic import() to handle ES Modules)
// We must wrap the import in an async function call.
let GoogleGenAI;
(async () => {
    const module = await import('@google/genai');
    GoogleGenAI = module.GoogleGenAI;
})();

// 2. Initialize the AI client
// The ai object must be initialized inside the handler to ensure the dynamic import completes.
const model = "gemini-2.5-flash"; 

/**
 * Main handler function for the Vercel serverless environment.
 * @param {import('http').IncomingMessage} req - The request object.
 * @param {import('http').ServerResponse} res - The response object.
 */
module.exports = async (req, res) => {
    
    // Initialize AI client inside the handler after dynamic import is guaranteed to have run
    if (!GoogleGenAI) {
        // Fallback or wait if the initial IIFE hasn't completed, though Vercel usually handles this.
        // For simplicity and stability, we re-import here to ensure it's loaded if the IIFE failed.
        try {
            const module = await import('@google/genai');
            GoogleGenAI = module.GoogleGenAI;
        } catch (e) {
            return res.status(500).json({ error: 'Initialization Error', details: 'Failed to dynamically import @google/genai SDK.' });
        }
    }
    
    // Initialize the AI client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
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
        // Use res.json() for simplified Vercel response
        return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    }

    // --- Data Parsing (Simplified: Relying on Vercel's built-in JSON parsing for standard requests) ---
    let formData = req.body;
    
    // Fallback for manual parsing if req.body is undefined, though this should be rare in the current setup.
    if (!formData) {
        try {
            const data = await new Promise((resolve, reject) => {
                let chunk = '';
                req.on('data', c => chunk += c);
                req.on('end', () => resolve(chunk));
                req.on('error', reject);
            });
            formData = JSON.parse(data);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid or missing JSON body provided.' });
        }
    }

    // Safely destructure after ensuring formData exists
    const { guests, partyDetails, appetizers, mainCourses, sideDishes, desserts, beverages, otherItems } = formData || {};

    // --- Input Validation ---
    if (!guests || typeof guests !== 'number' || guests < 1) {
        return res.status(400).json({ error: 'The "guests" field is required and must be a number greater than 0.' });
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

        // --- Success Response (using Vercel's res.json helper) ---
        return res.status(200).json(finalData);

    } catch (error) {
        console.error("Gemini API Invocation Error:", error);
        // This detail will now be sent back to your index.html's error box
        return res.status(500).json({ 
            error: 'AI Function Crash: Check Vercel logs for missing dependencies or API Key issue.', 
            details: error.message 
        });
    }
};