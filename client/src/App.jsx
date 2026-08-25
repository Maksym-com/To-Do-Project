import { useEffect, useRef, useState } from 'react'
import './App.css'
import './overrides.css'

const starterItems = [
  { id: 'folder-project', type: 'folder', name: 'My projects', parentId: null },
  { id: 'file-welcome', type: 'file', name: 'Welcome', parentId: null, content: 'A quiet place for your ideas and plans.', todos: [] },
  { id: 'file-week', type: 'file', name: 'This week', parentId: 'folder-project', content: 'Focus on what matters most.', todos: [{ id: 'todo-1', text: 'Choose one important thing', done: false }, { id: 'todo-2', text: 'Make a little progress', done: true }] },
]

function App() {
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('little-list-items') || 'null') || starterItems)
  const [selectedId, setSelectedId] = useState('file-welcome')
  const [expanded, setExpanded] = useState(() => new Set(['folder-project']))
  const [modal, setModal] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('little-list-theme') || 'light')
  const [draggedId, setDraggedId] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const contentRef = useRef(null)

  const selectedFile = items.find((item) => item.id === selectedId && item.type === 'file')
  const rootItems = items.filter((item) => item.parentId === null)
  const filesCount = items.filter((item) => item.type === 'file').length

  useEffect(() => localStorage.setItem('little-list-items', JSON.stringify(items)), [items])
  useEffect(() => { localStorage.setItem('little-list-theme', theme) }, [theme])
  useEffect(() => {
    if (!contentRef.current) return
    contentRef.current.style.height = 'auto'
    contentRef.current.style.height = `${contentRef.current.scrollHeight}px`
  }, [selectedId, selectedFile?.content])

  function childrenOf(parentId) { return items.filter((item) => item.parentId === parentId) }

  function createItem(event) {
    event.preventDefault()
    const name = new FormData(event.currentTarget).get('name').trim()
    if (!name) return
    const id = `${modal}-${items.length + 1}`
    const item = modal === 'folder' ? { id, type: 'folder', name, parentId: null } : { id, type: 'file', name, parentId: null, content: '', todos: [] }
    setItems((current) => [...current, item])
    if (modal === 'file') setSelectedId(id)
    setModal(null)
  }

  function updateSelected(changes) { setItems((current) => current.map((item) => item.id === selectedId ? { ...item, ...changes } : item)) }
  function renameSelected(event) { updateSelected({ name: event.target.value }) }

  function addTodo(event) {
    event.preventDefault()
    const text = new FormData(event.currentTarget).get('todo').trim()
    if (!text) return
    updateSelected({ todos: [...(selectedFile.todos || []), { id: `${selectedId}-todo-${selectedFile.todos.length + 1}`, text, done: false }] })
    event.currentTarget.reset()
  }

  function toggleTodo(todoId) { updateSelected({ todos: selectedFile.todos.map((todo) => todo.id === todoId ? { ...todo, done: !todo.done } : todo) }) }
  function removeTodo(todoId) { updateSelected({ todos: selectedFile.todos.filter((todo) => todo.id !== todoId) }) }
  function toggleFolder(folderId) { setExpanded((current) => { const next = new Set(current); next.has(folderId) ? next.delete(folderId) : next.add(folderId); return next }) }

  function canMove(itemId, parentId) {
    if (itemId === parentId) return false
    let current = items.find((item) => item.id === parentId)
    while (current) { if (current.id === itemId) return false; current = items.find((item) => item.id === current.parentId) }
    return true
  }

  function dropOnFolder(folderId) {
    if (!draggedId || !canMove(draggedId, folderId)) return
    setItems((current) => current.map((item) => item.id === draggedId ? { ...item, parentId: folderId } : item))
    setExpanded((current) => new Set(current).add(folderId))
    setDraggedId(null)
  }

  function moveToRoot() {
    if (!draggedId) return
    setItems((current) => current.map((item) => item.id === draggedId ? { ...item, parentId: null } : item))
    setDraggedId(null)
  }

  function deleteItem(itemId) {
    const idsToDelete = new Set([itemId])
    let changed = true
    while (changed) {
      changed = false
      items.forEach((item) => { if (idsToDelete.has(item.parentId) && !idsToDelete.has(item.id)) { idsToDelete.add(item.id); changed = true } })
    }
    setItems((current) => current.filter((item) => !idsToDelete.has(item.id)))
    if (idsToDelete.has(selectedId)) setSelectedId(null)
    setContextMenu(null)
  }

  function renderTree(parentId = null, depth = 0) {
    return childrenOf(parentId).map((item) => <div key={item.id}>
      <button className={`tree-item ${selectedId === item.id ? 'selected' : ''}`} style={{ '--depth': depth }} draggable onDragStart={() => setDraggedId(item.id)} onDragEnd={() => setDraggedId(null)} onDragOver={(event) => item.type === 'folder' && event.preventDefault()} onDrop={(event) => { if (item.type === 'folder') { event.stopPropagation(); dropOnFolder(item.id) } }} onContextMenu={(event) => { event.preventDefault(); setContextMenu({ id: item.id, x: event.clientX, y: event.clientY }) }} onClick={() => { item.type === 'folder' ? toggleFolder(item.id) : setSelectedId(item.id); setMobileSidebarOpen(false) }} type="button">
        <span className={`tree-icon ${item.type}`}>{item.type === 'folder' ? (expanded.has(item.id) ? '▾' : '▸') : '□'}</span><span className="tree-name">{item.name}</span>{item.type === 'folder' && <span className="tree-count">{childrenOf(item.id).length}</span>}
      </button>
      {item.type === 'folder' && expanded.has(item.id) && renderTree(item.id, depth + 1)}
    </div>)
  }

  const completedTodos = selectedFile?.todos?.filter((todo) => todo.done).length || 0

  return <div className={`app-shell ${theme}`}>
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">✦</span><span>little list</span></div>
      <div className="workspace-head"><span>MY SPACE</span><button type="button" aria-label="More workspace options">•••</button></div>
      <div className="create-actions"><button type="button" onClick={() => setModal('folder')}><span>＋</span> New folder</button><button type="button" onClick={() => setModal('file')}><span>＋</span> New file</button></div>
      <div className="tree-label">FILES <span>{filesCount}</span></div>
      <nav className="file-tree" aria-label="Files and folders">{rootItems.length ? renderTree() : <p className="tree-empty">Your space is empty.</p>}{draggedId && items.find((item) => item.id === draggedId)?.parentId !== null && <button className="root-drop" type="button" onDragOver={(event) => event.preventDefault()} onDrop={moveToRoot}>↥ Move to My space</button>}</nav>
      <div className="sidebar-footer"><div className="storage-line"><span className="status-dot" /> Saved locally</div><button className="theme-toggle" type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Change theme"><span>☀</span><span className={`toggle-track ${theme === 'dark' ? 'is-dark' : ''}`}><i /></span><span>☾</span></button></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="mobile-menu" type="button" aria-label="Open files and folders" onClick={() => setMobileSidebarOpen(true)}>☰</button><span className="breadcrumb">My space <b>/</b> {selectedFile?.name || 'Overview'}</span><div className="top-actions"><span className="autosave"><i /> Saved</span><button className="top-menu" type="button" aria-label="More options">•••</button></div></header>
      {selectedFile ? <article className="editor">
        <div className="editor-meta"><span className="file-pill">□ FILE</span><span>{completedTodos}/{selectedFile.todos?.length || 0} checklist items done</span></div>
        <input className="file-title" value={selectedFile.name} onChange={renameSelected} aria-label="File name" />
        <textarea ref={contentRef} className="file-content" value={selectedFile.content} onChange={(event) => updateSelected({ content: event.target.value })} placeholder="Start writing here..." aria-label="File content" />
        <section className="checklist"><div className="section-title"><h2>Checklist</h2><span>{selectedFile.todos?.length || 0} items</span></div><div className="todo-list">{selectedFile.todos?.map((todo) => <div className={`todo-row ${todo.done ? 'completed' : ''}`} key={todo.id}><button className="todo-check" type="button" onClick={() => toggleTodo(todo.id)} aria-label={`Mark ${todo.text} ${todo.done ? 'incomplete' : 'complete'}`}>{todo.done && '✓'}</button><span>{todo.text}</span><button className="todo-remove" type="button" onClick={() => removeTodo(todo.id)} aria-label={`Remove ${todo.text}`}>×</button></div>)}</div><form className="todo-add" onSubmit={addTodo}><span>＋</span><input name="todo" placeholder="Add a checklist item..." aria-label="New checklist item" /></form></section>
        <div className="editor-hint"><span>⌘</span> Everything is saved automatically</div>
      </article> : <div className="welcome"><span className="welcome-icon">✦</span><h1>A small space<br />for big ideas.</h1><p>Choose a file from the sidebar<br />or create something new.</p><div className="welcome-actions"><button type="button" onClick={() => setModal('folder')}>＋ New folder</button><button type="button" onClick={() => setModal('file')}>＋ New file</button></div></div>}
    </main>
    {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}><form className="modal" onSubmit={createItem}><span className="modal-icon">{modal === 'folder' ? '▰' : '□'}</span><h2>New {modal}</h2><p>Give your {modal} a clear name.</p><input name="name" autoFocus placeholder={modal === 'folder' ? 'e.g. Personal' : 'e.g. Project notes'} /><div className="modal-actions"><button type="button" onClick={() => setModal(null)}>Cancel</button><button className="primary" type="submit">Create {modal}</button></div></form></div>}
    {mobileSidebarOpen && <button className="drawer-backdrop" type="button" aria-label="Close files and folders" onClick={() => setMobileSidebarOpen(false)} />}
    {contextMenu && <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => deleteItem(contextMenu.id)}>Delete {items.find((item) => item.id === contextMenu.id)?.type}</button></div>}
  </div>
}

export default App
