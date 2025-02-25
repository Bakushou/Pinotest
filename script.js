const GOOGLE_CLOUD_API_KEY = "AIzaSyDsoo18UyvdkdnNmlrFFMLACIX5BcWVerA"; 

// Get references to the HTML elements (assuming you have a button and output area)
const startButton = document.getElementById("start");
const outputDiv = document.getElementById("output");

let mediaRecorder;
let audioChunks = [];

// 🎤 Start Recording Function
async function startRecording() {
    outputDiv.innerText = "Listening... 🎤";
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
        mediaRecorder.onstop = processRecording;

        audioChunks = [];
        mediaRecorder.start();

        setTimeout(() => mediaRecorder.stop(), 5000); // Stops recording after 5 seconds
    } catch (error) {
        console.error("Microphone access error:", error);
        outputDiv.innerText = "Error accessing microphone!";
    }
}

// 🔊 Process Recorded Audio
async function processRecording() {
    const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
    const transcript = await convertSpeechToText(audioBlob);
    
    if (!transcript) {
        outputDiv.innerText = "Couldn't recognize speech. Try again!";
        return;
    }

    outputDiv.innerText = `You said: "${transcript}"`;
    checkForMistakes(transcript);
}

// 📝 Convert Speech to Text (Google API)
async function convertSpeechToText(audioBlob) {
    const base64Audio = await blobToBase64(audioBlob);

const response = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_CLOUD_API_KEY}`,
    {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            config: { 
                encoding: "WEBM_OPUS", 
                sampleRateHertz: 48000,  // 🔥 Fix here!
                languageCode: "en-US" 
            },
            audio: { content: base64Audio },
        }),
    }
);

    const data = await response.json();
    console.log("Google API Response:", JSON.stringify(data, null, 2));

    return data.results?.[0]?.alternatives?.[0]?.transcript || "";
}

// 🤖 Check for Mistakes (OpenAI API)
async function checkForMistakes(transcript) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4-turbo",
            messages: [
                { role: "system", content: "You are an AI that listens to discussions and only responds if a mistake is made. Correct any incorrect statements." },
                { role: "user", content: transcript }
            ],
            temperature: 0.5
        })
    });

    const data = await response.json();
    console.log("OpenAI Response:", data);

    const correction = data.choices?.[0]?.message?.content?.trim();
    if (correction && correction !== transcript) {
        outputDiv.innerText += `\nCorrection: "${correction}"`;
        speakCorrection(correction);
    }
}

// 🔊 Convert Text to Speech (Speak the Correction)
function speakCorrection(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
}

// 📄 Convert Blob to Base64
function blobToBase64(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(blob);
    });
}

// 🎤 Add Click Event to Start Button
startButton.addEventListener("click", startRecording);
