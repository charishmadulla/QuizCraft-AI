require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("./server");
const User = require("./models/User");

async function runTestSuite() {
  console.log("==================================================");
  console.log("QUIZCRAFT AI - END-TO-END AUTOMATED VERIFICATION");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Start ephemeral server on random port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200 && healthJson.success === true, "GET /api/health returns 200 and healthy");

    // 2. Register / Login test student
    const testEmail = `test_student_${Date.now()}@quizcraft.ai`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Student",
        email: testEmail,
        password: "password123",
      }),
    });
    const regJson = await regRes.json();
    assert(regRes.status === 201 && Boolean(regJson.token), "Auth: Register student returns JWT token");
    const token = regJson.token;
    const testUserId = regJson.user._id;

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // 3. Save pasted study notes
    const testNoteTitle = `AI Learning Unit - ${Date.now()}`;
    const testNoteText =
      "Supervised learning algorithms build a mathematical model of a set of data that contains both the inputs and the desired outputs. The data is known as training data, and consists of a set of training examples. Unsupervised learning algorithms take a set of data that contains only inputs, and find structure in the data, like grouping or clustering of data points.";

    const saveNoteRes = await fetch(`${baseUrl}/api/materials`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        title: testNoteTitle,
        sourceType: "pasted_text",
        extractedText: testNoteText,
      }),
    });
    const saveNoteJson = await saveNoteRes.json();
    assert(saveNoteRes.status === 201 && saveNoteJson.success === true, "POST /api/materials successfully saves study notes for user");
    const createdMaterialId = saveNoteJson.material._id;
    assert(Boolean(createdMaterialId), "Saved study material has valid MongoDB _id");

    // 4. Fetch materials list (summary view)
    const listRes = await fetch(`${baseUrl}/api/materials`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listJson = await listRes.json();
    assert(listRes.status === 200 && Array.isArray(listJson.materials), "GET /api/materials returns array of materials");
    const foundMaterial = listJson.materials.find((m) => m._id === createdMaterialId);
    assert(Boolean(foundMaterial), "Newly created study material appears in materials list");
    assert(foundMaterial.extractedText === undefined, "Materials list excludes extractedText for performance");

    // 5. Fetch single material with extractedText (preview)
    const previewRes = await fetch(`${baseUrl}/api/materials/${createdMaterialId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const previewJson = await previewRes.json();
    assert(previewRes.status === 200 && previewJson.material?.extractedText === testNoteText, "GET /api/materials/:id retrieves extractedText for preview modal");

    // 6. Rename study material
    const renamedTitle = `${testNoteTitle} (Revised)`;
    const renameRes = await fetch(`${baseUrl}/api/materials/${createdMaterialId}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ title: renamedTitle }),
    });
    const renameJson = await renameRes.json();
    assert(renameRes.status === 200 && renameJson.material?.title === renamedTitle, "PATCH /api/materials/:id renames material");

    // 7. Test both upload routes (/api/materials/upload AND /api/uploads)
    const uploadRouteCheck1 = await fetch(`${baseUrl}/api/materials/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(uploadRouteCheck1.status !== 404, "POST /api/materials/upload route is registered (not 404)");

    const uploadRouteCheck2 = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(uploadRouteCheck2.status !== 404, "POST /api/uploads route is registered (not 404)");

    // 8. Test Quiz Generation with Gemini
    console.log("Calling Gemini API to generate 3 questions...");
    const genRes = await fetch(`${baseUrl}/api/quizzes/generate`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        materialId: createdMaterialId,
        questionCount: 3,
        difficulty: "easy",
        questionType: "multiple_choice",
      }),
    });
    const genJson = await genRes.json();
    assert(genRes.status === 201 && genJson.success === true, "POST /api/quizzes/generate returns 201 and success");
    assert(Boolean(genJson.quizId), "Quiz contains valid quizId");
    assert(Array.isArray(genJson.questions) && genJson.questions.length === 3, "Quiz contains exactly 3 generated questions");

    // Security check: ensure answer key and explanation are NOT in quiz taking response
    const firstQ = genJson.questions[0];
    assert(firstQ.correctAnswer === undefined, "SECURITY: correctAnswer is NOT exposed in quiz generation response");
    assert(firstQ.explanation === undefined, "SECURITY: explanation is NOT exposed in quiz generation response");
    assert(Array.isArray(firstQ.options) && firstQ.options.length >= 2, "Question has valid options array");

    // 9. Test Quiz Taking GET /:id (answers still hidden)
    const getQuizRes = await fetch(`${baseUrl}/api/quizzes/${genJson.quizId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getQuizJson = await getQuizRes.json();
    assert(getQuizRes.status === 200, "GET /api/quizzes/:id returns 200");
    assert(getQuizJson.questions[0].correctAnswer === undefined, "SECURITY: GET /api/quizzes/:id does NOT expose answers");

    // 10. Test Quiz Submission (grading & attempt creation)
    const submitRes = await fetch(`${baseUrl}/api/quizzes/submit`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        quizId: genJson.quizId,
        answers: [0, 1, 0],
        timeTaken: 42,
        autoSubmit: false,
      }),
    });
    const submitJson = await submitRes.json();
    assert(submitRes.status === 200 && submitJson.success === true, "POST /api/quizzes/submit successfully grades quiz");
    assert(submitJson.score !== undefined && submitJson.percentage !== undefined, "Submission returns calculated score and percentage");
    assert(Array.isArray(submitJson.results) && submitJson.results.length === 3, "Submission returns detailed results array");
    assert(submitJson.results[0].explanation !== undefined, "Submission provides explanations after completion");
    assert(Boolean(submitJson.attemptId), "Submission creates a dedicated QuizAttempt with attemptId");

    const createdAttemptId = submitJson.attemptId;

    // 11. Test Quiz History
    const historyRes = await fetch(`${baseUrl}/api/quizzes/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const historyJson = await historyRes.json();
    assert(historyRes.status === 200 && Array.isArray(historyJson.attempts), "GET /api/quizzes/history returns attempts array");
    const foundAttempt = historyJson.attempts.find((a) => a.attemptId === createdAttemptId);
    assert(Boolean(foundAttempt), "Completed attempt appears in history");

    // 12. Test Fetch Single Attempt By ID
    const getAttemptRes = await fetch(`${baseUrl}/api/quizzes/attempts/${createdAttemptId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getAttemptJson = await getAttemptRes.json();
    assert(getAttemptRes.status === 200 && getAttemptJson.success === true, "GET /api/quizzes/attempts/:id retrieves full attempt review");
    assert(Array.isArray(getAttemptJson.attempt.results), "Attempt contains full question-by-question review results");

    // 13. Test Bookmarking
    const bookmarkRes = await fetch(`${baseUrl}/api/bookmarks`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        quizId: genJson.quizId,
        materialTitle: renamedTitle,
        difficulty: "easy",
        question: firstQ.question,
        options: firstQ.options,
        correctAnswer: 0,
        explanation: "Supervised learning builds a model with inputs and desired outputs.",
        questionType: "multiple_choice",
      }),
    });
    const bookmarkJson = await bookmarkRes.json();
    assert(bookmarkRes.status === 201 && bookmarkJson.success === true, "POST /api/bookmarks successfully bookmarks a question");
    const bookmarkId = bookmarkJson.bookmark._id;

    // Fetch bookmarks
    const getBookmarksRes = await fetch(`${baseUrl}/api/bookmarks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getBookmarksJson = await getBookmarksRes.json();
    assert(getBookmarksRes.status === 200 && getBookmarksJson.bookmarks.some((b) => b._id === bookmarkId), "GET /api/bookmarks lists the bookmarked question");

    // Remove bookmark
    const deleteBookmarkRes = await fetch(`${baseUrl}/api/bookmarks/${bookmarkId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(deleteBookmarkRes.status === 200, "DELETE /api/bookmarks/:id successfully deletes bookmark");

    // 14. Clean up test material & user
    await fetch(`${baseUrl}/api/materials/${createdMaterialId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await User.findByIdAndDelete(testUserId);

    console.log("==================================================");
    console.log(`TOTAL TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log("==================================================");

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("Test execution failed with exception:", error);
    server.close();
    process.exit(1);
  }
}

mongoose
  .connect((process.env.MONGODB_URI || process.env.MONGO_URI))
  .then(() => {
    runTestSuite();
  })
  .catch((err) => {
    console.error("DB connection error:", err.message);
    process.exit(1);
  });
