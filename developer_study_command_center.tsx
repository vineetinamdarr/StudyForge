
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VineetOS - CSE & Study Command Center</title>

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- ES Module Import Map for React & Lucide Icons -->
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18.3.1",
      "react/": "https://esm.sh/react@18.3.1/",
      "react-dom": "https://esm.sh/react-dom@18.3.1",
      "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
      "lucide-react": "https://esm.sh/lucide-react@0.344.0?deps=react@18.3.1"
    }
  }
  </script>

  <!-- In-browser Babel Compiler for JSX -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body class="bg-[#0b0f19] text-slate-100 min-h-screen">
  <div id="root"></div>

  <!-- React Application Script -->
  <script type="text/babel" data-type="module">
    import React, { useState, useEffect, useRef, useMemo } from 'react';
    import { createRoot } from 'react-dom/client';
    import {
      Terminal, Code2, Brain, Sparkles, Clock, Play, Pause, RotateCcw,
      Volume2, VolumeX, Plus, Trash2, CheckCircle2, ArrowRight, ArrowLeft,
      Flame, Trophy, BookOpen, Layers, FileText, Copy, Check, Download,
      RefreshCw, LayoutGrid, Maximize2, ChevronRight, ChevronLeft, Zap,
      Award, Calendar, Filter, Sliders, Music, Hash, Cpu, Globe,
      Bot, Wand2, Loader2, Send, MessageSquare, Timer, Watch, Quote,
      Image as ImageIcon, BarChart3, Sun, Moon, Save
    } from 'lucide-react';

    // ==========================================
    // GEMINI API HELPER (Exponential Backoff)
    // ==========================================
    // Insert your Gemini API Key here (or leave empty if testing without AI)
    const apiKey = "";
    const GEMINI_MODEL = "gemini-2.5-flash";

    async function callGeminiAPI({ prompt, systemInstruction, responseSchema = null }) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
      };

      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      if (responseSchema) {
        payload.generationConfig = {
          responseMimeType: "application/json",
          responseSchema
        };
      }

      const delays = [1000, 2000, 4000, 8000, 16000];
      for (let attempt = 0; attempt <= delays.length; attempt++) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            throw new Error(`HTTP status ${response.status}`);
          }

          const result = await response.json();
          const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) throw new Error("Empty response from Gemini");
          return responseSchema ? JSON.parse(text) : text;
        } catch (err) {
          if (attempt === delays.length) {
            throw err;
          }
          await new Promise((res) => setTimeout(res, delays[attempt]));
        }
      }
    }

    // ==========================================
    // INITIAL DEMO DATA
    // ==========================================
    const INITIAL_TASKS = [
      {
        id: 't-1',
        title: 'Practice arrays & pointers memory allocation in C',
        category: 'DSA & C/Python',
        priority: 'High',
        status: 'in_progress',
        xp: 50
      },
      {
        id: 't-2',
        title: 'Solve 2 Python logic & string manipulation problems',
        category: 'DSA & C/Python',
        priority: 'High',
        status: 'todo',
        xp: 40
      },
      {
        id: 't-3',
        title: 'Review Hiragana chart & 10 JLPT N5 vocabulary words',
        category: 'Japanese (JLPT N5)',
        priority: 'Medium',
        status: 'in_progress',
        xp: 35
      },
      {
        id: 't-4',
        title: 'Explore Gemini API vision prompts & structured JSON outputs',
        category: 'AI / ML',
        priority: 'Medium',
        status: 'todo',
        xp: 45
      },
      {
        id: 't-5',
        title: 'Revise engineering math differential equations derivations',
        category: 'College / CSE',
        priority: 'Low',
        status: 'todo',
        xp: 30
      },
      {
        id: 't-6',
        title: 'Implement Binary Search iterative & recursive in C++',
        category: 'DSA & C/Python',
        priority: 'Medium',
        status: 'completed',
        xp: 50
      }
    ];

    const INITIAL_FLASHCARDS = [
      { id: 'f-1', jp: 'わたし (私)', romaji: 'Watashi', en: 'I / Me', type: 'Vocab (N5)', mastered: true },
      { id: 'f-2', jp: 'べんきょう (勉強)', romaji: 'Benkyou', en: 'Study / Diligence', type: 'Vocab (N5)', mastered: false },
      { id: 'f-3', jp: 'がくせい (学生)', romaji: 'Gakusei', en: 'Student', type: 'Vocab (N5)', mastered: true },
      { id: 'f-4', jp: 'にほんご (日本語)', romaji: 'Nihongo', en: 'Japanese Language', type: 'Vocab (N5)', mastered: false },
      { id: 'f-5', jp: 'だいがく (大学)', romaji: 'Daigaku', en: 'University / College', type: 'Vocab (N5)', mastered: false },
      { id: 'f-6', jp: 'あ / ア', romaji: 'a', en: 'Vowel "Ah" (Hiragana / Katakana)', type: 'Kana', mastered: true },
      { id: 'f-7', jp: 'き / キ', romaji: 'ki', en: 'Syllable "Ki" (Key)', type: 'Kana', mastered: false },
      { id: 'f-8', jp: 'でんしゃ (電車)', romaji: 'Densha', en: 'Electric Train', type: 'Vocab (N5)', mastered: false },
      { id: 'f-9', jp: 'ともだち (友達)', romaji: 'Tomodachi', en: 'Friend', type: 'Vocab (N5)', mastered: false },
      { id: 'f-10', jp: 'まいります (参ります)', romaji: 'Mairimasu', en: 'To go / To come (Humble)', type: 'Grammar (N5)', mastered: false }
    ];

    const INITIAL_HABITS = [
      {
        id: 'h-1',
        name: 'Code in Python / C (30m+)',
        category: 'DSA & C/Python',
        days: [true, true, true, false, true, true, false],
        streak: 4
      },
      {
        id: 'h-2',
        name: '10 JLPT N5 Words / Kana Review',
        category: 'Japanese (JLPT N5)',
        days: [true, false, true, true, true, true, false],
        streak: 5
      },
      {
        id: 'h-3',
        name: '1 DSA Concept or LeetCode Problem',
        category: 'DSA & C/Python',
        days: [false, true, true, true, false, true, false],
        streak: 2
      },
      {
        id: 'h-4',
        name: 'College CSE Lecture Notes Review',
        category: 'College / CSE',
        days: [true, true, false, true, true, false, false],
        streak: 3
      }
    ];

    const INITIAL_NOTES = {
      snippets: `# Python & C Quick Scratchpad

// 1. C Pointer & Dynamic Array Template
#include <stdio.h>
#include <stdlib.h>

int main() {
    int n = 5;
    int *arr = (int*)malloc(n * sizeof(int));
    for(int i = 0; i < n; i++) *(arr + i) = (i + 1) * 10;
    free(arr);
    return 0;
}

# 2. Python Fast Dictionary Frequency Map
from collections import Counter
nums = [1, 2, 2, 3, 3, 3, 4]
freq = Counter(nums)
print(freq.most_common(1)) # [(3, 3)]`,

      japanese: `# JLPT N5 Grammar & Particle Notes

1. は (wa) - Topic Marker
   わたし は がくせい です。
   (Watashi wa gakusei desu - I am a student.)

2. を (wo/o) - Direct Object Marker
   にほんご を べんきょう します。
   (Nihongo o benkyou shimasu - I study Japanese.)

3. に (ni) / へ (e) - Direction / Time
   だいがく へ いきます。
   (Daigaku e ikimasu - I go to university.)`,

      ideas: `# Hackathon & AI Project Ideas

- Smart Recycling Digital Twin:
  * Combine camera classification with real-time bin capacity telemetry
  * Add gamified reward tokens for campus sustainability
- Next Steps:
  * Benchmark sorting algorithms visualizer
  * Build personal portfolio site after mastering core DSA patterns`
    };

    const COMPLEXITY_DATA = [
      { name: 'Array (Dynamic)', access: 'O(1)', search: 'O(n)', insert: 'O(n)', space: 'O(n)', note: 'Contiguous memory; fast random access via index.' },
      { name: 'Singly Linked List', access: 'O(n)', search: 'O(n)', insert: 'O(1)*', space: 'O(n)', note: 'O(1) insert/delete at head; pointer overhead.' },
      { name: 'Stack / Queue', access: 'O(n)', search: 'O(n)', insert: 'O(1)', space: 'O(n)', note: 'LIFO (Stack) / FIFO (Queue) operations.' },
      { name: 'Hash Table / Dict', access: 'N/A', search: 'O(1)*', insert: 'O(1)*', space: 'O(n)', note: 'Amortized O(1) avg; O(n) worst case on collisions.' },
      { name: 'Binary Search', access: 'N/A', search: 'O(log n)', insert: 'N/A', space: 'O(1)', note: 'Requires sorted array; halves search space each step.' },
      { name: 'Merge Sort', access: 'N/A', search: 'N/A', insert: 'O(n log n)', space: 'O(n)', note: 'Stable divide & conquer sort; guaranteed O(n log n).' },
      { name: 'Quick Sort', access: 'N/A', search: 'N/A', insert: 'O(n log n)*', space: 'O(log n)', note: 'In-place pivot partitioning; fast in practice.' }
    ];

    const TIMER_MODES = [
      { id: 'coding', label: 'Deep Coding', minutes: 25, color: 'from-indigo-500 to-cyan-400', badge: '25m' },
      { id: 'dsa', label: 'DSA Sprint', minutes: 45, color: 'from-emerald-500 to-teal-400', badge: '45m' },
      { id: 'jlpt', label: 'JLPT Study', minutes: 20, color: 'from-fuchsia-500 to-rose-400', badge: '20m' },
      { id: 'short', label: 'Short Break', minutes: 5, color: 'from-amber-400 to-orange-500', badge: '5m' },
      { id: 'long', label: 'Long Break', minutes: 15, color: 'from-sky-400 to-blue-500', badge: '15m' }
    ];

    const CATEGORY_STYLES = {
      'DSA & C/Python': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      'AI / ML': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      'Japanese (JLPT N5)': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      'College / CSE': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    };

    const PRIORITY_STYLES = {
      High: 'bg-red-500/20 text-red-300 border-red-500/30',
      Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      Low: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    };

    const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const DAILY_WALLPAPERS = [
      {
        id: 'wp-1',
        name: 'Mount Fuji Twilight',
        url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1800&q=80',
        accent: 'from-indigo-950/85 via-slate-950/75 to-slate-950/90'
      },
      {
        id: 'wp-2',
        name: 'Cyberpunk Tokyo Neon',
        url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1800&q=80',
        accent: 'from-slate-950/85 via-indigo-950/70 to-slate-950/90'
      },
      {
        id: 'wp-3',
        name: 'Kyoto Bamboo Sanctuary',
        url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1800&q=80',
        accent: 'from-emerald-950/85 via-slate-950/75 to-slate-950/90'
      },
      {
        id: 'wp-4',
        name: 'Deep Space Nebula',
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1800&q=80',
        accent: 'from-slate-950/85 via-cyan-950/75 to-slate-950/90'
      },
      {
        id: 'wp-5',
        name: 'Minimalist Midnight Peaks',
        url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1800&q=80',
        accent: 'from-slate-950/80 via-slate-900/75 to-slate-950/90'
      },
      {
        id: 'wp-6',
        name: 'Sakura Shrine Evening',
        url: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1800&q=80',
        accent: 'from-rose-950/80 via-slate-950/75 to-slate-950/90'
      },
      {
        id: 'wp-7',
        name: 'Aurora Borealis Horizon',
        url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1800&q=80',
        accent: 'from-teal-950/80 via-slate-950/75 to-slate-950/90'
      }
    ];

    const DAILY_QUOTES = [
      {
        quote: "First, solve the problem. Then, write the code.",
        author: "John Johnson",
        jpSub: "継続は力なり (Keizoku wa chikara nari) — Consistency is power."
      },
      {
        quote: "Fall seven times, stand up eight.",
        author: "Japanese Proverb (七転び八起き)",
        jpSub: "Nanakorobi yaoki — Resilience defines mastery."
      },
      {
        quote: "Talk is cheap. Show me the code.",
        author: "Linus Torvalds",
        jpSub: "一歩一歩 (Ippo ippo) — Step by step."
      },
      {
        quote: "Simplicity is the soul of efficiency.",
        author: "Austin Freeman",
        jpSub: "初心忘るべからず — Never forget your beginner's spirit."
      },
      {
        quote: "An investment in knowledge pays the best interest.",
        author: "Benjamin Franklin",
        jpSub: "学問に王道なし — There is no royal road to learning."
      },
      {
        quote: "The only way to learn a new programming language is by writing programs in it.",
        author: "Dennis Ritchie (Creator of C)",
        jpSub: "習うより慣れろ — Learn by doing rather than just being taught."
      },
      {
        quote: "Small daily improvements over time lead to stunning results.",
        author: "Robin Sharma",
        jpSub: "千里の道も一歩から — A journey of a thousand miles begins with a single step."
      }
    ];

    const DAILY_KANJI_LIST = [
      {
        kanji: '学',
        onyomi: 'ガク (Gaku)',
        kunyomi: 'まな-ぶ (Mana-bu)',
        meaning: 'Study, Learning, Science',
        example: '学生 (Gakusei) — Student • 大学 (Daigaku) — University',
        strokes: 8,
        level: 'JLPT N5'
      },
      {
        kanji: '時',
        onyomi: 'ジ (Ji)',
        kunyomi: 'とき (Toki)',
        meaning: 'Time, Hour, Moment',
        example: '時間 (Jikan) — Time / Hours • 一時 (Ichiji) — 1 O’clock',
        strokes: 10,
        level: 'JLPT N5'
      },
      {
        kanji: '道',
        onyomi: 'ドウ (Dou)',
        kunyomi: 'みち (Michi)',
        meaning: 'Way, Road, Path, Philosophy',
        example: '柔道 (Juudou) — Judo • 道 (Michi) — Street / Path',
        strokes: 12,
        level: 'JLPT N5'
      },
      {
        kanji: '電',
        onyomi: 'デン (Den)',
        kunyomi: 'いなずま (Inazuma)',
        meaning: 'Electricity, Powered',
        example: '電車 (Densha) — Electric Train • 電気 (Denki) — Electricity',
        strokes: 13,
        level: 'JLPT N5'
      },
      {
        kanji: '語',
        onyomi: 'ゴ (Go)',
        kunyomi: 'かた-る (Kata-ru)',
        meaning: 'Word, Speech, Language',
        example: '日本語 (Nihongo) — Japanese • 英語 (Eigo) — English',
        strokes: 14,
        level: 'JLPT N5'
      },
      {
        kanji: '書',
        onyomi: 'ショ (Sho)',
        kunyomi: 'か-く (Ka-ku)',
        meaning: 'Write, Book, Document',
        example: '辞書 (Jisho) — Dictionary • 書きます (Kakimasu) — To write',
        strokes: 10,
        level: 'JLPT N5'
      },
      {
        kanji: '力',
        onyomi: 'リョク / リキ (Ryoku)',
        kunyomi: 'ちから (Chikara)',
        meaning: 'Power, Strength, Ability',
        example: '努力 (Doryoku) — Great effort • 能力 (Nouryoku) — Ability',
        strokes: 2,
        level: 'JLPT N4/N5'
      }
    ];

    const getInitialStudyHistory = () => {
      const today = new Date();
      const formatKey = (d) => d.toISOString().split('T')[0];
      const d1 = new Date(today);
      d1.setDate(today.getDate() - 1);
      const d2 = new Date(today);
      d2.setDate(today.getDate() - 2);
      const d3 = new Date(today);
      d3.setDate(today.getDate() - 3);

      return {
        [formatKey(today)]: {
          totalSeconds: 5400,
          sessions: [
            { id: 's-init-1', subject: 'DSA & C/Python', durationSecs: 3600, timestamp: '09:30 AM' },
            { id: 's-init-2', subject: 'Japanese (JLPT N5)', durationSecs: 1800, timestamp: '04:15 PM' }
          ]
        },
        [formatKey(d1)]: {
          totalSeconds: 7800,
          sessions: [
            { id: 's-init-3', subject: 'DSA & C/Python', durationSecs: 4800, timestamp: '07:00 PM' },
            { id: 's-init-4', subject: 'AI / ML', durationSecs: 3000, timestamp: '09:15 PM' }
          ]
        },
        [formatKey(d2)]: {
          totalSeconds: 4500,
          sessions: [
            { id: 's-init-5', subject: 'College / CSE', durationSecs: 4500, timestamp: '06:20 PM' }
          ]
        },
        [formatKey(d3)]: {
          totalSeconds: 9000,
          sessions: [
            { id: 's-init-6', subject: 'DSA & C/Python', durationSecs: 5400, timestamp: '05:00 PM' },
            { id: 's-init-7', subject: 'Japanese (JLPT N5)', durationSecs: 3600, timestamp: '08:30 PM' }
          ]
        }
      };
    };

    function App() {
      const loadState = (key, fallback) => {
        try {
          const saved = localStorage.getItem(`vineet_cmd_${key}`);
          return saved ? JSON.parse(saved) : fallback;
        } catch {
          return fallback;
        }
      };

      const [activeNav, setActiveNav] = useState('dashboard');
      const [xp, setXp] = useState(() => loadState('xp', 340));
      const [tasks, setTasks] = useState(() => loadState('tasks', INITIAL_TASKS));
      const [flashcards, setFlashcards] = useState(() => loadState('flashcards', INITIAL_FLASHCARDS));
      const [habits, setHabits] = useState(() => loadState('habits', INITIAL_HABITS));
      const [notes, setNotes] = useState(() => loadState('notes', INITIAL_NOTES));
      const [focusStats, setFocusStats] = useState(() =>
        loadState('focusStats', { sessionsCompleted: 3, totalMinutes: 85 })
      );

      const [now, setNow] = useState(new Date());
      useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
      }, []);

      useEffect(() => localStorage.setItem('vineet_cmd_xp', JSON.stringify(xp)), [xp]);
      useEffect(() => localStorage.setItem('vineet_cmd_tasks', JSON.stringify(tasks)), [tasks]);
      useEffect(() => localStorage.setItem('vineet_cmd_flashcards', JSON.stringify(flashcards)), [flashcards]);
      useEffect(() => localStorage.setItem('vineet_cmd_habits', JSON.stringify(habits)), [habits]);
      useEffect(() => localStorage.setItem('vineet_cmd_notes', JSON.stringify(notes)), [notes]);
      useEffect(() => localStorage.setItem('vineet_cmd_focusStats', JSON.stringify(focusStats)), [focusStats]);

      const [toast, setToast] = useState(null);
      const triggerToast = (message, icon = 'sparkles') => {
        setToast({ message, icon });
        setTimeout(() => setToast(null), 3200);
      };

      const [selectedMode, setSelectedMode] = useState(TIMER_MODES[0]);
      const [customMinutes, setCustomMinutes] = useState(25);
      const [timeLeft, setTimeLeft] = useState(TIMER_MODES[0].minutes * 60);
      const [totalTime, setTotalTime] = useState(TIMER_MODES[0].minutes * 60);
      const [isRunning, setIsRunning] = useState(false);
      const [linkedTaskId, setLinkedTaskId] = useState('t-1');

      const [ambientType, setAmbientType] = useState('off');
      const [volume, setVolume] = useState(0.25);
      const audioCtxRef = useRef(null);
      const activeNodesRef = useRef([]);

      const [taskFilter, setTaskFilter] = useState('All');
      const [newTaskTitle, setNewTaskTitle] = useState('');
      const [newTaskCategory, setNewTaskCategory] = useState('DSA & C/Python');
      const [newTaskPriority, setNewTaskPriority] = useState('Medium');
      const [showAddTask, setShowAddTask] = useState(false);

      const [studyTab, setStudyTab] = useState('jlpt');
      const [currentCardIdx, setCurrentCardIdx] = useState(0);
      const [isFlipped, setIsFlipped] = useState(false);
      const [showAddCard, setShowAddCard] = useState(false);
      const [newCardJp, setNewCardJp] = useState('');
      const [newCardRomaji, setNewCardRomaji] = useState('');
      const [newCardEn, setNewCardEn] = useState('');
      const [csSearch, setCsSearch] = useState('');

      const [activeNoteTab, setActiveNoteTab] = useState('snippets');
      const [copiedNote, setCopiedNote] = useState(false);

      const [use24Hour, setUse24Hour] = useState(false);
      const [zenClockMode, setZenClockMode] = useState('clock');
      const [stopwatchRunning, setStopwatchRunning] = useState(false);
      const [stopwatchSecs, setStopwatchSecs] = useState(() => loadState('stopwatch_active_secs', 0));
      const [stopwatchSubject, setStopwatchSubject] = useState('DSA & C/Python');
      const [studyHistory, setStudyHistory] = useState(() => loadState('study_history', getInitialStudyHistory()));

      const dayOfYearIndex = useMemo(() => {
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
      }, [now]);

      const [manualDayOffset, setManualDayOffset] = useState(0);
      const activeWallpaper = DAILY_WALLPAPERS[(dayOfYearIndex + manualDayOffset) % DAILY_WALLPAPERS.length];
      const activeQuote = DAILY_QUOTES[(dayOfYearIndex + manualDayOffset) % DAILY_QUOTES.length];
      const activeKanji = DAILY_KANJI_LIST[(dayOfYearIndex + manualDayOffset) % DAILY_KANJI_LIST.length];

      useEffect(() => {
        localStorage.setItem('vineet_cmd_stopwatch_active_secs', JSON.stringify(stopwatchSecs));
      }, [stopwatchSecs, stopwatchRunning]);

      useEffect(() => {
        localStorage.setItem('vineet_cmd_study_history', JSON.stringify(studyHistory));
      }, [studyHistory]);

      useEffect(() => {
        if (!stopwatchRunning) return;
        const swInterval = setInterval(() => {
          setStopwatchSecs((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(swInterval);
      }, [stopwatchRunning]);

      const formatStopwatch = (totalSeconds) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return {
          hrs: String(hrs).padStart(2, '0'),
          mins: String(mins).padStart(2, '0'),
          secs: String(secs).padStart(2, '0'),
          formatted: `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        };
      };

      const formatHoursReadable = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
      };

      const handleLogStopwatchSession = () => {
        if (stopwatchSecs < 5) {
          triggerToast('Run the stopwatch for at least 5 seconds to log a session!', 'sparkles');
          return;
        }
        setStopwatchRunning(false);
        const todayKey = now.toISOString().split('T')[0];
        const timeStampStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const earnedXp = Math.max(15, Math.round(stopwatchSecs / 60) * 2);

        setStudyHistory((prev) => {
          const existingDay = prev[todayKey] || { totalSeconds: 0, sessions: [] };
          const newSession = {
            id: `sw-${Date.now()}`,
            subject: stopwatchSubject,
            durationSecs: stopwatchSecs,
            timestamp: timeStampStr
          };
          return {
            ...prev,
            [todayKey]: {
              totalSeconds: existingDay.totalSeconds + stopwatchSecs,
              sessions: [newSession, ...existingDay.sessions]
            }
          };
        });

        const loggedTime = formatHoursReadable(stopwatchSecs);
        setStopwatchSecs(0);
        setXp((x) => x + earnedXp);
        playCompletionChime();
        triggerToast(`Logged ${loggedTime} of ${stopwatchSubject} to today's record! (+${earnedXp} XP)`, 'trophy');
      };

      const deleteStudyDayEntry = (dateKey, sessionId, durationSecs) => {
        setStudyHistory((prev) => {
          const dayData = prev[dateKey];
          if (!dayData) return prev;
          const updatedSessions = dayData.sessions.filter((s) => s.id !== sessionId);
          const updatedTotal = Math.max(0, dayData.totalSeconds - durationSecs);
          const next = { ...prev };
          if (updatedSessions.length === 0) {
            delete next[dateKey];
          } else {
            next[dateKey] = {
              totalSeconds: updatedTotal,
              sessions: updatedSessions
            };
          }
          return next;
        });
        triggerToast('Session removed from study log', 'check');
      };

      const [aiSprintGoal, setAiSprintGoal] = useState('');
      const [showAiSprintModal, setShowAiSprintModal] = useState(false);
      const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);

      const [aiDeckTopic, setAiDeckTopic] = useState('');
      const [showAiDeckModal, setShowAiDeckModal] = useState(false);
      const [isGeneratingCards, setIsGeneratingCards] = useState(false);
      const [cardAiExplanation, setCardAiExplanation] = useState(null);
      const [isExplainingCard, setIsExplainingCard] = useState(false);

      const [isAiProcessingNote, setIsAiProcessingNote] = useState(false);

      const [aiChatInput, setAiChatInput] = useState('');
      const [aiPersona, setAiPersona] = useState('dsa');
      const [isAiChatLoading, setIsAiChatLoading] = useState(false);
      const [aiMessages, setAiMessages] = useState([
        {
          role: 'assistant',
          text: "Hey Vineet! I'm your Gemini CSE & JLPT AI Copilot. Ask me to explain a C pointer concept, debug Python code, quiz you on JLPT N5 particles, or brainstorm AI/ML hackathon architectures!"
        }
      ]);

      const handleAiGenerateSprint = async (e) => {
        e.preventDefault();
        if (!aiSprintGoal.trim() || isGeneratingTasks) return;
        setIsGeneratingTasks(true);
        try {
          const schema = {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                category: { type: "STRING" },
                priority: { type: "STRING" },
                xp: { type: "INTEGER" }
              },
              propertyOrdering: ["title", "category", "priority", "xp"]
            }
          };

          const systemInstruction = `You are an expert CSE academic & coding coach for Vineet (Sem 2 CSE student learning C, Python, DSA, AI/ML, and Japanese JLPT N5). Break down the user's study/coding goal into 3 actionable, specific micro-tasks.
Allowed categories ONLY: "DSA & C/Python", "AI / ML", "Japanese (JLPT N5)", "College / CSE".
Allowed priorities ONLY: "High", "Medium", "Low".
XP should be between 30 and 60.`;

          const generated = await callGeminiAPI({
            prompt: `Create 3 actionable study/coding sprint tasks for this goal: "${aiSprintGoal}"`,
            systemInstruction,
            responseSchema: schema
          });

          if (Array.isArray(generated) && generated.length > 0) {
            const validCategories = ['DSA & C/Python', 'AI / ML', 'Japanese (JLPT N5)', 'College / CSE'];
            const validPriorities = ['High', 'Medium', 'Low'];
            const newItems = generated.map((item, idx) => ({
              id: `t-ai-${Date.now()}-${idx}`,
              title: item.title || 'Study Task',
              category: validCategories.includes(item.category) ? item.category : 'DSA & C/Python',
              priority: validPriorities.includes(item.priority) ? item.priority : 'Medium',
              status: 'todo',
              xp: Number(item.xp) || 40
            }));
            setTasks((prev) => [...newItems, ...prev]);
            setXp((x) => x + 15);
            setAiSprintGoal('');
            setShowAiSprintModal(false);
            triggerToast(`✨ AI generated ${newItems.length} sprint tasks! (+15 XP)`, 'sparkles');
          }
        } catch (err) {
          triggerToast('Could not reach Gemini AI. Check API Key.', 'sparkles');
        } finally {
          setIsGeneratingTasks(false);
        }
      };

      const handleAiGenerateCards = async (e) => {
        e.preventDefault();
        if (!aiDeckTopic.trim() || isGeneratingCards) return;
        setIsGeneratingCards(true);
        try {
          const schema = {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                jp: { type: "STRING" },
                romaji: { type: "STRING" },
                en: { type: "STRING" },
                type: { type: "STRING" }
              },
              propertyOrdering: ["jp", "romaji", "en", "type"]
            }
          };

          const systemInstruction = `You are a Japanese JLPT N5 teacher. Generate 4 useful JLPT N5 flashcards related to the user's topic. Include Hiragana/Kanji in 'jp' (e.g. "たべます (食べます)"), Romaji in 'romaji', clear English meaning in 'en', and short tag in 'type' (e.g. "Verb (N5)", "Vocab (N5)", "Grammar (N5)").`;

          const generated = await callGeminiAPI({
            prompt: `Generate 4 JLPT N5 flashcards for topic: "${aiDeckTopic}"`,
            systemInstruction,
            responseSchema: schema
          });

          if (Array.isArray(generated) && generated.length > 0) {
            const added = generated.map((c, i) => ({
              id: `f-ai-${Date.now()}-${i}`,
              jp: c.jp || 'ことば',
              romaji: c.romaji || 'Kotoba',
              en: c.en || 'Word',
              type: c.type || 'AI N5',
              mastered: false
            }));
            setFlashcards((prev) => {
              const updated = [...prev, ...added];
              setCurrentCardIdx(prev.length);
              return updated;
            });
            setIsFlipped(false);
            setAiDeckTopic('');
            setShowAiDeckModal(false);
            setXp((x) => x + 20);
            triggerToast(`✨ Added ${added.length} AI JLPT N5 flashcards! (+20 XP)`, 'sparkles');
          }
        } catch (err) {
          triggerToast('AI card generation failed. Check API key.', 'sparkles');
        } finally {
          setIsGeneratingCards(false);
        }
      };

      const handleExplainCurrentCard = async () => {
        if (!currentCard || isExplainingCard) return;
        setIsExplainingCard(true);
        setCardAiExplanation(null);
        try {
          const systemInstruction = `You are a friendly JLPT N5 Japanese Sensei. Given a vocabulary word or kana, provide:
1) One simple JLPT N5 example sentence in Japanese, Romaji, and English.
2) A quick memory mnemonic or grammar tip (max 3 short bullet lines total). Keep it super concise.`;

          const text = await callGeminiAPI({
            prompt: `Explain this JLPT N5 card: Japanese: "${currentCard.jp}", Romaji: "${currentCard.romaji}", Meaning: "${currentCard.en}"`,
            systemInstruction
          });
          setCardAiExplanation(text);
        } catch (err) {
          triggerToast('Could not fetch AI Sensei explanation.', 'sparkles');
        } finally {
          setIsExplainingCard(false);
        }
      };

      const handleAiScratchpadAssist = async (mode) => {
        const currentText = notes[activeNoteTab] || '';
        if (!currentText.trim() || isAiProcessingNote) return;
        setIsAiProcessingNote(true);
        try {
          let prompt = '';
          if (mode === 'optimize') {
            prompt = `Review the following scratchpad notes/code. Add concise, helpful comments, time/space complexity notes (if code), or clean formatting without removing the user's core content:\n\n${currentText}`;
          } else if (mode === 'quiz') {
            prompt = `Based on these notes, append 2 quick practice questions or mini-challenges (with brief answers) at the bottom so Vineet can test his understanding:\n\n${currentText}`;
          }

          const systemInstruction = `You are an expert CSE & JLPT study assistant. Return the updated scratchpad text directly in clean plain text / markdown format without wrapping the entire response in outer markdown code fences.`;
          const updated = await callGeminiAPI({ prompt, systemInstruction });
          setNotes((prev) => ({
            ...prev,
            [activeNoteTab]: updated.trim()
          }));
          setXp((x) => x + 15);
          triggerToast('✨ Scratchpad enhanced by Gemini AI! (+15 XP)', 'sparkles');
        } catch (err) {
          triggerToast('AI Scratchpad action failed.', 'sparkles');
        } finally {
          setIsAiProcessingNote(false);
        }
      };

      const handleSendAiChat = async (customPrompt = null) => {
        const query = (customPrompt || aiChatInput).trim();
        if (!query || isAiChatLoading) return;

        const userMsg = { role: 'user', text: query };
        setAiMessages((prev) => [...prev, userMsg]);
        if (!customPrompt) setAiChatInput('');
        setIsAiChatLoading(true);

        try {
          const personaPrompts = {
            dsa: "You are an elite C, C++, Python, and Data Structures & Algorithms mentor for Vineet, a Sem 2 CSE student. Give clear, concise explanations with clean code snippets and Big-O complexity analysis.",
            sensei: "You are a warm, encouraging Japanese JLPT N5 Sensei. Explain vocabulary, particles (wa, ga, wo, ni, de), and grammar clearly using Japanese, Romaji, and English.",
            project: "You are a Hackathon & AI/ML Architect mentor. Help brainstorm high-impact CSE projects, Gemini API integrations, and smart digital-twin architectures with practical implementation steps."
          };

          const reply = await callGeminiAPI({
            prompt: query,
            systemInstruction: personaPrompts[aiPersona] || personaPrompts.dsa
          });

          setAiMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
          setXp((x) => x + 10);
        } catch (err) {
          setAiMessages((prev) => [
            ...prev,
            { role: 'assistant', text: '⚠️ Connection to Gemini API timed out. Please check your API key.' }
          ]);
        } finally {
          setIsAiChatLoading(false);
        }
      };

      const stopAmbientAudio = () => {
        activeNodesRef.current.forEach((node) => {
          try {
            if (node.stop) node.stop();
            if (node.disconnect) node.disconnect();
          } catch (e) {}
        });
        activeNodesRef.current = [];
      };

      const playCompletionChime = () => {
        try {
          const ctx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)();
          audioCtxRef.current = ctx;
          if (ctx.state === 'suspended') ctx.resume();

          const notesFreq = [523.25, 659.25, 783.99, 1046.5];
          notesFreq.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
            gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.14);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.14 + 0.8);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.14);
            osc.stop(ctx.currentTime + idx * 0.14 + 0.85);
          });
        } catch (e) {}
      };

      const startAmbientAudio = (type, vol) => {
        stopAmbientAudio();
        if (type === 'off') return;

        try {
          const ctx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)();
          audioCtxRef.current = ctx;
          if (ctx.state === 'suspended') ctx.resume();

          const masterGain = ctx.createGain();
          masterGain.gain.setValueAtTime(vol, ctx.currentTime);
          masterGain.connect(ctx.destination);

          if (type === 'rain') {
            const bufferSize = 2 * ctx.sampleRate;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
              const white = Math.random() * 2 - 1;
              output[i] = (lastOut + 0.02 * white) / 1.02;
              lastOut = output[i];
              output[i] *= 2.5;
            }
            const whiteNoise = ctx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(850, ctx.currentTime);

            whiteNoise.connect(filter);
            filter.connect(masterGain);
            whiteNoise.start(0);
            activeNodesRef.current = [whiteNoise, filter, masterGain];
          } else if (type === 'lofi') {
            const freqs = [174.61, 220.0, 261.63, 329.63];
            const nodes = [masterGain];
            freqs.forEach((f) => {
              const osc = ctx.createOscillator();
              const oscGain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(f, ctx.currentTime);
              oscGain.gain.setValueAtTime(0.18, ctx.currentTime);

              const filter = ctx.createBiquadFilter();
              filter.type = 'lowpass';
              filter.frequency.setValueAtTime(420, ctx.currentTime);

              osc.connect(filter);
              filter.connect(oscGain);
              oscGain.connect(masterGain);
              osc.start();
              nodes.push(osc, filter, oscGain);
            });
            activeNodesRef.current = nodes;
          } else if (type === 'binaural') {
            const oscLeft = ctx.createOscillator();
            const oscRight = ctx.createOscillator();
            const gainNodes = ctx.createGain();
            gainNodes.gain.setValueAtTime(0.35, ctx.currentTime);

            oscLeft.type = 'sine';
            oscRight.type = 'sine';
            oscLeft.frequency.setValueAtTime(200, ctx.currentTime);
            oscRight.frequency.setValueAtTime(214, ctx.currentTime);

            oscLeft.connect(gainNodes);
            oscRight.connect(gainNodes);
            gainNodes.connect(masterGain);
            oscLeft.start();
            oscRight.start();
            activeNodesRef.current = [oscLeft, oscRight, gainNodes, masterGain];
          }
        } catch (e) {
          console.error('Web Audio error:', e);
        }
      };

      useEffect(() => {
        startAmbientAudio(ambientType, volume);
        return () => stopAmbientAudio();
      }, [ambientType, volume]);

      useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setIsRunning(false);
              playCompletionChime();
              const minsCompleted = Math.max(1, Math.round(totalTime / 60));
              setFocusStats((st) => ({
                sessionsCompleted: st.sessionsCompleted + 1,
                totalMinutes: st.totalMinutes + minsCompleted
              }));
              setXp((x) => x + 60);
              triggerToast(`Focus Session Complete! +60 XP & ${minsCompleted}m logged`, 'trophy');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(interval);
      }, [isRunning, totalTime]);

      const selectTimerMode = (mode) => {
        setIsRunning(false);
        setSelectedMode(mode);
        setCustomMinutes(mode.minutes);
        setTimeLeft(mode.minutes * 60);
        setTotalTime(mode.minutes * 60);
      };

      const applyCustomMinutes = (mins) => {
        const valid = Math.min(180, Math.max(1, Number(mins) || 1));
        setCustomMinutes(valid);
        setIsRunning(false);
        setTimeLeft(valid * 60);
        setTotalTime(valid * 60);
      };

      const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      };

      const timerProgress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

      const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        const newTask = {
          id: `t-${Date.now()}`,
          title: newTaskTitle.trim(),
          category: newTaskCategory,
          priority: newTaskPriority,
          status: 'todo',
          xp: newTaskPriority === 'High' ? 50 : newTaskPriority === 'Medium' ? 35 : 25
        };
        setTasks([newTask, ...tasks]);
        setNewTaskTitle('');
        setShowAddTask(false);
        triggerToast('New task added to board!', 'check');
      };

      const moveTask = (taskId, newStatus) => {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === taskId) {
              if (t.status !== 'completed' && newStatus === 'completed') {
                setXp((x) => x + t.xp);
                triggerToast(`Task Completed! +${t.xp} XP earned`, 'zap');
              }
              return { ...t, status: newStatus };
            }
            return t;
          })
        );
      };

      const deleteTask = (taskId) => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      };

      const filteredTasks = useMemo(() => {
        if (taskFilter === 'All') return tasks;
        return tasks.filter((t) => t.category === taskFilter);
      }, [tasks, taskFilter]);

      const toggleCardMastered = (id) => {
        setFlashcards((prev) =>
          prev.map((c) => {
            if (c.id === id) {
              const nextState = !c.mastered;
              if (nextState) {
                setXp((x) => x + 15);
                triggerToast('JLPT Card Marked Mastered! +15 XP', 'sparkles');
              }
              return { ...c, mastered: nextState };
            }
            return c;
          })
        );
      };

      const handleAddCard = (e) => {
        e.preventDefault();
        if (!newCardJp.trim() || !newCardEn.trim()) return;
        const card = {
          id: `f-${Date.now()}`,
          jp: newCardJp.trim(),
          romaji: newCardRomaji.trim() || '—',
          en: newCardEn.trim(),
          type: 'Custom N5',
          mastered: false
        };
        setFlashcards([...flashcards, card]);
        setCurrentCardIdx(flashcards.length);
        setNewCardJp('');
        setNewCardRomaji('');
        setNewCardEn('');
        setShowAddCard(false);
        triggerToast('Added custom JLPT flashcard!', 'check');
      };

      const toggleHabitDay = (habitId, dayIdx) => {
        setHabits((prev) =>
          prev.map((h) => {
            if (h.id !== habitId) return h;
            const updatedDays = [...h.days];
            updatedDays[dayIdx] = !updatedDays[dayIdx];
            const count = updatedDays.filter(Boolean).length;
            if (updatedDays[dayIdx]) {
              setXp((x) => x + 20);
              triggerToast(`Habit Checked! +20 XP`, 'flame');
            }
            return { ...h, days: updatedDays, streak: count };
          })
        );
      };

      const handleExportData = () => {
        const payload = {
          exportedAt: new Date().toISOString(),
          xp,
          focusStats,
          tasks,
          flashcards,
          habits,
          notes,
          studyHistory
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vineet-command-center-backup.json`;
        a.click();
        URL.revokeObjectURL(url);
        triggerToast('Workspace JSON exported!', 'download');
      };

      const handleResetDemo = () => {
        setXp(340);
        setTasks(INITIAL_TASKS);
        setFlashcards(INITIAL_FLASHCARDS);
        setHabits(INITIAL_HABITS);
        setNotes(INITIAL_NOTES);
        setFocusStats({ sessionsCompleted: 3, totalMinutes: 85 });
        setStudyHistory(getInitialStudyHistory());
        setStopwatchSecs(0);
        setStopwatchRunning(false);
        triggerToast('Workspace restored to starter demo data', 'refresh');
      };

      const copyScratchpad = () => {
        navigator.clipboard.writeText(notes[activeNoteTab] || '');
        setCopiedNote(true);
        setTimeout(() => setCopiedNote(false), 1800);
        triggerToast('Copied scratchpad to clipboard!', 'check');
      };

      const currentLevel = Math.floor(xp / 100) + 1;
      const xpInCurrentLevel = xp % 100;
      const totalStreak = habits.reduce((acc, h) => acc + h.streak, 0);
      const currentCard = flashcards[currentCardIdx] || flashcards[0];

      return (
        <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
            <div className="absolute top-1/3 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          </div>

          {toast && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/95 border border-indigo-500/40 shadow-2xl shadow-indigo-500/20 backdrop-blur-md animate-bounce">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
              <span className="text-sm font-medium text-slate-100">{toast.message}</span>
            </div>
          )}

          <aside className="relative z-10 w-full lg:w-64 bg-slate-900/60 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between shrink-0">
            <div>
              <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-500 to-emerald-400 p-[1px] shadow-lg shadow-indigo-500/20">
                    <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                      <Terminal className="w-5 h-5 text-cyan-400" />
                    </div>
                  </div>
                  <div>
                    <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                      VINEET<span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">OS</span>
                    </h1>
                    <p className="text-xs text-slate-400">CSE & Study Command</p>
                  </div>
                </div>
              </div>

              <nav className="p-3 flex lg:flex-col gap-1.5 overflow-x-auto">
                {[
                  { id: 'dashboard', label: 'Command Grid', icon: LayoutGrid, badge: 'All' },
                  { id: 'zen_clock', label: 'Zen Clock & Log', icon: Watch, badge: stopwatchRunning ? formatStopwatch(stopwatchSecs).formatted : 'Live' },
                  { id: 'ai_tutor', label: 'AI Copilot Hub', icon: Bot, badge: 'Gemini' },
                  { id: 'focus', label: 'Focus & Synth', icon: Clock, badge: formatTime(timeLeft) },
                  { id: 'kanban', label: 'Kanban Board', icon: Layers, badge: tasks.filter(t => t.status !== 'completed').length },
                  { id: 'study', label: 'JLPT & DSA Deck', icon: BookOpen, badge: 'N5' },
                  { id: 'scratchpad', label: 'Dev Scratchpad', icon: Code2, badge: 'Code' }
                ].map((item) => {
                  const Icon = item.icon;
                  const active = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveNav(item.id)}
                      className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 ${
                        active
                          ? 'bg-gradient-to-r from-indigo-600/30 to-cyan-500/20 text-white border border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
                        active ? 'bg-indigo-500/30 text-cyan-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="hidden lg:block p-4 m-3 rounded-2xl bg-slate-950/80 border border-slate-800/90">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Active Stack
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['Python', 'C / C++', 'DSA', 'AI/ML', 'JLPT N5'].map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <div className="relative z-10 flex-1 flex flex-col min-w-0">
            <header className="px-6 py-4 bg-slate-900/40 backdrop-blur-xl border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Vineet&apos;s Command Center
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                    <Sparkles className="w-3 h-3" /> Sem 1 CSE
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} •{' '}
                  {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <div className="text-xs">
                    <span className="text-slate-400">Habit Check-ins: </span>
                    <span className="font-bold font-mono text-amber-300">{totalStreak}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold font-mono text-indigo-300">LVL {currentLevel}</span>
                  </div>
                  <div className="w-20 sm:w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${xpInCurrentLevel}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{xp} XP</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleExportData}
                    title="Export Workspace JSON"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5 text-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden md:inline">Export</span>
                  </button>
                  <button
                    onClick={handleResetDemo}
                    title="Reset to Demo Data"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden md:inline">Reset</span>
                  </button>
                </div>
              </div>
            </header>

            <main className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6">
              {activeNav === 'zen_clock' && (
                <div className="space-y-6">
                  <section
                    className="relative rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl min-h-[430px] flex flex-col justify-between p-6 sm:p-8 bg-cover bg-center transition-all duration-700"
                    style={{ backgroundImage: `url('${activeWallpaper.url}')` }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-b ${activeWallpaper.accent} backdrop-blur-[2px] z-0`} />

                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 bg-slate-950/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
                        <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs font-medium text-slate-200">
                          Daily Wallpaper: <strong className="text-white">{activeWallpaper.name}</strong>
                        </span>
                        <button
                          onClick={() => setManualDayOffset((prev) => prev + 1)}
                          className="ml-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-cyan-300 transition"
                          title="Preview Tomorrow's Wallpaper, Quote & Kanji"
                        >
                          Cycle Daily ↻
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-white/15">
                          <button
                            onClick={() => setZenClockMode('clock')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                              zenClockMode === 'clock'
                                ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" /> Full Digital Clock
                          </button>
                          <button
                            onClick={() => setZenClockMode('stopwatch')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                              zenClockMode === 'stopwatch'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            <Watch className="w-3.5 h-3.5" /> Study Timewatch
                            {stopwatchRunning && (
                              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                            )}
                          </button>
                        </div>

                        {zenClockMode === 'clock' && (
                          <button
                            onClick={() => setUse24Hour(!use24Hour)}
                            className="px-3 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-xs font-mono text-slate-200 border border-white/15 backdrop-blur-md transition"
                          >
                            {use24Hour ? '24H' : '12H'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="relative z-10 my-8 flex flex-col items-center justify-center text-center select-none">
                      {zenClockMode === 'clock' ? (
                        <>
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-cyan-300 mb-3 backdrop-blur-md">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {now.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-center gap-2 sm:gap-4 font-mono font-extrabold tracking-tight text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
                            <span className="text-6xl sm:text-8xl md:text-9xl bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-cyan-200">
                              {use24Hour
                                ? String(now.getHours()).padStart(2, '0')
                                : String(now.getHours() % 12 || 12).padStart(2, '0')}
                              :{String(now.getMinutes()).padStart(2, '0')}
                            </span>
                            <div className="flex flex-col items-start">
                              <span className="text-2xl sm:text-4xl md:text-5xl text-cyan-400 font-bold">
                                :{String(now.getSeconds()).padStart(2, '0')}
                              </span>
                              {!use24Hour && (
                                <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-indigo-300 mt-1">
                                  {now.getHours() >= 12 ? 'PM' : 'AM'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <button
                              onClick={() => setZenClockMode('stopwatch')}
                              className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-xs sm:text-sm font-semibold text-white flex items-center gap-2 transition shadow-lg"
                            >
                              <Watch className="w-4 h-4 text-emerald-400" />
                              {stopwatchRunning
                                ? `Timewatch Running (${formatStopwatch(stopwatchSecs).formatted}) — View`
                                : 'Open Study Timewatch Recorder'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
                          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-mono text-emerald-300 mb-3 backdrop-blur-md">
                            <Timer className="w-3.5 h-3.5" />
                            <span>Live Study Timewatch • Records Day-wise Hours</span>
                          </div>

                          <div className="flex items-baseline justify-center gap-1 sm:gap-3 font-mono font-extrabold text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)] my-2">
                            <div className="flex flex-col items-center">
                              <span className="text-5xl sm:text-7xl md:text-8xl text-white">
                                {formatStopwatch(stopwatchSecs).hrs}
                              </span>
                              <span className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Hours</span>
                            </div>
                            <span className="text-4xl sm:text-6xl md:text-7xl text-emerald-400 -translate-y-3">:</span>
                            <div className="flex flex-col items-center">
                              <span className="text-5xl sm:text-7xl md:text-8xl text-white">
                                {formatStopwatch(stopwatchSecs).mins}
                              </span>
                              <span className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Minutes</span>
                            </div>
                            <span className="text-4xl sm:text-6xl md:text-7xl text-emerald-400 -translate-y-3">:</span>
                            <div className="flex flex-col items-center">
                              <span className="text-5xl sm:text-7xl md:text-8xl text-emerald-300">
                                {formatStopwatch(stopwatchSecs).secs}
                              </span>
                              <span className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Seconds</span>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 bg-slate-950/80 backdrop-blur-xl p-3 rounded-2xl border border-white/15">
                            <select
                              value={stopwatchSubject}
                              onChange={(e) => setStopwatchSubject(e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none focus:border-emerald-400"
                            >
                              <option value="DSA & C/Python">💻 DSA & C/Python</option>
                              <option value="Japanese (JLPT N5)">🇯🇵 Japanese (JLPT N5)</option>
                              <option value="AI / ML">🤖 AI / ML Exploration</option>
                              <option value="College / CSE">🎓 College / CSE Lectures</option>
                            </select>

                            <button
                              onClick={() => setStopwatchRunning(!stopwatchRunning)}
                              className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg ${
                                stopwatchRunning
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                              }`}
                            >
                              {stopwatchRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              {stopwatchRunning ? 'Pause Watch' : stopwatchSecs > 0 ? 'Resume Watch' : 'Start Timewatch'}
                            </button>

                            <button
                              onClick={handleLogStopwatchSession}
                              disabled={stopwatchSecs < 5}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save & Log Session</span>
                            </button>

                            <button
                              onClick={() => {
                                setStopwatchRunning(false);
                                setStopwatchSecs(0);
                              }}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                              title="Reset Stopwatch"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative z-10 bg-slate-950/75 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Quote className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm sm:text-base font-semibold text-white italic">
                            &ldquo;{activeQuote.quote}&rdquo;
                          </p>
                          <p className="text-xs text-cyan-300 font-mono mt-0.5">{activeQuote.jpSub}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-300 shrink-0 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                        — {activeQuote.author}
                      </span>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <section className="xl:col-span-5 bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-rose-400" />
                            <h3 className="font-bold text-base text-white">Daily Kanji Spotlight</h3>
                          </div>
                          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            {activeKanji.level} • {activeKanji.strokes} Strokes
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/30 border border-slate-800/90">
                          <div className="w-28 h-28 rounded-2xl bg-slate-950 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-inner">
                            <span className="text-6xl font-bold text-white select-all">
                              {activeKanji.kanji}
                            </span>
                          </div>

                          <div className="space-y-2 text-center sm:text-left flex-1">
                            <div>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                                Core Meaning
                              </span>
                              <h4 className="text-xl font-bold text-rose-300">{activeKanji.meaning}</h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                                <span className="block text-[10px] text-slate-400 font-mono">On&apos;yomi (Chinese)</span>
                                <span className="text-xs font-semibold text-slate-100">{activeKanji.onyomi}</span>
                              </div>
                              <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                                <span className="block text-[10px] text-slate-400 font-mono">Kun&apos;yomi (Japanese)</span>
                                <span className="text-xs font-semibold text-slate-100">{activeKanji.kunyomi}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                          <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                            Compound Vocabulary Example
                          </span>
                          <p className="text-xs sm:text-sm font-medium text-slate-200">
                            {activeKanji.example}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          Rotates automatically every midnight
                        </span>
                        <button
                          onClick={() => {
                            const exists = flashcards.some((f) => f.jp.includes(activeKanji.kanji));
                            if (exists) {
                              triggerToast('This Kanji is already in your JLPT deck!', 'check');
                              return;
                            }
                            setFlashcards((prev) => [
                              ...prev,
                              {
                                id: `f-kanji-${Date.now()}`,
                                jp: activeKanji.kanji,
                                romaji: `${activeKanji.onyomi} / ${activeKanji.kunyomi}`,
                                en: activeKanji.meaning,
                                type: 'Daily Kanji',
                                mastered: false
                              }
                            ]);
                            triggerToast(`Added ${activeKanji.kanji} (${activeKanji.meaning}) to JLPT Deck!`, 'sparkles');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add to JLPT Deck
                        </button>
                      </div>
                    </section>

                    <section className="xl:col-span-7 bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-emerald-400" />
                            <div>
                              <h3 className="font-bold text-base text-white">Day-Wise Study Hours Record</h3>
                              <p className="text-xs text-slate-400">
                                Persistent log of all sessions recorded via the Study Timewatch
                              </p>
                            </div>
                          </div>

                          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono text-emerald-300">
                            Total Logged:{' '}
                            <strong>
                              {formatHoursReadable(
                                Object.values(studyHistory).reduce((acc, d) => acc + (d.totalSeconds || 0), 0)
                              )}
                            </strong>
                          </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2 mb-5 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90">
                          {Array.from({ length: 7 }).map((_, i) => {
                            const d = new Date(now);
                            d.setDate(now.getDate() - (6 - i));
                            const dateKey = d.toISOString().split('T')[0];
                            const daySecs = studyHistory[dateKey]?.totalSeconds || 0;
                            const hoursFloat = +(daySecs / 3600).toFixed(1);
                            const barPercent = Math.min(100, Math.round((daySecs / (4 * 3600)) * 100));
                            const isToday = i === 6;

                            return (
                              <div key={dateKey} className="flex flex-col items-center">
                                <span className="text-[10px] font-mono text-slate-400 mb-1">
                                  {hoursFloat > 0 ? `${hoursFloat}h` : '0h'}
                                </span>
                                <div className="w-full max-w-[32px] h-16 bg-slate-900 rounded-lg border border-slate-800 flex items-end p-0.5 overflow-hidden">
                                  <div
                                    className={`w-full rounded transition-all duration-500 ${
                                      isToday
                                        ? 'bg-gradient-to-t from-emerald-500 to-cyan-400'
                                        : 'bg-indigo-500/60'
                                    }`}
                                    style={{ height: `${Math.max(barPercent, daySecs > 0 ? 14 : 0)}%` }}
                                  />
                                </div>
                                <span
                                  className={`text-[10px] font-mono mt-1.5 ${
                                    isToday ? 'text-emerald-300 font-bold' : 'text-slate-400'
                                  }`}
                                >
                                  {isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {Object.keys(studyHistory)
                            .sort((a, b) => b.localeCompare(a))
                            .map((dateKey) => {
                              const dayRecord = studyHistory[dateKey];
                              const isToday = dateKey === now.toISOString().split('T')[0];
                              return (
                                <div
                                  key={dateKey}
                                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90"
                                >
                                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/80">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-white font-mono">
                                        {dateKey}
                                      </span>
                                      {isToday && (
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                                          Today
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs font-mono font-bold text-cyan-300">
                                      {formatHoursReadable(dayRecord.totalSeconds)}
                                    </span>
                                  </div>

                                  <div className="space-y-1.5">
                                    {dayRecord.sessions.map((sess) => (
                                      <div
                                        key={sess.id}
                                        className="flex items-center justify-between text-xs bg-slate-900/80 px-2.5 py-1.5 rounded-lg"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`text-[10px] px-2 py-0.5 rounded border ${
                                              CATEGORY_STYLES[sess.subject] || CATEGORY_STYLES['College / CSE']
                                            }`}
                                          >
                                            {sess.subject}
                                          </span>
                                          <span className="text-[11px] text-slate-400 font-mono">
                                            at {sess.timestamp}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-emerald-300 font-semibold">
                                            {formatHoursReadable(sess.durationSecs)}
                                          </span>
                                          <button
                                            onClick={() =>
                                              deleteStudyDayEntry(dateKey, sess.id, sess.durationSecs)
                                            }
                                            className="text-slate-500 hover:text-red-400 transition"
                                            title="Remove entry"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {(activeNav === 'dashboard' || activeNav === 'focus' || activeNav === 'kanban') && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  {(activeNav === 'dashboard' || activeNav === 'focus') && (
                    <section
                      className={`${
                        activeNav === 'focus' ? 'xl:col-span-12 max-w-4xl mx-auto w-full' : 'xl:col-span-5'
                      } bg-slate-900/50 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-xl`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-cyan-400" />
                            <h3 className="font-bold text-base text-white">Deep Work Focus Timer</h3>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                              {focusStats.sessionsCompleted} sessions
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300">
                              {focusStats.totalMinutes}m today
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-5">
                          {TIMER_MODES.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => selectTimerMode(m)}
                              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition border text-center ${
                                selectedMode.id === m.id
                                  ? 'bg-indigo-500/20 text-white border-indigo-500/50 shadow-sm'
                                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                              }`}
                            >
                              <div className="truncate">{m.label}</div>
                              <div className="text-[10px] font-mono opacity-75">{m.badge}</div>
                            </button>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-4">
                          <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                              <circle
                                cx="80"
                                cy="80"
                                r="70"
                                fill="none"
                                stroke="#1e293b"
                                strokeWidth="8"
                              />
                              <circle
                                cx="80"
                                cy="80"
                                r="70"
                                fill="none"
                                stroke="url(#timerGrad)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 70}
                                strokeDashoffset={2 * Math.PI * 70 * (1 - timerProgress / 100)}
                                className="transition-all duration-500"
                              />
                              <defs>
                                <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#6366f1" />
                                  <stop offset="100%" stopColor="#22d3ee" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                              <span className="text-3xl font-bold font-mono tracking-wider text-white">
                                {formatTime(timeLeft)}
                              </span>
                              <span className="text-[11px] uppercase tracking-widest text-cyan-400 font-semibold mt-1">
                                {selectedMode.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 w-full sm:w-auto">
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                              <button
                                onClick={() => setIsRunning(!isRunning)}
                                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg ${
                                  isRunning
                                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                                    : 'bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white shadow-indigo-500/25'
                                }`}
                              >
                                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {isRunning ? 'Pause' : 'Start Focus'}
                              </button>
                              <button
                                onClick={() => {
                                  setIsRunning(false);
                                  setTimeLeft(totalTime);
                                }}
                                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                                title="Reset Timer"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-2 bg-slate-950/70 px-3 py-2 rounded-xl border border-slate-800">
                              <span className="text-xs text-slate-400">Custom (min):</span>
                              <input
                                type="number"
                                min="1"
                                max="180"
                                value={customMinutes}
                                onChange={(e) => applyCustomMinutes(e.target.value)}
                                className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-center text-white focus:outline-none focus:border-cyan-400"
                              />
                            </div>

                            <div className="bg-slate-950/70 px-3 py-2 rounded-xl border border-slate-800">
                              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                                Focusing On Task:
                              </label>
                              <select
                                value={linkedTaskId}
                                onChange={(e) => setLinkedTaskId(e.target.value)}
                                className="w-full bg-transparent text-xs text-slate-200 focus:outline-none truncate"
                              >
                                {tasks
                                  .filter((t) => t.status !== 'completed')
                                  .map((t) => (
                                    <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                                      {t.title}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-800/80">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                          <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                            <Music className="w-3.5 h-3.5 text-indigo-400" />
                            Web Audio Ambient Synth
                          </span>
                          <div className="flex items-center gap-2">
                            {ambientType === 'off' ? (
                              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                            )}
                            <input
                              type="range"
                              min="0.02"
                              max="0.6"
                              step="0.02"
                              value={volume}
                              onChange={(e) => setVolume(parseFloat(e.target.value))}
                              className="w-20 accent-cyan-400 cursor-pointer h-1 bg-slate-800 rounded-lg"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { id: 'off', label: 'Muted' },
                            { id: 'rain', label: 'Soft Rain' },
                            { id: 'lofi', label: 'Warm Pad' },
                            { id: 'binaural', label: 'Beta 14Hz' }
                          ].map((sound) => (
                            <button
                              key={sound.id}
                              onClick={() => setAmbientType(sound.id)}
                              className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
                                ambientType === sound.id
                                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {sound.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  {(activeNav === 'dashboard' || activeNav === 'kanban') && (
                    <section
                      className={`${
                        activeNav === 'kanban' ? 'xl:col-span-12' : 'xl:col-span-7'
                      } bg-slate-900/50 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 flex flex-col shadow-xl`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <Layers className="w-5 h-5 text-indigo-400" />
                          <h3 className="font-bold text-base text-white">CSE & Study Sprint Board</h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={taskFilter}
                            onChange={(e) => setTaskFilter(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="All">All Categories</option>
                            <option value="DSA & C/Python">DSA & C/Python</option>
                            <option value="AI / ML">AI / ML</option>
                            <option value="Japanese (JLPT N5)">Japanese (JLPT N5)</option>
                            <option value="College / CSE">College / CSE</option>
                          </select>

                          <button
                            onClick={() => setShowAddTask(!showAddTask)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/20"
                          >
                            <Plus className="w-3.5 h-3.5" /> New Task
                          </button>

                          <button
                            onClick={() => setShowAiSprintModal(!showAiSprintModal)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-fuchsia-600/20"
                          >
                            <Wand2 className="w-3.5 h-3.5" /> AI Sprint Breakdown
                          </button>
                        </div>
                      </div>

                      {showAiSprintModal && (
                        <form
                          onSubmit={handleAiGenerateSprint}
                          className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/90 via-slate-950 to-fuchsia-950/80 border border-fuchsia-500/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                        >
                          <div className="flex items-center gap-2 text-xs font-semibold text-fuchsia-300 shrink-0">
                            <Sparkles className="w-4 h-4 text-fuchsia-400" />
                            <span>Gemini Goal Breakdown:</span>
                          </div>
                          <input
                            type="text"
                            placeholder="e.g., Master C pointers & dynamic memory or Prepare for JLPT N5 particles..."
                            value={aiSprintGoal}
                            onChange={(e) => setAiSprintGoal(e.target.value)}
                            className="flex-1 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-fuchsia-400"
                          />
                          <button
                            type="submit"
                            disabled={isGeneratingTasks}
                            className="px-4 py-2 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0"
                          >
                            {isGeneratingTasks ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-3.5 h-3.5" /> Generate 3 Tasks
                              </>
                            )}
                          </button>
                        </form>
                      )}

                      {showAddTask && (
                        <form
                          onSubmit={handleAddTask}
                          className="mb-4 p-3.5 rounded-xl bg-slate-950/90 border border-indigo-500/30 grid grid-cols-1 sm:grid-cols-12 gap-2.5"
                        >
                          <input
                            type="text"
                            placeholder="e.g., Implement Linked List insertion in C..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className="sm:col-span-6 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                          <select
                            value={newTaskCategory}
                            onChange={(e) => setNewTaskCategory(e.target.value)}
                            className="sm:col-span-3 bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-200"
                          >
                            <option value="DSA & C/Python">DSA & C/Python</option>
                            <option value="AI / ML">AI / ML</option>
                            <option value="Japanese (JLPT N5)">Japanese (JLPT N5)</option>
                            <option value="College / CSE">College / CSE</option>
                          </select>
                          <select
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value)}
                            className="sm:col-span-2 bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-200"
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                          <button
                            type="submit"
                            className="sm:col-span-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg py-2 text-xs transition"
                          >
                            Add
                          </button>
                        </form>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 flex-1">
                        {[
                          { id: 'todo', title: 'To Do', dot: 'bg-slate-400' },
                          { id: 'in_progress', title: 'In Progress', dot: 'bg-cyan-400' },
                          { id: 'completed', title: 'Completed', dot: 'bg-emerald-400' }
                        ].map((col) => {
                          const colTasks = filteredTasks.filter((t) => t.status === col.id);
                          return (
                            <div
                              key={col.id}
                              className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between min-h-[260px]"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                      {col.title}
                                    </h4>
                                  </div>
                                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-400">
                                    {colTasks.length}
                                  </span>
                                </div>

                                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                                  {colTasks.length === 0 ? (
                                    <p className="text-xs text-slate-600 text-center py-8 italic">
                                      No tasks in {col.title}
                                    </p>
                                  ) : (
                                    colTasks.map((task) => (
                                      <div
                                        key={task.id}
                                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition group"
                                      >
                                        <div className="flex items-center justify-between gap-1 mb-1.5">
                                          <span
                                            className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                                              CATEGORY_STYLES[task.category] || CATEGORY_STYLES['College / CSE']
                                            }`}
                                          >
                                            {task.category}
                                          </span>
                                          <span
                                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                              PRIORITY_STYLES[task.priority]
                                            }`}
                                          >
                                            {task.priority}
                                          </span>
                                        </div>

                                        <p
                                          className={`text-xs font-medium leading-relaxed mb-3 ${
                                            task.status === 'completed'
                                              ? 'line-through text-slate-500'
                                              : 'text-slate-200'
                                          }`}
                                        >
                                          {task.title}
                                        </p>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                                          <span className="text-[10px] font-mono text-indigo-400">
                                            +{task.xp} XP
                                          </span>
                                          <div className="flex items-center gap-1">
                                            {task.status !== 'todo' && (
                                              <button
                                                onClick={() =>
                                                  moveTask(
                                                    task.id,
                                                    task.status === 'completed' ? 'in_progress' : 'todo'
                                                  )
                                                }
                                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                                                title="Move Left"
                                              >
                                                <ArrowLeft className="w-3 h-3" />
                                              </button>
                                            )}
                                            {task.status !== 'completed' && (
                                              <button
                                                onClick={() =>
                                                  moveTask(
                                                    task.id,
                                                    task.status === 'todo' ? 'in_progress' : 'completed'
                                                  )
                                                }
                                                className="p-1 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300"
                                                title="Advance Task"
                                              >
                                                <ArrowRight className="w-3 h-3" />
                                              </button>
                                            )}
                                            <button
                                              onClick={() => deleteTask(task.id)}
                                              className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition"
                                              title="Delete"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {(activeNav === 'dashboard' || activeNav === 'study') && (
                  <section
                    className={`${
                      activeNav === 'study' ? 'xl:col-span-12 max-w-4xl mx-auto w-full' : 'xl:col-span-5'
                    } bg-slate-900/50 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-xl`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-rose-400" />
                          <h3 className="font-bold text-base text-white">Study Deck & Cheat Sheet</h3>
                        </div>

                        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                          <button
                            onClick={() => setStudyTab('jlpt')}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                              studyTab === 'jlpt'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            🇯🇵 JLPT N5 Deck
                          </button>
                          <button
                            onClick={() => setStudyTab('cs')}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                              studyTab === 'cs'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            ⚡ Big-O & CS
                          </button>
                        </div>
                      </div>

                      {studyTab === 'jlpt' && currentCard && (
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 mb-2">
                            <span>
                              Card <strong className="text-white font-mono">{currentCardIdx + 1}</strong> of{' '}
                              {flashcards.length} ({flashcards.filter((f) => f.mastered).length} Mastered)
                            </span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setShowAiDeckModal(!showAiDeckModal)}
                                className="text-fuchsia-400 hover:text-fuchsia-300 font-semibold flex items-center gap-1"
                              >
                                <Wand2 className="w-3.5 h-3.5" /> ✨ AI Generate Cards
                              </button>
                              <button
                                onClick={() => setShowAddCard(!showAddCard)}
                                className="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Word
                              </button>
                            </div>
                          </div>

                          {showAiDeckModal && (
                            <form
                              onSubmit={handleAiGenerateCards}
                              className="mb-3 p-3 rounded-xl bg-slate-950 border border-fuchsia-500/40 flex flex-col sm:flex-row gap-2"
                            >
                              <input
                                type="text"
                                placeholder="Topic (e.g., Daily Verbs, Campus Life, Food, Time, Particles)..."
                                value={aiDeckTopic}
                                onChange={(e) => setAiDeckTopic(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-fuchsia-400"
                              />
                              <button
                                type="submit"
                                disabled={isGeneratingCards}
                                className="px-3 py-1.5 bg-fuchsia-500 hover:bg-fuchsia-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shrink-0"
                              >
                                {isGeneratingCards ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5" /> Create 4 N5 Cards
                                  </>
                                )}
                              </button>
                            </form>
                          )}

                          {showAddCard && (
                            <form
                              onSubmit={handleAddCard}
                              className="mb-3 p-3 rounded-xl bg-slate-950 border border-rose-500/30 grid grid-cols-1 sm:grid-cols-3 gap-2"
                            >
                              <input
                                type="text"
                                placeholder="Japanese (e.g. みず)"
                                value={newCardJp}
                                onChange={(e) => setNewCardJp(e.target.value)}
                                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                              />
                              <input
                                type="text"
                                placeholder="Romaji (e.g. Mizu)"
                                value={newCardRomaji}
                                onChange={(e) => setNewCardRomaji(e.target.value)}
                                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                              />
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="English (Water)"
                                  value={newCardEn}
                                  onChange={(e) => setNewCardEn(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                                />
                                <button
                                  type="submit"
                                  className="px-3 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg text-xs"
                                >
                                  Save
                                </button>
                              </div>
                            </form>
                          )}

                          <div
                            onClick={() => setIsFlipped(!isFlipped)}
                            className="cursor-pointer select-none h-48 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/30 border border-slate-800 hover:border-rose-500/40 p-6 flex flex-col items-center justify-center text-center relative transition-all shadow-inner group"
                          >
                            <div className="absolute top-3 left-3 flex items-center gap-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                {currentCard.type}
                              </span>
                              {currentCard.mastered && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  ✓ Mastered
                                </span>
                              )}
                            </div>
                            <span className="absolute top-3 right-3 text-[10px] text-slate-500 group-hover:text-slate-300">
                              Click to flip
                            </span>

                            {!isFlipped ? (
                              <div>
                                <p className="text-3xl sm:text-4xl font-bold text-white tracking-wide mb-2">
                                  {currentCard.jp}
                                </p>
                                <p className="text-xs text-slate-400 font-mono">
                                  Tap to reveal Romaji & Meaning
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <p className="text-lg font-mono text-rose-300 font-semibold">
                                  {currentCard.romaji}
                                </p>
                                <p className="text-2xl font-bold text-white">{currentCard.en}</p>
                                <p className="text-xs text-slate-400">{currentCard.jp}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-3">
                            <button
                              onClick={() => {
                                setIsFlipped(false);
                                setCardAiExplanation(null);
                                setCurrentCardIdx((prev) =>
                                  prev === 0 ? flashcards.length - 1 : prev - 1
                                );
                              }}
                              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => toggleCardMastered(currentCard.id)}
                              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
                                currentCard.mastered
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              {currentCard.mastered ? 'Mastered' : 'Mark Mastered'}
                            </button>

                            <button
                              onClick={handleExplainCurrentCard}
                              disabled={isExplainingCard}
                              className="py-2 px-3 rounded-xl text-xs font-semibold bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-300 border border-fuchsia-500/30 transition flex items-center gap-1.5"
                              title="Get AI Example Sentence & Mnemonic"
                            >
                              {isExplainingCard ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                              )}
                              <span>AI Sensei</span>
                            </button>

                            <button
                              onClick={() => {
                                setIsFlipped(false);
                                setCardAiExplanation(null);
                                setCurrentCardIdx((prev) => (prev + 1) % flashcards.length);
                              }}
                              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          {cardAiExplanation && (
                            <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-fuchsia-500/30 text-xs text-slate-200 space-y-1">
                              <div className="flex items-center justify-between text-fuchsia-300 font-semibold mb-1">
                                <span className="flex items-center gap-1.5">
                                  <Bot className="w-3.5 h-3.5" /> Gemini Sensei Note
                                </span>
                                <button
                                  onClick={() => setCardAiExplanation(null)}
                                  className="text-[10px] text-slate-400 hover:text-white"
                                >
                                  Dismiss
                                </button>
                              </div>
                              <p className="whitespace-pre-line leading-relaxed text-slate-300">
                                {cardAiExplanation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {studyTab === 'cs' && (
                        <div>
                          <input
                            type="text"
                            placeholder="Filter data structure or algorithm..."
                            value={csSearch}
                            onChange={(e) => setCsSearch(e.target.value)}
                            className="w-full mb-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                          />
                          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                            {COMPLEXITY_DATA.filter(
                              (item) =>
                                item.name.toLowerCase().includes(csSearch.toLowerCase()) ||
                                item.note.toLowerCase().includes(csSearch.toLowerCase())
                            ).map((item) => (
                              <div
                                key={item.name}
                                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                                  <span className="font-bold text-cyan-300">{item.name}</span>
                                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                                    <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300">
                                      Search: {item.search}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                                      Ins/Run: {item.insert}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                      Space: {item.space}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-400">{item.note}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {activeNav === 'dashboard' && (
                  <section className="xl:col-span-3 bg-slate-900/50 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Flame className="w-5 h-5 text-amber-400" />
                          <h3 className="font-bold text-base text-white">Daily Habit Matrix</h3>
                        </div>
                        <span className="text-xs font-mono text-amber-300">+20 XP / check</span>
                      </div>

                      <div className="space-y-3.5">
                        {habits.map((habit) => (
                          <div
                            key={habit.id}
                            className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-slate-200 truncate pr-2">
                                {habit.name}
                              </span>
                              <span className="text-[11px] font-mono text-amber-400 shrink-0 flex items-center gap-0.5">
                                <Flame className="w-3 h-3" /> {habit.streak}d
                              </span>
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {DAYS_SHORT.map((dayLabel, idx) => {
                                const done = habit.days[idx];
                                return (
                                  <button
                                    key={dayLabel}
                                    onClick={() => toggleHabitDay(habit.id, idx)}
                                    className={`py-1.5 rounded-lg text-[10px] font-mono font-semibold border transition flex flex-col items-center ${
                                      done
                                        ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300'
                                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                                    }`}
                                  >
                                    <span>{dayLabel[0]}</span>
                                    <span className="mt-0.5">{done ? '✓' : '·'}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {(activeNav === 'dashboard' || activeNav === 'scratchpad') && (
                  <section
                    className={`${
                      activeNav === 'scratchpad' ? 'xl:col-span-12 max-w-5xl mx-auto w-full' : 'xl:col-span-4'
                    } bg-slate-900/50 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-xl`}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Code2 className="w-5 h-5 text-emerald-400" />
                          <h3 className="font-bold text-base text-white">Dev & Study Scratchpad</h3>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAiScratchpadAssist('optimize')}
                            disabled={isAiProcessingNote}
                            title="Add AI Complexity & Code Comments"
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs flex items-center gap-1 transition disabled:opacity-50"
                          >
                            {isAiProcessingNote ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Wand2 className="w-3 h-3" />
                            )}
                            <span>AI Polish</span>
                          </button>
                          <button
                            onClick={() => handleAiScratchpadAssist('quiz')}
                            disabled={isAiProcessingNote}
                            title="Generate 2 Practice Questions from Notes"
                            className="px-2.5 py-1 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/30 text-xs flex items-center gap-1 transition disabled:opacity-50"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Quiz Me</span>
                          </button>
                          <button
                            onClick={copyScratchpad}
                            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs flex items-center gap-1.5 transition"
                          >
                            {copiedNote ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-cyan-400" /> Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-1.5 mb-3">
                        {[
                          { id: 'snippets', label: 'Python / C Code' },
                          { id: 'japanese', label: 'JLPT Notes' },
                          { id: 'ideas', label: 'Project Ideas' }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveNoteTab(tab.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                              activeNoteTab === tab.id
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={notes[activeNoteTab] || ''}
                        onChange={(e) =>
                          setNotes({ ...notes, [activeNoteTab]: e.target.value })
                        }
                        rows={activeNav === 'scratchpad' ? 16 : 9}
                        spellCheck={false}
                        className="w-full flex-1 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none focus:border-emerald-500/50 resize-none"
                        placeholder="Type code snippets, algorithms, or Japanese notes here..."
                      />

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mt-2 pt-1">
                        <span>Auto-saved to localStorage</span>
                        <span>
                          {(notes[activeNoteTab] || '').split('\n').length} lines •{' '}
                          {(notes[activeNoteTab] || '').length} chars
                        </span>
                      </div>
                    </div>
                  </section>
                )}
              </div>

              {(activeNav === 'dashboard' || activeNav === 'ai_tutor') && (
                <section
                  className={`${
                    activeNav === 'ai_tutor' ? 'max-w-5xl mx-auto w-full' : ''
                  } bg-slate-900/60 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-5 shadow-2xl`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-white">Gemini AI Study & Coding Copilot</h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {GEMINI_MODEL}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Interactive mentor for C/Python DSA, JLPT N5 Japanese, and AI/ML Hackathon ideas
                        </p>
                      </div>
                    </div>

                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                      {[
                        { id: 'dsa', label: '💻 DSA & C/Python' },
                        { id: 'sensei', label: '🇯🇵 JLPT N5 Sensei' },
                        { id: 'project', label: '🚀 AI & Hackathons' }
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setAiPersona(p.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            aiPersona === p.id
                              ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-500/40'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      'Explain C pointers vs arrays with a memory diagram example',
                      'Give me a 3-question mini quiz on JLPT N5 particles (wa, wo, ni)',
                      'How do I optimize a Python O(n²) nested loop using a Hash Map?',
                      'Suggest a Gemini API feature for my Smart Recycling project'
                    ].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => handleSendAiChat(chip)}
                        disabled={isAiChatLoading}
                        className="text-xs px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-indigo-500/40 transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-xs sm:max-w-md">{chip}</span>
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 h-72 overflow-y-auto space-y-3 mb-3">
                    {aiMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'user'
                              ? 'bg-indigo-600 text-white rounded-br-none'
                              : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isAiChatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-900 border border-slate-800 text-indigo-300 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Gemini is thinking...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendAiChat();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Ask anything about C pointers, Python DSA, Big-O, or Japanese N5 grammar..."
                      value={aiChatInput}
                      onChange={(e) => setAiChatInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={isAiChatLoading || !aiChatInput.trim()}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-lg shadow-indigo-500/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ask Gemini</span>
                    </button>
                  </form>
                </section>
              )}
            </main>
          </div>
        </div>
      );
    }

    // Mount the React Application
    const root = createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>

