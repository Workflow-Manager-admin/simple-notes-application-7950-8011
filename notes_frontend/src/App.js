import React, { useState, useEffect } from "react";
import "./App.css";

/**
 * Simple Notes Application
 * - Sidebar for notes list with search
 * - Main pane for creating, reading, updating, deleting notes
 * - Minimal UI, light theme, primary: #1976d2, secondary: #424242, accent: #ffca28
 * - REST interface stubbed (replace with real API integration later)
 */

// Utility to generate unique IDs
function uuid() {
  // Not cryptographically secure, but sufficient for demo
  return "_" + Math.random().toString(36).substr(2, 9);
}

// Fake async API interface (replace with actual REST API calls)
const NotesAPI = {
  notesKey: "notes-app-demo",

  // PUBLIC_INTERFACE
  getNotes: async function () {
    /** Gets all notes from localStorage (stub for REST API) */
    const notes = JSON.parse(window.localStorage.getItem(this.notesKey) || "[]");
    // Sort by updated time desc
    notes.sort((a, b) => b.updatedAt - a.updatedAt);
    return notes;
  },

  // PUBLIC_INTERFACE
  saveNote: async function (note) {
    /** Save (insert/update) a note; returns updated notes array */
    let notes = JSON.parse(window.localStorage.getItem(this.notesKey) || "[]");
    if (note.id) {
      // update
      const idx = notes.findIndex((n) => n.id === note.id);
      if (idx !== -1) {
        notes[idx] = { ...note, updatedAt: Date.now() };
      }
    } else {
      // create
      note.id = uuid();
      note.createdAt = Date.now();
      note.updatedAt = Date.now();
      notes.unshift(note);
    }
    window.localStorage.setItem(this.notesKey, JSON.stringify(notes));
    return notes;
  },

  // PUBLIC_INTERFACE
  deleteNote: async function (id) {
    /** Remove a note by id; returns updated notes array */
    let notes = JSON.parse(window.localStorage.getItem(this.notesKey) || "[]");
    notes = notes.filter((n) => n.id !== id);
    window.localStorage.setItem(this.notesKey, JSON.stringify(notes));
    return notes;
  },

  // PUBLIC_INTERFACE
  getNoteById: async function (id) {
    /** Get single note */
    const notes = JSON.parse(window.localStorage.getItem(this.notesKey) || "[]");
    return notes.find((n) => n.id === id);
  }
};

// Color theme CSS variables
const themeVars = {
  "--primary-color": "#1976d2",
  "--secondary-color": "#424242",
  "--accent-color": "#ffca28",
  "--background": "#f9f9f9",
  "--sidebar-bg": "#fff",
  "--sidebar-border": "#e9ecef",
  "--note-bg": "#fff",
  "--text-main": "#212121",
  "--text-light": "#757575"
};

