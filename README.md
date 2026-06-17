# Collab Hub - Influencer-Brand Collaboration Platform

A full-stack web application designed to connect brands with influencers for campaign collaborations. Built using Express, TypeScript, and MongoDB on the backend, and Ionic with Angular on the frontend.

## Key Features

### 🏢 Brand Features
- **Campaign Creation**: Define details like niche, platform (Instagram, YouTube, Twitter), budget, deliverables, requirements, and dates.
- **Application Management**: View pitches submitted by influencers and accept or reject applications.
- **Brand Profile**: Customize brand details, company logo, website, and industry.

### 🤳 Influencer Features
- **Campaign Directory**: Browse open campaigns filtered by niche and platform.
- **Pitches & Applications**: Submit custom pitches to open campaigns.
- **Influencer Profile**: Customize bio, niche tags, country, social media links (Instagram, YouTube, Twitter), and profile pictures.

### ⚙️ Core Architecture
- **Mongoose Discriminators**: Structured user schemas splitting a base `User` model into distinct `Brand` and `Influencer` sub-types.
- **Secure Authentication**: JWT-based authentication with OTP-based verification.
- **Dynamic Avatars**: Renders company logos or influencer profile pictures with elegant fallback text initials.

---

## Tech Stack

### Backend
- **Core**: Node.js, Express, TypeScript
- **Database**: MongoDB, Mongoose
- **Mailing**: Nodemailer (OTP delivery)
- **Validation**: Zod
- **Security**: Helmet, bcryptjs, express-rate-limit

### Frontend
- **Framework**: Angular, Ionic (for responsive mobile-first UI)
- **Styling**: Sass (SCSS)
- **HTTP**: HttpClient with Authorization interceptors

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or on MongoDB Atlas

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Hemil-Gandhi/Collabrationapp.git
   cd Collabrationapp
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   # Create a .env file based on the environment needs (MONGO_URI, JWT_SECRET, EMAIL config, etc.)
   npm run dev
   ```

3. **Setup Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm start
   ```
