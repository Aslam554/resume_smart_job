from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import aiofiles
import os
import logging
import fitz  # PyMuPDF for PDF parsing
import requests
import re

app = FastAPI()

# Allow frontend origins
origins = ["http://localhost:3000", "http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)

ARBEITNOV_API_URL = "https://arbeitnow.com/api/job-board-api"


def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file using PyMuPDF (fitz)."""
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text("text") + "\n"
    except Exception as e:
        logging.error(f"Error extracting text from PDF: {e}")
    return text


def parse_resume(text):
    """Extract basic details from resume text."""
    name_match = re.search(r"([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)", text)
    name = name_match.group(1) if name_match else "Unknown"

    skills = re.findall(r"\b(Python|FastAPI|React|JavaScript|Node\.js|SQL|MongoDB|Django|Flask|Tailwind CSS)\b", text, re.I)
    skills = list(set(skills)) if skills else ["General IT Skills"]

    experience_match = re.search(r"(\d+)\s+years?.*experience", text, re.I)
    experience = f"{experience_match.group(1)} years" if experience_match else "Not specified"

    job_interests = ["Software Engineer", "Backend Developer"] if "backend" in text.lower() else ["Frontend Developer"]

    return {
        "name": name,
        "skills": skills,
        "experience": experience,
        "projects": ["Project A", "Project B"],  # Mocked
        "achievements": ["Achievement 1", "Achievement 2"],  # Mocked
        "jobInterests": job_interests
    }


def remove_html_tags(text):
    """Removes all HTML tags from the given text."""
    clean_text = re.sub(r"<[^>]*>", "", text)  # Removes all HTML tags
    return clean_text.strip()


def shorten_text(text, word_limit=50):
    """Shortens text to a maximum of `word_limit` words."""
    words = text.split()
    return " ".join(words[:word_limit]) + ("..." if len(words) > word_limit else "")


def fetch_jobs(skills):
    """Fetch jobs from Arbeitnow API and filter relevant data based on skills."""
    try:
        response = requests.get(ARBEITNOV_API_URL)
        response.raise_for_status()
        jobs = response.json().get("data", [])

        extracted_jobs = []
        skills_lower = [skill.lower() for skill in skills]  # Convert skills to lowercase

        for job in jobs:
            job_title = job.get("title", "").lower()
            job_desc = job.get("description", "").lower()

            # Check if any skill is present in the job title or job description
            if any(skill in job_title or skill in job_desc for skill in skills_lower):
                extracted_jobs.append({
                    "title": job.get("title", "N/A"),
                    "description": shorten_text(remove_html_tags(job.get("description", "No description provided."))),
                    "requirements": remove_html_tags(job.get("requirements", "Not specified.")),
                    "last_date": job.get("last_date", "Not mentioned"),
                    "salary": job.get("salary", "Not disclosed"),
                    "stipend": job.get("stipend", "N/A"),
                    "qualifications": remove_html_tags(job.get("qualifications", "Not specified")),
                    "url": job.get("url", "#")
                })

        # If no jobs are found, return a message in BIG FORMAT
        if not extracted_jobs:
            return [{"title": "🚀 NO JOBS FOUND 🚀", "description": "Sorry, no matching jobs were found. Please try updating your resume or skills.", "url": "#"}]

        return extracted_jobs  # Return relevant jobs
    except Exception as e:
        logging.error(f"Error fetching jobs: {e}")
        return [{"title": "❌ ERROR FETCHING JOBS ❌", "description": "An error occurred while fetching job data.", "url": "#"}]


@app.post("/upload-resume/")
async def upload_resume(file: UploadFile = File(...)):
    try:
        os.makedirs("resumes", exist_ok=True)
        file_path = f"resumes/{file.filename}"

        async with aiofiles.open(file_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)

        logging.info(f"File {file.filename} uploaded successfully.")

        # Extract and parse resume data
        resume_text = extract_text_from_pdf(file_path)
        resume_data = parse_resume(resume_text)

        # Fetch relevant job listings
        job_data = fetch_jobs(resume_data["skills"])

        return {"filename": file.filename, "resume_data": resume_data, "job_data": job_data}

    except Exception as e:
        logging.error(f"Error processing resume: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
