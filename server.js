/**
 * Node.js Proxy Server for Recipe & Party Planner
 *
 * This server acts as a secure intermediary between the client-side (index.html) and the Gemini API.
 * It is required for two reasons:
 * 1. To securely handle the GEMINI_API_KEY, preventing its exposure in the browser.
 * 2. To manage complex API requests like structured JSON output.
 *
 * This version uses ES Module syntax (import), which requires the "type": "module" in your package.json file.
 */

// Load environment variables from .env file
import 'dotenv/config';

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from 'node-fetch'; 

const app = express();
const port = 3000;

// Middleware setup
app.use(cors()); // Enable CORS for client-side requests
app.use(bodyParser.json()); // To parse incoming JSON requests

// --- Configuration ---
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("FATAL: GEMINI_API_KEY not found in environment variables. Please create a .env file.");
    // Exit if the key is missing, as the server cannot function
    process.exit(1);
}

// Define the model and API endpoint URL
const MODEL = "gemini-2.5-flash-preview-09-2025";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;


// Helper function for exponential backoff retry logic
async function exponentialBackoffFetch(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options); 
            if (!response.ok) {
                // If the response is an API error (e.g., 400, 500), throw to trigger retry/error handling
                const errorData = await response.json();
                console.error(`Gemini API call failed with status ${response.status}:`, JSON.stringify(errorData));
                
                // If the error is 400, it's likely a bad request, don't retry, just fail fast
                if (response.status === 400) {
                     throw new Error(`Gemini API call failed with status 400: ${JSON.stringify(errorData)}`);
                }
                
                // For other status codes (e.g., 500 or 429), retry
                throw new Error(`HTTP Error: ${response.status}`);
            }
            return response;
        } catch (error) {
            if (i === maxRetries - 1) {
                console.error("Max retries reached. Failing request.");
                throw error;
            }
            const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s...
            console.warn(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}


// --- API Endpoints ---

// 1. Menu Optimization Endpoint (Uses Structured JSON)
app.post('/api/optimize', async (req, res) => {
    try {
        const payload = req.body;
        
        // Remove 'tools' property (Google Search Grounding) as it conflicts with JSON output
        if (payload.tools) {
            delete payload.tools;
        }

        const response = await exponentialBackoffFetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        res.json(result);

    } catch (error) {
        console.error('Error handling /api/optimize:', error.message);
        res.status(500).json({ error: `Proxy error: ${error.message}` });
    }
});


// 2. Drink Estimation Endpoint (Uses Structured JSON)
app.post('/api/drinks', async (req, res) => {
    try {
        const payload = req.body;
        
        // Remove 'tools' property (Google Search Grounding) as it conflicts with JSON output
        if (payload.tools) {
            delete payload.tools;
        }

        const response = await exponentialBackoffFetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        res.json(result);

    } catch (error) {
        console.error('Error handling /api/drinks:', error.message);
        res.status(500).json({ error: `Proxy error: ${error.message}` });
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server listening securely on http://localhost:${port}`);
    console.log("Ready to proxy requests to the Gemini API.");
});