import { Exam, ExamResult, ClassGroup, User, Role, Question, ExamPackage } from '../types';

// ============================================================================
// KONFIGURASI DATABASE (MODE ONLINE)
// ============================================================================
// Set ke 'true' untuk menggunakan Database MySQL (Production/Server)
// Set ke 'false' untuk mode Simulasi/Offline (Tanpa Server)
const USE_API_BACKEND = false; 
const API_BASE_URL = './api'; 

// --- HELPER & UTILS ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const STORAGE_KEYS = {
  USERS: 'exambit_users',
  CLASSES: 'exambit_classes',
  QUESTIONS: 'exambit_questions',
  PACKAGES: 'exambit_packages',
  EXAMS: 'exambit_exams',
  RESULTS: 'exambit_results'
};

// Initialize Mock Data if empty (Only runs if accessed directly, harmless in API mode)
try {
    if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
        localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify([
            { id: 'c1', name: 'X-MIPA-1' }, { id: 'c2', name: 'X-MIPA-2' }, { id: 'c3', name: 'XII-IPA-1' }
        ]));
    }
} catch (e) {
    console.error("LocalStorage access denied", e);
}

// --- 1. LOCAL STORAGE IMPLEMENTATION (MOCK / OFFLINE) ---
const localDb = {
  login: async (identifier: string, credential: string, role: Role): Promise<User | null> => {
    await delay(500);
    if (role === Role.ADMIN) {
       if (identifier.toLowerCase() === 'admin') {
           return { id: 'admin-1', username: identifier, role: Role.ADMIN, fullName: 'Administrator' };
       }
    } else {
       if (identifier && credential) {
           return { 
               id: `stu-${Date.now()}`, 
               username: identifier.replace(/\s+/g, '').toLowerCase(), 
               role: Role.STUDENT, 
               fullName: identifier, 
               className: credential 
           };
       }
    }
    return null;
  },

  // Classes
  getClasses: async (): Promise<ClassGroup[]> => {
    await delay(300);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES) || '[]');
  },
  addClass: async (name: string) => {
    await delay(300);
    const classes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES) || '[]');
    const newClass = { id: `cls-${Date.now()}`, name };
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify([...classes, newClass]));
    return newClass;
  },
  deleteClass: async (id: string) => {
    await delay(300);
    const classes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES) || '[]');
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes.filter((c: any) => c.id !== id)));
  },

  // Questions
  getQuestions: async (): Promise<Question[]> => {
    await delay(300);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.QUESTIONS) || '[]');
  },
  addQuestion: async (q: Question) => {
    await delay(300);
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUESTIONS) || '[]');
    const newQ = { ...q, id: q.id || `q-${Date.now()}` };
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify([...list, newQ]));
    return newQ;
  },
  deleteQuestion: async (id: string) => {
    await delay(300);
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUESTIONS) || '[]');
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(list.filter((q: any) => q.id !== id)));
  },

  // Packages (Not used in Form mode, but kept for types)
  getPackages: async (): Promise<ExamPackage[]> => {
    await delay(300);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PACKAGES) || '[]');
  },
  addPackage: async (pkg: ExamPackage) => {
    await delay(300);
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.PACKAGES) || '[]');
    const newPkg = { ...pkg, id: `pkg-${Date.now()}` };
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify([...list, newPkg]));
    return newPkg;
  },

  // Exams
  getExams: async (): Promise<Exam[]> => {
    await delay(400);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAMS) || '[]');
  },
  addExam: async (exam: Exam) => {
    await delay(400);
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAMS) || '[]');
    const newExam = { ...exam, id: `ex-${Date.now()}` };
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify([...list, newExam]));
    return newExam;
  },
  updateExam: async (updated: Exam) => {
    await delay(300);
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAMS) || '[]');
    const idx = list.findIndex((e: any) => e.id === updated.id);
    if (idx !== -1) {
        list[idx] = updated;
        localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(list));
    }
  },
  deleteExam: async (id: string) => {
    await delay(300);
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAMS) || '[]');
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(list.filter((e: any) => e.id !== id)));
  },
  updateExamStatus: async (id: string, isActive: boolean) => {
    await delay(200);
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAMS) || '[]');
    const updated = list.map((e: any) => e.id === id ? { ...e, isActive } : e);
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(updated));
  },

  // Results
  getResults: async (): Promise<ExamResult[]> => {
    await delay(300);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]');
  },
  getResultsByExamId: async (examId: string): Promise<ExamResult[]> => {
      await delay(300);
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]');
      return all.filter((r: any) => r.examId === examId);
  },
  submitExam: async (result: ExamResult) => {
    await delay(800);
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]');
    const existingIdx = list.findIndex((r: any) => r.examId === result.examId && r.studentName === result.studentName);
    if (existingIdx >= 0) {
        list[existingIdx] = result;
    } else {
        list.push(result);
    }
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(list));
  },

  // Stats & Sync
  syncGoogleFormResults: async (examId: string): Promise<number> => {
    await delay(1500);
    const exams = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAMS) || '[]');
    const exam = exams.find((e: any) => e.id === examId);
    if (!exam) return 0;

    const classes = exam.assignedClasses || ['XII-IPA-1'];
    const results = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]');
    let addedCount = 0;

    for (const cls of classes) {
        for (let i = 1; i <= 15; i++) {
            const name = `Siswa ${cls} ${i}`;
            if (!results.find((r: any) => r.studentName === name && r.examId === examId)) {
                results.push({
                    examId,
                    studentName: name,
                    className: cls,
                    completedAt: new Date().toISOString(),
                    status: 'COMPLETED',
                    score: Math.floor(Math.random() * 40) + 60 
                });
                addedCount++;
            }
        }
    }
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
    return addedCount;
  },

  getExamStats: async (examId: string) => {
      await delay(300);
      const results = (JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]') as ExamResult[])
                      .filter(r => r.examId === examId);
      
      if (results.length === 0) return null;

      const scores = results.map(r => r.score || 0);
      const total = scores.length;
      const sum = scores.reduce((a, b) => a + b, 0);
      const avg = Math.round(sum / total);
      const max = Math.max(...scores);
      const min = Math.min(...scores);
      const pass = scores.filter(s => s >= 75).length;

      return {
          totalStudents: total,
          averageScore: avg,
          highestScore: max,
          lowestScore: min,
          passCount: pass,
          results: results
      };
  },

  getGlobalStats: async () => {
      await delay(500);
      const exams = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAMS) || '[]');
      const results = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]');
      // In local mode, we just simulate '1' online user (the current one)
      return {
          activeExams: exams.filter((e: any) => e.isActive).length,
          completedStudents: results.length,
          onlineStudents: 1 
      };
  },

  sendHeartbeat: async (user: User) => {
      // In Mock mode, do nothing
  },

  exportDatabase: async () => {},
  importDatabase: async (jsonStr: string) => {},
  resetDatabase: async () => {
      if(confirm("Reset semua data simulasi?")) {
          localStorage.clear();
          window.location.reload();
      }
  }
};

