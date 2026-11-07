const { GoogleGenAI } = require("@google/genai");

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

async function callGemini(prompt) {
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
      console.warn(`[Visual Learning] ${model} failed, trying next...`);
    }
  }

  throw new Error(lastError?.message || "Visual learning generation service failed.");
}

function parseJSON(text) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Invalid JSON response from AI.");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

/**
 * Generate Simplified Explanation for the document or a specific sub-topic / paragraph
 */
async function generateSimplifiedExplanation(rawText, topicOrParagraph = "") {
  const prompt = `
You are an expert tutor skilled in the Feynman Technique (explaining complex concepts in plain, intuitive English).
${topicOrParagraph ? `Focus specifically on this selected topic/paragraph: "${topicOrParagraph}"` : "Explain the core concepts of this study material."}

Rules:
- Preserve the exact factual truth and core meaning of the original material.
- Translate dense academic/technical jargon into clear, relatable language.
- Provide simple, relatable real-world analogies supported by the text.
- Create a technical glossary explaining essential vocabulary.
- Return ONLY valid raw JSON with NO markdown code backticks.

Required JSON Structure:
{
  "simplifiedText": "Clear, accessible 2-4 paragraph explanation written in easy-to-understand conversational language.",
  "analogies": [
    "Simple real-world analogy 1 that explains a difficult mechanism",
    "Simple real-world analogy 2"
  ],
  "technicalGlossary": [
    {
      "term": "Technical Term",
      "simpleExplanation": "Plain English meaning in 1 sentence"
    }
  ],
  "keyTakeaways": [
    "Simple takeaway 1",
    "Simple takeaway 2",
    "Simple takeaway 3"
  ]
}

Study Material:
${rawText.slice(0, 30000)}
`;

  const responseText = await callGemini(prompt);
  return parseJSON(responseText);
}

/**
 * Generate Visual Learning Assets: Mind Map, Flowchart, Comparison Tables, Numerical Charts, Flashcards
 */
async function generateVisualLearning(rawText, title = "") {
  const prompt = `
You are an expert educational data visualizer and instructional designer.
Analyze the following study material and generate structured visual learning data structures.
Title: "${title || "Study Material"}"

STRICT RULES:
1. Mind Map:
   - Root node at the center representing the main topic.
   - 3 to 6 major branches connecting to root.
   - 2 to 4 subtopics for each branch.
   - Include clear relationships ("edges") connecting parent and children.
2. Flowchart:
   - Identify sequential processes, lifecycle steps, algorithms, or historical progressions in the text.
   - Include 'start', 'process', 'decision' (if conditional logic exists), and 'end' nodes.
   - Number the steps sequentially with explicit 'nextStepId'.
3. Comparison Tables:
   - Identify contrasting concepts, techniques, or theories mentioned in the text (e.g. Advantages vs Disadvantages, Approach A vs Approach B, or Category comparisons).
   - If multiple concepts exist, create 1 to 2 comparison tables with clear headers and row matrices.
4. Charts and Graphs (CRITICAL NUMERICAL DATA RULE):
   - Inspect the text for ACTUAL NUMERICAL METRICS, percentages, quantities, years, or statistics.
   - NEVER invent or fake numbers.
   - If the material contains legitimate quantitative data, set "hasNumericalData": true and format a suitable "bar", "pie", or "line" chart with exact numbers, units, and descriptions.
   - If NO real numerical data is present, set "hasNumericalData": false, "charts": [], and provide a clear message: "This study material is conceptual and does not contain quantitative numerical data for statistical charts."
5. Flashcards & Formulas:
   - Create 6 to 12 high-yield study flashcards with front (question/prompt) and back (answer/key concept).
   - Extract important formulas (or say "None in this text" if non-mathematical) and verified key facts.

Return ONLY valid raw JSON with NO markdown code backticks.

Required JSON Structure:
{
  "mindMapData": {
    "topic": "Main Topic Title",
    "nodes": [
      { "id": "root", "label": "Main Topic", "type": "root", "parentId": null, "description": "Core theme" },
      { "id": "b1", "label": "Branch 1", "type": "branch", "parentId": "root", "description": "Branch explanation" },
      { "id": "s1", "label": "Subtopic 1.1", "type": "subtopic", "parentId": "b1", "description": "Subtopic detail" }
    ],
    "edges": [
      { "from": "root", "to": "b1", "relation": "encompasses" },
      { "from": "b1", "to": "s1", "relation": "includes" }
    ]
  },
  "flowchartData": {
    "title": "Process / Workflow Name",
    "steps": [
      { "id": "step-1", "stepNumber": 1, "type": "start", "label": "Initial Step", "description": "What initiates the process", "nextStepId": "step-2", "condition": null },
      { "id": "step-2", "stepNumber": 2, "type": "process", "label": "Execution Step", "description": "Action performed", "nextStepId": "step-3", "condition": null },
      { "id": "step-3", "stepNumber": 3, "type": "end", "label": "Completed Output", "description": "Outcome reached", "nextStepId": null, "condition": null }
    ]
  },
  "comparisonTables": [
    {
      "title": "Comparison Title",
      "headers": ["Feature / Aspect", "Concept A", "Concept B"],
      "rows": [
        ["Definition", "...", "..."],
        ["Key Strength", "...", "..."]
      ]
    }
  ],
  "chartsData": {
    "hasNumericalData": true,
    "message": "Explanation of chart relevance",
    "charts": [
      {
        "title": "Distribution of Categories",
        "type": "bar",
        "xAxisLabel": "Category",
        "yAxisLabel": "Percentage (%)",
        "unit": "%",
        "description": "Chart based on figures cited in text",
        "dataPoints": [
          { "label": "Item A", "value": 45 },
          { "label": "Item B", "value": 30 }
        ]
      }
    ]
  },
  "flashcards": [
    { "front": "What is ...?", "back": "Direct answer derived from text", "category": "concept" }
  ],
  "importantFormulas": [
    { "name": "Formula Name", "formula": "E = mc^2", "explanation": "Brief context" }
  ],
  "importantFacts": [
    "High-yield fact 1",
    "High-yield fact 2"
  ]
}

Study Material:
${rawText.slice(0, 30000)}
`;

  const responseText = await callGemini(prompt);
  return parseJSON(responseText);
}

module.exports = {
  generateSimplifiedExplanation,
  generateVisualLearning,
};