// Sidebar component for listing & searching notes
function Sidebar({
  notes, selectedId, onSelect, onCreate, search, setSearch
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Notes</span>
        <button className="accent" title="New note" onClick={onCreate}>＋</button>
      </div>
      <input
        className="search"
        type="text"
        placeholder="Search notes..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        aria-label="Search notes"
      />
      <ul className="notes-list">
        {notes.length === 0 ? (
          <li className="notes-list-empty">No notes found.</li>
        ) : (
          notes.map((note) => (
            <li
              key={note.id}
              className={`notes-list-item${note.id === selectedId ? " selected" : ""}`}
              onClick={() => onSelect(note.id)}
              tabIndex={0}
              aria-label={`View note: ${note.title || "Untitled"}`}
            >
              <span className="note-title">{note.title || <em>Untitled</em>}</span>
              <span className="note-date">{new Date(note.updatedAt).toLocaleDateString()}</span>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}

// Main note editor/view component
function NoteMain({
  note, onChange, onSave, onDelete, onCancel, isEditing, setIsEditing
}) {
  const [editNote, setEditNote] = useState(note || { title: "", content: "" });

  useEffect(() => {
    setEditNote(note ? { ...note } : { title: "", content: "" });
  }, [note]);

  if (!note && !isEditing) {
    return (
      <main className="note-main">
        <div className="note-empty">
          <p>No note selected.<br />Select or create a note from the sidebar.</p>
        </div>
      </main>
    );
  }

  // Handler for input changes
  const handleInput = (e) => {
    const { name, value } = e.target;
    setEditNote((n) => ({ ...n, [name]: value }));
  };

  // Save button handler
  const handleSave = () => {
    onSave({ ...editNote });
    setIsEditing(false);
  };

  // Cancel button handler
  const handleCancel = () => {
    setEditNote(note ? { ...note } : { title: "", content: "" });
    setIsEditing(false);
    onCancel && onCancel();
  };

  if (isEditing) {
    return (
      <main className="note-main">
        <form className="note-form" onSubmit={e => { e.preventDefault(); handleSave(); }}>
          <input
            className="note-title-input"
            type="text"
            name="title"
            value={editNote.title}
            onChange={handleInput}
            placeholder="Title"
            maxLength={60}
            autoFocus
            required
            aria-label="Note Title"
          />
          <textarea
            className="note-content-input"
            name="content"
            value={editNote.content}
            onChange={handleInput}
            placeholder="Write your note here..."
            rows={12}
            aria-label="Note Content"
            required
          />
          <div className="note-actions">
            <button type="submit" className="primary" aria-label="Save note">Save</button>
            <button type="button" className="secondary" onClick={handleCancel} aria-label="Cancel edit">Cancel</button>
            {note && (
              <button type="button" className="danger" onClick={() => onDelete(note.id)} aria-label="Delete note">Delete</button>
            )}
          </div>
        </form>
      </main>
    );
  } else {
    return (
      <main className="note-main">
        <div className="note-view">
          <div className="note-view-header">
            <h2>{note?.title || <em>Untitled</em>}</h2>
            <button className="primary" onClick={() => setIsEditing(true)} aria-label="Edit note">
              Edit
            </button>
          </div>
          <div className="note-view-content">
            <pre>{note?.content}</pre>
          </div>
          <div className="note-view-footer">
            <span>
              Updated: {note ? new Date(note.updatedAt).toLocaleString() : ""}
            </span>
          </div>
        </div>
      </main>
    );
  }
}

// App main component
function App() {
  // Notes state
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Load notes on mount
  useEffect(() => {
    loadNotes();
    setCSSVars(themeVars);
  }, []);

  // PUBLIC_INTERFACE
  // Load all notes
  async function loadNotes() {
    const allNotes = await NotesAPI.getNotes();
    setNotes(allNotes);
    if (allNotes.length > 0 && !selectedId) {
      setSelectedId(allNotes[0].id);
    }
  }

  // PUBLIC_INTERFACE
  // Handle create new note
  async function handleCreateNote() {
    setIsEditing(true);
    setSelectedId(null); // New note (no id)
  }

  // PUBLIC_INTERFACE
  // Handle select from list
  async function handleSelectNote(id) {
    setSelectedId(id);
    setIsEditing(false);
  }

  // PUBLIC_INTERFACE
  // Handle save (create/update) note
  async function handleSaveNote(note) {
    const updatedNotes = await NotesAPI.saveNote(note);
    setNotes(updatedNotes);
    // Find new/updated note's id
    const n = note.id
      ? updatedNotes.find((x) => x.id === note.id)
      : updatedNotes[0];
    setSelectedId(n?.id || null);
    setIsEditing(false);
  }

  // PUBLIC_INTERFACE
  // Handle delete note
  async function handleDeleteNote(id) {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    const updatedNotes = await NotesAPI.deleteNote(id);
    setNotes(updatedNotes);
    setSelectedId(updatedNotes.length > 0 ? updatedNotes[0].id : null);
    setIsEditing(false);
  }

  // Filter notes by search text
  const visibleNotes = notes.filter(
    n =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );
  const selectedNote = notes.find((n) => n.id === selectedId);

  // "New note" placeholder object if editing and no note selected
  const noteObj = isEditing
    ? selectedNote || { title: "", content: "" }
    : selectedNote;

  return (
    <div className="notes-app">
      <Sidebar
        notes={visibleNotes}
        selectedId={selectedId}
        onSelect={handleSelectNote}
        onCreate={handleCreateNote}
        search={search}
        setSearch={setSearch}
      />
      <NoteMain
        note={noteObj}
        onChange={() => {}}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        onCancel={() => setIsEditing(false)}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
    </div>
  );
}

// Util to set CSS variables globally for theme
function setCSSVars(vars) {
  Object.entries(vars).forEach(([k, v]) =>
    document.documentElement.style.setProperty(k, v)
  );
}

export default App;

