import { useState } from "react";
import axios from "axios";
import "./App.css";

// ==========================================
// LIVE BACKEND URL
// ==========================================

const BACKEND_URL =
  "https://ai-interview-accelerator-backend.onrender.com";


function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [message, setMessage] = useState("");

  const [analysis, setAnalysis] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submittedAnswer, setSubmittedAnswer] = useState("");

  const [evaluation, setEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [scores, setScores] = useState([]);

  // PDF UPLOAD STATE
  const [uploading, setUploading] = useState(false);


  // =========================
  // CHECK BACKEND
  // =========================

  const checkBackend = async () => {
    try {
      const response = await axios.get(
  "https://ai-interview-accelerator-backend.onrender.com/health"
);

      setMessage(`Backend: ${response.data.status}`);
    } catch (error) {
      console.error(error);
      setMessage("Backend connection failed");
    }
  };


  // =========================
  // UPLOAD RESUME PDF
  // =========================

  const uploadResume = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    console.log("Selected file:", file);
    console.log("File name:", file.name);
    console.log("File type:", file.type);

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setMessage("Please upload a PDF file only.");
      return;
    }

    try {
      setUploading(true);

      setMessage(
        "📄 Uploading and reading your resume..."
      );

      const formData = new FormData();

      formData.append("file", file);

      const response = await axios.post(
        "https://ai-interview-accelerator-backend.onrender.com/upload-resume",
      );

      console.log(
        "Upload response:",
        response.data
      );

      if (response.data.resume_text) {

        setResume(
          response.data.resume_text
        );

        setMessage(
          `✅ ${file.name} uploaded successfully! Resume text extracted.`
        );

      } else {

        setMessage(
          response.data.message ||
          "Could not extract resume text."
        );
      }

    } catch (error) {

      console.error(
        "PDF upload error:",
        error
      );

      if (error.response) {

        console.error(
          "Backend response:",
          error.response.data
        );

        setMessage(
          `❌ Upload failed: ${
            error.response.data.detail ||
            error.response.data.message ||
            "Backend error"
          }`
        );

      } else if (error.request) {

        setMessage(
          "❌ Cannot connect to FastAPI backend."
        );

      } else {

        setMessage(
          "❌ PDF upload failed."
        );
      }

    } finally {

      setUploading(false);

      event.target.value = "";
    }
  };


  // =========================
  // ANALYZE RESUME
  // =========================

  const analyzeResume = async () => {

    if (
      !jobDescription.trim() ||
      !resume.trim()
    ) {

      setMessage(
        "Please enter both Job Description and Resume."
      );

      return;
    }

    try {

      const response = await axios.post(
        "https://ai-interview-accelerator-backend.onrender.com/analyze",
        {
          job_description: jobDescription,
          resume: resume,
        }
      );

      setAnalysis(response.data);

      setMessage(
        "Analysis completed successfully!"
      );

      setCurrentQuestion(0);
      setAnswer("");
      setSubmittedAnswer("");
      setEvaluation(null);
      setScores([]);

    } catch (error) {

      console.error(error);

      setMessage(
        "Analysis failed. Please check the backend."
      );
    }
  };


  // =========================
  // SUBMIT ANSWER
  // =========================

  const submitAnswer = async () => {

    if (!answer.trim()) {

      setMessage(
        "Please write an answer first."
      );

      return;
    }

    if (
      !analysis ||
      !analysis.interview_questions ||
      !analysis.interview_questions[currentQuestion]
    ) {

      setMessage(
        "Interview question not found."
      );

      return;
    }

    try {

      setEvaluating(true);

      setMessage("");

      const question =
        analysis.interview_questions[
          currentQuestion
        ];

      const response = await axios.post(
        "https://ai-interview-accelerator-backend.onrender.com/evaluate-answer",
        {
          question: question,
          answer: answer,
          job_description: jobDescription,
          resume: resume,
        }
      );

      setSubmittedAnswer(answer);

      setEvaluation(
        response.data
      );

      // Save score for this question
      setScores((previousScores) => {

        const updatedScores = [
          ...previousScores
        ];

        updatedScores[currentQuestion] =
          response.data.score;

        return updatedScores;
      });

      setMessage(
        "Answer evaluated successfully!"
      );

    } catch (error) {

      console.error(error);

      setMessage(
        "Answer evaluation failed. Please check the backend."
      );

    } finally {

      setEvaluating(false);
    }
  };


  // =========================
  // NEXT QUESTION
  // =========================

  const nextQuestion = () => {

    if (
      analysis &&
      analysis.interview_questions &&
      currentQuestion <
        analysis.interview_questions.length - 1
    ) {

      setCurrentQuestion(
        currentQuestion + 1
      );

      setAnswer("");
      setSubmittedAnswer("");
      setEvaluation(null);
      setMessage("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };


  // =========================
  // MATCH SCORE
  // =========================

  const matchingSkills =
    analysis?.matching_skills || [];

  const skillsToImprove =
    analysis?.skills_to_improve ||
    analysis?.missing_skills ||
    [];

  const totalSkills =
    matchingSkills.length +
    skillsToImprove.length;

  const calculatedScore =
    totalSkills > 0
      ? Math.round(
          (matchingSkills.length /
            totalSkills) *
            100
        )
      : 0;

  const matchScore =
    analysis?.match_score ??
    analysis?.match_percentage ??
    calculatedScore;


  // =========================
  // QUESTIONS
  // =========================

  const totalQuestions =
    analysis?.interview_questions?.length ||
    0;

  const progress =
    totalQuestions > 0
      ? Math.round(
          ((currentQuestion + 1) /
            totalQuestions) *
            100
        )
      : 0;


  // =========================
  // INTERVIEW SCORE DATA
  // =========================

  const answeredScores =
    scores.filter(
      (score) =>
        typeof score === "number"
    );

  const questionsAnswered =
    answeredScores.length;

  const averageScore =
    questionsAnswered > 0
      ? (
          answeredScores.reduce(
            (total, score) =>
              total + score,
            0
          ) / questionsAnswered
        ).toFixed(1)
      : 0;

  const bestScore =
    questionsAnswered > 0
      ? Math.max(
          ...answeredScores
        )
      : 0;

  const lowestScore =
    questionsAnswered > 0
      ? Math.min(
          ...answeredScores
        )
      : 0;


  return (

    <div className="app">

      <section className="hero">

        {/* =========================
            HERO
        ========================= */}

        <p className="badge">
          🚀 AI INTERVIEW ACCELERATOR
        </p>

        <h1>
          Prepare smarter.
          <br />
          <span>
            Ace your interview.
          </span>
        </h1>

        <p className="subtitle">
          Analyze your resume against any job
          description and practice with a
          personalized AI-powered interview.
        </p>


        {/* =========================
            INPUT SECTION
        ========================= */}

        <div className="form-grid">

          {/* JOB DESCRIPTION */}

          <div className="card">

            <h2>
              01
            </h2>

            <h2>
              Job Description
            </h2>

            <p>
              Paste the job description you are
              applying for.
            </p>

            <textarea
              placeholder="Paste Job Description here..."
              value={jobDescription}
              onChange={(e) =>
                setJobDescription(
                  e.target.value
                )
              }
            />

            <p>
              {jobDescription.length}
              {" "}characters
            </p>

          </div>


          {/* RESUME */}

          <div className="card">

            <h2>
              02
            </h2>

            <h2>
              Resume
            </h2>

            <p>
              Upload your resume PDF or paste
              your resume manually.
            </p>


            {/* PDF UPLOAD */}

            <div className="upload-section">

              <label htmlFor="resume-upload">
                📄 Upload Resume PDF
              </label>

              <input
                id="resume-upload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={uploadResume}
                disabled={uploading}
              />

            </div>


            <p>
              OR paste your resume below:
            </p>

            <textarea
              placeholder="Paste your resume here..."
              value={resume}
              onChange={(e) =>
                setResume(
                  e.target.value
                )
              }
            />

            <p>
              {resume.length}
              {" "}characters
            </p>

          </div>

        </div>


        {/* =========================
            BUTTONS
        ========================= */}

        <div className="button-container">

          <button
            onClick={checkBackend}
          >
            🔌 Check Backend
          </button>

          <button
            onClick={analyzeResume}
            disabled={uploading}
          >
            ✨ Analyze Resume
          </button>

        </div>


        {/* =========================
            MESSAGE
        ========================= */}

        {message && (

          <p className="status">
            {message}
          </p>

        )}


        {/* =========================
            ANALYSIS
        ========================= */}

        {analysis && (

          <div className="analysis">

            <p className="badge">
              YOUR ANALYSIS
            </p>

            <h1>
              Resume Match Report
            </h1>

            <p>
              Here's how well your resume
              matches the selected job.
            </p>


            {/* =========================
                SUMMARY CARDS
            ========================= */}

            <div className="summary-grid">

              <div className="summary-card">

                <span>
                  🎯
                </span>

                <p>
                  Match Score
                </p>

                <strong>
                  {matchScore}%
                </strong>

              </div>


              <div className="summary-card">

                <span>
                  💼
                </span>

                <p>
                  Matching Skills
                </p>

                <strong>
                  {matchingSkills.length}
                </strong>

              </div>


              <div className="summary-card">

                <span>
                  📚
                </span>

                <p>
                  Skills to Improve
                </p>

                <strong>
                  {skillsToImprove.length}
                </strong>

              </div>

            </div>


            {/* =========================
                MATCHING SKILLS
            ========================= */}

            <div className="result-card">

              <h2>
                ✅ Matching Skills
              </h2>

              <p>
                Skills found in both the role
                and your resume.
              </p>

              <div className="skill-list">

                {matchingSkills.length > 0 ? (

                  matchingSkills.map(
                    (skill, index) => (

                      <span
                        className="skill-badge"
                        key={index}
                      >
                        ✓ {skill}
                      </span>

                    )
                  )

                ) : (

                  <p>
                    No matching skills found.
                  </p>

                )}

              </div>

            </div>


            {/* =========================
                SKILLS TO IMPROVE
            ========================= */}

            <div className="result-card">

              <h2>
                📚 Skills to Improve
              </h2>

              <p>
                Skills from the job description
                that are missing from your resume.
              </p>

              <div className="skill-list">

                {skillsToImprove.length > 0 ? (

                  skillsToImprove.map(
                    (skill, index) => (

                      <span
                        className="improve-badge"
                        key={index}
                      >
                        + {skill}
                      </span>

                    )
                  )

                ) : (

                  <p>
                    🎉 No major skill gaps detected.
                  </p>

                )}

              </div>

            </div>


            {/* =========================
                INTERVIEW
            ========================= */}

            {totalQuestions > 0 && (

              <div className="interview-section">

                <p className="badge">
                  🤖 AI MOCK INTERVIEW
                </p>

                <h1>
                  Personalized Interview
                </h1>

                <p>
                  Answer each question and receive
                  instant AI feedback.
                </p>


                {/* PROGRESS */}

                <div className="progress-container">

                  <div className="progress-info">

                    <span>
                      Question{" "}
                      {currentQuestion + 1}
                      {" "}of{" "}
                      {totalQuestions}
                    </span>

                    <span>
                      {progress}%
                    </span>

                  </div>

                  <div className="progress-bar">

                    <div
                      className="progress-fill"
                      style={{
                        width:
                          `${progress}%`,
                      }}
                    />

                  </div>

                </div>


                {/* QUESTION */}

                <div className="question-card">

                  <p className="question-label">
                    QUESTION{" "}
                    {currentQuestion + 1}
                  </p>

                  <h2>
                    {
                      analysis
                        .interview_questions[
                          currentQuestion
                        ]
                    }
                  </h2>


                  {/* ANSWER */}

                  <textarea
                    placeholder="Type your answer here..."
                    value={answer}
                    onChange={(e) =>
                      setAnswer(
                        e.target.value
                      )
                    }
                  />

                  <p>
                    {answer.length}
                    {" "}characters
                  </p>


                  {/* SUBMIT */}

                  <button
                    onClick={submitAnswer}
                    disabled={evaluating}
                  >
                    {evaluating
                      ? "🤖 Evaluating..."
                      : "Submit Answer →"}
                  </button>

                </div>


                {/* =========================
                    ANSWER RESULT
                ========================= */}

                {submittedAnswer && (

                  <div className="answer-result">

                    <h2>
                      Your Answer
                    </h2>

                    <p>
                      {submittedAnswer}
                    </p>


                    {/* =========================
                        EVALUATION
                    ========================= */}

                    {evaluation && (

                      <div className="evaluation">

                        <p className="badge">
                          AI EVALUATION
                        </p>

                        <h2>
                          Interview Performance
                        </h2>


                        {/* SCORE */}

                        <div className="evaluation-score">

                          <strong>
                            {evaluation.score}/10
                          </strong>

                          <span>
                            Overall Score
                          </span>

                        </div>


                        {/* STRENGTHS */}

                        <h3>
                          💪 Strengths
                        </h3>

                        <ul>

                          {evaluation.strengths &&
                            evaluation.strengths.map(
                              (item, index) => (

                                <li key={index}>
                                  {item}
                                </li>

                              )
                            )}

                        </ul>


                        {/* IMPROVEMENTS */}

                        <h3>
                          📈 Areas to Improve
                        </h3>

                        <ul>

                          {evaluation.improvements &&
                            evaluation.improvements.map(
                              (item, index) => (

                                <li key={index}>
                                  {item}
                                </li>

                              )
                            )}

                        </ul>


                        {/* FEEDBACK */}

                        <h3>
                          🤖 AI Feedback
                        </h3>

                        <p>
                          {evaluation.feedback}
                        </p>


                        {/* DETAILED EVALUATION */}

                        <div className="evaluation-details">

                          <div className="evaluation-detail-card">

                            <span>
                              🎯
                            </span>

                            <p>
                              Job Relevance
                            </p>

                            <strong>
                              {
                                evaluation.job_relevance ||
                                "Not available"
                              }
                            </strong>

                          </div>


                          <div className="evaluation-detail-card">

                            <span>
                              💻
                            </span>

                            <p>
                              Technical Relevance
                            </p>

                            <strong>
                              {
                                evaluation.technical_relevance ||
                                "Not available"
                              }
                            </strong>

                          </div>


                          <div className="evaluation-detail-card">

                            <span>
                              📄
                            </span>

                            <p>
                              Resume Connection
                            </p>

                            <strong>
                              {
                                evaluation.resume_connection ||
                                "Not available"
                              }
                            </strong>

                          </div>


                          <div className="evaluation-detail-card">

                            <span>
                              ⭐
                            </span>

                            <p>
                              STAR Score
                            </p>

                            <strong>
                              {
                                evaluation.star_score ??
                                0
                              }/4
                            </strong>

                          </div>

                        </div>


                        {/* STAR FEEDBACK */}

                        {evaluation.star_feedback && (

                          <div className="star-feedback">

                            <h3>
                              ⭐ STAR Method Feedback
                            </h3>

                            <p>
                              {
                                evaluation.star_feedback
                              }
                            </p>

                          </div>

                        )}


                        {/* TECHNICAL KEYWORDS */}

                        {evaluation.technical_keywords &&
                          evaluation.technical_keywords.length > 0 && (

                            <div className="technical-keywords">

                              <h3>
                                💻 Technical Concepts Detected
                              </h3>

                              <div className="skill-list">

                                {
                                  evaluation.technical_keywords.map(
                                    (keyword, index) => (

                                      <span
                                        className="skill-badge"
                                        key={index}
                                      >
                                        ✓ {keyword}
                                      </span>

                                    )
                                  )
                                }

                              </div>

                            </div>

                          )}

                      </div>

                    )}


                    {/* =========================
                        NEXT QUESTION
                    ========================= */}

                    {currentQuestion <
                      totalQuestions - 1 && (

                      <button
                        onClick={nextQuestion}
                      >
                        Next Question →
                      </button>

                    )}


                    {/* COMPLETED */}

                    {currentQuestion ===
                      totalQuestions - 1 && (

                      <div className="completed">

                        🎉

                        <h2>
                          Interview completed!
                        </h2>

                        <p>
                          Great job! You completed
                          all interview questions.
                        </p>

                      </div>

                    )}

                  </div>

                )}


                {/* =========================
                    INTERVIEW REPORT
                ========================= */}

                {currentQuestion ===
                  totalQuestions - 1 &&
                  evaluation &&
                  questionsAnswered > 0 && (

                  <div className="performance-dashboard">

                    <p className="badge">
                      📊 INTERVIEW REPORT
                    </p>

                    <h2>
                      Your Interview Performance
                    </h2>


                    <div className="summary-grid">

                      <div className="summary-card">

                        <span>
                          🎯
                        </span>

                        <p>
                          Average Score
                        </p>

                        <strong>
                          {averageScore}/10
                        </strong>

                      </div>


                      <div className="summary-card">

                        <span>
                          🏆
                        </span>

                        <p>
                          Best Score
                        </p>

                        <strong>
                          {bestScore}/10
                        </strong>

                      </div>


                      <div className="summary-card">

                        <span>
                          📝
                        </span>

                        <p>
                          Questions Answered
                        </p>

                        <strong>
                          {questionsAnswered}
                        </strong>

                      </div>


                      <div className="summary-card">

                        <span>
                          📉
                        </span>

                        <p>
                          Lowest Score
                        </p>

                        <strong>
                          {lowestScore}/10
                        </strong>

                      </div>

                    </div>


                    <div className="result-card">

                      <h3>
                        📈 Interview Summary
                      </h3>

                      <p>
                        You completed{" "}
                        {questionsAnswered} of{" "}
                        {totalQuestions} interview
                        questions.
                      </p>

                      <p>
                        Your average performance
                        score is{" "}
                        <strong>
                          {averageScore}/10
                        </strong>.
                      </p>


                      {Number(averageScore) >= 8 ? (

                        <p>
                          🎉 Excellent performance!
                          Your answers demonstrate
                          strong interview readiness.
                        </p>

                      ) : Number(averageScore) >= 6 ? (

                        <p>
                          👍 Good performance!
                          Focus on giving more
                          specific examples and
                          measurable results.
                        </p>

                      ) : (

                        <p>
                          📚 Keep practicing.
                          Try using the STAR method
                          and provide more detailed
                          examples.
                        </p>

                      )}

                    </div>

                  </div>

                )}

              </div>

            )}

          </div>

        )}

      </section>

    </div>
  );
}

export default App;