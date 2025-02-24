const GOOGLE_CLOUD_API_KEY = "a0953d4273e6f0031f29eba1d9789851f8497c5c"; // Replace with your key
const OPENAI_API_KEY = "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"; // Replace with your key

document.getElementById("start").addEventListener("click", startRecording);

async function startRecording() {
  document.getElementById("output").textContent = "Listening...";
  
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  let audioChunks = [];

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
    const transcript = await convertSpeechToText(audioBlob);
    document.getElementById("output").textContent = `You said: "${transcript}"`;

    if (transcript) {
      const correction = await checkWithAI(transcript);
      if (correction) {
        document.getElementById("output").textContent = `Correction: ${correction}`;
        speakText(correction);
      } else {
        document.getElementById("output").textContent = "No mistakes detected.";
      }
    }
  };

  mediaRecorder.start();
  setTimeout(() => mediaRecorder.stop(), 5000); // Stop recording after 5 seconds
}

// Convert Speech to Text using Google Cloud API
async function convertSpeechToText(audioBlob) {
  const base64Audio = await blobToBase64(audioBlob);

  const response = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_CLOUD_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: { encoding: "LINEAR16", sampleRateHertz: 16000, languageCode: "en-US" },
        audio: { content: base64Audio },
      }),
    }
  );

  const data = await response.json();
  return data.results?.[0]?.alternatives?.[0]?.transcript || "";
}

// Convert Blob to Base64
async function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      resolve(reader.result.split(",")[1]); // Extract Base64 content
    };
  });
}

// Fact-Check with OpenAI
async function checkWithAI(statement) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a fact-checking assistant. Only correct false statements. If a statement is true, do nothing." },
        { role: "user", content: statement },
      ],
    }),
  });

  const data = await response.json();
  const correction = data.choices?.[0]?.message?.content?.trim();
  return correction && correction.toLowerCase() !== "true" ? correction : "";
}

// Speak Correction
function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
}
