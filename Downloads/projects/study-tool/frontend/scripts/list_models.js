
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

function getApiKey() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const matches = envContent.match(/GEMINI_API_KEY=(.*)/);
    return matches ? matches[1].trim() : null;
  } catch (e) {
    return process.env.GEMINI_API_KEY;
  }
}

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("No API key found in .env.local");
    return;
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log("Checking available models...");

    // Test specific models to see what works
    const modelsToCheck = [
      "gemini-1.5-flash", 
      "gemini-1.5-flash-latest",
      "gemini-pro"
    ];

    for (const modelName of modelsToCheck) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        await model.generateContent("Hi");
        console.log(`${modelName}: AVAILABLE ✅`);
      } catch(e) { 
        console.log(`${modelName}: FAILED ❌ (${e.message.substring(0, 50)}...)`); 
      }
    }

  } catch (error) {
    console.error("General Error:", error);
  }
}

main();
