import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Home, 
  Calendar as CalendarIcon, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Trash2, 
  Users, 
  CheckSquare, 
  Square, 
  Sparkles, 
  ArrowUpDown, 
  Sun, 
  Moon, 
  X, 
  Copy, 
  Check,
  ListTodo,
  ShoppingCart,
  Wrench,
  Search,
  Archive,
  Repeat,
  ExternalLink,
  Download,
  Upload,
  Play,
  Pause,
  RotateCcw,
  FileText,
  Hourglass,
  Store,
  Zap,
  Smartphone,
  Code2,
  CalendarPlus,
  Terminal,
  FolderGit2
} from 'lucide-react';

// ==========================================
// FIREBASE INITIALIZATION (MANDATORY PATTERN)
// ==========================================
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'kanban-family-app';

// ==========================================
// CONSTANTS & CONFIGURATION
// ==========================================
const COLUMNS = [
  { id: 'backlog', title: '1. Бэклог', subtitle: 'Все идеи и задачи в сыром виде', color: 'slate' },
  { id: 'todo', title: '2. План на неделю', subtitle: 'Буфер задач на текущую неделю', color: 'blue' },
  { id: 'in_progress', title: '3. В работе', subtitle: 'Делаем прямо сейчас (макс. 4)', color: 'indigo', wipLimit: 4 },
  { id: 'waiting', title: '4. Ожидание', subtitle: 'Ждём ответа, доставки, анализов', color: 'amber' },
  { id: 'done', title: '5. Готово', subtitle: 'Выполненные задачи', color: 'emerald' }
];

