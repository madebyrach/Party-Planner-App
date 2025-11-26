<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Party Menu Optimizer</title>
    <!-- Load Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Custom styles for smooth scrolling and clean font */
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', sans-serif; background-color: #f7f9fc; }
        .input-group label { transition: all 0.3s; }
        .input-group input:focus + label { color: #4f46e5; transform: translateY(-1.5rem) scale(0.9); }
        .input-group.has-content label { color: #4f46e5; transform: translateY(-1.5rem) scale(0.9); }
        .card { box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); }
    </style>
</head>
<body class="min-h-screen p-4 sm:p-8">

    <!-- Main Container -->
    <div class="max-w-4xl mx-auto">
        <header class="text-center mb-10">
            <h1 class="text-4xl font-extrabold text-indigo-700">AI Party Menu Optimizer</h1>
            <p class="text-gray-500 mt-2">Plan your perfect party: tell us what you're serving, and Gemini will calculate the precise quantities you need.</p>
        </header>

        <!-- Input Card -->
        <div class="card bg-white p-6 md:p-10 rounded-xl border border-gray-100 mb-10">
            <form id="optimizerForm">
                <div class="mb-6">
                    <!-- UI Enhancement 1: Added * for Required Field -->
                    <label for="guests" class="block text-sm font-medium text-gray-700 mb-1">Number of Guests <span class="text-red-500">*</span></label>
                    <input type="number" id="guests" required min="1" placeholder="e.g., 20" 
                           class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150">
                    <!-- Validation message display -->
                    <p id="guestError" class="text-red-500 text-sm mt-1 hidden">Please enter a valid number of guests (1 or more).</p>
                </div>

                <!-- Optional Party Details Input -->
                <div class="mt-6 mb-6">
                    <label for="partyDetails" class="block text-sm font-medium text-gray-700 mb-1">Party Details (Optional Context)</label>
                    <textarea id="partyDetails" rows="2" placeholder="e.g., It's a 3-hour cocktail party, most guests are light drinkers, we need eco-friendly plates." class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"></textarea>
                </div>

                <!-- Menu Item Inputs (Grouped for readability) -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Row 1 -->
                    <div>
                        <label for="appetizers" class="block text-sm font-medium text-gray-700 mb-1">Appetizers (e.g., Mini Quiches, Cheese Board)</label>
                        <textarea id="appetizers" rows="2" placeholder="List items or styles" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"></textarea>
                    </div>
                    <div>
                        <label for="mainCourses" class="block text-sm font-medium text-gray-700 mb-1">Main Courses (e.g., Pulled Pork, Vegetarian Lasagna)</label>
                        <textarea id="mainCourses" rows="2" placeholder="List items" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"></textarea>
                    </div>
                    <!-- Row 2 -->
                    <div>
                        <label for="sideDishes" class="block text-sm font-medium text-gray-700 mb-1">Side Dishes (e.g., Potato Salad, Green Beans)</label>
                        <textarea id="sideDishes" rows="2" placeholder="List items" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"></textarea>
                    </div>
                    <div>
                        <label for="desserts" class="block text-sm font-medium text-gray-700 mb-1">Desserts (e.g., Cupcakes, Fruit Platter)</label>
                        <textarea id="desserts" rows="2" placeholder="List items" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"></textarea>
                    </div>
                </div>

                <!-- Separate Beverages field -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                        <label for="beverages" class="block text-sm font-medium text-gray-700 mb-1">Beverages (e.g., Soda, Beer, Water)</label>
                        <textarea id="beverages" rows="2" placeholder="List drinks and expected quantities/mixes" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"></textarea>
                    </div>
                    <div>
                        <label for="otherItems" class="block text-sm font-medium text-gray-700 mb-1">Other Items (e.g., Ice, Paper Plates, Utensils)</label>
                        <textarea id="otherItems" rows="2" placeholder="List supplies or non-food items" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"></textarea>
                    </div>
                </div>

                <button type="submit" id="optimizeButton"
                        class="w-full mt-8 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50">
                    <span id="buttonText">Calculate Optimized Quantities</span>
                    <div id="loadingSpinner" class="hidden spinner border-2 border-t-2 border-white border-opacity-20 rounded-full w-5 h-5 animate-spin mx-auto"></div>
                </button>
            </form>
        </div>

        <!-- Output Section -->
        <div id="outputSection" class="card bg-white p-6 md:p-10 rounded-xl border border-gray-100 hidden">
            <h2 class="text-2xl font-bold text-indigo-700 mb-6">Optimized Plan:</h2>
            
            <!-- AI Summary Section -->
            <div id="summaryContainer" class="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-r-lg shadow-inner hidden">
                <h3 class="font-semibold text-lg flex items-center mb-2">
                    <svg class="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    AI Assumptions & Notes
                </h3>
                <p id="summaryText" class="text-sm"></p>
            </div>
            
            <div id="resultsTableContainer" class="overflow-x-auto">
                <!-- Table will be generated here -->
            </div>

            <div id="errorMessage" class="hidden mt-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300"></div>
        </div>
    </div>

    <!-- JavaScript Logic -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('optimizerForm');
            const outputSection = document.getElementById('outputSection');
            const resultsTableContainer = document.getElementById('resultsTableContainer');
            const summaryContainer = document.getElementById('summaryContainer');
            const summaryText = document.getElementById('summaryText');
            const errorMessageDiv = document.getElementById('errorMessage');
            const optimizeButton = document.getElementById('optimizeButton');
            const buttonText = document.getElementById('buttonText');
            const loadingSpinner = document.getElementById('loadingSpinner');
            const guestsInput = document.getElementById('guests');
            const guestError = document.getElementById('guestError');


            const API_URL = '/api/optimize'; 

            /**
             * Handles the form submission, sends data to the server, and processes the JSON response.
             */
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // --- Client-Side Validation ---
                const guestsValue = parseInt(guestsInput.value);
                if (isNaN(guestsValue) || guestsValue < 1) {
                    guestError.classList.remove('hidden');
                    guestsInput.classList.add('border-red-500');
                    return; // Stop form submission
                } else {
                    guestError.classList.add('hidden');
                    guestsInput.classList.remove('border-red-500');
                }
                // --- End Validation ---

                // Reset UI
                outputSection.classList.add('hidden');
                errorMessageDiv.classList.add('hidden');
                resultsTableContainer.innerHTML = '';
                summaryText.textContent = '';
                summaryContainer.classList.add('hidden'); 
                
                // Show loading state
                buttonText.classList.add('hidden');
                loadingSpinner.classList.remove('hidden');
                optimizeButton.disabled = true;

                // Gather form data, including the new 'beverages' field
                const formData = {
                    guests: guestsValue, // Use validated value
                    partyDetails: document.getElementById('partyDetails').value.trim(), 
                    appetizers: document.getElementById('appetizers').value.trim(),
                    mainCourses: document.getElementById('mainCourses').value.trim(),
                    sideDishes: document.getElementById('sideDishes').value.trim(),
                    desserts: document.getElementById('desserts').value.trim(),
                    // Include the new field
                    beverages: document.getElementById('beverages').value.trim(), 
                    otherItems: document.getElementById('otherItems').value.trim(),
                };

                try {
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData),
                    });

                    // Server responded, but might be an error (e.g., 400, 500)
                    if (!response.ok) {
                        const errorData = await response.text(); 
                        throw new Error(`HTTP Error! Status: ${response.status}. Details: ${errorData}`);
                    }

                    // Server responded successfully (Status 200), parse the structured JSON
                    const data = await response.json(); 
                    
                    // Check for the new structured format: { plan: [...], summary: "..." }
                    if (data && Array.isArray(data.plan) && typeof data.summary === 'string') {
                        
                        // 1. Render the table
                        renderResultsTable(data.plan);
                        
                        // 2. Render the summary
                        summaryText.textContent = data.summary;
                        summaryContainer.classList.remove('hidden');

                        outputSection.classList.remove('hidden');
                        // Scroll to the results
                        outputSection.scrollIntoView({ behavior: 'smooth' });

                    } else {
                        throw new Error("Received an invalid response structure from the server. Expected 'plan' array and 'summary' text.");
                    }

                } catch (error) {
                    console.error("Fetch or Processing Error:", error);
                    errorMessageDiv.textContent = `CRITICAL ERROR: Failed to fetch data or process response. Details: ${error.message}`;
                    errorMessageDiv.classList.remove('hidden');
                    outputSection.classList.remove('hidden'); // Show the section to display the error
                } finally {
                    // Hide loading state
                    buttonText.classList.remove('hidden');
                    loadingSpinner.classList.add('hidden');
                    optimizeButton.disabled = false;
                }
            });


            /**
             * Generates an HTML table from the JSON array of optimized items.
             * @param {Array<Object>} data - The array of plan objects.
             */
            function renderResultsTable(data) {
                // Group items by category for a cleaner, organized view
                const groupedData = data.reduce((acc, item) => {
                    // Use fallback for category in case AI misses it
                    const category = item.category || 'Uncategorized';
                    if (!acc[category]) {
                        acc[category] = [];
                    }
                    acc[category].push(item);
                    return acc;
                }, {});

                let htmlContent = '';

                for (const category in groupedData) {
                    htmlContent += `
                        <h3 class="text-xl font-semibold text-gray-800 mt-6 mb-3 border-b-2 border-indigo-100 pb-1">${category}</h3>
                        <table class="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
                            <thead class="bg-indigo-50">
                                <tr>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Item</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Quantity Needed</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                    `;

                    groupedData[category].forEach(item => {
                        htmlContent += `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.item}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">${item.quantity}</td>
                            </tr>
                        `;
                    });

                    htmlContent += `
                            </tbody>
                        </table>
                    `;
                }

                resultsTableContainer.innerHTML = htmlContent;
            }

            // Simple loading spinner definition for better visual feedback
            const style = document.createElement('style');
            style.textContent = `
                .spinner {
                    border-top-color: #4f46e5;
                }
            `;
            document.head.appendChild(style);
        });
    </script>
</body>
</html>