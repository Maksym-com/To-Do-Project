import { useEffect, useMemo, useState } from 'react'
import { createTask, deleteTask, getTasks, updateTask } from './services/api'
import './App.css'

const starterTasks = [
  { id: 1, title: 'Map out the week', detail: 'Choose three outcomes that would make Friday feel good.', done: false, tag: 'Planning' },
  { id: 2, title: 'Reply to the design notes', detail: 'Close the loop with a clear next step.', done: false, tag: 'Work' },
  { id: 3, title: 'Book a quiet hour', detail: 'Make some room for focused, uninterrupted work.', done: true, tag: 'Personal' },
]

const filters = ['All', 'Today', 'Upcoming', 'Done']

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('little-list-tasks')
    return saved ? JSON.parse(saved) : starterTasks
  })
  const [newTask, setNewTask] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [focusMode, setFocusMode] = useState(false)

  useEffect(() => {
    getTasks()
      .then((remoteTasks) => setTasks(remoteTasks))
      .catch(() => {})
  }, [])

  useEffect(() => {
    localStorage.setItem('little-list-tasks', JSON.stringify(tasks))
  }, [tasks])

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    if (activeFilter === 'Done') return task.done
    if (activeFilter === 'Today') return !task.done && task.tag !== 'Upcoming'
    if (activeFilter === 'Upcoming') return !task.done && task.tag === 'Upcoming'
    return !focusMode || !task.done
  }), [activeFilter, focusMode, tasks])

  const openCount = tasks.filter((task) => !task.done).length
  const completedCount = tasks.length - openCount

  function addTask(event) {
    event.preventDefault()
    const title = newTask.trim()
    if (!title) return
    const task = { title, detail: 'Added just now', done: false, tag: 'Today' }
    setTasks((current) => [{ id: Date.now(), ...task }, ...current])
    createTask(task).then((savedTask) => setTasks((current) => current.map((item) => item.title === title && item.id > 1000000000000 ? savedTask : item))).catch(() => {})
    setNewTask('')
  }

  function toggleTask(id) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task))
    const task = tasks.find((item) => item.id === id)
    if (task) updateTask(id, { done: !task.done }).catch(() => {})
  }

  function removeTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id))
    if (id < 1000000000000) deleteTask(id).catch(() => {})
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">◎</span> little list</div>
        <div className="workspace-label">MY WORKSPACE</div>
        <nav className="side-nav" aria-label="Workspace">
          <button className="nav-item active" type="button"><span>□</span> Inbox <b>{openCount}</b></button>
          <button className="nav-item" type="button"><span>▣</span> Today</button>
          <button className="nav-item" type="button"><span>◷</span> Upcoming</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-progress"><span style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }} /></div>
          <p><strong>{completedCount}</strong> of {tasks.length} complete</p>
          <div className="profile"><span className="avatar">M</span><span>maksim</span><span className="dots">•••</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar"><span className="crumb">Workspace / <strong>Inbox</strong></span><button className="icon-button" type="button" aria-label="More options">•••</button></header>
        <section className="content-wrap">
          <div className="eyebrow">TUESDAY, AUGUST 25</div>
          <div className="title-row"><div><h1>Good morning, Maksim.</h1><p className="subtitle">A clear space for the things that matter today.</p></div><button className={`focus-button ${focusMode ? 'selected' : ''}`} type="button" onClick={() => setFocusMode(!focusMode)}><span>◉</span> {focusMode ? 'Focus on' : 'Focus mode'}</button></div>

          <form className="add-task" onSubmit={addTask}><span className="plus">＋</span><input value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Add a task to your list..." aria-label="New task" /><button type="submit">Add task <span>↵</span></button></form>

          <div className="list-heading"><div><h2>My tasks</h2><span className="task-count">{openCount} open</span></div><div className="filters" role="tablist" aria-label="Task filters">{filters.map((filter) => <button key={filter} className={activeFilter === filter ? 'filter active' : 'filter'} type="button" onClick={() => setActiveFilter(filter)}>{filter}</button>)}</div></div>
          <div className="task-list">{visibleTasks.length ? visibleTasks.map((task, index) => <article className={`task-row ${task.done ? 'done' : ''}`} key={task.id} style={{ '--delay': `${index * 60}ms` }}><button className="check" type="button" aria-label={`Mark ${task.title} ${task.done ? 'open' : 'done'}`} onClick={() => toggleTask(task.id)}>{task.done ? '✓' : ''}</button><div className="task-copy"><h3>{task.title}</h3><p>{task.detail}</p></div><span className={`tag tag-${task.tag.toLowerCase()}`}>{task.tag}</span><button className="delete-button" type="button" aria-label={`Delete ${task.title}`} onClick={() => removeTask(task.id)}>×</button></article>) : <div className="empty-state"><span>✦</span><h3>Nothing here yet</h3><p>Enjoy the breathing room, or add something new above.</p></div>}</div>
          <footer className="list-footer"><span><span className="footer-dot" /> Changes save automatically</span><span>Press <kbd>⌘</kbd> <kbd>K</kbd> to search</span></footer>
        </section>
      </main>
    </div>
  )
}

export default App
