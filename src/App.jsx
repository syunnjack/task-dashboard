import { useEffect, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'task-dashboard.tasks'

function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function App() {
  const [tasks, setTasks] = useState(loadTasks)
  const [text, setText] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const addTask = (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setTasks([...tasks, { id: crypto.randomUUID(), text: trimmed, done: false }])
    setText('')
  }

  const toggleTask = (id) => {
    setTasks(tasks.map((task) =>
      task.id === id ? { ...task, done: !task.done } : task
    ))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  return (
    <div className="app">
      <h1>タスクボード</h1>

      <form className="task-form" onSubmit={addTask}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="新しいタスクを入力"
        />
        <button type="submit">追加</button>
      </form>

      {tasks.length === 0 ? (
        <p className="empty">タスクはありません</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className={task.done ? 'task done' : 'task'}>
              <label>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                />
                <span>{task.text}</span>
              </label>
              <button
                type="button"
                className="delete-button"
                onClick={() => deleteTask(task.id)}
                aria-label="タスクを削除"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App
