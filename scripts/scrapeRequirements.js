import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import medicalSchoolsData from '../src/data/medicalSchoolsData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function scrapeRequirements() {
  console.log('Starting scraper...');
  const results = {};

  for (let i = 0; i < medicalSchoolsData.length; i++) {
    const school = medicalSchoolsData[i];
    console.log(`[${i + 1}/${medicalSchoolsData.length}] Fetching ${school.university}...`);
    
    if (!school.officialUrl) {
      console.log(`  -> No official URL found. Skipping.`);
      continue;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(school.officialUrl, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`  -> Failed with status: ${response.status}`);
        results[school.id] = { error: `HTTP ${response.status}` };
        continue;
      }
      
      const html = await response.text();
      
      // Extremely lightweight regex parsing
      // 1. Strip script and style tags completely
      let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
      cleanHtml = cleanHtml.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');
      cleanHtml = cleanHtml.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
      
      // 2. Extract paragraphs and list items
      const blockRegex = /<(p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
      let match;
      const extractedBlocks = [];
      
      while ((match = blockRegex.exec(cleanHtml)) !== null) {
        // Strip inner HTML tags to get raw text
        const text = match[2].replace(/<[^>]+>/g, ' ').trim().replace(/\s+/g, ' ');
        
        // 3. Filter for keywords
        if (
          text.length > 10 && 
          text.length < 1000 &&
          /(A[\s-]*level|GCSE|IB|International Baccalaureate|UCAT|Chemistry|Biology|Scottish Highers|OSSD|Ontario)/i.test(text)
        ) {
          extractedBlocks.push(text);
        }
      }
      
      // Deduplicate blocks
      const uniqueBlocks = [...new Set(extractedBlocks)];
      
      results[school.id] = {
        university: school.university,
        url: school.officialUrl,
        extractedRequirements: uniqueBlocks
      };
      
      console.log(`  -> Extracted ${uniqueBlocks.length} relevant requirement blocks.`);
      
    } catch (err) {
      console.log(`  -> Error fetching: ${err.message}`);
      results[school.id] = { error: err.message };
    }
    
    // Polite delay
    await delay(1000);
  }
  
  const outputPath = path.join(__dirname, '../src/data/scrapedRequirements.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nScraping complete! Results saved to ${outputPath}`);
}

scrapeRequirements();
