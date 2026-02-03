
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
    console.error("No API key found");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
        console.error(`Error ${response.status}:`, JSON.stringify(data, null, 2));
    } else {
        if (data.models) {
            // Find best Flash
            const flash = data.models.find(m => m.name.includes("gemini-1.5-flash"));
            if (flash) {
                console.log("MODEL_FOUND: " + flash.name);
                return;
            }
            // Find best Pro
            const pro = data.models.find(m => m.name.includes("gemini-pro"));
            if (pro) {
                 console.log("MODEL_FOUND: " + pro.name);
                 return;
            }
        }
    }
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

main();
