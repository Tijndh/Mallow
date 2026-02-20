# Mallow
Mallow Creme

## Deployment Setup

### 1. Backend (Render)
- Push this repository to GitHub.
- In Render, create a new **Web Service** from this repo.
- Render will auto-detect `render.yaml`.
- Set required environment variables in Render:
  - `MONGO_URL`
  - `DB_NAME` (default: `mallow_prod`)
  - `STRIPE_API_KEY`
  - `CORS_ORIGINS` (default includes `https://tijndh.github.io`)

### 2. Database (MongoDB Atlas)
- Create a cluster and DB user.
- Add network access for your backend host.
- Put the Atlas URI into Render `MONGO_URL`.

### 3. Frontend (GitHub Pages)
- In GitHub repo settings: `Pages` source = `GitHub Actions`.
- In GitHub: `Settings > Secrets and variables > Actions > Variables`.
- Add variable:
  - `REACT_APP_BACKEND_URL` = your Render backend URL (for example `https://mallow-backend.onrender.com`)
- Push to `main` to trigger deployment.

### 4. Local development
- Copy `backend/.env.example` to `backend/.env`.
- Copy `frontend/.env.example` to `frontend/.env`.
