import re


def analyze_resume(job_description: str, resume: str):
    """
    Rule-based resume and job description analyzer.
    """

    job_text = job_description.lower()
    resume_text = resume.lower()

    skills = [
        "python",
        "java",
        "javascript",
        "react",
        "node.js",
        "node",
        "express",
        "mongodb",
        "sql",
        "mysql",
        "git",
        "github",
        "machine learning",
        "deep learning",
        "data science",
        "artificial intelligence",
        "ai",
        "generative ai",
        "fastapi",
        "flask",
        "docker",
        "aws",
        "html",
        "css",
    ]

    required_skills = []
    matching_skills = []
    missing_skills = []

    # Find skills mentioned in job description
    for skill in skills:
        if skill in job_text:
            required_skills.append(skill)

            if skill in resume_text:
                matching_skills.append(skill)
            else:
                missing_skills.append(skill)

    # Calculate match percentage
    if len(required_skills) > 0:
        match_percentage = round(
            (len(matching_skills) / len(required_skills)) * 100
        )
    else:
        match_percentage = 0

    # Strengths
    strengths = []

    for skill in matching_skills:
        strengths.append(
            f"Your resume contains experience/knowledge in {skill}."
        )

    # Interview questions
    interview_questions = [
        "Tell me about yourself.",
        "Why are you interested in this role?",
        "Explain one of your major projects.",
        "What are your strongest technical skills?",
        "Describe a challenging problem you solved.",
    ]

    # Add skill-specific questions
    for skill in matching_skills[:5]:
        interview_questions.append(
            f"Explain your experience with {skill}."
        )

    return {
        "match_percentage": match_percentage,
        "required_skills": required_skills,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,

        # React App.jsx expects this name
        "skills_to_improve": missing_skills,

        "strengths": strengths,
        "interview_questions": interview_questions,
    }


def evaluate_answer(
    question: str,
    answer: str,
    job_description: str,
    resume: str
):
    """
    Basic rule-based interview answer evaluator.
    """

    answer = answer.strip()

    if not answer:
        return {
            "score": 0,
            "strengths": [],
            "improvements": ["Please provide an answer."],
            "feedback": "No answer was provided."
        }

    answer_lower = answer.lower()

    # Basic scoring based on answer quality
    score = 5

    # Length
    word_count = len(answer.split())

    if word_count >= 20:
        score += 1

    if word_count >= 50:
        score += 1

    if word_count >= 100:
        score += 1

    # Look for useful professional keywords
    useful_words = [
        "project",
        "experience",
        "team",
        "problem",
        "solution",
        "developed",
        "implemented",
        "learned",
        "result",
        "achievement",
        "python",
        "java",
        "javascript",
        "react",
        "machine learning",
        "ai",
    ]

    found_words = []

    for word in useful_words:
        if word in answer_lower:
            found_words.append(word)

    if len(found_words) >= 2:
        score += 1

    # Maximum score = 10
    score = min(score, 10)

    strengths = []

    if word_count >= 20:
        strengths.append(
            "Your answer provides enough detail."
        )
    else:
        strengths.append(
            "You answered the question directly."
        )

    if found_words:
        strengths.append(
            "You included relevant professional or technical details."
        )

    improvements = []

    if word_count < 20:
        improvements.append(
            "Add more detail and examples to make your answer stronger."
        )

    if word_count < 50:
        improvements.append(
            "Try explaining the situation, your actions, and the result."
        )

    if not found_words:
        improvements.append(
            "Include specific examples from your projects or experience."
        )

    if score >= 8:
        feedback = (
            "Good answer. It is relevant and reasonably detailed. "
            "Keep using specific examples and measurable results."
        )
    elif score >= 6:
        feedback = (
            "Decent answer, but you can make it stronger by adding "
            "specific examples, technical details, and results."
        )
    else:
        feedback = (
            "Your answer needs more detail. Try using a real example "
            "and explain what you did and what the result was."
        )

    return {
        "score": score,
        "strengths": strengths,
        "improvements": improvements,
        "feedback": feedback,
    }