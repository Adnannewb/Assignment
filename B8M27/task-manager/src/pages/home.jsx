import { useEffect, useRef, useState } from "react";

import TaskItem from "../components/TaskItem";

function Home() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const inputRef = useRef(null);
  const countRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "https://jsonplaceholder.typicode.com/todos?_limit=5",
        );

        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }

        const data = await response.json();

        const formattedTasks = data.map((task) => ({
          id: task.id,
          title: task.title,
          completed: task.completed,
        }));

        setTasks(formattedTasks);
      } catch (error) {
        console.error(error);
        setError("Unable to load tasks.");
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  useEffect(() => {
    if (countRef.current) {
      countRef.current.innerText = `Total Tasks: ${tasks.length}`;
    }
  }, [tasks]);

  const addTask = () => {
    const trimmedTask = newTask.trim();

    if (trimmedTask === "") {
      return;
    }

    const task = {
      id: Date.now(),
      title: trimmedTask,
      completed: false,
    };

    setTasks((previousTasks) => [...previousTasks, task]);

    setNewTask("");

    inputRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      addTask();
    }
  };

  const toggleTask = (id) => {
    setTasks((previousTasks) =>
      previousTasks.map((task) => {
        if (task.id === id) {
          return {
            ...task,
            completed: !task.completed,
          };
        }

        return task;
      }),
    );
  };

  return (
    <section className="page">
      <div className="container">
        <h1>My Tasks</h1>

        <p className="subtitle">Manage your daily tasks with React.</p>

        <div className="task-input">
          <input
            ref={inputRef}
            type="text"
            value={newTask}
            onChange={(event) => setNewTask(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a new task..."
          />

          <button onClick={addTask}>Add Task</button>
        </div>

        <p ref={countRef} className="task-count">
          Total Tasks: 0
        </p>

        {loading && (
          <div className="status-message">
            <p>Loading tasks...</p>
          </div>
        )}

        {!loading && error && (
          <div className="status-message error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <ul className="task-list">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={toggleTask} />
            ))}
          </ul>
        )}

        {!loading && !error && tasks.length === 0 && (
          <p className="empty-message">No tasks available.</p>
        )}
      </div>
    </section>
  );
}

export default Home;
