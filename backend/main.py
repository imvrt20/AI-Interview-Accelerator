import re

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
from io import BytesIO

from ai_engine import analyze_resume


# ==========================================
# CREATE FASTAPI APPLICATION
# ==========================================

app = FastAPI()


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ai-interview-accelerator-u5xb.onrender.com",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# REQUEST MODELS
# ==========================================

class AnalyzeRequest(BaseModel):
    job_description: str
    resume: str


class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    job_description: str
    resume: str


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/health")
def health():
    return {
        "status": "Backend connected successfully"
    }


# ==========================================
# PDF RESUME UPLOAD
# ==========================================

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):

    # Check file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    try:

        # Read uploaded file
        contents = await file.read()

        # Create PDF reader
        pdf = PdfReader(BytesIO(contents))

        # Extract text from all pages
        extracted_text = ""

        for page in pdf.pages:

            page_text = page.extract_text()

            if page_text:
                extracted_text += page_text + "\n"

        # Check if text was extracted
        if not extracted_text.strip():
            raise HTTPException(
                status_code=400,
                detail=(
                    "Could not extract text from this PDF. "
                    "Please upload a text-based PDF."
                )
            )

        return {
            "filename": file.filename,
            "resume_text": extracted_text.strip(),
            "message": "Resume uploaded and text extracted successfully."
        }

    except HTTPException:
        raise

    except Exception as error:

        print("PDF extraction error:", error)

        raise HTTPException(
            status_code=500,
            detail="Failed to read the PDF resume."
        )


# ==========================================
# ANALYZE RESUME
# ==========================================

@app.post("/analyze")
def analyze(request: AnalyzeRequest):

    result = analyze_resume(
        request.job_description,
        request.resume
    )

    return result


# ==========================================
# EVALUATE INTERVIEW ANSWER
# ==========================================

