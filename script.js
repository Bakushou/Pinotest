const GOOGLE_CLOUD_API_KEY = "your-google-cloud-api-key";

// Function to send audio to Google Cloud for transcription
async function convertSpeechToText(audioBlob) {
  const formData = new FormData();
  formData.append("audio", audioBlob);

  const response = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_CLOUD_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        config: {
          encoding: "LINEAR16",
          sampleRateHertz: 16000,
          languageCode: "en-US",
        },
        audio: {
          content: await blobToBase64(audioBlob),
        },
      }),
    }
  );

  const data = await response.json();
  console.log("Speech Recognition Result:", data);
  return data.results?.[0]?.alternatives?.[0]?.transcript || "";
}

// Helper function: Convert audio blob to Base64
async function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      resolve(reader.result.split(",")[1]); // Extract Base64 part
    };
  });
}
