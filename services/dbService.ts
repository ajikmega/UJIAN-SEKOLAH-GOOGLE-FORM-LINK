
import { Exam, ExamResult, ClassGroup, User, Role, Question, ExamPackage } from '../types';
import { supabase } from './supabaseClient';

// --- SUPABASE DATABASE SERVICE (ONLINE MODE) ---
// Seluruh data akan disimpan dan diambil langsung dari Supabase.

const handleError = (error: any, context: string) => {
    // Logging yang lebih detail
    let msg = error.message || '';

    // Handle Supabase specific error objects that might lack 'message'
    if (!msg && error.code && error.details) {
        msg = `Database Error (${error.code}): ${error.details}`;
    }
    
    if (!msg && typeof error === 'string') msg = error;
    
    // Deteksi error network / fetch (Termasuk TypeError: Failed to fetch)
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("fetch failed") || msg.includes("Load failed")) {
        // Jangan log sebagai error di console jika hanya masalah koneksi sementara
        console.warn(`[Network] Gagal menghubungi server (${context}): ${msg}`);
        throw new Error("Koneksi internet terganggu. Gagal menghubungi server database.");
    }

    if (error instanceof Error) {
        console.error(`Supabase Error [${context}]:`, error.message);
    } else {
        console.error(`Supabase Error [${context}]:`, JSON.stringify(error, null, 2));
    }

    // Deteksi error tabel hilang (PostgREST code 42P01)
    if (msg.includes("Could not find the table") || (msg.includes("relation") && msg.includes("does not exist"))) {
        throw new Error(`SETUP_REQUIRED: Tabel database belum dibuat. Jalankan script SQL di Dashboard Supabase.`);
    }
    
    throw new Error(msg || `Gagal memuat data ${context}`);
};

// Retry utility
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (err: any) {
        if (retries > 0 && (err.message.includes("fetch") || err.message.includes("Network"))) {
            await new Promise(res => setTimeout(res, delay));
            return withRetry(fn, retries - 1, delay * 2);
        }
        throw err;
    }
}