@app.post("/evaluate-answer")
def evaluate_answer_endpoint(request: EvaluateAnswerRequest):

    question = request.question.strip()
    answer = request.answer.strip()
    job_description = request.job_description.strip()
    resume = request.resume.strip()

    answer_lower = answer.lower()
    question_lower = question.lower()
    job_lower = job_description.lower()
    resume_lower = resume.lower()

    # --------------------------------
    # 1. ANSWER LENGTH
    # --------------------------------

    if len(answer) < 40:
        length_score = 1
    elif len(answer) < 80:
        length_score = 2
    elif len(answer) < 150:
        length_score = 3
    else:
        length_score = 4

    # --------------------------------
    # 2. RELEVANCE TO QUESTION
    # --------------------------------

    question_words = re.findall(
        r"\b[a-zA-Z]{4,}\b",
        question_lower
    )

    relevant_words = 0

    for word in question_words:
        if word in answer_lower:
            relevant_words += 1

    if relevant_words >= 3:
        relevance_score = 2
    elif relevant_words >= 1:
        relevance_score = 1
    else:
        relevance_score = 0

    # --------------------------------
    # 3. TECHNICAL / EXPERIENCE CONTENT
    # --------------------------------

    technical_keywords = [
        "python",
        "java",
        "javascript",
        "react",
        "node",
        "node.js",
        "fastapi",
        "api",
        "rest",
        "sql",
        "mongodb",
        "machine learning",
        "ai",
        "github",
        "git",
        "project",
        "algorithm",
        "database",
        "frontend",
        "backend",
        "development",
        "testing",
        "debugging",
    ]

    technical_matches = []

    for keyword in technical_keywords:
        if keyword in answer_lower:
            technical_matches.append(keyword)

    if len(technical_matches) >= 4:
        technical_score = 2
    elif len(technical_matches) >= 2:
        technical_score = 1
    else:
        technical_score = 0

    # --------------------------------
    # 4. STAR METHOD
    # --------------------------------

    star_keywords = {
        "situation": [
            "situation",
            "problem",
            "challenge",
            "initially",
        ],
        "task": [
            "task",
            "responsibility",
            "goal",
            "needed to",
        ],
        "action": [
            "implemented",
            "developed",
            "created",
            "used",
            "built",
            "debugged",
            "worked",
            "solved",
            "designed",
        ],
        "result": [
            "result",
            "improved",
            "successfully",
            "achieved",
            "reduced",
            "increased",
            "learned",
        ],
    }

    star_sections = []

    for section, keywords in star_keywords.items():

        found = False

        for keyword in keywords:
            if keyword in answer_lower:
                found = True
                break

        if found:
            star_sections.append(section)

    star_score = min(len(star_sections), 4)

    # --------------------------------
    # 5. JOB RELEVANCE
    # --------------------------------

    job_words = set(
        re.findall(
            r"\b[a-zA-Z]{4,}\b",
            job_lower
        )
    )

    job_matches = []

    for word in job_words:
        if word in answer_lower:
            job_matches.append(word)

    if len(job_matches) >= 5:
        job_relevance_score = 2
    elif len(job_matches) >= 2:
        job_relevance_score = 1
    else:
        job_relevance_score = 0

    # --------------------------------
    # 6. RESUME CONNECTION
    # --------------------------------

    resume_words = set(
        re.findall(
            r"\b[a-zA-Z]{4,}\b",
            resume_lower
        )
    )

    resume_matches = []

    for word in resume_words:
        if word in answer_lower:
            resume_matches.append(word)

    if len(resume_matches) >= 5:
        resume_score = 2
    elif len(resume_matches) >= 2:
        resume_score = 1
    else:
        resume_score = 0

    # --------------------------------
    # FINAL SCORE
    # --------------------------------

    raw_score = (
        length_score
        + relevance_score
        + technical_score
        + star_score
        + job_relevance_score
        + resume_score
    )

    max_score = 16

    score = round(
        (raw_score / max_score) * 10
    )

    score = max(1, min(score, 10))

    # --------------------------------
    # STRENGTHS
    # --------------------------------

    strengths = []

    if len(answer) >= 80:
        strengths.append(
            "Your answer provides a reasonable amount of detail."
        )

    if len(technical_matches) >= 2:
        strengths.append(
            "You included relevant technical skills or concepts."
        )

    if len(star_sections) >= 2:
        strengths.append(
            "Your answer follows parts of the STAR structure."
        )

    if len(job_matches) >= 2:
        strengths.append(
            "Your answer is relevant to the job description."
        )

    if len(resume_matches) >= 2:
        strengths.append(
            "You connected your answer with your experience."
        )

    if not strengths:
        strengths.append(
            "You made a relevant attempt to answer the question."
        )

    # --------------------------------
    # IMPROVEMENTS
    # --------------------------------

    improvements = []

    if len(answer) < 80:
        improvements.append(
            "Provide a more detailed answer with a specific example."
        )

    if len(technical_matches) < 2:
        improvements.append(
            "Include relevant technical skills, tools, or technologies."
        )

    if len(star_sections) < 3:
        improvements.append(
            "Use the STAR method: Situation, Task, Action, and Result."
        )

    if len(job_matches) < 2:
        improvements.append(
            "Connect your answer more directly to the job requirements."
        )

    if len(resume_matches) < 2:
        improvements.append(
            "Mention a relevant project, experience, or achievement from your resume."
        )

    # --------------------------------
    # FEEDBACK
    # --------------------------------

    if score >= 8:

        feedback = (
            "Excellent answer. Your response is detailed, "
            "relevant, and demonstrates strong communication. "
            "You also connected your experience with the role. "
            "To make it even stronger, include measurable results "
            "where possible."
        )

    elif score >= 6:

        feedback = (
            "Good answer, but it can be improved. "
            "Try adding a specific real-world example, "
            "technical details, and a clear result. "
            "Using the STAR method will make your response "
            "more structured and convincing."
        )

    else:

        feedback = (
            "Your answer needs more detail and structure. "
            "Try explaining a real situation, what your task was, "
            "what actions you personally took, and what result "
            "you achieved. Also connect the answer to the job "
            "requirements and your technical experience."
        )

    # --------------------------------
    # STAR RECOMMENDATION
    # --------------------------------

    if len(star_sections) == 4:

        star_feedback = (
            "Excellent STAR structure. You covered "
            "Situation, Task, Action, and Result."
        )

    elif len(star_sections) >= 2:

        star_feedback = (
            "Your answer contains some STAR elements. "
            "Try to clearly cover all four: "
            "Situation, Task, Action, and Result."
        )

    else:

        star_feedback = (
            "Use the STAR method to make your answer "
            "more structured: Situation → Task → Action → Result."
        )

    return {
        "score": score,

        "strengths": strengths,

        "improvements": improvements,

        "feedback": feedback,

        "job_relevance": (
            "High" if job_relevance_score == 2
            else "Moderate" if job_relevance_score == 1
            else "Low"
        ),

        "technical_relevance": (
            "Strong" if technical_score == 2
            else "Moderate" if technical_score == 1
            else "Limited"
        ),

        "resume_connection": (
            "Strong" if resume_score == 2
            else "Moderate" if resume_score == 1
            else "Limited"
        ),

        "star_score": star_score,

        "star_feedback": star_feedback,

        "technical_keywords": technical_matches,
    }