import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

// Attach JWT token to all requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("quizcraft_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login/register endpoints
      const url = error.config?.url || "";
      if (!url.includes("/auth/login") && !url.includes("/auth/register")) {
        localStorage.removeItem("quizcraft_token");
        localStorage.removeItem("quizcraft_user");
        window.dispatchEvent(new Event("quizcraft_auth_expired"));
      }
    }
    return Promise.reject(error);
  }
);

// --------------------------------------------------
// Error handling
// --------------------------------------------------

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  "Something went wrong. Please try again.";

const handleApiError = (error) => {
  console.error("API request failed:", error);
  if (error.response) {
    throw error;
  }
  throw new Error(getErrorMessage(error));
};

// --------------------------------------------------
// Authentication API
// --------------------------------------------------

export const registerUser = async ({ name, email, password }) => {
  try {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const loginUser = async ({ email, password }) => {
  try {
    const response = await api.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.put("/auth/profile", profileData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// --------------------------------------------------
// Study materials
// --------------------------------------------------

export const getMaterials = async () => {
  try {
    const response = await api.get("/materials");
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getMaterialById = async (materialId) => {
  try {
    const response = await api.get(`/materials/${materialId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const saveMaterial = async (materialData) => {
  try {
    const response = await api.post("/materials", materialData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const createMaterial = saveMaterial;

export const uploadDocument = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/materials/upload", formData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const uploadMaterial = async (formData) => {
  try {
    const response = await api.post("/materials/upload", formData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const renameMaterial = async (materialId, title) => {
  try {
    const response = await api.patch(`/materials/${materialId}`, { title });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteMaterial = async (materialId) => {
  try {
    const response = await api.delete(`/materials/${materialId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// --------------------------------------------------
// Quiz generation
// --------------------------------------------------

export const generateQuiz = async ({
  materialId,
  questionCount = 5,
  difficulty = "medium",
  questionType = "multiple_choice",
}) => {
  try {
    const response = await api.post("/quizzes/generate", {
      materialId,
      questionCount: Number(questionCount),
      difficulty,
      questionType,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// --------------------------------------------------
// Quiz submission
// --------------------------------------------------

export const submitQuiz = async ({
  quizId,
  answers,
  timeTaken = 0,
  autoSubmit = false,
}) => {
  try {
    if (!quizId) {
      throw new Error("Quiz ID is missing. Please generate a new quiz.");
    }

    if (!Array.isArray(answers)) {
      throw new Error("Quiz answers must be an array.");
    }

    const normalizedAnswers = answers.map((answer) => {
      if (answer === null || answer === undefined || answer === "") {
        return null;
      }
      const value = Number(answer);
      if (!Number.isInteger(value) || value < 0) {
        throw new Error("An answer contains an invalid option.");
      }
      return value;
    });

    const shouldAutoSubmit =
      Boolean(autoSubmit) ||
      normalizedAnswers.some((answer) => answer === null);

    const response = await api.post("/quizzes/submit", {
      quizId,
      answers: normalizedAnswers,
      timeTaken: Number(timeTaken) || 0,
      autoSubmit: shouldAutoSubmit,
    });

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// --------------------------------------------------
// Quiz history & attempts
// --------------------------------------------------

export const getQuizHistory = async () => {
  try {
    const response = await api.get("/quizzes/history");
    const data = response.data;
    const attempts = Array.isArray(data)
      ? data
      : Array.isArray(data.attempts)
      ? data.attempts
      : [];
    return { ...(!Array.isArray(data) ? data : {}), attempts };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getQuizAttemptById = async (attemptId) => {
  try {
    const response = await api.get(`/quizzes/attempts/${attemptId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getQuizById = async (quizId) => {
  try {
    const response = await api.get(`/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const loadQuizHistory = getQuizHistory;
export const getQuizAttempts = getQuizHistory;

// --------------------------------------------------
// Bookmarks
// --------------------------------------------------

export const getBookmarks = async (params = {}) => {
  try {
    const response = await api.get("/bookmarks", { params });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const addBookmark = async (bookmarkData) => {
  try {
    const response = await api.post("/bookmarks", {
      ...bookmarkData,
      correctAnswer: Number(bookmarkData.correctAnswer) || 0,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const removeBookmark = async (bookmarkId) => {
  try {
    const response = await api.delete(`/bookmarks/${bookmarkId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const removeBookmarkByQuestion = async (question, quizId) => {
  try {
    const response = await api.post("/bookmarks/remove-by-question", {
      question,
      quizId,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export default api;
