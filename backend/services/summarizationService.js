const { GoogleGenAI } = require("@google/genai");

const SUMMARIZATION_MODEL =
  process.env.SUMMARIZATION_MODEL || "facebook/bart-large-cnn";
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || "";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const GEMINI_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
].filter(Boolean);

/**
 * Clean text of null characters, carriage returns, and excessive whitespace
 */
function cleanText(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/\0/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Split text into overlapping chunks
 * maxChunkLength: characters per chunk
 * overlap: character overlap between successive chunks
 */
function chunkText(text, maxChunkLength = 2200, overlap = 200) {
  const cleaned = cleanText(text);
  if (!cleaned) return [];
  if (cleaned.length <= maxChunkLength) return [cleaned];

  const chunks = [];
  let startIndex = 0;

  while (startIndex < cleaned.length) {
    let endIndex = startIndex + maxChunkLength;

    if (endIndex < cleaned.length) {
      // Avoid splitting words: look for sentence ending or space
      const sentenceEnd = cleaned.lastIndexOf(".", endIndex);
      const spaceEnd = cleaned.lastIndexOf(" ", endIndex);

      if (sentenceEnd > startIndex + maxChunkLength * 0.7) {
        endIndex = sentenceEnd + 1;
      } else if (spaceEnd > startIndex + maxChunkLength * 0.7) {
        endIndex = spaceEnd;
      }
    } else {
      endIndex = cleaned.length;
    }

    chunks.push(cleaned.slice(startIndex, endIndex).trim());

    if (endIndex >= cleaned.length) break;
    startIndex = Math.max(endIndex - overlap, startIndex + 1);
  }

  return chunks;
}

/**
 * Call Hugging Face hosted inference API for facebook/bart-large-cnn
 */
async function callHuggingFaceBart(chunk, level = "medium") {
  if (!HUGGINGFACE_API_KEY) {
    throw new Error("No HUGGINGFACE_API_KEY configured in environment.");
  }

  const minLength = level === "short" ? 30 : level === "detailed" ? 120 : 60;
  const maxLength = level === "short" ? 100 : level === "detailed" ? 300 : 180;

  const url = `https://api-inference.huggingface.co/models/${SUMMARIZATION_MODEL}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: chunk,
      parameters: {
        min_length: minLength,
        max_length: maxLength,
        do_sample: false,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Hugging Face API returned ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  if (Array.isArray(result) && result[0]?.summary_text) {
    return result[0].summary_text.trim();
  }
  throw new Error("Unexpected Hugging Face response structure.");
}

/**
 * Fallback to Gemini with multi-model failover for reliable structured summary
 */
async function callGeminiFallback(prompt) {
  let lastError = null;
  const uniqueModels = [...new Set(GEMINI_CANDIDATES)];

  for (const model of uniqueModels) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      if (res && res.text) return res.text;
    } catch (err) {
      lastError = err;
      console.warn(`[Summarization Gemini Fallback] ${model} failed, trying next...`);
    }
  }

  throw new Error(
    lastError?.message || "AI summarization service temporarily unavailable."
  );
}

/**
 * Generate Structured Summary
 * level: "short" | "medium" | "detailed"
 */
async function generateStructuredSummary(rawText, level = "medium", title = "") {
  const cleaned = cleanText(rawText);
  if (!cleaned || cleaned.length < 30) {
    throw new Error("Study material text is too short to generate a meaningful summary.");
  }

  const chunks = chunkText(cleaned, 2200, 200);
  let chunkSummaries = [];
  let modelUsed = SUMMARIZATION_MODEL;

  // Attempt Hugging Face BART on individual chunks if key is available
  if (HUGGINGFACE_API_KEY) {
    try {
      for (let i = 0; i < Math.min(chunks.length, 5); i++) {
        const chunkSummary = await callHuggingFaceBart(chunks[i], level);
        chunkSummaries.push(chunkSummary);
      }
    } catch (hfErr) {
      console.warn(`[Summarization] Hugging Face Inference error: ${hfErr.message}. Utilizing Gemini architecture.`);
      chunkSummaries = [];
      modelUsed = "gemini-transformer-pipeline";
    }
  } else {
    modelUsed = "gemini-transformer-pipeline";
  }

  const combinedContext =
    chunkSummaries.length > 0
      ? chunkSummaries.join("\n\n")
      : cleaned.slice(0, 32000);

  // Now create the exact required structured sections grounded strictly in the document
  const levelDescriptions = {
    short: "Concise executive overview highlighting only the most vital concepts.",
    medium: "Standard well-rounded summary with balanced key concepts and definitions.",
    detailed: "In-depth comprehensive study summary exploring nuances, examples, and definitions.",
  };

  const prompt = `
You are an expert academic summarization system.
Summarize the following study material at a ${level.toUpperCase()} level (${levelDescriptions[level]}).
Source Title: "${title || "Study Material"}"

Rules:
- MUST be factually accurate and strictly grounded in the provided text.
- Do NOT invent facts or hallucinate external information.
- Return ONLY valid raw JSON with NO markdown code backticks.

Required JSON Structure:
{
  "mainTopic": "Short title of the core subject",
  "introduction": "Clear 2-3 sentence overview introducing the subject and scope",
  "importantConcepts": [
    "Concept 1 explanation",
    "Concept 2 explanation"
  ],
  "keyPoints": [
    "Key takeaway point 1",
    "Key takeaway point 2",
    "Key takeaway point 3"
  ],
  "importantDefinitions": [
    { "term": "Term Name", "definition": "Direct definition from text" }
  ],
  "examples": [
    "Example 1 mentioned in the material",
    "Example 2 mentioned in the material"
  ],
  "conclusion": "Final wrap-up highlighting the overall significance",
  "rawSummary": "A cohesive 2-4 paragraph prose summary suitable for quick revision."
}

Study Material Content:
${combinedContext}
`;

  const geminiResponseText = await callGeminiFallback(prompt);

  let structured;
  try {
    const jsonCleaned = geminiResponseText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const start = jsonCleaned.indexOf("{");
    const end = jsonCleaned.lastIndexOf("}");
    structured = JSON.parse(jsonCleaned.slice(start, end + 1));
  } catch (parseErr) {
    throw new Error("Failed to parse structured summary JSON from AI response.");
  }

  return {
    ...structured,
    summaryLevel: level,
    modelName: modelUsed,
  };
}

module.exports = {
  cleanText,
  chunkText,
  generateStructuredSummary,
};
