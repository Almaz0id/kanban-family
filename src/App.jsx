import React, { useState, useEffect } from 'react';
import { 
  Plus, CheckSquare, Square, Trash2, Edit3, Settings, 
  Calendar, CheckCircle2, Circle, Sun, Home, Moon, X, 
  ChevronRight, AlertCircle, RefreshCw, LogOut, User 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

// ==========================================
// FIREBASE CONFIG & INITIALIZATION
// ==========================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase init error:", e);
}

// ==========================================
// CONSTANTS & METADATA
// ==========================================
const SECTIONS_META = [
  { id: 'morning', title: 'Утро', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'day', title: 'Быт / Рутина', icon: Home, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { id: 'evening', title: 'Вечер', icon: Moon, color: 'text-purple-500', bg: 'bg-purple-500/10' }
];

const DEFAULT_TEMPLATE = [
  { id: 't1', section: 'morning', text: 'Заправить постель' },
  { id: 't2', section: 'morning', text: 'Выпить стакан воды' },
  { id: 't3', section: 'day', text: 'Проверить порядок на кухне' },
  { id: 't4', section: 'evening', text: 'Подготовить одежду на завтра' }
];

// ==========================================
// SUBCOMPONENT: TASK MODAL
// ==========================================
function TaskModal({ task, isCreating, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(
    task || {
      id: `task_${Date.now()}`,
      title: '',
      section: 'morning',
      priority: 'normal',
      subtasks: [],
      autoClose: true,
      completed: false
    }
  );
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    const newSt = {
      id: `st_${Date.now()}`,
      text: newSubtaskText.trim(),
      completed: false
    };
    setForm({
      ...form,
      subtasks: [...(form.subtasks || []), newSt]
    });
    setNewSubtaskText('');
  };

  const handleToggleSub = (id) => {
    const updated = (form.subtasks || []).map((st) =>
      st.id === id ? { ...st, completed: !st.completed } : st
    );
    
    let completedStatus = form.completed;
    if (form.autoClose !== false && updated.length > 0) {
      const allDone = updated.every((st) => st.completed);
      if (allDone) completedStatus = true;
    }

    setForm({ ...form, subtasks: updated, completed: completedStatus });
  };

  const handleRemoveSub = (id) => {
    setForm({
      ...form,
      subtasks: (form.subtasks || []).filter((st) => st.id !== id)
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl my-auto max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {isCreating ? '➕ Новая задача' : '✏️ Редактирование задачи'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Название задачи
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Что нужно сделать?"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              autoFocus
            />
          </div>

          {/* Section & Priority Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Раздел / Время
              </label>
              <select
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100"
              >
                <option value="morning">🌅 Утро</option>
                <option value="day">🧹 Быт</option>
                <option value="evening">🌙 Вечер</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Приоритет
              </label>
              <select
                value={form.priority || 'normal'}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100"
              >
                <option value="low">🟢 Обычный</option>
                <option value="normal">🟡 Средний</option>
                <option value="high">🔴 Важный</option>
              </select>
            </div>
          </div>

          {/* Subtasks Builder */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Чек-лист подзадач ({(form.subtasks || []).length})
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoClose !== false}
                  onChange={(e) => setForm({ ...form, autoClose: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-indigo-600"
                />
                <span>Авто-закрытие задачи при 100%</span>
              </label>
            </div>

            {(form.subtasks || []).length > 0 && (
              <div className="space-y-1.5 mb-2.5 max-h-40 overflow-y-auto pr-1">
                {(form.subtasks || []).map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSub(st.id)}
                      className="flex items-center gap-2 text-left flex-1 hover:opacity-80 transition"
                    >
                      {st.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className={st.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}>
                        {st.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSub(st.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                placeholder="Добавить пошаговое действие..."
                className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                + Шаг
              </button>
            </form>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          {!isCreating && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(form.id)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Удалить</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={() => onSave(form)}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition"
            >
              Сохранить
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// SUBCOMPONENT: MASTER DAILY TEMPLATE MODAL
// ==========================================
function TemplateModal({ items, onClose, onSave }) {
  const [templateItems, setTemplateItems] = useState([...items]);
  const [newText, setNewText] = useState('');
  const [newSection, setNewSection] = useState('morning');

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const newItem = {
      id: `tpl_${Date.now()}`,
      section: newSection,
      text: newText.trim()
    };
    setTemplateItems([...templateItems, newItem]);
    setNewText('');
  };

  const handleRemoveItem = (id) => {
    setTemplateItems(templateItems.filter((i) => i.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl my-auto max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Settings className="w-5 h-5 text-emerald-500" />
            Настройка базового шаблона дня
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Изменения зафиксируются в вашем ежедневном расписании. Каждый новый день будет автоматически создаваться с этими регулярными пунктами.
        </p>

        {/* List grouped by section */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
          {SECTIONS_META.map((sec) => {
            const secList = templateItems.filter((i) => i.section === sec.id);
            return (
              <div key={sec.id} className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{sec.title}</h4>
                {secList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <span className="text-slate-700 dark:text-slate-200">{item.text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Add Template Item Form */}
        <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
          <select
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            className="px-2.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100"
          >
            <option value="morning">🌅 Утро</option>
            <option value="day">🧹 Быт</option>
            <option value="evening">🌙 Вечер</option>
          </select>
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Название нового регулярного дела..."
            className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
          >
            +
          </button>
        </form>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
          >
            Отмена
          </button>
          <button
            onClick={() => onSave(templateItems)}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
          >
            Сохранить шаблон
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 10));
  const [tasks, setTasks] = useState([]);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  
  const [editingTask, setEditingTask] = useState(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Auth state listener
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        signInAnonymously(auth).catch((err) => console.error("Anon auth error:", err));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch or init daily data & template
  useEffect(() => {
    if (!user || !db) return;

    // Load template
    const tplRef = doc(db, 'users', user.uid, 'settings', 'template');
    getDoc(tplRef).then((snapshot) => {
      if (snapshot.exists() && snapshot.data().items) {
        setTemplate(snapshot.data().items);
      }
    });

    // Listen to current date tasks
    const dayRef = doc(db, 'users', user.uid, 'days', currentDate);
    const unsubscribe = onSnapshot(dayRef, (snapshot) => {
      if (snapshot.exists()) {
        setTasks(snapshot.data().tasks || []);
      } else {
        // Init day with template if empty
        const initialTasks = DEFAULT_TEMPLATE.map((t, idx) => ({
          id: `init_${idx}_${Date.now()}`,
          title: t.text,
          section: t.section,
          completed: false,
          subtasks: [],
          priority: 'normal'
        }));
        setTasks(initialTasks);
        setDoc(dayRef, { tasks: initialTasks }, { merge: true });
      }
    });

    return () => unsubscribe();
  }, [user, currentDate]);

  // Save tasks helper
  const saveTasksToFirebase = async (newTasks) => {
    setTasks(newTasks);
    if (!user || !db) return;
    const dayRef = doc(db, 'users', user.uid, 'days', currentDate);
    await setDoc(dayRef, { tasks: newTasks }, { merge: true });
  };

  const handleToggleTask = (id) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    saveTasksToFirebase(updated);
  };

  const handleSaveTask = (taskForm) => {
    const exists = tasks.some((t) => t.id === taskForm.id);
    let updated;
    if (exists) {
      updated = tasks.map((t) => (t.id === taskForm.id ? taskForm : t));
    } else {
      updated = [...tasks, taskForm];
    }
    saveTasksToFirebase(updated);
    setEditingTask(null);
    setIsCreatingTask(false);
  };

  const handleDeleteTask = (id) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasksToFirebase(updated);
    setEditingTask(null);
  };

  const handleSaveTemplate = async (newItems) => {
    setTemplate(newItems);
    setIsTemplateModalOpen(false);
    if (!user || !db) return;
    const tplRef = doc(db, 'users', user.uid, 'settings', 'template');
    await setDoc(tplRef, { items: newItems }, { merge: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base">Семейный Канбан</h1>
            <p className="text-xs text-slate-400">План на день и регулярные задачи</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs bg-slate-800 border border-slate-700 font-medium text-slate-200 focus:outline-none"
          />
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
            title="Настройка шаблона"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Board Layout */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-4">
        {SECTIONS_META.map((sec) => {
          const sectionTasks = tasks.filter((t) => t.section === sec.id);
          const Icon = sec.icon;

          return (
            <div
              key={sec.id}
              className="bg-slate-900/60 rounded-3xl p-4 border border-slate-800/80 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${sec.bg} ${sec.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-sm">{sec.title}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                    {sectionTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setEditingTask({ section: sec.id, subtasks: [], autoClose: true, priority: 'normal', title: '' });
                    setIsCreatingTask(true);
                  }}
                  className="p-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {sectionTasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    Нет задач в этом разделе
                  </div>
                ) : (
                  sectionTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-2xl border transition flex flex-col gap-2 bg-slate-900/90 ${
                        task.completed
                          ? 'border-emerald-500/20 opacity-60'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id)}
                          className="flex items-start gap-2.5 text-left flex-1"
                        >
                          {task.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={`text-xs font-medium leading-relaxed ${
                              task.completed ? 'line-through text-slate-400' : 'text-slate-200'
                            }`}
                          >
                            {task.title}
                          </span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setIsCreatingTask(false);
                          }}
                          className="text-slate-500 hover:text-slate-300 p-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subtasks progress indicator if any */}
                      {(task.subtasks || []).length > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pl-6">
                          <span>Шаги:</span>
                          <span className="font-semibold text-indigo-400">
                            {task.subtasks.filter((st) => st.completed).length} / {task.subtasks.length}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* Modals */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          isCreating={isCreatingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}

      {isTemplateModalOpen && (
        <TemplateModal
          items={template}
          onClose={() => setIsTemplateModalOpen(false)}
          onSave={handleSaveTemplate}
        />
      )}
    </div>
  );
}
