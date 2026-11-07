const http = require("http");
const mongoose = require("mongoose");
const app = require("./server");
const User = require("./models/User");

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function run() {
  console.log("==================================================");
  console.log("TESTING UPGRADED SUITE: SMART STUDIO & ML PIPELINE");
  console.log("==================================================");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Register test user
    const email = `upgrade_test_${Date.now()}@quizcraft.ai`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "ML Learner", email, password: "password123" }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, "Auth registration succeeds");
    const token = regData.token;
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // 2. Save study material with sample scientific data
    const matRes = await fetch(`${baseUrl}/api/materials`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        title: "Photosynthesis and Light Reactions",
        sourceType: "pasted_text",
        extractedText: `Photosynthesis is the biological process by which green plants, algae, and cyanobacteria convert light energy into chemical energy stored in glucose. The process occurs in two main stages: the light-dependent reactions taking place in the thylakoid membrane, and the light-independent Calvin cycle taking place in the stroma of chloroplasts. In the light-dependent reactions, chlorophyll a absorbs photons at 680 nm (Photosystem II) and 700 nm (Photosystem I). Water photolysis produces oxygen gas (O2), protons (H+), and electrons. ATP synthase utilizes proton gradients to generate ATP with 38% quantum efficiency. Globally, photosynthesis captures 130 terawatts of solar energy annually and converts 115 billion metric tons of carbon biomass each year.`,
      }),
    });
    const matData = await matRes.json();
    assert(matRes.status === 201, "Study material created");
    const materialId = matData.material._id;

    // 3. Test Structured Summarization
    console.log("Testing Summarization Service...");
    const sumRes = await fetch(`${baseUrl}/api/summaries/generate`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ materialId, summaryLevel: "medium" }),
    });
    const sumData = await sumRes.json();
    assert(sumRes.status === 201, "Summary generated successfully");
    assert(Boolean(sumData.summary.mainTopic), "Summary includes mainTopic");
    assert(Array.isArray(sumData.summary.keyPoints) && sumData.summary.keyPoints.length > 0, "Summary includes keyPoints");
    assert(Array.isArray(sumData.summary.importantDefinitions), "Summary includes importantDefinitions");

    // 4. Test List Summaries
    const listSumRes = await fetch(`${baseUrl}/api/summaries`, {
      headers: authHeaders,
    });
    const listSumData = await listSumRes.json();
    assert(listSumRes.status === 200, "GET /api/summaries returns 200");
    assert(listSumData.summaries.length >= 1, "User summaries listed");

    // 5. Test Simplified Explanation
    console.log("Testing Simplification Service...");
    const simpRes = await fetch(`${baseUrl}/api/learning/simplify`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ materialId, topicOrParagraph: "Light-dependent reactions" }),
    });
    const simpData = await simpRes.json();
    assert(simpRes.status === 200, "Simplified explanation generated");
    assert(Boolean(simpData.simplifiedExplanation.simplifiedText), "Simplified text present");
    assert(Array.isArray(simpData.simplifiedExplanation.technicalGlossary), "Technical glossary present");

    // 6. Test Visual Learning Generation (Mind map, Flowchart, Comparison, Charts, Flashcards)
    console.log("Testing Visual Learning Generation...");
    const visRes = await fetch(`${baseUrl}/api/learning/visualize`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ materialId }),
    });
    const visData = await visRes.json();
    assert(visRes.status === 200, "Visual learning assets generated");
    assert(Boolean(visData.data.mindMapData.topic), "Mind map data includes topic");
    assert(Array.isArray(visData.data.flowchartData.steps), "Flowchart steps present");
    assert(Array.isArray(visData.data.flashcards) && visData.data.flashcards.length > 0, "Flashcards generated");
    assert(visData.data.chartsData.hasNumericalData === true, "Accurately detected numerical data in source text");

    // 7. Test Performance Intelligence (Cold Start)
    const perfColdRes = await fetch(`${baseUrl}/api/performance/overview`, {
      headers: authHeaders,
    });
    const perfColdData = await perfColdRes.json();
    assert(perfColdRes.status === 200, "Performance overview returns 200");
    assert(perfColdData.performance.totalAttempts === 0, "Proper cold-start 0 attempts state");

    // 8. Test ML Prediction (Cold Start)
    const predColdRes = await fetch(`${baseUrl}/api/predictions/predict`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ targetDifficulty: 2 }),
    });
    const predColdData = await predColdRes.json();
    assert(predColdRes.status === 200, "Prediction endpoint returns 200");
    assert(predColdData.isColdStart === true, "Honest cold-start notice returned when < 2 attempts");

    // 9. Submit 2 synthetic completed quizzes to test Performance & ML Forecast
    console.log("Generating and submitting 2 quizzes to test Performance & ML pipelines...");
    const quiz1Res = await fetch(`${baseUrl}/api/quizzes/generate`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ materialId, questionCount: 3, difficulty: "medium" }),
    });
    const quiz1Data = await quiz1Res.json();
    assert(quiz1Res.status === 201, "Quiz 1 generated with topic tags");

    // Submit quiz 1
    const sub1Res = await fetch(`${baseUrl}/api/quizzes/submit`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        quizId: quiz1Data.quizId,
        answers: [0, 1, 0],
        timeTaken: 65,
        autoSubmit: false,
      }),
    });
    const sub1Data = await sub1Res.json();
    assert(sub1Res.status === 200, "Quiz 1 submitted");
    assert(Array.isArray(sub1Data.topicPerformance), "Submission response includes topicPerformance breakdown");

    // Generate and submit quiz 2
    const quiz2Res = await fetch(`${baseUrl}/api/quizzes/generate`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ materialId, questionCount: 3, difficulty: "easy" }),
    });
    const quiz2Data = await quiz2Res.json();
    await fetch(`${baseUrl}/api/quizzes/submit`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        quizId: quiz2Data.quizId,
        answers: [0, 0, 0],
        timeTaken: 50,
        autoSubmit: false,
      }),
    });

    // 10. Test Performance Overview with Data
    const perfWarmRes = await fetch(`${baseUrl}/api/performance/overview`, {
      headers: authHeaders,
    });
    const perfWarmData = await perfWarmRes.json();
    assert(perfWarmData.performance.totalAttempts === 2, "Performance reports 2 total attempts");
    assert(perfWarmData.performance.averagePercentage > 0, "Calculates non-zero average score");

    // 11. Test Recommendations
    const recRes = await fetch(`${baseUrl}/api/performance/recommendations`, {
      headers: authHeaders,
    });
    const recData = await recRes.json();
    assert(recRes.status === 200, "Recommendations endpoint returns 200");
    assert(Array.isArray(recData.recommendations) && recData.recommendations.length > 0, "Personalized recommendations returned");

    // 12. Test ML Prediction with Historical Data
    console.log("Testing ML Prediction with real historical attempts...");
    const predWarmRes = await fetch(`${baseUrl}/api/predictions/predict`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ targetDifficulty: 2 }),
    });
    const predWarmData = await predWarmRes.json();
    assert(predWarmData.isColdStart === false, "Prediction generated (not cold-start)");
    assert(typeof predWarmData.prediction.predictedScore === "number", "Predicted score is a valid number");
    assert(Boolean(predWarmData.prediction.readinessTier), "Prediction includes readiness tier");

    // 13. Test Model Info Endpoint
    const modelInfoRes = await fetch(`${baseUrl}/api/predictions/model-info`, {
      headers: authHeaders,
    });
    const modelInfoData = await modelInfoRes.json();
    assert(modelInfoRes.status === 200, "Model-info returns 200");
    assert(Boolean(modelInfoData.modelInfo.modelVersion), "Model info includes version");

    console.log("==================================================");
    console.log("ALL 13 UPGRADED BACKEND & ML SUITE TESTS PASSED!");
    console.log("==================================================");
    server.close();
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    server.close();
    process.exit(1);
  }
}

const connectDB = require("./config/db"); connectDB().then(run);