const CATEGORIES = [
  { id: 'all', label: 'Все задачи', badge: 'bg-slate-600 text-white', lightBadge: 'bg-slate-100 text-slate-800 border-slate-300', dot: 'bg-slate-400' },
  { id: 'work', label: 'Работа', emoji: '🟦', badge: 'bg-blue-600 text-white', lightBadge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30', dot: 'bg-blue-500' },
  { id: 'home', label: 'Дом / Быт', emoji: '🟩', badge: 'bg-emerald-600 text-white', lightBadge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' },
  { id: 'health', label: 'Здоровье', emoji: '🟥', badge: 'bg-rose-600 text-white', lightBadge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30', dot: 'bg-rose-500' },
  { id: 'hobby', label: 'Развитие / Хобби', emoji: '🟨', badge: 'bg-amber-500 text-white', lightBadge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  { id: 'admin', label: 'Административное', emoji: '🟪', badge: 'bg-purple-600 text-white', lightBadge: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30', dot: 'bg-purple-500' }
];

const RECURRENCE_OPTIONS = [
  { id: 'none', label: 'Разово (без повтора)' },
  { id: 'weekly', label: '🔄 Еженедельно (+7 дн.)' },
  { id: 'monthly', label: '📅 Ежемесячно (+1 мес.)' }
];

const QUICK_FORM_PRESETS = [
  {
    id: 'doctor',
    label: '🩺 Запись к врачу / Анализы',
    title: 'Пройти чек-ап и сдать анализы',
    category: 'health',
    status: 'todo',
    recurrence: 'none',
    notes: 'Взять направление и результаты прошлых обследований',
    subtasks: ['Записаться в клинику онлайн', 'Сдать анализы утром натощак', 'Получить результаты на почту']
  },
  {
    id: 'bills',
    label: '🧾 Оплата счетов',
    title: 'Оплатить коммунальные счета и интернет',
    category: 'admin',
    status: 'todo',
    recurrence: 'monthly',
    notes: 'Проверить квитанции за воду, электричество и домашний интернет',
    subtasks: ['Оплатить электроэнергию и воду', 'Оплатить домашний интернет и связь', 'Сохранить чеки об оплате']
  },
  {
    id: 'sprint',
    label: '💻 Рабочий спринт / Тест',
    title: 'Провести нагрузочное тестирование релиза',
    category: 'work',
    status: 'in_progress',
    recurrence: 'none',
    notes: 'Проверить метрики задержки и стабильность сервиса под пиковой нагрузкой',
    subtasks: ['Подготовить тестовые сценарии и профили', 'Запустить прогон нагрузки', 'Собрать графики и отправить отчёт команде']
  },
  {
    id: 'trip',
    label: '✈️ Поездка / Документы',
    title: 'Подготовить документы и бронь к поездке',
    category: 'admin',
    status: 'todo',
    recurrence: 'none',
    notes: 'Проверить сроки действия документов и страховки',
    subtasks: ['Сделать копии паспортов и документов', 'Проверить бронирование и билеты', 'Собрать аптечку и зарядки']
  }
];

const SHOPPING_AISLES = [
  { id: 'produce', label: '🥦 Овощи и фрукты' },
  { id: 'dairy', label: '🥛 Молочка и яйца' },
  { id: 'meat', label: '🥩 Мясо и рыба' },
  { id: 'grocery', label: '🥖 Бакалея и хлеб' },
  { id: 'household', label: '🧼 Бытовая химия и дом' },
  { id: 'other', label: '📦 Разное' }
];

const SHOPPING_STORES = ['Любой', 'Pingo Doce', 'Continente', 'Lidl', 'Aldi', 'Рынок / Аптека'];

const DEFAULT_DAILY_TEMPLATE = [
  { id: 'm1', section: 'morning', text: 'Выпить витамины и стакан воды' },
  { id: 'm2', section: 'morning', text: 'Проветрить спальню и заправить кровать' },
  { id: 'm3', section: 'morning', text: 'Разминка / зарядка 10 мин' },
  { id: 'd1', section: 'day', text: 'Запустить посудомойку / робот-пылесос' },
  { id: 'd2', section: 'day', text: 'Полить цветы и проверить порядок дома' },
  { id: 'd3', section: 'day', text: 'Приготовить вкусный домашний ужин с Камиллой' },
  { id: 'e1', section: 'evening', text: 'Вынести мусор и подготовить кухню к утру' },
  { id: 'e2', section: 'evening', text: 'Разобрать чистую посуду' },
  { id: 'e3', section: 'evening', text: 'Совместный отдых / прогулка с Камиллой' }
];

const SECTIONS_META = [
  { id: 'morning', title: '🌅 Утро', desc: 'Бодрое начало дня' },
  { id: 'day', title: '🧹 Быт в течение дня', desc: 'Поддержание чистоты и уюта' },
  { id: 'evening', title: '🌙 Вечер', desc: 'Завершение дел и отдых с Камиллой' }
];

const DEFAULT_MAINTENANCE_ITEMS = [
  { id: 'maint_1', title: 'Засыпать соль и очиститель в посудомойку', intervalDays: 30, category: 'Бытовая техника', icon: '🍽️' },
  { id: 'maint_2', title: 'Промыть фильтр и контейнер пылесоса', intervalDays: 14, category: 'Бытовая техника', icon: '🤖' },
  { id: 'maint_3', title: 'Смазка цепи и проверка давления шин велосипеда', intervalDays: 45, category: 'Спорт и транспорт', icon: '🚲' },
  { id: 'maint_4', title: 'Оплата коммунальных счетов и интернета', intervalDays: 30, category: 'Финансы и счета', icon: '🧾' },
  { id: 'maint_5', title: 'Бэкап семейного фотоархива и важных документов', intervalDays: 60, category: 'Цифровая гигиена', icon: '💾' },
  { id: 'maint_6', title: 'Смена постельного белья и полотенец', intervalDays: 10, category: 'Дом и уют', icon: '🛏️' }
];

// ==========================================
// DATE, GOOGLE CALENDAR & ICS HELPERS
// ==========================================
const toDateStr = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addDaysStr = (baseDateStr, offsetDays) => {
  if (!baseDateStr) return toDateStr(new Date());
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + offsetDays);
  return toDateStr(dt);
};

const addMonthsStr = (baseDateStr, offsetMonths) => {
  if (!baseDateStr) return toDateStr(new Date());
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const dt = new Date(y, m - 1 + offsetMonths, d);
  return toDateStr(dt);
};

const formatRussianDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' });
};

const daysBetweenDates = (dateStr1, dateStr2) => {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const dt1 = new Date(y1, m1 - 1, d1);
  const dt2 = new Date(y2, m2 - 1, d2);
  return Math.round((dt1.getTime() - dt2.getTime()) / (1000 * 60 * 60 * 24));
};

// Build direct Google Calendar event template URL
const buildGoogleCalendarUrl = (task) => {
  const dateStr = task.deadline || toDateStr(new Date());
  const cleanDate = dateStr.replace(/-/g, '');
  let datesParam = '';

  if (task.time) {
    const [hh, mm] = task.time.split(':');
    const startH = String(hh || '10').padStart(2, '0');
    const startM = String(mm || '00').padStart(2, '0');
    const endH = String((Number(startH) + 1) % 24).padStart(2, '0');
    datesParam = `${cleanDate}T${startH}${startM}00/${cleanDate}T${endH}${startM}00`;
  } else {
    const nextDay = addDaysStr(dateStr, 1).replace(/-/g, '');
    datesParam = `${cleanDate}/${nextDay}`;
  }

  const catObj = CATEGORIES.find((c) => c.id === task.category);
  const subtasksText = (task.subtasks || []).length > 0
    ? '\n\nПодзадачи:\n' + task.subtasks.map((s) => `${s.completed ? '☑' : '☐'} ${s.text}`).join('\n')
    : '';
  const linksText = (task.links || []).length > 0
    ? '\n\nСсылки:\n' + task.links.map((l) => `${l.title}: ${l.url}`).join('\n')
    : '';
  const waitingText = task.waitingFor ? `\n⏳ Ожидание: ${task.waitingFor}` : '';

  const details = `Сфера: ${catObj ? catObj.label : 'Общее'}${waitingText}${task.notes ? '\n\n' + task.notes : ''}${subtasksText}${linksText}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: task.title || 'Задача из Канбана',
    dates: datesParam,
    details
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Generate valid iCalendar (.ics) file content for all tasks with deadlines
const generateICSFileContent = (tasks) => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Personal & Family Life OS//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  tasks.filter((t) => t.deadline && !t.archived).forEach((task) => {
    const cleanDate = task.deadline.replace(/-/g, '');
    const nextDate = addDaysStr(task.deadline, 1).replace(/-/g, '');
    const subList = (task.subtasks || []).map((s) => `- ${s.text}`).join('\\n');
    const desc = `${(task.notes || '').replace(/\n/g, '\\n')}${subList ? '\\nПодзадачи:\\n' + subList : ''}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${task.id}@family-kanban.local`);
    lines.push(`DTSTAMP:${cleanDate}T080000Z`);
    if (task.time) {
      const [hh, mm] = task.time.split(':');
      const startH = String(hh || '10').padStart(2, '0');
      const startM = String(mm || '00').padStart(2, '0');
      const endH = String((Number(startH) + 1) % 24).padStart(2, '0');
      lines.push(`DTSTART:${cleanDate}T${startH}${startM}00`);
      lines.push(`DTEND:${cleanDate}T${endH}${startM}00`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${cleanDate}`);
      lines.push(`DTEND;VALUE=DATE:${nextDate}`);
    }
    lines.push(`SUMMARY:${task.title}`);
    if (desc) lines.push(`DESCRIPTION:${desc}`);
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-PT60M');
    lines.push('ACTION:DISPLAY');
    lines.push('DESCRIPTION:Напоминание о задаче');
    lines.push('END:VALARM');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

const getDeadlineStyles = (deadlineStr, status) => {
  if (!deadlineStr || status === 'done') {
    return {
      cardGradient: 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80',
      badge: null,
      daysDiff: 9999
    };
  }

  const todayStr = toDateStr(new Date());
  const days = daysBetweenDates(deadlineStr, todayStr);

  if (days < 0) {
    return {
      cardGradient: 'bg-gradient-to-br from-rose-500/20 via-red-500/10 to-white dark:from-rose-950/75 dark:via-red-900/30 dark:to-slate-800/95 border-rose-500/70 shadow-sm shadow-rose-500/10',
      badge: {
        text: `🚨 ПРОСРОЧЕНО на ${Math.abs(days)} дн.`,
        className: 'bg-rose-600 text-white font-semibold animate-pulse'
      },
      daysDiff: days
    };
  }
  if (days === 0) {
    return {
      cardGradient: 'bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-white dark:from-orange-950/75 dark:via-amber-900/30 dark:to-slate-800/95 border-orange-500/70 shadow-sm shadow-orange-500/10',
      badge: {
        text: '🔥 ГОРИТ! Сегодня',
        className: 'bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold'
      },
      daysDiff: days
    };
  }
  if (days <= 3) {
    return {
      cardGradient: 'bg-gradient-to-br from-amber-400/15 via-yellow-400/5 to-white dark:from-amber-950/50 dark:via-yellow-900/20 dark:to-slate-800/95 border-amber-500/50',
      badge: {
        text: `🟡 Поджимает: ${days} дн.`,
        className: 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-medium'
      },
      daysDiff: days
    };
  }
  return {
    cardGradient: 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white dark:from-emerald-950/35 dark:via-slate-800/90 dark:to-slate-800/95 border-emerald-500/30',
    badge: {
      text: `🟢 В запасе: ${days} дн.`,
      className: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-medium'
    },
    daysDiff: days
  };
};

// Initial sample tasks so user sees all features immediately
const getInitialSampleTasks = (familyCode) => {
  const today = toDateStr(new Date());
  return [
    {
      id: `${familyCode}_sample_1`,
      familyCode,
      title: 'Провести нагрузочное тестирование и подготовить отчёт',
      category: 'work',
      status: 'in_progress',
      deadline: today,
      time: '14:00',
      recurrence: 'none',
      waitingFor: '',
      autoClose: true,
      notes: 'Проверить стабильность сервера при пиковой нагрузке и собрать метрики',
      links: [{ id: 'l1', title: 'Дашборд мониторинга', url: 'https://grafana.com' }],
      subtasks: [
        { id: 's1', text: 'Настроить сценарии нагрузки', completed: true },
        { id: 's2', text: 'Запустить тест на 1 час', completed: true },
        { id: 's3', text: 'Выгрузить графики и отправить команде', completed: false }
      ],
      archived: false,
      createdAt: Date.now() - 3600000 * 5
    },
    {
      id: `${familyCode}_sample_2`,
      familyCode,
      title: 'Получить результаты анализов из клиники',
      category: 'health',
      status: 'waiting',
      deadline: addDaysStr(today, 2),
      time: '11:00',
      recurrence: 'none',
      waitingFor: 'Письмо из лаборатории на почту до четверга',
      autoClose: true,
      notes: 'После получения переслать врачу',
      links: [],
      subtasks: [
        { id: 's21', text: 'Сдать кровь утром натощак', completed: true },
        { id: 's22', text: 'Дождаться письма и переслать врачу', completed: false }
      ],
      archived: false,
      createdAt: Date.now() - 3600000 * 10
    },
    {
      id: `${familyCode}_sample_3`,
      familyCode,
      title: 'Починить обручи-сушилки и разобрать балкон',
      category: 'home',
      status: 'todo',
      deadline: addDaysStr(today, -1),
      time: '',
      recurrence: 'none',
      waitingFor: '',
      autoClose: true,
      notes: 'Куплены крепежи, нужен только шуруповёрт',
      links: [],
      subtasks: [
        { id: 's31', text: 'Выбросить старые коробки', completed: true },
        { id: 's32', text: 'Закрепить сушилку', completed: false }
      ],
      archived: false,
      createdAt: Date.now() - 3600000 * 20
    },
    {
      id: `${familyCode}_sample_4`,
      familyCode,
      title: 'Оплатить коммунальные счета и интернет',
      category: 'admin',
      status: 'todo',
      deadline: addDaysStr(today, 5),
      time: '18:00',
      recurrence: 'monthly',
      waitingFor: '',
      autoClose: true,
      notes: 'Регулярная задача: при закрытии сама создастся на следующий месяц!',
      links: [],
      subtasks: [
        { id: 's41', text: 'Оплатить электроэнергию и воду', completed: false },
        { id: 's42', text: 'Оплатить домашний интернет', completed: false }
      ],
      archived: false,
      createdAt: Date.now() - 3600000 * 15
    },
    {
      id: `${familyCode}_sample_5`,
      familyCode,
      title: 'Подготовить документы к продлению / заверить паспорт',
      category: 'admin',
      status: 'backlog',
      deadline: addDaysStr(today, 10),
      time: '',
      recurrence: 'none',
      waitingFor: '',
      autoClose: true,
      notes: 'Сделать цветные копии всех страниц и заполнить анкету вместе с Камиллой',
      links: [],
      subtasks: [
        { id: 's51', text: 'Собрать оригиналы документов', completed: false },
        { id: 's52', text: 'Записаться на приём онлайн', completed: false }
      ],
      archived: false,
      createdAt: Date.now() - 3600000 * 30
    }
  ];
};

export default function App() {
  // Auth & Sync State
  const [user, setUser] = useState(null);
  const [familyCode, setFamilyCode] = useState('ALMAZ-KAMILLA-1');
  const [tempFamilyCode, setTempFamilyCode] = useState('ALMAZ-KAMILLA-1');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // UI Navigation & Theme (7 Main Tabs)
  // 'kanban' | 'quick_form' | 'calendar' | 'family' | 'shopping' | 'maintenance' | 'widget_dev'
  const [activeTab, setActiveTab] = useState('kanban');
  const [widgetSubTab, setWidgetSubTab] = useState('widget'); // 'widget' | 'dev'
  const [darkMode, setDarkMode] = useState(true);
  const [toast, setToast] = useState(null);

  // Kanban State
  const [allTasks, setAllTasks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyRecurring, setOnlyRecurring] = useState(false);
  const [sortByDeadline, setSortByDeadline] = useState(true);
  const [mobileColumnId, setMobileColumnId] = useState('in_progress');
  const [editingTask, setEditingTask] = useState(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  // Quick Form & Batch Parser State (Tab 2)
  const [qfTitle, setQfTitle] = useState('');
  const [qfCategory, setQfCategory] = useState('work');
  const [qfStatus, setQfStatus] = useState('todo');
  const [qfDeadline, setQfDeadline] = useState(() => toDateStr(new Date()));
  const [qfTime, setQfTime] = useState('10:00');
  const [qfRecurrence, setQfRecurrence] = useState('none');
  const [qfWaitingFor, setQfWaitingFor] = useState('');
  const [qfLinkTitle, setQfLinkTitle] = useState('');
  const [qfLinkUrl, setQfLinkUrl] = useState('');
  const [qfNotes, setQfNotes] = useState('');
  const [qfSubtasks, setQfSubtasks] = useState([]);
  const [qfNewSubText, setQfNewSubText] = useState('');
  const [qfOpenGCal, setQfOpenGCal] = useState(false);
  const [batchRawText, setBatchRawText] = useState('');
  const [batchCategory, setBatchCategory] = useState('home');
  const [batchColumn, setBatchColumn] = useState('todo');

  // Monthly Calendar State (Tab 3)
  const [calMonthDate, setCalMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Daily Routine with Kamilla State (Tab 4)
  const [allDailyLogs, setAllDailyLogs] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => toDateStr(new Date()));
  const [activeActor, setActiveActor] = useState('Я'); // 'Я' | 'Камилла' | 'Вместе с Камиллой'
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newCustomCheckText, setNewCustomCheckText] = useState('');
  const [newCustomCheckSection, setNewCustomCheckSection] = useState('day');

  // Shopping List with Kamilla State (Tab 5)
  const [allShopping, setAllShopping] = useState([]);
  const [shopTitle, setShopTitle] = useState('');
  const [shopQty, setShopQty] = useState('');
  const [shopAisle, setShopAisle] = useState('produce');
  const [shopStore, setShopStore] = useState('Любой');
  const [filterStore, setFilterStore] = useState('Все');

  // Home Maintenance Tracker State (Tab 6)
  const [allMaintenance, setAllMaintenance] = useState([]);
  const [newMaintTitle, setNewMaintTitle] = useState('');
  const [newMaintDays, setNewMaintDays] = useState(30);
  const [newMaintCategory, setNewMaintCategory] = useState('Дом и уют');

  // Widget Quick Task Input (Tab 7)
  const [widgetQuickTaskTitle, setWidgetQuickTaskTitle] = useState('');

  // Focus Pomodoro Timer & Quick Scratchpad Inbox State
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState('work');
  const [showScratchpadModal, setShowScratchpadModal] = useState(false);
  const [scratchpadText, setScratchpadText] = useState('');
  const fileInputRef = useRef(null);

  // Helper to trigger celebratory or info toast
  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4200);
  };

  // Pomodoro Timer Countdown Effect
  useEffect(() => {
    if (!pomodoroRunning) return;
    const interval = setInterval(() => {
      setPomodoroSeconds((prev) => {
        if (prev <= 1) {
          setPomodoroRunning(false);
          const nextMode = pomodoroMode === 'work' ? 'break' : 'work';
          setPomodoroMode(nextMode);
          showToastMsg(
            nextMode === 'break'
              ? '🔔 25 минут фокуса прошли! Время размяться 5 минут.'
              : '⚡ Перерыв окончен! Готовы к следующему рывку?'
          );
          return nextMode === 'break' ? 5 * 60 : 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroMode]);

  const formatTimer = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // 1. Firebase Auth Effect (RULE 3)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Auth error:', err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Firestore Real-Time Listeners (RULE 1 & RULE 2)
  useEffect(() => {
    if (!user) return;

    const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'kanban_tasks');
    const logsRef = collection(db, 'artifacts', appId, 'public', 'data', 'family_daily_logs');
    const templatesRef = collection(db, 'artifacts', appId, 'public', 'data', 'family_templates');
    const shoppingRef = collection(db, 'artifacts', appId, 'public', 'data', 'family_shopping');
    const maintRef = collection(db, 'artifacts', appId, 'public', 'data', 'family_maintenance');

    const unsubTasks = onSnapshot(
      tasksRef,
      (snap) => setAllTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error('Tasks listener error:', err)
    );

    const unsubLogs = onSnapshot(
      logsRef,
      (snap) => setAllDailyLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error('Logs listener error:', err)
    );

    const unsubTemplates = onSnapshot(
      templatesRef,
      (snap) => setAllTemplates(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error('Templates listener error:', err)
    );

    const unsubShopping = onSnapshot(
      shoppingRef,
      (snap) => setAllShopping(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error('Shopping listener error:', err)
    );

    const unsubMaint = onSnapshot(
      maintRef,
      (snap) => setAllMaintenance(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error('Maintenance listener error:', err)
    );

    return () => {
      unsubTasks();
      unsubLogs();
      unsubTemplates();
      unsubShopping();
      unsubMaint();
    };
  }, [user]);

  // Filtered Data by Current Family Code
  const familyTasks = useMemo(() => {
    return allTasks.filter((t) => (t.familyCode || 'ALMAZ-KAMILLA-1') === familyCode && !t.archived);
  }, [allTasks, familyCode]);

  const archivedTasks = useMemo(() => {
    return allTasks.filter((t) => (t.familyCode || 'ALMAZ-KAMILLA-1') === familyCode && t.archived);
  }, [allTasks, familyCode]);

  const currentTemplateDoc = useMemo(() => {
    const found = allTemplates.find((t) => t.id === `template_${familyCode}`);
    return found ? found.items : DEFAULT_DAILY_TEMPLATE;
  }, [allTemplates, familyCode]);

  const familyLogs = useMemo(() => {
    return allDailyLogs.filter((l) => (l.familyCode || 'ALMAZ-KAMILLA-1') === familyCode);
  }, [allDailyLogs, familyCode]);

  const currentDayLog = useMemo(() => {
    return familyLogs.find((l) => l.date === selectedDate) || null;
  }, [familyLogs, selectedDate]);

  const familyShopping = useMemo(() => {
    return allShopping.filter((s) => (s.familyCode || 'ALMAZ-KAMILLA-1') === familyCode);
  }, [allShopping, familyCode]);

  const familyMaintenance = useMemo(() => {
    return allMaintenance.filter((m) => (m.familyCode || 'ALMAZ-KAMILLA-1') === familyCode);
  }, [allMaintenance, familyCode]);

  // Auto-seed sample tasks if space is completely empty
  const handleSeedDemoTasks = async () => {
    if (!user) return;
    const samples = getInitialSampleTasks(familyCode);
    try {
      for (const item of samples) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kanban_tasks', item.id), item);
      }
      showToastMsg('Загружены примеры задач с подзадачами и повторами! 🎉');
    } catch (err) {
      console.error('Seed error:', err);
    }
  };

  // Seed default maintenance items if empty
  useEffect(() => {
    if (user && activeTab === 'maintenance' && familyMaintenance.length === 0) {
      const seedMaint = async () => {
        const today = toDateStr(new Date());
        for (let i = 0; i < DEFAULT_MAINTENANCE_ITEMS.length; i++) {
          const item = DEFAULT_MAINTENANCE_ITEMS[i];
          const docId = `${familyCode}_${item.id}`;
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_maintenance', docId), {
            ...item,
            id: docId,
            familyCode,
            lastDoneDate: addDaysStr(today, -Math.floor(item.intervalDays * 0.6))
          });
        }
      };
      seedMaint();
    }
  }, [user, activeTab, familyMaintenance.length, familyCode]);

  // Ensure a daily checklist exists from template
  const ensureDayLog = async (targetDate) => {
    if (!user) return null;
    const docId = `${familyCode}_${targetDate}`;
    const existing = familyLogs.find((l) => l.date === targetDate);
    if (existing) return existing;

    const newLog = {
      id: docId,
      familyCode,
      date: targetDate,
      items: currentTemplateDoc.map((tpl) => ({
        ...tpl,
        completed: false,
        completedBy: null,
        completedAt: null
      })),
      updatedAt: Date.now()
    };
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_daily_logs', docId), newLog);
    return newLog;
  };

  useEffect(() => {
    if (user && (activeTab === 'family' || activeTab === 'widget_dev') && !currentDayLog) {
      ensureDayLog(selectedDate);
    }
  }, [user, activeTab, selectedDate, currentDayLog]);

  // ==========================================
  // RECURRING TASK SPAWNER HELPER
  // ==========================================
  const spawnNextRecurringTaskIfNeeded = async (completedTask) => {
    if (!completedTask.recurrence || completedTask.recurrence === 'none' || completedTask.spawnedNext) {
      return false;
    }
    const baseDate = completedTask.deadline || toDateStr(new Date());
    const nextDeadline =
      completedTask.recurrence === 'weekly'
        ? addDaysStr(baseDate, 7)
        : addMonthsStr(baseDate, 1);

    const newTaskId = `${familyCode}_task_${Date.now()}_rec`;
    const resetSubtasks = (completedTask.subtasks || []).map((s) => ({
      ...s,
      completed: false
    }));

    const nextTaskPayload = {
      ...completedTask,
      id: newTaskId,
      status: 'todo',
      deadline: nextDeadline,
      subtasks: resetSubtasks,
      spawnedNext: false,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kanban_tasks', newTaskId), nextTaskPayload);
    return nextDeadline;
  };

  // ==========================================
  // KANBAN & QUICK FORM HANDLERS
  // ==========================================
  const handleSaveTask = async (taskData) => {
    if (!user) return;
    const id = taskData.id || `${familyCode}_task_${Date.now()}`;
    
    let finalStatus = taskData.status || 'backlog';
    const subs = taskData.subtasks || [];
    let triggeredAutoClose = false;

    if (taskData.autoClose && subs.length > 0 && subs.every((s) => s.completed) && finalStatus !== 'done') {
      finalStatus = 'done';
      triggeredAutoClose = true;
    }

    const payload = {
      ...taskData,
      id,
      familyCode,
      status: finalStatus,
      archived: Boolean(taskData.archived),
      updatedAt: Date.now(),
      createdAt: taskData.createdAt || Date.now()
    };

    try {
      if (finalStatus === 'done' && taskData.status !== 'done' && taskData.recurrence && taskData.recurrence !== 'none') {
        const nextDt = await spawnNextRecurringTaskIfNeeded(payload);
        payload.spawnedNext = true;
        showToastMsg(`🔄 Задача закрыта! Создана копия на ${formatRussianDate(nextDt)}`);
      } else if (triggeredAutoClose) {
        showToastMsg(`🎉 Все подзадачи выполнены! «${taskData.title}» перенесена в Готово!`);
      }

      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kanban_tasks', id), payload);
      setEditingTask(null);
      setIsCreatingTask(false);
    } catch (err) {
      console.error('Error saving task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kanban_tasks', taskId));
      setEditingTask(null);
      showToastMsg('Задача удалена');
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleMoveTaskColumn = async (task, newColumnId) => {
    if (!user || task.status === newColumnId) return;
    try {
      const updates = {
        status: newColumnId,
        updatedAt: Date.now()
      };

      if (newColumnId === 'done') {
        if (task.recurrence && task.recurrence !== 'none' && !task.spawnedNext) {
          const nextDt = await spawnNextRecurringTaskIfNeeded(task);
          updates.spawnedNext = true;
          showToastMsg(`🔄 Выполнено! Следующий повтор назначен на ${formatRussianDate(nextDt)}`);
        } else {
          showToastMsg(`✅ Задача «${task.title}» выполнена!`);
        }
      }

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kanban_tasks', task.id), updates);
    } catch (err) {
      console.error('Move error:', err);
    }
  };

  const handleToggleSubtaskOnCard = async (task, subtaskId, e) => {
    e.stopPropagation();
    if (!user) return;

    const updatedSubtasks = (task.subtasks || []).map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);
    let newStatus = task.status;
    let spawnedNext = task.spawnedNext || false;

    if (allDone && task.autoClose !== false && task.status !== 'done') {
      newStatus = 'done';
      if (task.recurrence && task.recurrence !== 'none' && !spawnedNext) {
        const nextDt = await spawnNextRecurringTaskIfNeeded({ ...task, subtasks: updatedSubtasks });
        spawnedNext = true;
        showToastMsg(`🎉 Подзадачи закрыты! Создан повтор на ${formatRussianDate(nextDt)}`);
      } else {
        showToastMsg(`🎉 Все подзадачи закрыты! «${task.title}» автоматически в «5. Готово»!`);
      }
    }

    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kanban_tasks', task.id), {
        subtasks: updatedSubtasks,
        status: newStatus,
        spawnedNext,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error('Subtask toggle error:', err);
    }
  };

  const handleArchiveCompletedTasks = async () => {
    if (!user) return;
    const doneTasks = familyTasks.filter((t) => t.status === 'done');
    if (doneTasks.length === 0) return;
    try {
      for (const t of doneTasks) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kanban_tasks', t.id), {
          archived: true,
          updatedAt: Date.now()
        });
      }
      showToastMsg(`📦 В архив перенесено задач: ${doneTasks.length}`);
    } catch (err) {
      console.error('Archive error:', err);
    }
  };

  const handleRestoreFromArchive = async (task) => {
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kanban_tasks', task.id), {
      archived: false,
      status: 'todo',
      updatedAt: Date.now()
    });
    showToastMsg(`Задача «${task.title}» возвращена на доску`);
  };

  // Apply Preset in Quick Form Tab
  const handleApplyQuickPreset = (preset) => {
    setQfTitle(preset.title);
    setQfCategory(preset.category);
    setQfStatus(preset.status);
    setQfRecurrence(preset.recurrence || 'none');
    setQfNotes(preset.notes || '');
    setQfSubtasks(
      (preset.subtasks || []).map((txt, idx) => ({
        id: `qf_sub_${Date.now()}_${idx}`,
        text: txt,
        completed: false
      }))
    );
    showToastMsg(`⚡ Применён шаблон: «${preset.label}»`);
  };

  // Submit Quick Form Task
  const handleQuickFormSubmit = async (e) => {
    e.preventDefault();
    if (!user || !qfTitle.trim()) return;

    const links = [];
    if (qfLinkUrl.trim()) {
      const formatted = qfLinkUrl.startsWith('http') ? qfLinkUrl.trim() : `https://${qfLinkUrl.trim()}`;
      links.push({ id: `lnk_${Date.now()}`, title: qfLinkTitle.trim() || 'Ссылка', url: formatted });
    }

    const newTask = {
      id: `${familyCode}_task_${Date.now()}`,
      familyCode,
      title: qfTitle.trim(),
      category: qfCategory,
      status: qfStatus,
      deadline: qfDeadline,
      time: qfTime,
      recurrence: qfRecurrence,
      waitingFor: qfWaitingFor.trim(),
      autoClose: true,
      notes: qfNotes.trim(),
      links,
      subtasks: qfSubtasks,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kanban_tasks', newTask.id), newTask);

    if (qfOpenGCal) {
      window.open(buildGoogleCalendarUrl(newTask), '_blank', 'noopener,noreferrer');
    }

    setQfTitle('');
    setQfWaitingFor('');
    setQfLinkTitle('');
    setQfLinkUrl('');
    setQfNotes('');
    setQfSubtasks([]);
    showToastMsg('✅ Задача успешно создана через Быструю форму!');
  };

  // Smart Batch Text Parser (lines starting with '-' become subtasks of the parent line)
  const handleBatchParseSubmit = async () => {
    if (!user || !batchRawText.trim()) return;
    const rawLines = batchRawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsedTasks = [];
    let currentParent = null;

    rawLines.forEach((line, idx) => {
      if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
        const subText = line.replace(/^[-*•]\s*/, '').trim();
        if (subText) {
          if (!currentParent) {
            currentParent = {
              title: 'Задача из списка',
              subtasks: []
            };
            parsedTasks.push(currentParent);
          }
          currentParent.subtasks.push({
            id: `bsub_${Date.now()}_${idx}`,
            text: subText,
            completed: false
          });
        }
      } else {
        currentParent = {
          title: line,
          subtasks: []
        };
        parsedTasks.push(currentParent);
      }
    });

    for (let i = 0; i < parsedTasks.length; i++) {
      const item = parsedTasks[i];
      const id = `${familyCode}_batch_${Date.now()}_${i}`;
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kanban_tasks', id), {
        id,
        familyCode,
        title: item.title,
        category: batchCategory,
        status: batchColumn,
        deadline: toDateStr(new Date()),
        time: '',
        recurrence: 'none',
        waitingFor: '',
        autoClose: true,
        notes: 'Создано через Пакетный парсер',
        links: [],
        subtasks: item.subtasks,
        archived: false,
        createdAt: Date.now() + i
      });
    }

    setBatchRawText('');
    showToastMsg(`⚡ Распознано и создано задач с подзадачами: ${parsedTasks.length}!`);
  };

  // Convert lines from Quick Scratchpad into Backlog tasks
  const handleConvertScratchpadToTasks = async () => {
    if (!user || !scratchpadText.trim()) return;
    const lines = scratchpadText
      .split('\n')
      .map((l) => l.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);

    if (lines.length === 0) return;
    try {
      for (let i = 0; i < lines.length; i++) {
        const id = `${familyCode}_inbox_${Date.now()}_${i}`;
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kanban_tasks', id), {
          id,
          familyCode,
          title: lines[i],
          category: selectedCategory === 'all' ? 'home' : selectedCategory,
          status: 'backlog',
          deadline: '',
          time: '',
          recurrence: 'none',
          waitingFor: '',
          autoClose: true,
          notes: 'Создано из Быстрого Инбокса',
          links: [],
          subtasks: [],
          archived: false,
          createdAt: Date.now() + i
        });
      }
      setScratchpadText('');
      setShowScratchpadModal(false);
      showToastMsg(`⚡ В Бэклог добавлено новых задач: ${lines.length}!`);
    } catch (err) {
      console.error('Scratchpad convert error:', err);
    }
  };

  // Download .ICS Calendar File
  const handleDownloadICS = () => {
    const icsContent = generateICSFileContent(familyTasks);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanban_calendar_${familyCode}_${toDateStr(new Date())}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    showToastMsg('📅 Файл .ICS скачан! Импортируйте его в Google Calendar или Apple Calendar.');
  };

  // ==========================================
  // DAILY ROUTINE WITH KAMILLA HANDLERS
  // ==========================================
  const handleToggleDailyItem = async (itemId) => {
    if (!user || !currentDayLog) return;
    const updatedItems = currentDayLog.items.map((item) => {
      if (item.id === itemId) {
        const nextCompleted = !item.completed;
        return {
          ...item,
          completed: nextCompleted,
          completedBy: nextCompleted ? activeActor : null,
          completedAt: nextCompleted ? new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : null
        };
      }
      return item;
    });

    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_daily_logs', currentDayLog.id), {
        items: updatedItems,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error('Toggle daily item error:', err);
    }
  };

  const handleAddCustomDailyItem = async (e) => {
    e.preventDefault();
    if (!newCustomCheckText.trim() || !user || !currentDayLog) return;
    const newItem = {
      id: `custom_${Date.now()}`,
      section: newCustomCheckSection,
      text: newCustomCheckText.trim(),
      completed: false,
      completedBy: null,
      completedAt: null
    };
    const updatedItems = [...currentDayLog.items, newItem];
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_daily_logs', currentDayLog.id), {
        items: updatedItems,
        updatedAt: Date.now()
      });
      setNewCustomCheckText('');
      showToastMsg('Пункт добавлен в сегодняшний день с Камиллой');
    } catch (err) {
      console.error('Error adding daily item:', err);
    }
  };

  const handleSaveMasterTemplate = async (newItemsList) => {
    if (!user) return;
    const docId = `template_${familyCode}`;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_templates', docId), {
        id: docId,
        familyCode,
        items: newItemsList,
        updatedAt: Date.now()
      });
      if (currentDayLog) {
        const existingMap = new Map(currentDayLog.items.map((i) => [i.id, i]));
        const merged = newItemsList.map((tpl) => {
          if (existingMap.has(tpl.id)) {
            return { ...existingMap.get(tpl.id), text: tpl.text, section: tpl.section };
          }
          return { ...tpl, completed: false, completedBy: null, completedAt: null };
        });
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_daily_logs', currentDayLog.id), {
          items: merged,
          updatedAt: Date.now()
        });
      }
      setShowTemplateModal(false);
      showToastMsg('Ежедневный шаблон с Камиллой сохранён и обновлён!');
    } catch (err) {
      console.error('Save template error:', err);
    }
  };

  // ==========================================
  // SHOPPING LIST HANDLERS
  // ==========================================
  const handleAddShoppingItem = async (e) => {
    e.preventDefault();
    if (!shopTitle.trim() || !user) return;
    const id = `${familyCode}_shop_${Date.now()}`;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_shopping', id), {
      id,
      familyCode,
      title: shopTitle.trim(),
      qty: shopQty.trim(),
      aisle: shopAisle,
      store: shopStore,
      completed: false,
      boughtBy: null,
      createdAt: Date.now()
    });
    setShopTitle('');
    setShopQty('');
  };

  const handleToggleShoppingItem = async (item) => {
    if (!user) return;
    const next = !item.completed;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_shopping', item.id), {
      completed: next,
      boughtBy: next ? activeActor : null
    });
  };

  const handleClearBoughtShopping = async () => {
    if (!user) return;
    const bought = familyShopping.filter((i) => i.completed);
    for (const item of bought) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_shopping', item.id));
    }
    showToastMsg(`🛒 Очищено купленных товаров: ${bought.length}`);
  };

  // ==========================================
  // HOME MAINTENANCE HANDLERS
  // ==========================================
  const handleMarkMaintenanceDoneToday = async (item) => {
    if (!user) return;
    const today = toDateStr(new Date());
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_maintenance', item.id), {
      lastDoneDate: today,
      lastDoneBy: activeActor
    });
    showToastMsg(`🔧 Отлично! Таймер для «${item.title}» сброшен на ${item.intervalDays} дн.`);
  };

  const handleAddMaintenanceItem = async (e) => {
    e.preventDefault();
    if (!newMaintTitle.trim() || !user) return;
    const id = `${familyCode}_maint_${Date.now()}`;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_maintenance', id), {
      id,
      familyCode,
      title: newMaintTitle.trim(),
      intervalDays: Number(newMaintDays) || 30,
      category: newMaintCategory,
      icon: '🔧',
      lastDoneDate: toDateStr(new Date())
    });
    setNewMaintTitle('');
    showToastMsg('Добавлен новый регламент ТО!');
  };

  const handleDeleteMaintenanceItem = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_maintenance', id));
  };

  // ==========================================
  // JSON EXPORT / IMPORT BACKUP
  // ==========================================
  const handleExportJSON = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      familyCode,
      tasks: allTasks.filter((t) => (t.familyCode || 'ALMAZ-KAMILLA-1') === familyCode),
      dailyLogs: familyLogs,
      template: currentTemplateDoc,
      shopping: familyShopping,
      maintenance: familyMaintenance
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanban_kamilla_backup_${familyCode}_${toDateStr(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToastMsg('💾 Полная резервная копия скачана в JSON!');
  };

  const handleImportJSON = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data.tasks)) {
        for (const t of data.tasks) {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kanban_tasks', t.id), {
            ...t,
            familyCode
          });
        }
      }
      if (Array.isArray(data.shopping)) {
        for (const s of data.shopping) {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_shopping', s.id), {
            ...s,
            familyCode
          });
        }
      }
      if (Array.isArray(data.maintenance)) {
        for (const m of data.maintenance) {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_maintenance', m.id), {
            ...m,
            familyCode
          });
        }
      }
      showToastMsg('✅ Данные из резервной копии успешно восстановлены!');
    } catch (err) {
      console.error('Import error:', err);
      showToastMsg('Ошибка чтения файла резервной копии', 'error');
    }
  };

  // Filtered and Sorted Kanban Tasks
  const displayedTasks = useMemo(() => {
    let list = [...familyTasks];
    if (selectedCategory !== 'all') {
      list = list.filter((t) => t.category === selectedCategory);
    }
    if (onlyRecurring) {
      list = list.filter((t) => t.recurrence && t.recurrence !== 'none');
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.waitingFor?.toLowerCase().includes(q) ||
          (t.subtasks || []).some((s) => s.text.toLowerCase().includes(q))
      );
    }
    if (sortByDeadline) {
      list.sort((a, b) => {
        const da = a.deadline ? new Date(a.deadline).getTime() : 9999999999999;
        const dbTime = b.deadline ? new Date(b.deadline).getTime() : 9999999999999;
        return da - dbTime;
      });
    } else {
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return list;
  }, [familyTasks, selectedCategory, onlyRecurring, searchQuery, sortByDeadline]);

  // Last 28 days for Productivity Heatmap with Kamilla
  const heatmapDays = useMemo(() => {
    const today = toDateStr(new Date());
    const result = [];
    for (let i = 27; i >= 0; i--) {
      const dStr = addDaysStr(today, -i);
      const log = familyLogs.find((l) => l.date === dStr);
      const total = log?.items?.length || 0;
      const done = (log?.items || []).filter((it) => it.completed).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      result.push({ date: dStr, pct, done, total });
    }
    return result;
  }, [familyLogs]);

  // Monthly Calendar Grid Days
  const calendarGridCells = useMemo(() => {
    const year = calMonthDate.getFullYear();
    const month = calMonthDate.getMonth();
    const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTasks = familyTasks.filter((t) => t.deadline === dateStr);
      const log = familyLogs.find((l) => l.date === dateStr);
      const logDone = (log?.items || []).filter((i) => i.completed).length;
      const logTotal = log?.items?.length || 0;
      cells.push({
        day: d,
        dateStr,
        tasks: dayTasks,
        routinePct: logTotal > 0 ? Math.round((logDone / logTotal) * 100) : null
      });
    }
    return cells;
  }, [calMonthDate, familyTasks, familyLogs]);

  // 7 MAIN TABS DEFINITION
  const MAIN_TABS = [
    { id: 'kanban', label: '📋 Канбан', shortLabel: 'Канбан', icon: LayoutDashboard, activeColor: 'text-indigo-600 dark:text-indigo-400' },
    { id: 'quick_form', label: '⚡ Быстрая форма', shortLabel: 'Форма', icon: Zap, activeColor: 'text-amber-600 dark:text-amber-400' },
    { id: 'calendar', label: '📅 Календарь', shortLabel: 'Календарь', icon: CalendarIcon, activeColor: 'text-purple-600 dark:text-purple-400' },
    { id: 'family', label: '🏠 Наш день (с Камиллой)', shortLabel: 'С Камиллой', icon: Home, activeColor: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'shopping', label: '🛒 Покупки', shortLabel: 'Покупки', icon: ShoppingCart, activeColor: 'text-rose-600 dark:text-rose-400', badge: familyShopping.filter((s) => !s.completed).length },
    { id: 'maintenance', label: '🔧 Регламент и ТО', shortLabel: 'ТО дома', icon: Wrench, activeColor: 'text-orange-600 dark:text-orange-400' },
    { id: 'widget_dev', label: '📱 Виджет & Код', shortLabel: 'Виджет', icon: Smartphone, activeColor: 'text-cyan-600 dark:text-cyan-400' }
  ];

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 pb-16 lg:pb-6">
        
        {/* TOP HEADER BAR */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5">
          <div className="max-w-[1680px] mx-auto flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              
              {/* Brand & Title */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-bold text-sm sm:text-base tracking-tight leading-none">
                      Life OS • Алмаз и Камилла
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Sync
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                    Канбан, Google Календарь и совместное пространство с Камиллой
                  </p>
                </div>
              </div>

              {/* Right Actions: Pomodoro Widget, Quick Inbox, Backup, Family Code, Theme */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                
                {/* Built-in Pomodoro Focus Timer */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className={`text-xs font-mono font-bold ${pomodoroRunning ? 'text-amber-500 animate-pulse' : 'text-slate-600 dark:text-slate-300'}`}>
                    ⏱️ {formatTimer(pomodoroSeconds)}
                  </span>
                  <button
                    onClick={() => setPomodoroRunning(!pomodoroRunning)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-500"
                    title={pomodoroRunning ? 'Пауза' : 'Запустить фокус-таймер 25 мин'}
                  >
                    {pomodoroRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setPomodoroRunning(false);
                      setPomodoroMode('work');
                      setPomodoroSeconds(25 * 60);
                    }}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                    title="Сбросить таймер"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>

                {/* Quick Brain-Dump Scratchpad */}
                <button
                  onClick={() => setShowScratchpadModal(true)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1 transition"
                  title="Быстрый сброс мыслей списком в Бэклог"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Инбокс</span>
                </button>

                {/* Sync Code with Kamilla & Backup */}
                <button
                  onClick={() => {
                    setTempFamilyCode(familyCode);
                    setShowShareModal(true);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 transition"
                  title="Общий доступ с Камиллой и резервное копирование JSON"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-mono font-bold hidden sm:inline">{familyCode}</span>
                </button>

                {/* Theme Toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
                  title="Переключить тему"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 7 MAIN NAVIGATION TABS (Visible on Desktop & Scrollable on Tablet) */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/70 overflow-x-auto">
              {MAIN_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? `bg-white dark:bg-slate-900 ${tab.activeColor} shadow-sm`
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* MOBILE BOTTOM NAVIGATION BAR (For Android Convenience) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-1 px-1 overflow-x-auto">
          {MAIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] font-semibold whitespace-nowrap transition ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.shortLabel}</span>
                {tab.badge > 0 && (
                  <span className="absolute top-0.5 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* TOAST NOTIFICATION */}
        {toast && (
          <div className="fixed bottom-16 lg:bottom-5 right-5 z-50 max-w-sm bg-slate-900 dark:bg-indigo-600 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 dark:border-indigo-400 flex items-center gap-3 animate-bounce">
            <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
            <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 max-w-[1680px] w-full mx-auto px-3 sm:px-6 py-4 flex flex-col">
          
          {/* ========================================== */}
          {/* TAB 1: KANBAN BOARD                        */}
          {/* ========================================== */}
          {activeTab === 'kanban' && (
            <div className="flex-1 flex flex-col gap-3.5">
              
              {/* Top Filter & Search Bar */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                
                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 no-scrollbar">
                  {CATEGORIES.map((cat) => {
                    const active = selectedCategory === cat.id;
                    const count = cat.id === 'all' 
                      ? familyTasks.length 
                      : familyTasks.filter((t) => t.category === cat.id).length;

                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                          active
                            ? `${cat.badge} shadow-sm scale-[1.02]`
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {cat.emoji && <span>{cat.emoji}</span>}
                        <span>{cat.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${active ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Right Search, Filters & Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Input */}
                  <div className="relative flex-1 sm:flex-initial sm:w-52">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск задач..."
                      className="w-full pl-8 pr-7 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Recurring Filter Toggle */}
                  <button
                    onClick={() => setOnlyRecurring(!onlyRecurring)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1 ${
                      onlyRecurring
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-300'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                    title="Показать только регулярные повторяющиеся задачи"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Регулярные</span>
                  </button>

                  {/* Sort Toggle */}
                  <button
                    onClick={() => setSortByDeadline(!sortByDeadline)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1 ${
                      sortByDeadline
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-300'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                    title="Автоматически поднимать горящие задачи наверх"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{sortByDeadline ? 'По сроку' : 'По новизне'}</span>
                  </button>

                  {/* Archive Drawer Button */}
                  <button
                    onClick={() => setShowArchiveModal(true)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center gap-1"
                    title="Открыть архив выполненных задач"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Архив ({archivedTasks.length})</span>
                  </button>

                  {familyTasks.length === 0 && (
                    <button
                      onClick={handleSeedDemoTasks}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Примеры
                    </button>
                  )}

                  {/* New Task CTA */}
                  <button
                    onClick={() => {
                      setEditingTask({
                        title: '',
                        category: selectedCategory === 'all' ? 'work' : selectedCategory,
                        status: 'backlog',
                        deadline: toDateStr(new Date()),
                        time: '10:00',
                        recurrence: 'none',
                        waitingFor: '',
                        autoClose: true,
                        notes: '',
                        links: [],
                        subtasks: []
                      });
                      setIsCreatingTask(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Новая задача</span>
                  </button>
                </div>
              </div>

              {/* Mobile Column Switcher */}
              <div className="flex lg:hidden items-center gap-1 overflow-x-auto bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                {COLUMNS.map((col) => {
                  const colCount = displayedTasks.filter((t) => t.status === col.id).length;
                  const isSelected = mobileColumnId === col.id;
                  return (
                    <button
                      key={col.id}
                      onClick={() => setMobileColumnId(col.id)}
                      className={`flex-1 min-w-[110px] py-2 px-2 rounded-lg text-xs font-semibold text-center transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {col.title.split('. ')[1]} ({colCount})
                    </button>
                  );
                })}
              </div>

              {/* 5 KANBAN COLUMNS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-3.5 flex-1 items-start">
                {COLUMNS.map((col, colIndex) => {
                  const colTasks = displayedTasks.filter((t) => t.status === col.id);
                  const isOverWip = col.wipLimit && colTasks.length > col.wipLimit;

                  return (
                    <div
                      key={col.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedTaskId) {
                          const found = familyTasks.find((t) => t.id === draggedTaskId);
                          if (found) handleMoveTaskColumn(found, col.id);
                          setDraggedTaskId(null);
                        }
                      }}
                      className={`${
                        mobileColumnId === col.id ? 'flex' : 'hidden lg:flex'
                      } flex-col bg-slate-200/60 dark:bg-slate-900/70 rounded-2xl border ${
                        isOverWip
                          ? 'border-amber-500/70 ring-2 ring-amber-500/20'
                          : 'border-slate-200/90 dark:border-slate-800/90'
                      } p-3 min-h-[540px] transition-all`}
                    >
                      {/* Column Header */}
                      <div className="flex items-start justify-between gap-2 mb-3 px-1">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                              {col.title}
                            </h2>
                            <span
                              className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                isOverWip
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-slate-300/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {colTasks.length}
                              {col.wipLimit ? ` / ${col.wipLimit}` : ''}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {col.subtitle}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          {col.id === 'done' && colTasks.length > 0 && (
                            <button
                              onClick={handleArchiveCompletedTasks}
                              className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition"
                              title="Перенести все выполненные задачи в Архив"
                            >
                              📦 В архив
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingTask({
                                title: '',
                                category: selectedCategory === 'all' ? 'work' : selectedCategory,
                                status: col.id,
                                deadline: toDateStr(new Date()),
                                time: '10:00',
                                recurrence: 'none',
                                waitingFor: '',
                                autoClose: true,
                                notes: '',
                                links: [],
                                subtasks: []
                              });
                              setIsCreatingTask(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-slate-800 transition"
                            title={`Добавить в ${col.title}`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* WIP Limit Warning Banner */}
                      {isOverWip && (
                        <div className="mb-3 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                          <span>В работе больше 4 задач! Сфокусируйтесь на главном.</span>
                        </div>
                      )}

                      {/* Tasks Stack */}
                      <div className="flex flex-col gap-3 flex-1">
                        {colTasks.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300/70 dark:border-slate-800 rounded-xl p-6 text-center text-slate-400 dark:text-slate-600">
                            <p className="text-xs">Перетащите карточку сюда или нажмите +</p>
                          </div>
                        ) : (
                          colTasks.map((task) => {
                            const catObj = CATEGORIES.find((c) => c.id === task.category) || CATEGORIES[1];
                            const dlStyle = getDeadlineStyles(task.deadline, task.status);
                            const subtasks = task.subtasks || [];
                            const doneSubCount = subtasks.filter((s) => s.completed).length;
                            const subPercent = subtasks.length > 0 ? Math.round((doneSubCount / subtasks.length) * 100) : 0;
                            const links = task.links || [];

                            return (
                              <div
                                key={task.id}
                                draggable
                                onDragStart={() => setDraggedTaskId(task.id)}
                                onClick={() => {
                                  setEditingTask(task);
                                  setIsCreatingTask(false);
                                }}
                                className={`group relative rounded-xl p-3.5 border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${dlStyle.cardGradient}`}
                              >
                                {/* Top Badges Row: Category + Recurrence + Deadline Pill */}
                                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                                  <div className="flex items-center gap-1">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catObj.lightBadge}`}>
                                      {catObj.emoji} {catObj.label}
                                    </span>
                                    {task.recurrence && task.recurrence !== 'none' && (
                                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 flex items-center gap-0.5">
                                        <Repeat className="w-2.5 h-2.5" />
                                        {task.recurrence === 'weekly' ? 'Еженед.' : 'Ежемес.'}
                                      </span>
                                    )}
                                  </div>

                                  {dlStyle.badge && (
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] ${dlStyle.badge.className}`}>
                                      {dlStyle.badge.text}
                                    </span>
                                  )}
                                </div>

                                {/* Task Title */}
                                <h3
                                  className={`font-semibold text-sm leading-snug mb-1.5 ${
                                    task.status === 'done' ? 'line-through text-slate-400 dark:text-slate-500' : ''
                                  }`}
                                >
                                  {task.title}
                                </h3>

                                {/* Special Waiting For Banner */}
                                {(task.status === 'waiting' || task.waitingFor) && task.waitingFor && (
                                  <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-1.5">
                                    <Hourglass className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                                    <span><strong>Ждём:</strong> {task.waitingFor}</span>
                                  </div>
                                )}

                                {/* Notes Snippet */}
                                {task.notes && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                                    {task.notes}
                                  </p>
                                )}

                                {/* Clickable External Links & Direct Google Calendar Link on Card */}
                                <div className="flex flex-wrap gap-1.5 mb-2" onClick={(e) => e.stopPropagation()}>
                                  {links.map((lnk) => (
                                    <a
                                      key={lnk.id}
                                      href={lnk.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 transition"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5" />
                                      <span className="truncate max-w-[130px]">{lnk.title || 'Ссылка'}</span>
                                    </a>
                                  ))}
                                  {task.deadline && (
                                    <a
                                      href={buildGoogleCalendarUrl(task)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition"
                                      title="Добавить задачу в Google Календарь"
                                    >
                                      <CalendarPlus className="w-2.5 h-2.5" />
                                      <span>📅 В Google Календарь</span>
                                    </a>
                                  )}
                                </div>

                                {/* Subtasks Interactive Section */}
                                {subtasks.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/60">
                                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                                      <span className="flex items-center gap-1 font-medium">
                                        <ListTodo className="w-3.5 h-3.5 text-indigo-500" />
                                        Подзадачи: {doneSubCount}/{subtasks.length}
                                      </span>
                                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{subPercent}%</span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                                      <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                                        style={{ width: `${subPercent}%` }}
                                      />
                                    </div>

                                    {/* Direct Checkboxes on Card */}
                                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                      {subtasks.map((st) => (
                                        <button
                                          key={st.id}
                                          type="button"
                                          onClick={(e) => handleToggleSubtaskOnCard(task, st.id, e)}
                                          className="w-full flex items-start gap-2 text-left text-xs py-0.5 px-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition"
                                        >
                                          {st.completed ? (
                                            <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                          ) : (
                                            <Square className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                          )}
                                          <span className={st.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}>
                                            {st.text}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Footer: Date & Quick Move Arrows */}
                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/40 text-[11px] text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {task.deadline ? `${formatRussianDate(task.deadline)}${task.time ? ` • ${task.time}` : ''}` : 'Без срока'}
                                  </span>

                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    {colIndex > 0 && (
                                      <button
                                        onClick={() => handleMoveTaskColumn(task, COLUMNS[colIndex - 1].id)}
                                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300"
                                        title={`Назад в «${COLUMNS[colIndex - 1].title}»`}
                                      >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {colIndex < COLUMNS.length - 1 && (
                                      <button
                                        onClick={() => handleMoveTaskColumn(task, COLUMNS[colIndex + 1].id)}
                                        className="p-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-medium flex items-center"
                                        title={`Дальше в «${COLUMNS[colIndex + 1].title}»`}
                                      >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: QUICK FORM & SMART BATCH PARSER     */}
          {/* ========================================== */}
          {activeTab === 'quick_form' && (
            <div className="max-w-6xl mx-auto w-full flex flex-col gap-5">
              
              {/* Top Presets Banner */}
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 mb-2">
                  <Zap className="w-3.5 h-3.5" />
                  Конструктор задач и авто-парсер
                </span>
                <h2 className="text-xl sm:text-2xl font-bold">⚡ Быстрая форма ввода и шаблоны</h2>
                <p className="text-amber-100 text-xs sm:text-sm mt-0.5 mb-4">
                  Заполните задачу в 1 клик по готовому пресету, отправьте событие сразу в Google Календарь или загрузите список пачкой из текста
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/80 mr-1">
                    Умные пресеты:
                  </span>
                  {QUICK_FORM_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyQuickPreset(preset)}
                      className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-xs font-semibold border border-white/20 transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* Left Column: Detailed Single Task Form */}
                <form
                  onSubmit={handleQuickFormSubmit}
                  className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <h3 className="font-bold text-base flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Plus className="w-5 h-5 text-indigo-500" />
                    Детальное создание задачи
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Название задачи *
                    </label>
                    <input
                      type="text"
                      required
                      value={qfTitle}
                      onChange={(e) => setQfTitle(e.target.value)}
                      placeholder="Например: Записаться к стоматологу / Написать ТЗ"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Сфера
                      </label>
                      <select
                        value={qfCategory}
                        onChange={(e) => setQfCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.emoji} {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Этап (Колонка)
                      </label>
                      <select
                        value={qfStatus}
                        onChange={(e) => setQfStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        {COLUMNS.map((col) => (
                          <option key={col.id} value={col.id}>{col.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Повторяемость
                      </label>
                      <select
                        value={qfRecurrence}
                        onChange={(e) => setQfRecurrence(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        {RECURRENCE_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Дата дедлайна
                      </label>
                      <input
                        type="date"
                        value={qfDeadline}
                        onChange={(e) => setQfDeadline(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Время (для Google Календаря)
                      </label>
                      <input
                        type="time"
                        value={qfTime}
                        onChange={(e) => setQfTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        ⏳ Кого/чего ждём? (опционально)
                      </label>
                      <input
                        type="text"
                        value={qfWaitingFor}
                        onChange={(e) => setQfWaitingFor(e.target.value)}
                        placeholder="Например: Ответа из клиники"
                        className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        🔗 Ссылка (URL документа/сайта)
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={qfLinkTitle}
                          onChange={(e) => setQfLinkTitle(e.target.value)}
                          placeholder="Название"
                          className="w-1/3 px-2.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          value={qfLinkUrl}
                          onChange={(e) => setQfLinkUrl(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 px-2.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subtasks inside Quick Form */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <label className="block text-xs font-bold mb-2">
                      Чек-лист подзадач ({qfSubtasks.length})
                    </label>
                    {qfSubtasks.length > 0 && (
                      <div className="space-y-1.5 mb-2.5">
                        {qfSubtasks.map((st) => (
                          <div key={st.id} className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                            <span>• {st.text}</span>
                            <button
                              type="button"
                              onClick={() => setQfSubtasks(qfSubtasks.filter((s) => s.id !== st.id))}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={qfNewSubText}
                        onChange={(e) => setQfNewSubText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (qfNewSubText.trim()) {
                              setQfSubtasks([...qfSubtasks, { id: `qfs_${Date.now()}`, text: qfNewSubText.trim(), completed: false }]);
                              setQfNewSubText('');
                            }
                          }
                        }}
                        placeholder="Добавить шаг подзадачи..."
                        className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (qfNewSubText.trim()) {
                            setQfSubtasks([...qfSubtasks, { id: `qfs_${Date.now()}`, text: qfNewSubText.trim(), completed: false }]);
                            setQfNewSubText('');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                      >
                        + Шаг
                      </button>
                    </div>
                  </div>

                  {/* Direct Google Calendar Checkbox */}
                  <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qfOpenGCal}
                      onChange={(e) => setQfOpenGCal(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      📅 Сразу открыть событие в Google Календаре после создания
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition"
                  >
                    Создать задачу на доске
                  </button>
                </form>

                {/* Right Column: Smart Batch Text Parser */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                      <FileText className="w-5 h-5 text-amber-500" />
                      Пакетный парсер текста в задачи
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                      Вставьте сюда любой многострочный список из заметок или мессенджера. Строки с дефисом (<code>- ...</code>) автоматически станут <strong>подзадачами</strong> предыдущей строки!
                    </p>

                    <div className="grid grid-cols-2 gap-2.5 mb-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Сфера для пачки:</label>
                        <select
                          value={batchCategory}
                          onChange={(e) => setBatchCategory(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                          {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Колонка:</label>
                        <select
                          value={batchColumn}
                          onChange={(e) => setBatchColumn(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                          {COLUMNS.map((col) => (
                            <option key={col.id} value={col.id}>{col.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <textarea
                      rows={10}
                      value={batchRawText}
                      onChange={(e) => setBatchRawText(e.target.value)}
                      placeholder={`Подготовить велосипед к сезону\n- Почистить и смазать цепь\n- Проверить тормозные колодки\nСходить с Камиллой за покупками\n- Купить овощи и фрукты\n- Забрать фильтр для воды`}
                      className="w-full p-3.5 rounded-2xl text-xs sm:text-sm font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleBatchParseSubmit}
                    className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition"
                  >
                    ⚡ Распознать и добавить все задачи
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: MONTHLY CALENDAR & GOOGLE SYNC      */}
          {/* ========================================== */}
          {activeTab === 'calendar' && (
            <div className="max-w-6xl mx-auto w-full flex flex-col gap-5">
              
              {/* Top Calendar Header & .ICS Exporter */}
              <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 mb-2">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    Синхронизация с Google Calendar / Apple / Outlook
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold">📅 Календарь задач и дедлайнов</h2>
                  <p className="text-indigo-100 text-xs sm:text-sm mt-0.5">
                    Нажмите на любую задачу, чтобы отредактировать или отправить её в Google Календарь в 1 клик
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadICS}
                    className="px-4 py-2.5 rounded-2xl bg-white text-indigo-700 font-bold text-xs sm:text-sm shadow-md hover:bg-indigo-50 transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>📥 Скачать все задачи (.ICS)</span>
                  </button>
                </div>
              </div>

              {/* Month Selector Controls */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCalMonthDate(new Date(calMonthDate.getFullYear(), calMonthDate.getMonth() - 1, 1))}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-base sm:text-lg font-bold capitalize px-2">
                      {calMonthDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button
                      onClick={() => setCalMonthDate(new Date(calMonthDate.getFullYear(), calMonthDate.getMonth() + 1, 1))}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const now = new Date();
                      setCalMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                  >
                    Текущий месяц
                  </button>
                </div>

                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
                    <div key={d} className="py-1">{d}</div>
                  ))}
                </div>

                {/* Calendar Monthly Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarGridCells.map((cell, idx) => {
                    if (!cell) {
                      return <div key={`empty_${idx}`} className="min-h-[95px] rounded-2xl bg-slate-50/50 dark:bg-slate-900/30" />;
                    }
                    const isToday = cell.dateStr === toDateStr(new Date());
                    return (
                      <div
                        key={cell.dateStr}
                        className={`min-h-[100px] rounded-2xl p-2 border flex flex-col justify-between transition ${
                          isToday
                            ? 'bg-indigo-500/5 border-indigo-500 ring-1 ring-indigo-500/40'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-lg ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                            {cell.day}
                          </span>
                          {cell.routinePct !== null && (
                            <span
                              onClick={() => {
                                setSelectedDate(cell.dateStr);
                                setActiveTab('family');
                              }}
                              className="cursor-pointer text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              title="Прогресс ежедневных дел с Камиллой"
                            >
                              🏠 {cell.routinePct}%
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 overflow-y-auto max-h-28">
                          {cell.tasks.map((t) => {
                            const cat = CATEGORIES.find((c) => c.id === t.category) || CATEGORIES[1];
                            return (
                              <div
                                key={t.id}
                                onClick={() => {
                                  setEditingTask(t);
                                  setIsCreatingTask(false);
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-medium cursor-pointer truncate border flex items-center justify-between gap-1 ${cat.lightBadge} ${
                                  t.status === 'done' ? 'line-through opacity-50' : ''
                                }`}
                                title={t.title}
                              >
                                <span className="truncate">{cat.emoji} {t.title}</span>
                                <a
                                  href={buildGoogleCalendarUrl(t)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="shrink-0 hover:scale-125 transition"
                                  title="Открыть в Google Calendar"
                                >
                                  📅
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 4: OUR DAY WITH KAMILLA (НАШ ДЕНЬ)     */}
          {/* ========================================== */}
          {activeTab === 'family' && (
            <div className="max-w-5xl mx-auto w-full flex flex-col gap-5">
              
              {/* Top Banner & Date Navigator */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm mb-2">
                      <Users className="w-3.5 h-3.5" />
                      Совместный трекер с Камиллой
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold">Наш день с Камиллой 🏠</h2>
                    <p className="text-emerald-100 text-xs sm:text-sm mt-0.5">
                      Ежедневные дела с Камиллой в виде чекбоксов с историей и тепловой картой продуктивности
                    </p>
                  </div>

                  {/* Who is checking off right now */}
                  <div className="bg-black/20 backdrop-blur-sm p-2 rounded-2xl flex flex-col gap-1">
                    <span className="text-[11px] text-emerald-100 px-1">Кто сейчас отмечает:</span>
                    <div className="flex items-center gap-1">
                      {[
                        { id: 'Я', label: '👨 Я' },
                        { id: 'Камилла', label: '👩 Камилла' },
                        { id: 'Вместе с Камиллой', label: '💑 Вместе' }
                      ].map((actor) => (
                        <button
                          key={actor.id}
                          onClick={() => setActiveActor(actor.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            activeActor === actor.id
                              ? 'bg-white text-emerald-700 shadow-sm'
                              : 'text-white/80 hover:bg-white/10'
                          }`}
                        >
                          {actor.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Date Switcher Bar */}
                <div className="mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDate(addDaysStr(selectedDate, -1))}
                      className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition"
                      title="Предыдущий день"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="px-4 py-1.5 rounded-xl bg-white/15 font-semibold text-sm sm:text-base flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="capitalize">{formatRussianDate(selectedDate)}</span>
                      {selectedDate === toDateStr(new Date()) && (
                        <span className="px-2 py-0.5 text-[11px] bg-amber-400 text-slate-950 font-bold rounded-full">
                          Сегодня
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedDate(addDaysStr(selectedDate, 1))}
                      className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition"
                      title="Следующий день"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {selectedDate !== toDateStr(new Date()) && (
                      <button
                        onClick={() => setSelectedDate(toDateStr(new Date()))}
                        className="px-3 py-1.5 rounded-xl bg-white text-emerald-700 font-semibold text-xs shadow-sm"
                      >
                        Вернуться в Сегодня
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Settings className="w-4 h-4" />
                    <span>⚙️ Настроить шаблон дня</span>
                  </button>
                </div>
              </div>

              {/* 28-Day Visual Productivity Heatmap */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-sm font-bold">Тепловая карта привычек с Камиллой (последние 28 дней)</h3>
                    <p className="text-xs text-slate-400">Нажмите на любой день, чтобы посмотреть, что именно вы с Камиллой делали</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span>0%</span>
                    <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-800 inline-block" />
                    <span className="w-3 h-3 rounded bg-emerald-500/30 inline-block" />
                    <span className="w-3 h-3 rounded bg-emerald-500/60 inline-block" />
                    <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                    <span>100%</span>
                  </div>
                </div>

                <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
                  {heatmapDays.map((hd) => {
                    const isSelected = hd.date === selectedDate;
                    let bgClass = 'bg-slate-100 dark:bg-slate-800 text-slate-400';
                    if (hd.pct >= 80) bgClass = 'bg-emerald-500 text-white font-bold';
                    else if (hd.pct >= 45) bgClass = 'bg-emerald-500/60 text-white font-semibold';
                    else if (hd.pct > 0) bgClass = 'bg-emerald-500/25 text-emerald-700 dark:text-emerald-300';

                    const dayNum = hd.date.split('-')[2];
                    return (
                      <button
                        key={hd.date}
                        onClick={() => setSelectedDate(hd.date)}
                        className={`p-2 rounded-xl flex flex-col items-center justify-center transition border ${bgClass} ${
                          isSelected ? 'ring-2 ring-indigo-500 border-indigo-500 scale-105' : 'border-transparent hover:scale-105'
                        }`}
                        title={`${formatRussianDate(hd.date)}: ${hd.pct}% (${hd.done}/${hd.total})`}
                      >
                        <span className="text-[11px]">{dayNum}</span>
                        <span className="text-[9px] opacity-80">{hd.pct}%</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily Completion Progress */}
              {currentDayLog && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                  {(() => {
                    const total = currentDayLog.items.length;
                    const done = currentDayLog.items.filter((i) => i.completed).length;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            Выполнено за {formatRussianDate(selectedDate)}: {done} из {total}
                          </span>
                          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Checklist Sections: Morning, Day, Evening */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SECTIONS_META.map((sec) => {
                  const secItems = (currentDayLog?.items || []).filter((i) => i.section === sec.id);
                  return (
                    <div
                      key={sec.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col"
                    >
                      <div className="mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-base">{sec.title}</h3>
                        <p className="text-xs text-slate-400">{sec.desc}</p>
                      </div>

                      <div className="space-y-2 flex-1">
                        {secItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleToggleDailyItem(item.id)}
                            className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2 ${
                              item.completed
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-500 dark:text-slate-400'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/70 hover:border-emerald-500/50'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {item.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <p className={`text-sm font-medium ${item.completed ? 'line-through' : ''}`}>
                                  {item.text}
                                </p>
                                {item.completed && item.completedBy && (
                                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                    ✓ {item.completedBy} {item.completedAt ? `в ${item.completedAt}` : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add One-Off Item to Today */}
              <form
                onSubmit={handleAddCustomDailyItem}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2"
              >
                <select
                  value={newCustomCheckSection}
                  onChange={(e) => setNewCustomCheckSection(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="morning">🌅 Утро</option>
                  <option value="day">🧹 Быт в течение дня</option>
                  <option value="evening">🌙 Вечер</option>
                </select>
                <input
                  type="text"
                  value={newCustomCheckText}
                  onChange={(e) => setNewCustomCheckText(e.target.value)}
                  placeholder="Добавить разовое дело с Камиллой на этот день..."
                  className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition"
                >
                  + Добавить
                </button>
              </form>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 5: SHARED SHOPPING LIST WITH KAMILLA   */}
          {/* ========================================== */}
          {activeTab === 'shopping' && (
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-5">
              
              {/* Shopping Header */}
              <div className="bg-gradient-to-r from-rose-600 to-orange-500 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 mb-2">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Общий список покупок с Камиллой
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold">🛒 Покупки с Камиллой</h2>
                  <p className="text-rose-100 text-xs sm:text-sm mt-0.5">
                    Добавляйте продукты по отделам и магазинам, а в супермаркете отмечайте в один тап
                  </p>
                </div>

                {familyShopping.some((i) => i.completed) && (
                  <button
                    onClick={handleClearBoughtShopping}
                    className="px-4 py-2 rounded-xl bg-white text-rose-600 font-bold text-xs shadow-sm hover:bg-rose-50 transition"
                  >
                    Очистить купленное ({familyShopping.filter((i) => i.completed).length})
                  </button>
                )}
              </div>

              {/* Quick Add Shopping Form */}
              <form
                onSubmit={handleAddShoppingItem}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-2.5"
              >
                <input
                  type="text"
                  value={shopTitle}
                  onChange={(e) => setShopTitle(e.target.value)}
                  placeholder="Что купить? (например: Авокадо, Молоко, Соль для ПММ)"
                  className="sm:col-span-5 px-3.5 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="text"
                  value={shopQty}
                  onChange={(e) => setShopQty(e.target.value)}
                  placeholder="Кол-во (2 шт / 1 кг)"
                  className="sm:col-span-2 px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <select
                  value={shopAisle}
                  onChange={(e) => setShopAisle(e.target.value)}
                  className="sm:col-span-2 px-2.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {SHOPPING_AISLES.map((a) => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
                <select
                  value={shopStore}
                  onChange={(e) => setShopStore(e.target.value)}
                  className="sm:col-span-2 px-2.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {SHOPPING_STORES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="sm:col-span-1 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* Store Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['Все', ...SHOPPING_STORES].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStore(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      filterStore === st
                        ? 'bg-rose-600 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Store className="w-3 h-3 inline mr-1" />
                    {st}
                  </button>
                ))}
              </div>

              {/* Grouped by Aisle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SHOPPING_AISLES.map((aisle) => {
                  const items = familyShopping.filter(
                    (i) => i.aisle === aisle.id && (filterStore === 'Все' || i.store === filterStore)
                  );
                  if (items.length === 0) return null;

                  return (
                    <div
                      key={aisle.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                      <h3 className="font-bold text-sm mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                        {aisle.label} ({items.length})
                      </h3>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleToggleShoppingItem(item)}
                            className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                              item.completed
                                ? 'bg-slate-100/70 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400'
                                : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-rose-500/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {item.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-400 shrink-0" />
                              )}
                              <div>
                                <span className={`text-sm font-medium ${item.completed ? 'line-through' : ''}`}>
                                  {item.title}
                                </span>
                                {item.qty && (
                                  <span className="ml-2 px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[11px] font-semibold">
                                    {item.qty}
                                  </span>
                                )}
                                <div className="flex items-center gap-2 mt-0.5">
                                  {item.store && item.store !== 'Любой' && (
                                    <span className="text-[10px] text-rose-500 font-medium">
                                      📍 {item.store}
                                    </span>
                                  )}
                                  {item.completed && item.boughtBy && (
                                    <span className="text-[10px] text-emerald-500 font-semibold">
                                      Купил(а): {item.boughtBy}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_shopping', item.id));
                              }}
                              className="p-1 text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {familyShopping.length === 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-800 text-slate-400">
                  Список покупок чист! Добавьте нужные товары сверху.
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 6: HOME MAINTENANCE & PERIODIC TRACKER */}
          {/* ========================================== */}
          {activeTab === 'maintenance' && (
            <div className="max-w-5xl mx-auto w-full flex flex-col gap-5">
              
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 mb-2">
                  <Wrench className="w-3.5 h-3.5" />
                  Умные интервалы обслуживания
                </span>
                <h2 className="text-xl sm:text-2xl font-bold">🔧 Регламент и ТО дома</h2>
                <p className="text-amber-100 text-xs sm:text-sm mt-0.5">
                  Для задач, которые важно повторять раз в N дней (посудомойка, фильтр пылесоса, ТО велосипеда, счета, бэкапы). Нажмите «✅ Сделано сегодня», и отсчёт пойдёт заново!
                </p>
              </div>

              {/* Maintenance Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {familyMaintenance.map((item) => {
                  const today = toDateStr(new Date());
                  const elapsed = daysBetweenDates(today, item.lastDoneDate || today);
                  const daysLeft = item.intervalDays - elapsed;
                  const wearPct = Math.min(100, Math.max(0, Math.round((elapsed / item.intervalDays) * 100)));

                  let barColor = 'bg-emerald-500';
                  let statusText = `Ещё ${daysLeft} дн. в запасе`;
                  if (daysLeft <= 0) {
                    barColor = 'bg-rose-600';
                    statusText = `🚨 Пора сделать! (просрочено на ${Math.abs(daysLeft)} дн.)`;
                  } else if (daysLeft <= 4) {
                    barColor = 'bg-amber-500';
                    statusText = `🟡 Скоро (${daysLeft} дн.)`;
                  }

                  return (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {item.icon || '🔧'} {item.category} • Раз в {item.intervalDays} дн.
                          </span>
                          <button
                            onClick={() => handleDeleteMaintenanceItem(item.id)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h3 className="font-bold text-sm sm:text-base mb-1">{item.title}</h3>
                        <p className="text-xs text-slate-400">
                          Последний раз: {formatRussianDate(item.lastDoneDate)} {item.lastDoneBy ? `(${item.lastDoneBy})` : ''}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                          <span>{statusText}</span>
                          <span>{wearPct}% цикла</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                          <div className={`h-full ${barColor} transition-all`} style={{ width: `${wearPct}%` }} />
                        </div>

                        <button
                          onClick={() => handleMarkMaintenanceDoneToday(item)}
                          className="w-full py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>✅ Сделано сегодня (Сбросить таймер)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Periodic Maintenance Item */}
              <form
                onSubmit={handleAddMaintenanceItem}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2.5"
              >
                <input
                  type="text"
                  value={newMaintTitle}
                  onChange={(e) => setNewMaintTitle(e.target.value)}
                  placeholder="Новое регулярное ТО (например: Поменять картридж фильтра воды)"
                  className="flex-1 min-w-[220px] px-3.5 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Раз в</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={newMaintDays}
                    onChange={(e) => setNewMaintDays(e.target.value)}
                    className="w-16 px-2.5 py-2 rounded-xl text-xs font-bold text-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <span className="text-xs text-slate-400">дн.</span>
                </div>
                <input
                  type="text"
                  value={newMaintCategory}
                  onChange={(e) => setNewMaintCategory(e.target.value)}
                  placeholder="Категория"
                  className="w-36 px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs"
                >
                  + Добавить ТО
                </button>
              </form>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 7: ANDROID WIDGET & DEVELOPER HUB      */}
          {/* ========================================== */}
          {activeTab === 'widget_dev' && (
            <div className="max-w-5xl mx-auto w-full flex flex-col gap-5">
              
              {/* Sub-navigation between Mobile Widget View and Developer Hub */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWidgetSubTab('widget')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                      widgetSubTab === 'widget'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>📱 Компактный Android-Виджет</span>
                  </button>
                  <button
                    onClick={() => setWidgetSubTab('dev')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                      widgetSubTab === 'dev'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Code2 className="w-4 h-4" />
                    <span>💻 Разработка и экспорт (VS Code / APK / PWA)</span>
                  </button>
                </div>

                <button
                  onClick={handleExportJSON}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Скачать JSON-бэкап базы
                </button>
              </div>

              {/* SUBVIEW A: COMPACT ANDROID WIDGET MODE */}
              {widgetSubTab === 'widget' && (
                <div className="max-w-md mx-auto w-full bg-slate-900 text-white rounded-[36px] p-5 border-4 border-slate-800 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
                        Android Home Widget Mode
                      </span>
                      <h3 className="font-bold text-base">Фокус дня • С Камиллой</h3>
                    </div>
                    <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded-full text-emerald-400">
                      {formatRussianDate(toDateStr(new Date()))}
                    </span>
                  </div>

                  {/* Quick 1-Line Task Input */}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!widgetQuickTaskTitle.trim() || !user) return;
                      const id = `${familyCode}_wtask_${Date.now()}`;
                      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kanban_tasks', id), {
                        id,
                        familyCode,
                        title: widgetQuickTaskTitle.trim(),
                        category: 'work',
                        status: 'in_progress',
                        deadline: toDateStr(new Date()),
                        time: '',
                        recurrence: 'none',
                        waitingFor: '',
                        autoClose: true,
                        notes: 'Добавлено с Android-виджета',
                        links: [],
                        subtasks: [],
                        archived: false,
                        createdAt: Date.now()
                      });
                      setWidgetQuickTaskTitle('');
                      showToastMsg('⚡ Задача сразу добавлена в «3. В работе»!');
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={widgetQuickTaskTitle}
                      onChange={(e) => setWidgetQuickTaskTitle(e.target.value)}
                      placeholder="Быстрая задача сразу «В работу»..."
                      className="flex-1 px-3.5 py-2 rounded-2xl text-xs bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-2xl bg-cyan-500 text-slate-950 font-bold text-xs"
                    >
                      +
                    </button>
                  </form>

                  {/* Widget Section 1: Active "In Progress" Tasks */}
                  <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-400">
                        🔥 Сейчас в работе ({familyTasks.filter((t) => t.status === 'in_progress').length}/4)
                      </span>
                      <button
                        onClick={() => setActiveTab('kanban')}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Вся доска →
                      </button>
                    </div>
                    <div className="space-y-2">
                      {familyTasks.filter((t) => t.status === 'in_progress').length === 0 ? (
                        <p className="text-xs text-slate-500 py-2">Нет активных задач в работе</p>
                      ) : (
                        familyTasks
                          .filter((t) => t.status === 'in_progress')
                          .map((t) => (
                            <div
                              key={t.id}
                              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-between gap-2"
                            >
                              <span className="text-xs font-medium truncate">{t.title}</span>
                              <button
                                onClick={() => handleMoveTaskColumn(t, 'done')}
                                className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-bold shrink-0"
                              >
                                ✓ Готово
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Widget Section 2: Daily Checklist with Kamilla Progress */}
                  <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-400">
                        🏠 Наш день с Камиллой
                      </span>
                      <button
                        onClick={() => setActiveTab('family')}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Открыть →
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {(currentDayLog?.items || []).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleToggleDailyItem(item.id)}
                          className="w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-xl bg-slate-900/70 hover:bg-slate-900 text-xs"
                        >
                          <span className={item.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                            {item.completed ? '☑ ' : '☐ '} {item.text}
                          </span>
                          {item.completedBy && (
                            <span className="text-[9px] text-emerald-400 ml-2 shrink-0">{item.completedBy}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Widget Section 3: Unchecked Shopping Items */}
                  <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-rose-400">
                        🛒 Купить в магазине ({familyShopping.filter((s) => !s.completed).length})
                      </span>
                      <button
                        onClick={() => setActiveTab('shopping')}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Все покупки →
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {familyShopping.filter((s) => !s.completed).length === 0 ? (
                        <span className="text-xs text-slate-500">Все продукты куплены!</span>
                      ) : (
                        familyShopping
                          .filter((s) => !s.completed)
                          .map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleToggleShoppingItem(item)}
                              className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs hover:border-emerald-500 transition"
                            >
                              ☐ {item.title} {item.qty ? `(${item.qty})` : ''}
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBVIEW B: DEVELOPER HUB & SELF-HOSTING GUIDE */}
              {widgetSubTab === 'dev' && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Terminal className="w-6 h-6 text-indigo-500" />
                      Как развивать эту систему самостоятельно (Windows + Android)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Весь код приложения находится в одном файле <code>App.jsx</code> и не привязан к закрытым конструкторам. Вы можете развернуть его у себя локально в VS Code, выложить на бесплатный хостинг Vercel и установить на Android как PWA-приложение.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                        <FolderGit2 className="w-4 h-4" />
                        Шаг 1. Запуск на своём ПК (Vite + React)
                      </h3>
                      <pre className="text-[11px] font-mono bg-slate-900 text-emerald-400 p-3 rounded-xl overflow-x-auto leading-relaxed">
{`npm create vite@latest my-life-os -- --template react
cd my-life-os
npm install firebase lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p`}
                      </pre>
                      <p className="text-xs text-slate-500 mt-2">
                        Затем скопируйте код этого файла в <code>src/App.jsx</code> и подставьте свой бесплатный конфиг из консоли <code>console.firebase.google.com</code>.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <Smartphone className="w-4 h-4" />
                        Шаг 2. Установка на Android и Windows (PWA)
                      </h3>
                      <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                        <li>
                          1. Выложите проект на бесплатный <strong>Vercel</strong> или <strong>Firebase Hosting</strong> (деплой занимает 1 минуту из GitHub).
                        </li>
                        <li>
                          2. На телефоне Android (у вас и у Камиллы) откройте ссылку в Chrome и нажмите <strong>«Добавить на главный экран» (Установить приложение)</strong>.
                        </li>
                        <li>
                          3. На Windows в браузере Chrome/Edge нажмите иконку установки в адресной строке — приложение появится на панели задач как нативная программа.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ========================================== */}
        {/* MODAL 1: CREATE / EDIT TASK & SUBTASKS     */}
        {/* ========================================== */}
        {editingTask && (
          <TaskModal
            task={editingTask}
            isCreating={isCreatingTask}
            onClose={() => setEditingTask(null)}
            onSave={handleSaveTask}
            onDelete={handleDeleteTask}
          />
        )}

        {/* ========================================== */}
        {/* MODAL 2: MASTER DAILY TEMPLATE SETTINGS    */}
        {/* ========================================== */}
        {showTemplateModal && (
          <TemplateModal
            items={currentTemplateDoc}
            onClose={() => setShowTemplateModal(false)}
            onSave={handleSaveMasterTemplate}
          />
        )}

        {/* ========================================== */}
        {/* MODAL 3: ARCHIVE DRAWER                    */}
        {/* ========================================== */}
        {showArchiveModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Archive className="w-5 h-5 text-indigo-500" />
                  Архив выполненных задач ({archivedTasks.length})
                </h3>
                <button
                  onClick={() => setShowArchiveModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {archivedTasks.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">
                    В архиве пока пусто. Нажмите «📦 В архив» в колонке «5. Готово», чтобы убирать выполненные задачи с доски.
                  </p>
                ) : (
                  archivedTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-sm font-semibold line-through text-slate-400">{t.title}</p>
                        <span className="text-[11px] text-slate-400">
                          Срок был: {t.deadline ? formatRussianDate(t.deadline) : 'Без срока'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRestoreFromArchive(t)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-xs font-semibold"
                        >
                          Вернуть
                        </button>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* MODAL 4: QUICK BRAIN-DUMP SCRATCHPAD       */}
        {/* ========================================== */}
        {showScratchpadModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  Быстрый Инбокс (Выгрузка мыслей)
                </h3>
                <button
                  onClick={() => setShowScratchpadModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Напишите любые дела или идеи (каждая строка = отдельная задача) и превратите их в карточки в «1. Бэклог» одним нажатием!
              </p>
              <textarea
                rows={6}
                autoFocus
                value={scratchpadText}
                onChange={(e) => setScratchpadText(e.target.value)}
                placeholder={`Купить батарейки АА\nЗаписаться к стоматологу\nПроверить страховку\nОбсудить планы на выходные с Камиллой`}
                className="w-full p-3.5 rounded-2xl text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowScratchpadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
                >
                  Закрыть
                </button>
                <button
                  onClick={handleConvertScratchpadToTasks}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
                >
                  ⚡ Создать задачи в Бэклоге
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* MODAL 5: SYNC WITH KAMILLA & JSON BACKUP   */}
        {/* ========================================== */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl my-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  Синхронизация с Камиллой и Бэкап
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Введите один и тот же <strong>Код пространства</strong> на компьютере (Windows) и на ваших с Камиллой телефонах (Android) — все задачи, покупки и чек-листы будут синхронизироваться мгновенно!
              </p>

              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Ваш общий код с Камиллой:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempFamilyCode}
                    onChange={(e) => setTempFamilyCode(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
                    className="flex-1 px-3.5 py-2.5 rounded-xl font-mono font-bold text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    placeholder="Например: ALMAZ-KAMILLA-2026"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(tempFamilyCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700"
                    title="Скопировать код"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* JSON Backup Export / Import Section */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mb-4">
                <p className="text-xs font-bold mb-2">💾 Локальная резервная копия (JSON):</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-indigo-500 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-500" />
                    Скачать бэкап
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-emerald-500 transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-500" />
                    Восстановить
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    if (tempFamilyCode.trim()) {
                      setFamilyCode(tempFamilyCode.trim());
                      setShowShareModal(false);
                      showToastMsg(`Подключено пространство: ${tempFamilyCode.trim()}`);
                    }
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Применить код
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// SUBCOMPONENT: TASK EDIT / CREATE MODAL
// ==========================================
function TaskModal({ task, isCreating, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ ...task });
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    const next = [
      ...(form.subtasks || []),
      { id: `sub_${Date.now()}`, text: newSubtaskText.trim(), completed: false }
    ];
    setForm({ ...form, subtasks: next });
    setNewSubtaskText('');
  };

  const handleToggleSub = (id) => {
    const next = (form.subtasks || []).map((s) =>
      s.id === id ? { ...s, completed: !s.completed } : s
    );
    setForm({ ...form, subtasks: next });
  };

  const handleRemoveSub = (id) => {
    const next = (form.subtasks || []).filter((s) => s.id !== id);
    setForm({ ...form, subtasks: next });
  };

  const handleAddLink = (e) => {
    e.preventDefault();
    if (!newLinkUrl.trim()) return;
    const formattedUrl = newLinkUrl.startsWith('http') ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`;
    const next = [
      ...(form.links || []),
      { id: `lnk_${Date.now()}`, title: newLinkTitle.trim() || 'Документ / Ссылка', url: formattedUrl }
    ];
    setForm({ ...form, links: next });
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const handleRemoveLink = (id) => {
    setForm({ ...form, links: (form.links || []).filter((l) => l.id !== id) });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <h3 className="font-bold text-base sm:text-lg">
            {isCreating ? 'Новая карточка задачи' : 'Редактирование задачи'}
          </h3>
          <div className="flex items-center gap-2">
            {form.deadline && (
              <a
                href={buildGoogleCalendarUrl(form)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>В Google Календарь</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-3.5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Название-действие (конкретно, что нужно сделать)
            </label>
            <input
              type="text"
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Например: Записаться к стоматологу на чистку"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Сфера жизни
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Этап (Колонка)
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Waiting For Input */}
          <div className={`p-3 rounded-xl border ${form.status === 'waiting' ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'}`}>
            <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
              ⏳ Кого или чего мы ждём? (для колонки «4. Ожидание»)
            </label>
            <input
              type="text"
              value={form.waitingFor || ''}
              onChange={(e) => setForm({ ...form, waitingFor: e.target.value })}
              placeholder="Например: Жду ответа от коллеги по ТЗ / Жду SMS о доставке"
              className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            />
          </div>

          {/* Deadline Date, Time & Recurrence */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Срок (Дата)
              </label>
              <input
                type="date"
                value={form.deadline || ''}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Время
              </label>
              <input
                type="time"
                value={form.time || ''}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Повторяемость
              </label>
              <select
                value={form.recurrence || 'none'}
                onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Заметки / Подробности
            </label>
            <textarea
              rows={2}
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Дополнительная информация, адреса, телефоны..."
              className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          {/* External Clickable Links Builder */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
              🔗 Прикреплённые ссылки (Google Диск, документы, сайты)
            </label>
            {(form.links || []).length > 0 && (
              <div className="space-y-1.5 mb-2.5">
                {(form.links || []).map((lnk) => (
                  <div key={lnk.id} className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <a href={lnk.url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline flex items-center gap-1 truncate">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span>{lnk.title}</span>
                    </a>
                    <button type="button" onClick={() => handleRemoveLink(lnk.id)} className="text-slate-400 hover:text-rose-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5">
              <input
                type="text"
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                placeholder="Название (напр. ТЗ или Анализы)"
                className="sm:col-span-5 px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="text"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="https://..."
                className="sm:col-span-5 px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={handleAddLink}
                className="sm:col-span-2 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold hover:bg-indigo-600 hover:text-white transition"
              >
                + Ссылка
              </button>
            </div>
          </div>

          {/* Subtasks Builder */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Подзадачи (Чек-лист внутри карточки)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                <input
                  type="checkbox"
                  checked={form.autoClose !== false}
                  onChange={(e) => setForm({ ...form, autoClose: e.target.checked })}
                  className="rounded text-indigo-600 w-3.5 h-3.5"
                />
                <span>Авто-закрытие при 100%</span>
              </label>
            </div>

            <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto">
              {(form.subtasks || []).map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleSub(st.id)}
                    className="flex items-center gap-2 text-xs text-left flex-1"
                  >
                    {st.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={st.completed ? 'line-through text-slate-400' : ''}>{st.text}</span>
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

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubtask(e);
                }}
                placeholder="Напишите шаг и нажмите +..."
                className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
              >
                + Шаг
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
          {!isCreating ? (
            <button
              type="button"
              onClick={() => onDelete(form.id)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-500/10 flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Удалить
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={() => {
                if (!form.title.trim()) return;
                onSave(form);
              }}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
            >
              Сохранить задачу
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
  const [list, setList] = useState([...items]);
  const [newText, setNewText] = useState('');
  const [newSection, setNewSection] = useState('morning');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setList([
      ...list,
      { id: `tpl_${Date.now()}`, section: newSection, text: newText.trim() }
    ]);
    setNewText('');
  };

  const handleRemove = (id) => {
    setList(list.filter((i) => i.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div>
            <h3 className="font-bold text-lg">Шаблон ежедневных дел с Камиллой</h3>
            <p className="text-xs text-slate-400">
              Эти пункты будут автоматически появляться в каждом новом дне
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1 mb-4">
          {SECTIONS_META.map((sec) => (
            <div key={sec.id}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
                {sec.title}
              </h4>
              <div className="space-y-1.5">
                {list
                  .filter((i) => i.section === sec.id)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl text-xs"
                    >
                      <span>{item.text}</span>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAdd} className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <select
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            className="px-2.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <option value="morning">🌅 Утро</option>
            <option value="day">🧹 День</option>
            <option value="evening">🌙 Вечер</option>
          </select>
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Новая ежедневная привычка с Камиллой..."
            className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500"
          >
            Добавить
          </button>
        </form>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => onSave(list)}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Сохранить шаблон
          </button>
        </div>
      </div>
    </div>
  );
}
