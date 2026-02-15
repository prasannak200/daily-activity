
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Note, FilterType, Priority, User, AppTab } from './types';
import { storageService } from './services/storage';
import { geminiService } from './services/geminiService';
import { PlusIcon, CheckIcon, TrashIcon, SparklesIcon, PencilIcon, CalendarIcon, ClockIcon, ListIcon, DocumentTextIcon, MusicalNoteIcon } from './components/Icons';
import Auth from './components/Auth';
import Calendar from './components/Calendar';
import FocusTimer from './components/FocusTimer';
import MusicModule from './components/MusicModule';

const NOTE_COLORS = ['bg-amber-50', 'bg-blue-50', 'bg-emerald-50', 'bg-rose-50', 'bg-indigo-50'];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [activeTab, setActiveTab] = useState<AppTab>('tasks');
  
  // Modals/Editing
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  // Form states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.MEDIUM);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  
  // Features
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  const [focusingTask, setFocusingTask] = useState<Task | null>(null);

  // Load user
  useEffect(() => {
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    setIsAppLoaded(true);
  }, []);

  // Load data when user changes
  useEffect(() => {
    if (currentUser) {
      setTasks(storageService.getTasks(currentUser.uid));
      setNotes(storageService.getNotes(currentUser.uid));
    } else {
      setTasks([]);
      setNotes([]);
    }
  }, [currentUser]);

  // Persistence
  useEffect(() => {
    if (currentUser) {
      storageService.saveTasks(currentUser.uid, tasks);
    }
  }, [tasks, currentUser]);

  useEffect(() => {
    if (currentUser) {
      storageService.saveNotes(currentUser.uid, notes);
    }
  }, [notes, currentUser]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, percentage };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const dateFiltered = tasks.filter(t => t.dueDate === selectedDate);
    switch (filter) {
      case 'active': return dateFiltered.filter(t => !t.completed);
      case 'completed': return dateFiltered.filter(t => t.completed);
      default: return dateFiltered;
    }
  }, [tasks, filter, selectedDate]);

  // Auth Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('user', JSON.stringify(user));
  };
  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('user');
  };

  // Task Handlers
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !currentUser) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      userId: currentUser.uid,
      title: newTaskTitle,
      completed: false,
      priority: newTaskPriority,
      createdAt: Date.now(),
      dueDate: selectedDate
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    setIsAdding(false);
  };

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;
    setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
    setEditingTask(null);
  };

  // Note Handlers
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !currentUser) return;
    const newNote: Note = {
      id: crypto.randomUUID(),
      userId: currentUser.uid,
      title: newNoteTitle,
      content: newNoteContent,
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setNotes(prev => [newNote, ...prev]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsAdding(false);
  };

  const handleUpdateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !editingNote.title.trim()) return;
    const updated = { ...editingNote, updatedAt: Date.now() };
    setNotes(prev => prev.map(n => n.id === editingNote.id ? updated : n));
    setEditingNote(null);
  };

  const deleteNote = (id: string) => {
    if (confirm('Delete this note?')) {
      setNotes(prev => prev.filter(n => n.id !== id));
      setEditingNote(null);
    }
  };

  const handleAiSuggest = async () => {
    if (!aiInput.trim() || !currentUser) return;
    setIsAiLoading(true);
    try {
      const suggestions = await geminiService.suggestTasks(aiInput);
      const newTasks: Task[] = suggestions.map((s: any) => ({
        id: crypto.randomUUID(),
        userId: currentUser.uid,
        title: s.title,
        completed: false,
        priority: s.priority as Priority,
        createdAt: Date.now(),
        dueDate: selectedDate
      }));
      setTasks(prev => [...newTasks, ...prev]);
      setAiInput('');
    } catch (err) {
      alert("AI failed to suggest tasks.");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isAppLoaded) return null;
  if (!currentUser) return <Auth onLogin={handleLogin} />;

  const formattedSelectedDate = new Date(selectedDate).toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen pb-32 md:pb-24 bg-gray-50 flex flex-col items-center">
      <header className="w-full max-w-2xl px-6 pt-10 pb-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Day To Day</h1>
            <p className="text-slate-500 font-medium mt-1">Hello, {currentUser.displayName || 'Friend'}!</p>
          </div>
          <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors">
            Logout
          </button>
        </div>

        {activeTab === 'tasks' && (
          <div className="grid grid-cols-2 gap-4 animate-slideIn">
            <div className="bg-indigo-600 rounded-[1.75rem] p-5 text-white shadow-xl shadow-indigo-100 flex flex-col justify-between aspect-[1.5/1]">
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">Completion</div>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black">{stats.percentage}%</span>
                <div className="w-10 h-10 rounded-full border-4 border-indigo-400 border-t-white flex items-center justify-center">
                  <CheckIcon />
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-[1.75rem] p-5 flex flex-col justify-between aspect-[1.5/1]">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Pending</div>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black text-slate-900">{stats.pending}</span>
                <div className="text-slate-200"><ClockIcon /></div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="w-full max-w-2xl px-4 space-y-6">
        {activeTab === 'tasks' && (
          <div className="space-y-6 animate-slideIn">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-indigo-600 text-white rounded-lg"><SparklesIcon /></div>
                  <h2 className="font-bold text-slate-800">Smart Planning</h2>
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="What's the plan for today?" value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiSuggest()} className="flex-1 bg-white border-none rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-indigo-500 shadow-inner outline-none" />
                  <button onClick={handleAiSuggest} disabled={isAiLoading || !aiInput.trim()} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all min-w-[64px]">
                    {isAiLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Go'}
                  </button>
                </div>
              </div>
            </div>

            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">{formattedSelectedDate}</h2>
                <button onClick={() => setShowCalendar(!showCalendar)} className={`p-3 rounded-2xl transition-all ${showCalendar ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>
                  <CalendarIcon />
                </button>
              </div>
              {showCalendar && <Calendar selectedDate={selectedDate} onDateSelect={d => { setSelectedDate(d); setShowCalendar(false); }} tasks={tasks} />}
            </section>

            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 mx-2">
              {(['all', 'active', 'completed'] as FilterType[]).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>{f.toUpperCase()}</button>
              ))}
            </div>

            <div className="space-y-3 pb-8">
              {filteredTasks.length === 0 ? (
                <div className="py-20 text-center"><p className="text-slate-400 font-medium">No tasks yet.</p></div>
              ) : (
                filteredTasks.map(task => (
                  <div key={task.id} className={`task-enter group bg-white border border-slate-200 p-4 rounded-3xl flex items-center gap-4 shadow-sm ${task.completed ? 'opacity-60' : ''}`}>
                    <button onClick={() => setEditingTask(task)} className="flex-1 min-w-0 text-left">
                      <h3 className={`font-bold text-slate-800 truncate ${task.completed ? 'line-through text-slate-400' : ''}`}>{task.title}</h3>
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600">{task.priority}</span>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setFocusingTask(task); setActiveTab('focus'); }} className="p-2 text-slate-400 hover:text-indigo-600"><ClockIcon /></button>
                      <button onClick={() => { if(confirm('Delete?')) setTasks(t => t.filter(x => x.id !== task.id)) }} className="p-2 text-slate-400 hover:text-red-600"><TrashIcon /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'focus' && <div className="animate-slideIn"><FocusTimer currentTaskTitle={focusingTask?.title} /></div>}

        {activeTab === 'notes' && (
          <div className="animate-slideIn space-y-6">
            <header className="flex items-center justify-between px-2">
              <h2 className="text-3xl font-black text-slate-900">Notes</h2>
              <button onClick={() => setIsAdding(true)} className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><PlusIcon /></button>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-400 font-medium">Capture your thoughts. Add a note!</div>
              ) : (
                notes.map(note => (
                  <button 
                    key={note.id} 
                    onClick={() => setEditingNote(note)}
                    className={`${note.color} p-6 rounded-[2rem] text-left shadow-sm hover:shadow-md transition-all border border-black/5 flex flex-col min-h-[160px]`}
                  >
                    <h3 className="font-black text-slate-900 mb-2 truncate">{note.title || 'Untitled Note'}</h3>
                    <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed flex-1">{note.content || 'Empty note...'}</p>
                    <span className="text-[10px] uppercase font-bold text-slate-400 mt-4">{new Date(note.updatedAt).toLocaleDateString()}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'music' && <MusicModule />}
      </main>

      {/* FAB - Tasks tab only */}
      {activeTab === 'tasks' && !isAdding && !editingTask && (
        <button onClick={() => setIsAdding(true)} className="fixed bottom-24 md:bottom-28 right-8 w-16 h-16 bg-indigo-600 text-white rounded-3xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30">
          <PlusIcon />
        </button>
      )}

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 px-4 py-4 flex justify-around items-center z-40 md:max-w-2xl md:mx-auto md:mb-6 md:rounded-full md:shadow-2xl md:border-slate-200">
        <button onClick={() => setActiveTab('tasks')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'tasks' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <ListIcon /><span className="text-[8px] font-black uppercase tracking-widest">Tasks</span>
        </button>
        <button onClick={() => setActiveTab('focus')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'focus' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <ClockIcon /><span className="text-[8px] font-black uppercase tracking-widest">Focus</span>
        </button>
        <button onClick={() => setActiveTab('music')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'music' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <MusicalNoteIcon /><span className="text-[8px] font-black uppercase tracking-widest">Sounds</span>
        </button>
        <button onClick={() => setActiveTab('notes')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'notes' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <DocumentTextIcon /><span className="text-[8px] font-black uppercase tracking-widest">Notes</span>
        </button>
      </nav>

      {/* Task Modal */}
      {(activeTab === 'tasks' && (isAdding || editingTask)) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end md:items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 animate-slide-up">
            <h2 className="text-2xl font-black mb-8">{editingTask ? 'Edit Task' : 'New Task'}</h2>
            <form onSubmit={editingTask ? handleUpdateTask : handleAddTask} className="space-y-8">
              <input autoFocus type="text" placeholder="Task title..." className="w-full text-xl font-bold bg-slate-50 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-600" value={editingTask ? editingTask.title : newTaskTitle} onChange={e => editingTask ? setEditingTask({...editingTask, title: e.target.value}) : setNewTaskTitle(e.target.value)} />
              <div className="flex gap-4">
                <button type="button" onClick={() => { setIsAdding(false); setEditingTask(null); }} className="flex-1 py-4 text-slate-400 font-bold">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {(activeTab === 'notes' && (isAdding || editingNote)) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end md:items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 animate-slide-up max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">{editingNote ? 'Edit Note' : 'New Note'}</h2>
              {editingNote && <button onClick={() => deleteNote(editingNote.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-xl"><TrashIcon /></button>}
            </div>
            <form onSubmit={editingNote ? handleUpdateNote : handleAddNote} className="space-y-6 flex-1 flex flex-col overflow-hidden">
              <input autoFocus type="text" placeholder="Title" className="w-full text-xl font-bold border-none outline-none" value={editingNote ? editingNote.title : newNoteTitle} onChange={e => editingNote ? setEditingNote({...editingNote, title: e.target.value}) : setNewNoteTitle(e.target.value)} />
              <textarea placeholder="Write something..." className="w-full flex-1 text-slate-600 outline-none resize-none bg-slate-50 p-4 rounded-2xl min-h-[200px]" value={editingNote ? editingNote.content : newNoteContent} onChange={e => editingNote ? setEditingNote({...editingNote, content: e.target.value}) : setNewNoteContent(e.target.value)} />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setIsAdding(false); setEditingNote(null); }} className="flex-1 py-4 text-slate-400 font-bold">Discard</button>
                <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100">Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
