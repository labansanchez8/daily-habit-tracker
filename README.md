const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const dataDir = path.join(__dirname, 'data');
const habitsFile = path.join(dataDir, 'habits.json');

app.use(cors());
app.use(express.json());

const ensureDataFile = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(habitsFile)) {
    const seedData = [
      {
        id: 1,
        name: 'Drink water',
        category: 'Health',
        goal: 'Daily',
        streak: 4,
        completedToday: true,
      },
      {
        id: 2,
        name: 'Morning walk',
        category: 'Fitness',
        goal: '30 minutes',
        streak: 2,
        completedToday: false,
      },
      {
        id: 3,
        name: 'Read 20 pages',
        category: 'Learning',
        goal: 'Daily',
        streak: 6,
        completedToday: true,
      },
      {
        id: 4,
        name: 'Deep work session',
        category: 'Productivity',
        goal: '2 hours',
        streak: 3,
        completedToday: false,
      },
    ];

    fs.writeFileSync(habitsFile, JSON.stringify(seedData, null, 2));
  }
};

const readHabits = () => {
  ensureDataFile();
  const raw = fs.readFileSync(habitsFile, 'utf-8');
  return JSON.parse(raw);
};

const writeHabits = (habits) => {
  fs.writeFileSync(habitsFile, JSON.stringify(habits, null, 2));
};

const buildRecommendations = (habits) => {
  const recommendations = [];

  habits.forEach((habit) => {
    if (!habit.completedToday && habit.streak < 5) {
      recommendations.push({
        id: `recommend-${habit.id}`,
        title: `Keep ${habit.name} going`,
        text: `You are close to building momentum. Try a lighter version for 10 minutes and keep your streak alive.`,
      });
    }

    if (habit.completedToday && habit.streak >= 3) {
      recommendations.push({
        id: `reward-${habit.id}`,
        title: `Nice work on ${habit.name}`,
        text: `Consistency is paying off. Consider increasing the challenge slightly for the next few days.`,
      });
    }
  });

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'general-1',
      title: 'Stay consistent',
      text: 'Your routine looks balanced. Keep your focus on small wins and protect the time you set aside for habits.',
    });
  }

  return recommendations.slice(0, 4);
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/habits', (req, res) => {
  const habits = readHabits();
  res.json({ habits });
});

app.post('/api/habits', (req, res) => {
  const { name, category, goal } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Habit name is required.' });
  }

  const habits = readHabits();
  const newHabit = {
    id: Date.now(),
    name: String(name).trim(),
    category: category || 'Health',
    goal: goal || 'Daily',
    streak: 0,
    completedToday: false,
  };

  habits.unshift(newHabit);
  writeHabits(habits);

  return res.json({ success: true, habit: newHabit });
});

app.post('/api/habits/:id/toggle', (req, res) => {
  const habits = readHabits();
  const habit = habits.find((item) => String(item.id) === String(req.params.id));

  if (!habit) {
    return res.status(404).json({ message: 'Habit not found.' });
  }

  habit.completedToday = !habit.completedToday;
  habit.streak = habit.completedToday ? habit.streak + 1 : Math.max(0, habit.streak - 1);

  writeHabits(habits);
  res.json({ success: true, habit });
});

app.get('/api/recommendations', (req, res) => {
  const habits = readHabits();
  const recommendations = buildRecommendations(habits);
  res.json({ recommendations });
});

app.listen(PORT, () => {
  ensureDataFile();
  console.log(`Habit tracker API running on http://localhost:${PORT}`);
});
