import { useEffect, useMemo, useState } from 'react';

const defaultHabit = {
  name: '',
  category: 'Health',
  goal: 'Daily',
};

function App() {
  const [habits, setHabits] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [newHabit, setNewHabit] = useState(defaultHabit);
  const [loading, setLoading] = useState(true);

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits');
      const data = await response.json();
      setHabits(data.habits || []);
    } catch (error) {
      console.error('Failed to fetch habits:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/recommendations');
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchHabits(), fetchRecommendations()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = habits.length;
    const done = habits.filter((habit) => habit.completedToday).length;
    const streaks = habits.reduce((sum, habit) => sum + (habit.streak || 0), 0);

    return {
      total,
      done,
      streaks,
      completionRate: total ? Math.round((done / total) * 100) : 0,
    };
  }, [habits]);

  const toggleHabit = async (habitId) => {
    try {
      const response = await fetch(`/api/habits/${habitId}/toggle`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        await fetchHabits();
        await fetchRecommendations();
      }
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    }
  };

  const addHabit = async (event) => {
    event.preventDefault();

    if (!newHabit.name.trim()) {
      return;
    }

    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newHabit),
      });

      const data = await response.json();
      if (data.success) {
        setNewHabit(defaultHabit);
        await fetchHabits();
        await fetchRecommendations();
      }
    } catch (error) {
      console.error('Failed to add habit:', error);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Wellness planner</p>
          <h1>Daily Habit Tracker</h1>
        </div>
        <button className="primary-btn">Review goals</button>
      </header>

      <section className="stats-grid">
        <div className="stat-card accent">
          <span>Total habits</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>Completed today</span>
          <strong>{stats.done}</strong>
        </div>
        <div className="stat-card">
          <span>Completion rate</span>
          <strong>{stats.completionRate}%</strong>
        </div>
        <div className="stat-card">
          <span>Current streaks</span>
          <strong>{stats.streaks}</strong>
        </div>
      </section>

      <main className="content-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>Add a habit</h2>
          </div>

          <form className="habit-form" onSubmit={addHabit}>
            <label>
              Habit name
              <input
                type="text"
                value={newHabit.name}
                onChange={(event) =>
                  setNewHabit((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="e.g. Drink water"
              />
            </label>

            <div className="form-row">
              <label>
                Category
                <select
                  value={newHabit.category}
                  onChange={(event) =>
                    setNewHabit((current) => ({ ...current, category: event.target.value }))
                  }
                >
                  <option value="Health">Health</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Learning">Learning</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Mindfulness">Mindfulness</option>
                </select>
              </label>

              <label>
                Goal
                <input
                  type="text"
                  value={newHabit.goal}
                  onChange={(event) =>
                    setNewHabit((current) => ({ ...current, goal: event.target.value }))
                  }
                  placeholder="Daily / Weekly"
                />
              </label>
            </div>

            <button className="primary-btn" type="submit">
              Save habit
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>Smart recommendations</h2>
          </div>

          <div className="recommendation-list">
            {loading ? (
              <p>Loading suggestions...</p>
            ) : (
              recommendations.map((recommendation) => (
                <div key={recommendation.id} className="recommendation-item">
                  <div className="dot" />
                  <div>
                    <strong>{recommendation.title}</strong>
                    <p>{recommendation.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <section className="panel habits-panel">
        <div className="section-heading">
          <h2>Today's habits</h2>
        </div>

        {loading ? (
          <p>Loading habits...</p>
        ) : (
          <div className="habit-list">
            {habits.map((habit) => (
              <article key={habit.id} className={`habit-card ${habit.completedToday ? 'done' : ''}`}>
                <div>
                  <span className="habit-tag">{habit.category}</span>
                  <h3>{habit.name}</h3>
                  <p>
                    {habit.goal} • {habit.streak} day streak
                  </p>
                </div>

                <button
                  type="button"
                  className={`toggle-btn ${habit.completedToday ? 'done' : ''}`}
                  onClick={() => toggleHabit(habit.id)}
                >
                  {habit.completedToday ? 'Completed' : 'Mark done'}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
