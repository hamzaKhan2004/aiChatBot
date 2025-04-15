const chatBody = document.getElementById('chat-body');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const typingIndicator = document.getElementById('typing-indicator');

// API configuration for Google Gemini
const API_KEY = "AIzaSyDscVWqZCS96px2VRcwcpUeC8-wtPpj0k8";

// Function to call the Google Gemini API
async function callGeminiAPI(message) {
    try {
        showTypingIndicator();

        // Correct URL structure for Gemini API
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: message }]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 256,
                    topP: 0.95,
                    topK: 40
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error (${response.status}):`, errorText);

            try {
                const errorJson = JSON.parse(errorText);
                console.error("Structured error:", errorJson);

                if (errorJson.error && errorJson.error.message) {
                    if (errorJson.error.message.includes("API key")) {
                        return "There seems to be an issue with the API key. Please check your credentials.";
                    } else if (errorJson.error.message.includes("quota")) {
                        return "I've reached my conversation limit for now. Please try again later.";
                    }
                }
            } catch (e) {
                // Continue with generic error
            }

            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log("API response:", data);

        if (
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts &&
            data.candidates[0].content.parts[0]
        ) {
            return data.candidates[0].content.parts[0].text || "I don't have a response for that.";
        } else {
            console.error("Unexpected API response structure:", data);
            return "I received a response but couldn't interpret it correctly.";
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Sorry, I'm having trouble connecting to my knowledge source right now. Please try again later.";
    } finally {
        hideTypingIndicator();
    }
}

// Function to add message to chat
function addMessage(message, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'user-message' : 'bot-message';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = message;

    messageDiv.appendChild(messageContent);
    chatBody.insertBefore(messageDiv, typingIndicator);

    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Function to show typing indicator
function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Function to hide typing indicator
function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// Function to handle sending message
async function sendMessage() {
    const message = messageInput.value.trim();
    if (message === '') return;

    addMessage(message, true);
    messageInput.value = '';

    try {
        const botResponse = await callGeminiAPI(message);
        addMessage(botResponse, false);
    } catch (error) {
        console.error("Error in sendMessage:", error);
        addMessage("Sorry, I'm having trouble connecting right now. Please try again later.", false);
    }
}

// Event listeners
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Initialize
messageInput.disabled = false;
sendButton.disabled = false;

console.log("Chatbot script loaded successfully");
