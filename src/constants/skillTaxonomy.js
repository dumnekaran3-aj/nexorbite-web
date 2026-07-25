// src/constants/skillTaxonomy.js
//
// Frontend mirror of server/utils/skillTaxonomy.js — intentionally
// duplicated (frontend build can't import backend files). Agar backend
// wali list update ho, isko bhi sync rakhna (values EXACTLY match hone
// chahiye, warna PUT /api/profile/skills unrecognized values ko silently
// drop kar dega).
export const SKILL_TAXONOMY = {
  "Programming & Dev": [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C", "Go", "Rust",
    "React", "Node.js", "Next.js", "Django", "Flutter", "React Native",
    "Android Dev", "iOS Dev", "SQL", "MongoDB", "DevOps", "Cloud (AWS/GCP/Azure)",
    "Cybersecurity", "Blockchain", "Game Dev",
  ],
  "Data & AI": [
    "Machine Learning", "Deep Learning", "Data Science", "Data Analysis",
    "Data Visualization", "NLP", "Computer Vision", "Prompt Engineering",
  ],
  "Design": [
    "UI Design", "UX Design", "Graphic Design", "Figma", "3D Modeling",
    "Animation", "Illustration", "Product Design", "Branding",
  ],
  "Content & Media": [
    "Video Editing", "Photography", "Content Writing", "Copywriting",
    "Public Speaking", "Podcasting", "Social Media", "Blogging",
  ],
  "Business & Management": [
    "Entrepreneurship", "Marketing", "Digital Marketing", "Sales",
    "Finance", "Product Management", "Project Management", "Consulting",
    "Stock Market / Trading",
  ],
  "Core Engineering": [
    "Mechanical Design", "CAD", "Robotics", "Electronics", "IoT",
    "Civil Engineering", "Automotive", "Aerospace",
  ],
  "Academics & Research": [
    "Competitive Programming", "Research Writing", "Mathematics", "Physics",
    "Teaching / Mentoring", "Debate",
  ],
  "Creative & Extracurricular": [
    "Music", "Singing", "Dance", "Acting", "Sports", "Gaming / Esports",
    "Writing / Poetry", "Event Management", "Volunteering",
  ],
};

export const MAX_SKILLS_PER_USER = 10;