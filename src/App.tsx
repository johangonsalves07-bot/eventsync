/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Upload, 
  LogOut, 
  LayoutDashboard, 
  ClipboardList,
  ChevronRight,
  User as UserIcon,
  Image as ImageIcon,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type Role = 'organizer' | 'member';

interface User {
  id: string;
  name: string;
  role: Role;
}

interface Event {
  id: string;
  name: string;
  code: string;
  organizer_id: string;
}

interface Task {
  id: string;
  event_id: string;
  title: string;
  description: string;
  deadline: string;
  assigned_to: string;
  status: 'pending' | 'completed';
  proof_url?: string;
}

// --- Components ---

const Login = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('organizer');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      role
    };
    
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });

    localStorage.setItem('eventsync_user', JSON.stringify(user));
    onLogin(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold tracking-tight text-zinc-900 mb-2">EventSync</h1>
          <p className="text-zinc-500">Premium Event Collaboration Platform</p>
        </div>

        <div className="premium-card p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="premium-input"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">I am an...</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('organizer')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    role === 'organizer' 
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900' 
                      : 'border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-zinc-200'
                  }`}
                >
                  <LayoutDashboard className="mb-2" size={20} />
                  <div className="font-semibold">Organizer</div>
                  <div className="text-xs opacity-70">Create & manage events</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('member')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    role === 'member' 
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900' 
                      : 'border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-zinc-200'
                  }`}
                >
                  <Users className="mb-2" size={20} />
                  <div className="font-semibold">Member</div>
                  <div className="text-xs opacity-70">Join & complete tasks</div>
                </button>
              </div>
            </div>

            <button type="submit" className="premium-button w-full py-3 text-lg">
              Get Started
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const OrganizerDashboard = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<{id: string, name: string}[]>([]);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  // Form states
  const [newEventName, setNewEventName] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', deadline: '', assigned_to: '' });

  // Fake members for demo
  const availableMembers = [
    { id: 'm1', name: 'Aarav Sharma' },
    { id: 'm2', name: 'Priya Patel' },
    { id: 'm3', name: 'Rohan Mehta' },
    { id: 'm4', name: 'Sneha Gupta' }
  ];

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;

    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const newEvent: Event = {
      id: Date.now().toString(),
      name: newEventName.trim(),
      code,
      organizer_id: user.id
    };

    setEvents(prev => [newEvent, ...prev]);
    setNewEventName('');
    setIsCreatingEvent(false);
    
    // Auto select the newly created event
    setTimeout(() => setSelectedEvent(newEvent), 300);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !newTask.title.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      event_id: selectedEvent.id,
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      deadline: newTask.deadline,
      assigned_to: newTask.assigned_to,
      status: 'pending'
    };

    setTasks(prev => [...prev, task]);
    setNewTask({ title: '', description: '', deadline: '', assigned_to: '' });
    setIsCreatingTask(false);
  };

  // When selecting an event, load fake members
  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    setTasks([]); // Reset tasks for demo
    setMembers(availableMembers); // Show demo members
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Sidebar - Keep same as before */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-zinc-200 p-6 flex flex-col">
        <div className="mb-10">
          <h2 className="text-2xl font-serif font-bold text-zinc-900">EventSync</h2>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setSelectedEvent(null)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${!selectedEvent ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <LayoutDashboard size={18} />
            <span className="font-medium">Overview</span>
          </button>
          
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">My Events</div>
          
          {events.map(event => (
            <button 
              key={event.id}
              onClick={() => handleSelectEvent(event)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${selectedEvent?.id === event.id ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}
            >
              <Calendar size={18} />
              <span className="font-medium truncate">{event.name}</span>
            </button>
          ))}

          <button 
            onClick={() => setIsCreatingEvent(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-all mt-4"
          >
            <Plus size={18} />
            <span className="font-medium">New Event</span>
          </button>
        </nav>

        <div className="pt-6 border-t border-zinc-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold">
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-zinc-900 truncate">{user.name}</div>
              <div className="text-xs text-zinc-500 capitalize">{user.role}</div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content - Rest remains mostly same, but with fixes */}
      <main className="ml-64 p-10">
        <AnimatePresence mode="wait">
          {!selectedEvent ? (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <header className="mb-10">
                <h1 className="text-4xl font-serif font-bold text-zinc-900 mb-2">Welcome back, {user.name}</h1>
                <p className="text-zinc-500 italic">Manage your events and track team progress.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="premium-card p-6 bg-emerald-500 text-white border-none">
                  <div className="text-emerald-100 text-sm font-medium mb-1">Active Events</div>
                  <div className="text-4xl font-bold">{events.length}</div>
                </div>
                <div className="premium-card p-6">
                  <div className="text-zinc-500 text-sm font-medium mb-1">Total Members</div>
                  <div className="text-4xl font-bold text-zinc-900">4</div>
                </div>
                <div className="premium-card p-6">
                  <div className="text-zinc-500 text-sm font-medium mb-1">Tasks Completed</div>
                  <div className="text-4xl font-bold text-zinc-900">--</div>
                </div>
              </div>

              <div className="premium-card overflow-hidden">
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                  <h3 className="font-bold text-zinc-900">Recent Events</h3>
                </div>
                <div className="divide-y divide-zinc-100">
                  {events.length === 0 ? (
                    <div className="p-16 text-center text-zinc-400 italic">
                      No events created yet. Click "New Event" to get started.
                    </div>
                  ) : (
                    events.map(event => (
                      <div key={event.id} className="p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                            <Calendar size={24} />
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900">{event.name}</div>
                            <div className="text-xs font-mono text-zinc-500">CODE: {event.code}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleSelectEvent(event)}
                          className="p-2 rounded-lg hover:bg-zinc-200 text-zinc-400 transition-colors"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            // Event Details view (same as before, but with better task display)
            <motion.div key="event-details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <header className="mb-10 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-3 text-zinc-500 text-sm font-medium mb-2">
                    <button onClick={() => setSelectedEvent(null)} className="hover:text-zinc-900">Events</button>
                    <ChevronRight size={14} />
                    <span className="text-zinc-900">{selectedEvent.name}</span>
                  </div>
                  <h1 className="text-4xl font-serif font-bold text-zinc-900">{selectedEvent.name}</h1>
                  <div className="mt-2 flex items-center gap-4">
                    <span className="px-3 py-1 bg-zinc-900 text-white text-xs font-mono rounded-full">CODE: {selectedEvent.code}</span>
                    <span className="text-zinc-500 text-sm flex items-center gap-1"><Users size={14} /> {members.length} Members</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCreatingTask(true)}
                  className="premium-button flex items-center gap-2"
                >
                  <Plus size={18} /> Assign Task
                </button>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="premium-card">
                    <div className="p-6 border-b border-zinc-100">
                      <h3 className="font-bold text-zinc-900">Tasks</h3>
                    </div>
                    <div className="divide-y divide-zinc-100">
                      {tasks.length === 0 ? (
                        <div className="p-12 text-center text-zinc-400 italic">No tasks assigned yet. Create one above.</div>
                      ) : (
                        tasks.map(task => (
                          <div key={task.id} className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-bold text-zinc-900">{task.title}</h4>
                                <p className="text-zinc-500 text-sm mt-1">{task.description}</p>
                              </div>
                              <span className="px-3 py-1 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-full">
                                PENDING
                              </span>
                            </div>
                            <div className="mt-4 text-sm text-zinc-500 flex items-center gap-6">
                              <div>Deadline: {new Date(task.deadline).toLocaleDateString()}</div>
                              <div>Assigned to: {availableMembers.find(m => m.id === task.assigned_to)?.name || 'Unassigned'}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="premium-card">
                    <div className="p-6 border-b border-zinc-100">
                      <h3 className="font-bold text-zinc-900">Team Members</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      {members.map(member => (
                        <div key={member.id} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                            {member.name[0]}
                          </div>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Event Modal */}
        <AnimatePresence>
          {isCreatingEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
              >
                <h2 className="text-2xl font-serif font-bold mb-6">Create New Event</h2>
                <form onSubmit={handleCreateEvent} className="space-y-6">
                  <input 
                    type="text" 
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    className="premium-input"
                    placeholder="Event Name (e.g. Tech Fest 2026)"
                    required
                  />
                  <div className="flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => setIsCreatingEvent(false)} 
                      className="premium-button-outline flex-1"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="premium-button flex-1">
                      Create Event
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Create Task Modal - Same as before but simplified */}
        <AnimatePresence>
          {isCreatingTask && selectedEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg"
              >
                <h2 className="text-2xl font-serif font-bold mb-6">Assign New Task</h2>
                <form onSubmit={handleCreateTask} className="space-y-6">
                  <input 
                    type="text" 
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="premium-input"
                    placeholder="Task Title"
                    required
                  />
                  <textarea 
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    className="premium-input min-h-[100px]"
                    placeholder="Task Description"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-zinc-600 mb-1 block">Deadline</label>
                      <input 
                        type="datetime-local" 
                        value={newTask.deadline}
                        onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                        className="premium-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-600 mb-1 block">Assign To</label>
                      <select 
                        value={newTask.assigned_to}
                        onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                        className="premium-input"
                        required
                      >
                        <option value="">Select Member</option>
                        {availableMembers.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setIsCreatingTask(false)} className="premium-button-outline flex-1">Cancel</button>
                    <button type="submit" className="premium-button flex-1">Assign Task</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const MemberDashboard = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isJoiningEvent, setIsJoiningEvent] = useState(false);
  const [eventCode, setEventCode] = useState('');
  const [uploadingTask, setUploadingTask] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Demo events pool (so members can join events created by organizer)
  const [allEvents, setAllEvents] = useState<Event[]>([]);

  const availableMembers = [
    { id: 'm1', name: 'Aarav Sharma' },
    { id: 'm2', name: 'Priya Patel' },
    { id: 'm3', name: 'Rohan Mehta' },
    { id: 'm4', name: 'Sneha Gupta' }
  ];

  // Simulate fetching joined events
  const fetchJoinedEvents = () => {
    // For demo, we'll show events that were "joined"
    setEvents(allEvents.filter(e => Math.random() > 0.5)); // Random for demo
  };

  const handleJoinEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventCode.trim()) return;

    const upperCode = eventCode.trim().toUpperCase();

    // Simulate finding event by code (works with events created in Organizer)
    const foundEvent = allEvents.find(ev => ev.code === upperCode);

    if (foundEvent) {
      setEvents(prev => {
        if (prev.some(e => e.id === foundEvent.id)) return prev;
        return [...prev, foundEvent];
      });
      setEventCode('');
      setIsJoiningEvent(false);
      alert(`Successfully joined: ${foundEvent.name}`);
    } else {
      alert('Invalid Event Code! Ask your Organizer for the correct code.');
    }
  };

  const handleFileUpload = (taskId: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit');
      return;
    }

    setUploadingTask(taskId);
    
    // Simulate upload delay
    setTimeout(() => {
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, status: 'completed', proof_url: URL.createObjectURL(file) } 
            : task
        )
      );
      setUploadingTask(null);
      alert('Proof submitted successfully!');
    }, 1200);
  };

  // When organizer creates events, we make them available globally for demo
  useEffect(() => {
    // This is a simple way to share events between Organizer and Member in same browser
    const handleStorageChange = () => {
      const savedEvents = localStorage.getItem('eventsync_all_events');
      if (savedEvents) setAllEvents(JSON.parse(savedEvents));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-zinc-200 p-6 flex flex-col">
        <div className="mb-10">
          <h2 className="text-2xl font-serif font-bold text-zinc-900">EventSync</h2>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setSelectedEvent(null)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${!selectedEvent ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}
          >
            <LayoutDashboard size={18} />
            <span className="font-medium">My Tasks</span>
          </button>
          
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Joined Events</div>
          
          {events.map(event => (
            <button 
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${selectedEvent?.id === event.id ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}
            >
              <Calendar size={18} />
              <span className="font-medium truncate">{event.name}</span>
            </button>
          ))}

          <button 
            onClick={() => setIsJoiningEvent(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-all mt-4"
          >
            <Plus size={18} />
            <span className="font-medium">Join Event</span>
          </button>
        </nav>

        <div className="pt-6 border-t border-zinc-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold">
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-zinc-900 truncate">{user.name}</div>
              <div className="text-xs text-zinc-500 capitalize">{user.role}</div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="ml-64 p-10">
        <AnimatePresence mode="wait">
          {!selectedEvent ? (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <header className="mb-10">
                <h1 className="text-4xl font-serif font-bold text-zinc-900 mb-2">Hello, {user.name}</h1>
                <p className="text-zinc-500 italic">Select an event to view your assigned tasks.</p>
              </header>

              {events.length === 0 ? (
                <div className="premium-card p-16 text-center">
                  <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar size={40} className="text-zinc-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-3">No Events Joined Yet</h3>
                  <p className="text-zinc-500 mb-8 max-w-sm mx-auto">
                    Join an event using the 6-digit code provided by your organizer.
                  </p>
                  <button 
                    onClick={() => setIsJoiningEvent(true)}
                    className="premium-button text-lg px-10 py-3"
                  >
                    Join Your First Event
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.map(event => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="premium-card p-8 text-left hover:border-emerald-500 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <Calendar size={28} />
                        </div>
                        <ChevronRight className="text-zinc-300 group-hover:text-emerald-500 transition" />
                      </div>
                      <h3 className="text-2xl font-bold text-zinc-900 mb-2">{event.name}</h3>
                      <p className="font-mono text-sm text-zinc-500">CODE: {event.code}</p>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="event-tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <header className="mb-10">
                <div className="flex items-center gap-3 text-zinc-500 text-sm font-medium mb-2">
                  <button onClick={() => setSelectedEvent(null)} className="hover:text-zinc-900">My Events</button>
                  <ChevronRight size={14} />
                  <span className="text-zinc-900">{selectedEvent.name}</span>
                </div>
                <h1 className="text-4xl font-serif font-bold text-zinc-900">{selectedEvent.name}</h1>
              </header>

              <div className="space-y-8">
                {tasks.length === 0 ? (
                  <div className="premium-card p-16 text-center text-zinc-500">
                    No tasks assigned to you in this event yet.
                  </div>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} className="premium-card p-8">
                      <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-2xl font-bold">{task.title}</h3>
                            <span className={`px-4 py-1 rounded-full text-sm font-bold ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {task.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-zinc-600 leading-relaxed">{task.description}</p>
                          <div className="mt-6 text-sm text-zinc-500">
                            Deadline: <span className="font-medium">{new Date(task.deadline).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="w-full lg:w-80">
                          {task.status === 'completed' && task.proof_url ? (
                            <div className="rounded-2xl overflow-hidden border border-zinc-200">
                              <img src={task.proof_url} alt="Proof" className="w-full" />
                            </div>
                          ) : (
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingTask === task.id}
                              className="w-full premium-button py-6 flex items-center justify-center gap-3 text-lg"
                            >
                              {uploadingTask === task.id ? (
                                <>Uploading...</>
                              ) : (
                                <>📤 Submit Proof</>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Join Event Modal */}
        <AnimatePresence>
          {isJoiningEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-8 w-full max-w-md"
              >
                <h2 className="text-3xl font-serif font-bold mb-2">Join Event</h2>
                <p className="text-zinc-500 mb-8">Enter the 6-digit code from your Organizer</p>
                
                <form onSubmit={handleJoinEvent}>
                  <input 
                    type="text" 
                    value={eventCode}
                    onChange={(e) => setEventCode(e.target.value)}
                    className="premium-input text-3xl font-mono tracking-widest text-center mb-6"
                    placeholder="ABC123"
                    maxLength={6}
                    required
                  />
                  <div className="flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => setIsJoiningEvent(false)}
                      className="premium-button-outline flex-1 py-4"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="premium-button flex-1 py-4">
                      Join Event
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && uploadingTask) handleFileUpload(uploadingTask, file);
          }}
        />
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('eventsync_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('eventsync_user');
    setUser(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <Loader2 className="animate-spin text-emerald-500" size={40} />
    </div>
  );

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return user.role === 'organizer' ? (
    <OrganizerDashboard user={user} onLogout={handleLogout} />
  ) : (
    <MemberDashboard user={user} onLogout={handleLogout} />
  );
}
