# Pragyan Space Analytics

A high-performance, AI-powered aerospace data dashboard built with a custom neon-glassmorphism UI. It visualizes decades of historical orbital data, renders 3D procedural globes, and integrates live third-party launch APIs.

* **Live Demo:** [pragyan-three.vercel.app](https://pragyan-three.vercel.app)

## Core Features
- **AI-Powered Insights:** Integrated with Google Gemini to dynamically summarize and explain complex orbital charts and data trends.
- **3D Orbital WebGL:** Procedurally generated 3D earth visualizations with geospatial heatmaps using `React-Globe.gl`.
- **Live Launch Tracking:** Real-time countdowns for the next global rocket launches fetching from the Space Devs REST API.
- **Interactive Sandbox:** A dynamic Recharts engine allowing users to build custom data aggregations on the fly.
- **Rocket Garage:** A paginated, interactive gallery of historical rockets and their specifications.
- **Neon Glassmorphism UI:** Fully custom, responsive Tailwind CSS design system with custom scrollbars, glowing borders, and fluid animations.

## Tech Stack
- **Frontend:** React (Vite), Tailwind CSS, Recharts, React-Globe.gl, Framer Motion
- **Backend:** FastAPI (Python), Uvicorn, Google Gemini SDK
- **Database:** SQLite, Python Pandas Data Pipeline

## Local Quickstart
### 1. Start the Backend
Navigate to the `backend` folder and start the FastAPI server:
```bash
cd backend
# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Start the server
uvicorn main:app --reload --port 8001
```

### 2. Start the Frontend
Navigate to the `frontend` folder and start the Vite dev server:
```bash
cd frontend
npm install
npm run dev
```