// --- 2. API IMPLEMENTATION (PHP BACKEND) ---
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    const json = await response.json();
    return json.data !== undefined ? json.data : json; 
  } catch (error) {
    console.error(`Fetch Error [${endpoint}]:`, error);
    throw error;
  }
}

const apiDb = {
  login: async (identifier: string, credential: string, role: Role) => 
    apiRequest<User>('/auth.php', { method: 'POST', body: JSON.stringify({ action: 'login', identifier, credential, role }) }),
  
  getClasses: async () => apiRequest<ClassGroup[]>('/classes.php?action=get_all'),
  addClass: async (name: string) => apiRequest('/classes.php', { method: 'POST', body: JSON.stringify({ action: 'create', name }) }),
  deleteClass: async (id: string) => apiRequest('/classes.php', { method: 'POST', body: JSON.stringify({ action: 'delete', id }) }),

  getQuestions: async () => apiRequest<Question[]>('/questions.php?action=get_all'),
  addQuestion: async (q: Question) => apiRequest('/questions.php', { method: 'POST', body: JSON.stringify({ action: 'create', ...q }) }),
  deleteQuestion: async (id: string) => apiRequest('/questions.php', { method: 'POST', body: JSON.stringify({ action: 'delete', id }) }),

  getPackages: async () => apiRequest<ExamPackage[]>('/packages.php?action=get_all'),
  addPackage: async (pkg: ExamPackage) => apiRequest('/packages.php', { method: 'POST', body: JSON.stringify({ action: 'create', ...pkg }) }),

  getExams: async () => apiRequest<Exam[]>('/exams.php?action=get_all'),
  addExam: async (exam: Exam) => apiRequest('/exams.php', { method: 'POST', body: JSON.stringify({ action: 'create', ...exam }) }),
  updateExam: async (exam: Exam) => apiRequest('/exams.php', { method: 'POST', body: JSON.stringify({ action: 'update', ...exam }) }),
  deleteExam: async (id: string) => apiRequest('/exams.php', { method: 'POST', body: JSON.stringify({ action: 'delete', id }) }),
  updateExamStatus: async (id: string, isActive: boolean) => apiRequest('/exams.php', { method: 'POST', body: JSON.stringify({ action: 'set_status', id, isActive }) }),

  getResults: async () => apiRequest<ExamResult[]>('/results.php?action=get_all'),
  getResultsByExamId: async (examId: string) => apiRequest<ExamResult[]>(`/results.php?action=get_by_exam&examId=${examId}`),
  submitExam: async (result: ExamResult) => apiRequest('/results.php', { method: 'POST', body: JSON.stringify({ action: 'submit', ...result }) }),
  
  syncGoogleFormResults: async (examId: string) => {
      const res = await apiRequest<{addedCount: number}>('/sync_results.php', { method: 'POST', body: JSON.stringify({ action: 'sync_mock', examId }) });
      return res.addedCount;
  },
  getExamStats: async (examId: string) => apiRequest<any>(`/analytics.php?action=exam_stats&examId=${examId}`),
  getGlobalStats: async () => apiRequest<any>('/analytics.php?action=global_stats'),
  
  // Realtime Heartbeat
  sendHeartbeat: async (user: User) => {
      if (user.role === Role.STUDENT) {
        await apiRequest('/analytics.php', { 
            method: 'POST', 
            body: JSON.stringify({ 
                action: 'heartbeat', 
                studentName: user.fullName || user.username, 
                className: user.className 
            }) 
        });
      }
  },

  exportDatabase: async () => alert("Gunakan phpMyAdmin untuk export."),
  importDatabase: async () => alert("Gunakan phpMyAdmin untuk import."),
  resetDatabase: async () => { if(confirm("Reset Server DB?")) apiRequest('/system.php', { method: 'POST', body: JSON.stringify({ action: 'reset_db' }) }) }
};

export const db = USE_API_BACKEND ? apiDb : localDb;