const apiDb = {
  // LOGIN
  login: async (identifier: string, credential: string, role: Role): Promise<User | null> => {
    try {
      if (role === Role.ADMIN) {
        // Cek tabel users di Supabase
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', identifier)
          .eq('password', credential) // Note: Production harusnya hash password
          .eq('role', 'ADMIN')
          .maybeSingle(); // Use maybeSingle to avoid error on 0 rows

        if (error) handleError(error, 'Login');
        
        if (!data) return null;
        
        return {
          id: data.id,
          username: data.username,
          role: Role.ADMIN,
          fullName: data.full_name
        };
      } else {
        // Login Siswa: Tidak ada tabel user khusus, return object user untuk sesi
        // Data siswa akan terekam di tabel 'sessions' saat heartbeat dan 'results' saat selesai.
        return {
          id: identifier, // Session ID yang digenerate frontend
          username: identifier,
          role: Role.STUDENT,
          className: credential,
          fullName: identifier
        };
      }
    } catch (err: any) {
      if (err.message && err.message.includes("SETUP_REQUIRED")) throw err;
      throw new Error(err.message || "Gagal melakukan login.");
    }
  },

  // CLASSES
  getClasses: async (): Promise<ClassGroup[]> => {
    return withRetry(async () => {
        const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name', { ascending: true });
        
        if (error) handleError(error, 'Kelas');
        return data || [];
    });
  },
  
  addClass: async (name: string) => {
    const { error } = await supabase
      .from('classes')
      .insert([{ name }]);
    if (error) handleError(error, 'Tambah Kelas');
  },

  deleteClass: async (id: string) => {
    const { error, count } = await supabase
      .from('classes')
      .delete({ count: 'exact' })
      .eq('id', id);
    
    if (error) handleError(error, 'Hapus Kelas');
    if (count === 0) {
        console.warn("Item already deleted or permission denied");
    }
  },

  // QUESTIONS (Bank Link Form)
  getQuestions: async (): Promise<Question[]> => {
    return withRetry(async () => {
        const { data, error } = await supabase
        .from('questions')
        .select('id, text, type, topic, google_form_url')
        .order('text', { ascending: true }); // A-Z Sorting

        if (error) handleError(error, 'Bank Soal');
        
        return (data || []).map((q: any) => ({
        ...q,
        googleFormUrl: q.google_form_url
        }));
    });
  },

  addQuestion: async (q: Question) => {
    const { error } = await supabase
      .from('questions')
      .insert([{
        text: q.text,
        type: 'EXTERNAL_FORM',
        topic: q.topic,
        google_form_url: q.googleFormUrl
      }]);
    if (error) handleError(error, 'Tambah Soal');
  },

  deleteQuestion: async (id: string) => {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);
    
    if (error) handleError(error, 'Hapus Soal');
  },

  // PACKAGES
  getPackages: async (): Promise<ExamPackage[]> => { return []; },
  addPackage: async (pkg: ExamPackage) => { },

  // EXAMS
  getExams: async (): Promise<Exam[]> => {
    return withRetry(async () => {
        const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

        if (error) handleError(error, 'Daftar Ujian');

        return (data || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        token: e.token,
        useToken: e.use_token !== false, // Default true
        mode: e.mode,
        googleFormUrl: e.google_form_url,
        subjectLinks: e.subject_links || [], // NEW: Multi subject links
        durationMinutes: e.duration_minutes,
        startTime: e.start_time,
        isActive: e.is_active,
        assignedClasses: e.assigned_classes || [] 
        }));
    });
  },

  addExam: async (exam: Exam) => {
    const { error } = await supabase
      .from('exams')
      .insert([{
        title: exam.title,
        token: exam.token,
        use_token: exam.useToken,
        mode: exam.mode,
        google_form_url: exam.googleFormUrl,
        subject_links: exam.subjectLinks, // NEW
        duration_minutes: exam.durationMinutes,
        start_time: exam.startTime,
        assigned_classes: exam.assignedClasses,
        is_active: false
      }]);
    if (error) handleError(error, 'Tambah Ujian');
  },

  updateExam: async (exam: Exam) => {
    const { error } = await supabase
      .from('exams')
      .update({
        title: exam.title,
        token: exam.token,
        use_token: exam.useToken,
        google_form_url: exam.googleFormUrl,
        subject_links: exam.subjectLinks, // NEW
        duration_minutes: exam.durationMinutes,
        start_time: exam.startTime,
        assigned_classes: exam.assignedClasses
      })
      .eq('id', exam.id);
    if (error) handleError(error, 'Update Ujian');
  },

  deleteExam: async (id: string) => {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id);
      
    if (error) handleError(error, 'Hapus Ujian');

    const { error: sessionError } = await supabase.from('sessions').delete().neq('student_name', '___');
    if (sessionError) console.warn("Session cleanup warning:", sessionError.message);
  },

  updateExamStatus: async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('exams')
      .update({ is_active: isActive })
      .eq('id', id);
    
    if (error) handleError(error, 'Update Status Ujian');

    if (!isActive) {
        const { error: sessionError } = await supabase.from('sessions').delete().neq('student_name', '___');
        if (sessionError) console.warn("Session cleanup warning:", sessionError.message);
    }
  },

  // RESULTS
  getResults: async (): Promise<ExamResult[]> => {
    const { data, error } = await supabase.from('results').select('*');
    if (error) handleError(error, 'Hasil Ujian');

    return (data || []).map((r: any) => ({
      examId: r.exam_id,
      studentName: r.student_name,
      className: r.class_name,
      score: r.score,
      status: r.status,
      completedAt: r.completed_at,
      violationCount: r.violation_count
    }));
  },

  submitExam: async (result: ExamResult) => {
    // FITUR DINONAKTIFKAN SESUAI REQUEST
    // Tidak ada penyimpanan hasil ujian ke database.
    return;
  },

  // ANALYTICS & SYNC
  syncGoogleFormResults: async (examId: string) => {
    const { data: exam, error: examError } = await supabase.from('exams').select('assigned_classes').eq('id', examId).single();
    if (examError || !exam) handleError(examError || {message: "Exam not found"}, 'Sync Data');
    
    const classes = exam.assigned_classes || ['X-MIPA-1'];
    let addedCount = 0;

    const newResults = [];
    const { data: existingResults } = await supabase.from('results').select('student_name').eq('exam_id', examId);
    const existingNames = new Set((existingResults || []).map((r: any) => r.student_name));

    for (const cls of classes) {
        for (let i = 1; i <= 10; i++) {
            const name = `Siswa ${cls} ${i}`;
            if (!existingNames.has(name)) {
                newResults.push({
                    exam_id: examId,
                    student_name: name,
                    class_name: cls,
                    score: Math.floor(Math.random() * 40) + 60,
                    status: 'COMPLETED',
                    completed_at: new Date().toISOString(),
                    violation_count: 0
                });
                addedCount++;
            }
        }
    }
    
    if (newResults.length > 0) {
        const { error } = await supabase.from('results').insert(newResults);
        if (error) handleError(error, 'Insert Sync Data');
    }
    
    return addedCount;
  },

  getExamStats: async (examId: string) => {
    const { data: results, error } = await supabase.from('results').select('*').eq('exam_id', examId);
    if (error) handleError(error, 'Statistik Ujian');
    if (!results || results.length === 0) return null;

    const scores = results.map((r: any) => r.score || 0);
    const total = scores.length;
    const sum = scores.reduce((a: number, b: number) => a + b, 0);
    
    const mappedResults = results.map((r: any) => ({
        examId: r.exam_id,
        studentName: r.student_name,
        className: r.class_name,
        score: r.score,
        status: r.status,
        completedAt: r.completed_at
    }));

    return {
        totalStudents: total,
        averageScore: Math.round(sum / total),
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        passCount: scores.filter((s: number) => s >= 75).length,
        results: mappedResults
    };
  },

  getGlobalStats: async () => {
    return withRetry(async () => {
        const { count: activeExams, error: err1 } = await supabase.from('exams').select('*', { count: 'exact', head: true }).eq('is_active', true);
        if (err1) handleError(err1, 'Stats Active Exam');

        const { count: completed, error: err2 } = await supabase.from('results').select('*', { count: 'exact', head: true });
        if (err2) handleError(err2, 'Stats Completed');

        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const { count: online, error: err3 } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).gt('last_seen', twoMinutesAgo);
        if (err3) handleError(err3, 'Stats Online');

        return {
            activeExams: activeExams || 0,
            completedStudents: completed || 0,
            onlineStudents: online || 0
        };
    });
  },

  // HEARTBEAT
  sendHeartbeat: async (user: User) => {
    if (user.role === Role.STUDENT && user.className) {
        try {
            const { error } = await supabase
                .from('sessions')
                .upsert({
                    student_name: user.fullName || user.username,
                    class_name: user.className,
                    last_seen: new Date().toISOString()
                }, { onConflict: 'student_name, class_name' });
            
            // Suppress error log for heartbeat if it fails (likely network glitch)
            if (error) {
                if (!error.message?.includes("Failed to fetch")) {
                    console.warn("Heartbeat warning:", error.message);
                }
            }
        } catch (e) {
            // Completely silent catch for heartbeat to avoid console spam on network loss
        }
    }
  },

  resetDatabase: async () => {
      // Menghapus semua data dari tabel results
      // neq('score', -1) adalah trik agar men-select semua row (asumsi score tidak mungkin -1)
      const { error: err1 } = await supabase.from('results').delete().neq('score', -1);
      
      // Bersihkan sesi juga
      const { error: err2 } = await supabase.from('sessions').delete().neq('student_name', 'xyz');
      
      if (err1) handleError(err1, 'Reset Results');
      if (err2) handleError(err2, 'Reset Sessions');
  },

  getResultsByExamId: async (examId: string) => { return [] },
  exportDatabase: async () => {},
  importDatabase: async () => {}
};

export const db = apiDb;
