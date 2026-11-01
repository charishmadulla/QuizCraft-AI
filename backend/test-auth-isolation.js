require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("./server");
const User = require("./models/User");

async function runAuthIsolationTests() {
  console.log("==================================================");
  console.log("QUIZCRAFT AI - USER ACCESS & ISOLATION TEST SUITE");
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

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Unauthenticated requests should be blocked with 401
    const unauthMaterials = await fetch(`${baseUrl}/api/materials`);
    assert(unauthMaterials.status === 401, "GET /api/materials without token returns 401 Unauthorized");

    const unauthQuizzes = await fetch(`${baseUrl}/api/quizzes/history`);
    assert(unauthQuizzes.status === 401, "GET /api/quizzes/history without token returns 401 Unauthorized");

    const unauthBookmarks = await fetch(`${baseUrl}/api/bookmarks`);
    assert(unauthBookmarks.status === 401, "GET /api/bookmarks without token returns 401 Unauthorized");

    // 2. Register User A
    const timestamp = Date.now();
    const userAEmail = `user_a_${timestamp}@quizcraft.test`;
    const regARes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alice Learner",
        email: userAEmail,
        password: "password123",
      }),
    });
    const regAJson = await regARes.json();
    assert(regARes.status === 201 && Boolean(regAJson.token), "Register User A returns 201 and JWT token");
    const tokenA = regAJson.token;
    const userAId = regAJson.user._id;

    // 3. Register User B
    const userBEmail = `user_b_${timestamp}@quizcraft.test`;
    const regBRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Bob Scholar",
        email: userBEmail,
        password: "password456",
      }),
    });
    const regBJson = await regBRes.json();
    assert(regBRes.status === 201 && Boolean(regBJson.token), "Register User B returns 201 and JWT token");
    const tokenB = regBJson.token;
    const userBId = regBJson.user._id;

    // 4. Test Login with credentials
    const loginARes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userAEmail,
        password: "password123",
      }),
    });
    const loginAJson = await loginARes.json();
    assert(loginARes.status === 200 && Boolean(loginAJson.token), "Login User A returns 200 and valid JWT");

    // Test Login with wrong password
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userAEmail,
        password: "wrongpassword",
      }),
    });
    assert(badLoginRes.status === 401, "Login with incorrect password returns 401 Unauthorized");

    // 5. Test Current User Profile (GET /api/auth/me)
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const meJson = await meRes.json();
    assert(meRes.status === 200 && meJson.user.email === userAEmail, "GET /api/auth/me returns User A details");

    // 6. User A saves a private study note
    const noteARes = await fetch(`${baseUrl}/api/materials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: "Alice Confidential Research Notes",
        sourceType: "pasted_text",
        extractedText: "These are private notes only Alice should be able to view and generate quizzes from.",
      }),
    });
    const noteAJson = await noteARes.json();
    assert(noteARes.status === 201, "User A creates private study material");
    const materialAId = noteAJson.material._id;

    // 7. User B saves a private study note
    const noteBRes = await fetch(`${baseUrl}/api/materials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        title: "Bob Quantum Computing Chapter",
        sourceType: "pasted_text",
        extractedText: "These are private notes only Bob should be able to view.",
      }),
    });
    const noteBJson = await noteBRes.json();
    assert(noteBRes.status === 201, "User B creates private study material");
    const materialBId = noteBJson.material._id;

    // 8. STRICT ISOLATION CHECK: User A lists materials
    const listARes = await fetch(`${baseUrl}/api/materials`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listAJson = await listARes.json();
    const aliceHasAliceNote = listAJson.materials.some((m) => m._id === materialAId);
    const aliceHasBobNote = listAJson.materials.some((m) => m._id === materialBId);
    assert(aliceHasAliceNote, "User A can see their own study material");
    assert(!aliceHasBobNote, "ISOLATION: User A CANNOT see User B's study material");

    // 9. STRICT ISOLATION CHECK: User B lists materials
    const listBRes = await fetch(`${baseUrl}/api/materials`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const listBJson = await listBRes.json();
    const bobHasBobNote = listBJson.materials.some((m) => m._id === materialBId);
    const bobHasAliceNote = listBJson.materials.some((m) => m._id === materialAId);
    assert(bobHasBobNote, "User B can see their own study material");
    assert(!bobHasAliceNote, "ISOLATION: User B CANNOT see User A's study material");

    // 10. Direct access attempt: User B tries to preview User A's material by ID
    const crossAccessRes = await fetch(`${baseUrl}/api/materials/${materialAId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(crossAccessRes.status === 404, "SECURITY: User B direct GET on User A's material is denied (404/Access Denied)");

    // 11. Tamper attempt: User B tries to delete User A's material by ID
    const crossDeleteRes = await fetch(`${baseUrl}/api/materials/${materialAId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(crossDeleteRes.status === 404, "SECURITY: User B cannot delete User A's material");

    // 12. Bookmarks isolation:
    // User A bookmarks a question
    const bmARes = await fetch(`${baseUrl}/api/bookmarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        materialTitle: "Alice Confidential Research Notes",
        question: "What is Alice's primary research topic?",
        options: ["AI", "Robotics", "Physics", "Chemistry"],
        correctAnswer: 0,
        explanation: "AI research",
      }),
    });
    assert(bmARes.status === 201, "User A bookmarks a question");

    // User B checks bookmarks
    const bmBRes = await fetch(`${baseUrl}/api/bookmarks`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const bmBJson = await bmBRes.json();
    assert(bmBJson.bookmarks.length === 0, "ISOLATION: User B has 0 bookmarks (cannot see User A's bookmarks)");

    // Clean up test accounts and materials
    await fetch(`${baseUrl}/api/materials/${materialAId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    await fetch(`${baseUrl}/api/materials/${materialBId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    await User.deleteMany({ _id: { $in: [userAId, userBId] } });

    console.log("==================================================");
    console.log(`TOTAL AUTH & ISOLATION TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log("==================================================");

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("Auth test execution failed:", error);
    server.close();
    process.exit(1);
  }
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    runAuthIsolationTests();
  })
  .catch((err) => {
    console.error("DB error:", err.message);
    process.exit(1);
  });
