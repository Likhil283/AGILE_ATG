# Automatic Timetable Generator (Simple Full-Stack Demo)

## What this is
A minimal full-stack demonstration of an Automatic Timetable Generator for colleges:
- Backend: Node.js + Express providing a simple scheduler and persistence to a JSON file.
- Frontend: Static HTML/CSS/JS to input teachers, rooms, courses and time slots and generate a timetable.

## Features
- Greedy scheduler that assigns course slots avoiding teacher and room clashes.
- Save/load dataset to server (data/saved.json).
- Download generated timetable as CSV.
- Example data pre-filled for convenience.

## Run locally
1. Make sure Node.js (v14+) and npm are installed.
2. Extract the project and open a terminal in the project folder.
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```
5. Open http://localhost:3000 in your browser.

## API endpoints
- `POST /api/generate` — body: { courses, teachers, rooms, slots } -> returns `{ schedule }`
- `POST /api/save` — body: full dataset to persist
- `GET /api/load` — get persisted dataset (if any)

## Notes
- This is a simple demo with a straightforward greedy algorithm. For real-world needs, add constraints (batch, lab requirements, teacher availability windows), conflict resolution, optimization (ILP/GA), and a database.