const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const SAVED_FILE = path.join(DATA_DIR, 'saved.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Simple scheduler: greedy assignment avoiding teacher/room/time conflicts
function generateTimetable({ courses, teachers, rooms, slots }) {
  // courses: [{ id, code, name, teacherId, hours }] hours = number of slots needed
  // teachers: [{ id, name }]
  // rooms: [{ id, name, capacity }]
  // slots: array of slot identifiers, e.g. ["Mon 9-10","Mon 10-11",...]
  const schedule = [];
  const teacherBusy = {}; // teacherId -> Set of slot
  const roomBusy = {}; // roomId -> Set of slot

  // initialize busy maps
  teachers.forEach(t => teacherBusy[t.id] = new Set());
  rooms.forEach(r => roomBusy[r.id] = new Set());

  // shuffle courses for fairness
  const shuffledCourses = [...courses];
  shuffledCourses.sort((a,b) => a.code.localeCompare(b.code)); // deterministic order

  for (const c of shuffledCourses) {
    let remaining = c.hours || 1;
    for (const slot of slots) {
      if (remaining <= 0) break;
      // check teacher availability
      const tBusy = teacherBusy[c.teacherId] || new Set();
      if (tBusy.has(slot)) continue;

      // find first available room that's free in this slot
      const room = rooms.find(r => !(roomBusy[r.id] && roomBusy[r.id].has(slot)));
      if (!room) continue;

      // assign
      schedule.push({
        courseId: c.id,
        courseCode: c.code,
        courseName: c.name,
        teacherId: c.teacherId,
        slot,
        roomId: room.id,
        roomName: room.name
      });
      tBusy.add(slot);
      teacherBusy[c.teacherId] = tBusy;
      if (!roomBusy[room.id]) roomBusy[room.id] = new Set();
      roomBusy[room.id].add(slot);
      remaining -= 1;
    }
    if (remaining > 0) {
      // couldn't assign all required slots — mark unassigned entries
      schedule.push({
        courseId: c.id,
        courseCode: c.code,
        courseName: c.name,
        teacherId: c.teacherId,
        slot: null,
        roomId: null,
        roomName: null,
        note: `Unassigned ${remaining} slot(s)`
      });
    }
  }
  return schedule;
}

// API: Generate timetable from posted data
app.post('/api/generate', (req, res) => {
  try {
    const payload = req.body;
    // validate minimal
    if (!payload.courses || !payload.rooms || !payload.teachers || !payload.slots) {
      return res.status(400).json({ error: 'courses, teachers, rooms and slots are required' });
    }
    const schedule = generateTimetable(payload);
    res.json({ ok: true, schedule });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

// API: Save data (simple persist)
app.post('/api/save', (req, res) => {
  try {
    const data = req.body || {};
    fs.writeFileSync(SAVED_FILE, JSON.stringify(data, null, 2));
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'could not save' });
  }
});

// API: Load saved data
app.get('/api/load', (req, res) => {
  try {
    if (!fs.existsSync(SAVED_FILE)) return res.json({ courses: [], teachers: [], rooms: [], slots: [] });
    const raw = fs.readFileSync(SAVED_FILE);
    const data = JSON.parse(raw);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'could not load' });
  }
});

// fallback to frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Automatic Timetable Generator running on http://localhost:${PORT}`);
});