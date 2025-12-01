
import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { User, Exam, Question } from '../types';
import { Button, Card, Modal, Input } from '../components/UI';
import { Clock, CheckCircle, ChevronRight, ChevronLeft, Calendar, Play, RefreshCw, Key, LogOut, LayoutGrid, BookOpen, AlertOctagon, Menu } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

export const StudentExam: React.FC<Props> = ({ user, onLogout }) => {
  // FIX: Lazy initialization untuk mencegah kedipan (flash) ke dashboard saat refresh
  const [activeExam, setActiveExam] = useState<Exam | null>(() => {
    try {
        const savedExamStr = localStorage.getItem('exambit_active_exam');
        if (savedExamStr) {
            const savedExam = JSON.parse(savedExamStr);
            // Security check: pastikan ujian milik user yang sedang login
            if (savedExam._studentUser === user.username) {
                return savedExam;
            } else {
                localStorage.removeItem('exambit_active_exam');
                localStorage.removeItem('exambit_exam_start_timestamp');
            }
        }
    } catch (e) {
        localStorage.removeItem('exambit_active_exam');
    }
    return null;
  });

  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [inputToken, setInputToken] = useState('');
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    const sendSignal = async () => { try { await db.sendHeartbeat(user); } catch(e) { } };
    sendSignal();
    const interval = setInterval(sendSignal, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchExams = async () => {
    try {
        const allExams = await db.getExams();
        const now = new Date();
        
        const filtered = allExams.filter(exam => {
            if (!exam.isActive) return false;
            
            // Cek Kelas
            if (exam.assignedClasses && exam.assignedClasses.length > 0) {
                if (!user.className || !exam.assignedClasses.includes(user.className)) return false;
            }
            
            // Cek Waktu
            if (exam.startTime) {
                const start = new Date(exam.startTime);
                if (now < start) return false;
            }
            
            return true;
        });
        setAvailableExams(filtered);
    } catch(e) { console.error("Failed to fetch exams", e); }
  };

  const handleRefresh = async () => { setIsRefreshing(true); await fetchExams(); setIsRefreshing(false); };
  
  // Load exams only if not currently in an exam
  useEffect(() => { 
      if (!activeExam) {
        fetchExams(); 
        const interval = setInterval(fetchExams, 60000); 
        return () => clearInterval(interval);
      }
  }, [user, activeExam]);

  const handleInitiateExam = (exam: Exam) => { setSelectedExam(exam); setInputToken(''); setTokenError(''); };

  const enterFullScreen = () => {
    const elem = document.documentElement as any;
    if (elem.requestFullscreen) elem.requestFullscreen().catch((err: any) => console.error(err));
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
  };

  const handleSubmitToken = () => {
    if (!selectedExam) return;
    if (inputToken.toUpperCase() === selectedExam.token) {
        enterFullScreen();
        const examState = { ...selectedExam, _studentUser: user.username };
        
        // Simpan state ujian aktif
        localStorage.setItem('exambit_active_exam', JSON.stringify(examState));
        
        // Simpan waktu mulai jika belum ada
        if (!localStorage.getItem('exambit_exam_start_timestamp')) {
            localStorage.setItem('exambit_exam_start_timestamp', Date.now().toString());
        }
        
        setActiveExam(examState); 
        setSelectedExam(null); 
    } else { setTokenError('Token tidak valid!'); }
  };

  const handleFinish = async (score?: number, status: 'COMPLETED' | 'CHEATING_SUSPECTED' = 'COMPLETED', violationCount = 0) => {
    if (activeExam) {
      if (document.fullscreenElement) document.exitFullscreen().catch(err => console.error(err));
      
      // Bersihkan Session Storage Khusus Ujian ini
      localStorage.removeItem('exambit_active_exam'); 
      localStorage.removeItem('exambit_exam_start_timestamp'); 
      
      // Bersihkan Jawaban & Progress (Fitur Resume)
      localStorage.removeItem(`exambit_answers_${activeExam.id}`);
      localStorage.removeItem(`exambit_q_index_${activeExam.id}`);

      setIsExamFinished(true); 
      setActiveExam(null); 
    }
  };

  const handleReturnToDashboard = () => { setIsExamFinished(false); fetchExams(); };

  if (isExamFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 font-sans animate-fade-in">
        <Card className="max-w-md w-full text-center py-12 px-6 shadow-2xl border-t-4 border-green-500 rounded-2xl">
          <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-green-100">
            <CheckCircle size={48} strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800 mb-3 tracking-tight">Sesi Berakhir</h2>
          <p className="text-gray-500 mb-10 leading-relaxed">
            Anda telah keluar dari ruang ujian.<br/>
            Pastikan Anda sudah menekan <b>Submit</b> pada Google Form.
          </p>
          <Button 
            onClick={handleReturnToDashboard} 
            className="w-full py-4 text-lg font-bold shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
          >
            <LayoutGrid size={20} /> Kembali ke Dashboard
          </Button>
        </Card>
        <p className="text-gray-400 text-sm mt-8 font-medium">SMK Muhammadiyah Kalibawang &copy; 2025</p>
      </div>
    );
  }

  if (activeExam) return <ExamRoom exam={activeExam} user={user} onFinish={handleFinish} />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col noselect">
      <header className="bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-lg sticky top-0 z-20">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <BookOpen size={20} strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="font-bold text-lg leading-tight hidden md:block tracking-wide">SMK Muhammadiyah Kalibawang</h1>
                    <h1 className="font-bold text-lg leading-tight md:hidden">CBT System</h1>
                    <p className="text-xs text-blue-200 font-medium">Ujian Berbasis Komputer Online</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden md:flex flex-col items-end mr-2 text-right">
                 <span className="font-bold text-sm">{user.fullName}</span>
                 <span className="text-[10px] bg-blue-900/50 px-2 py-0.5 rounded text-blue-100 font-mono border border-blue-500/30">{user.className}</span>
               </div>
               <Button onClick={onLogout} className="text-xs py-2 px-4 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white border-none shadow-sm font-bold"><LogOut size={14} /> Keluar</Button>
            </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 lg:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <LayoutGrid size={24} className="text-blue-600"/> Daftar Ujian Tersedia
                </h1>
                <p className="text-gray-500 text-sm mt-1">Pilih mata ujian aktif yang sesuai dengan jadwal Anda.</p>
            </div>
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-2 bg-white shadow-sm border-gray-300 text-gray-700">
                <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} /> {isRefreshing ? 'Memuat...' : 'Refresh Jadwal'}
            </Button>
        </div>
        
        {availableExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm p-16 text-center border-2 border-dashed border-gray-200">
                <div className="bg-gray-50 p-4 rounded-full mb-4 text-gray-400"><Calendar size={32} /></div>
                <h3 className="text-lg font-bold text-gray-700">Tidak Ada Ujian Aktif</h3>
                <p className="text-gray-500 max-w-sm mt-2 mb-6">Jadwal ujian untuk kelas Anda belum tersedia saat ini.</p>
                <Button variant="ghost" onClick={handleRefresh} className="text-blue-600">Coba Refresh Lagi</Button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableExams.map(exam => (
                    <div key={exam.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                        <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-blue-400"></div>
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border ${exam.mode === 'GOOGLE_FORM' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                    {exam.mode === 'NATIVE' ? 'Aplikasi' : 'Google Form'}
                                </span>
                                {exam.durationMinutes && (
                                    <span className="flex items-center text-xs text-gray-500 gap-1 bg-gray-100 px-2 py-1 rounded-md">
                                        <Clock size={12} /> {exam.durationMinutes}m
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2 leading-snug group-hover:text-blue-600 transition-colors">{exam.title}</h3>
                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-3">
                                <Calendar size={14} className="text-blue-400"/>
                                <span className="font-medium">{exam.startTime ? new Date(exam.startTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tersedia Sekarang'}</span>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                            <Button onClick={() => handleInitiateExam(exam)} className="w-full justify-center py-3 shadow-blue-200">
                                <Play size={16} fill="currentColor" /> Kerjakan Sekarang
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      <Modal isOpen={!!selectedExam} onClose={() => setSelectedExam(null)}>
        <div className="text-center space-y-6 px-2 py-4">
            <div>
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm"><Key size={32} /></div>
                <h3 className="text-2xl font-bold text-gray-800">Masukkan Token</h3>
                <p className="text-gray-500 text-sm mt-2">Minta token kepada pengawas untuk membuka soal:<br/><span className="font-semibold text-blue-600">{selectedExam?.title}</span></p>
            </div>
            <div className="max-w-xs mx-auto">
                <Input 
                    value={inputToken} 
                    onChange={(e) => { setInputToken(e.target.value.toUpperCase()); setTokenError(''); }}
                    placeholder="TOKEN"
                    className="text-center font-mono text-3xl font-bold tracking-[0.5em] uppercase py-4 border-2 focus:border-blue-500 focus:ring-0 rounded-xl placeholder:text-gray-200"
                    maxLength={10}
                    autoFocus
                />
                {tokenError && <p className="text-red-500 text-sm mt-3 animate-pulse font-medium bg-red-50 py-1 rounded">{tokenError}</p>}
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
                <Button variant="outline" className="flex-1 py-3" onClick={() => setSelectedExam(null)}>Batal</Button>
                <Button className="flex-1 py-3 text-lg" onClick={handleSubmitToken}>Mulai</Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

const ExamRoom: React.FC<{ exam: Exam; user: User; onFinish: (score?: number, status?: 'COMPLETED' | 'CHEATING_SUSPECTED', violations?: number) => void }> = ({ exam, user, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
      const startStr = localStorage.getItem('exambit_exam_start_timestamp');
      if (startStr) {
          const startTime = parseInt(startStr, 10);
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
          const remaining = (exam.durationMinutes * 60) - elapsedSeconds;
          return remaining > 0 ? remaining : 0;
      }
      return exam.durationMinutes * 60;
  });

  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  
  // FIX: Inisialisasi dari LocalStorage (Session Resume)
  const [currentQIndex, setCurrentQIndex] = useState(() => {
      const saved = localStorage.getItem(`exambit_q_index_${exam.id}`);
      return saved ? parseInt(saved, 10) : 0;
  });

  // FIX: Inisialisasi dari LocalStorage (Session Resume)
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
      const saved = localStorage.getItem(`exambit_answers_${exam.id}`);
      return saved ? JSON.parse(saved) : {};
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  // FIX: Simpan Jawaban ke LocalStorage setiap ada perubahan
  useEffect(() => {
      localStorage.setItem(`exambit_answers_${exam.id}`, JSON.stringify(answers));
  }, [answers, exam.id]);

  // FIX: Simpan Posisi Soal ke LocalStorage setiap pindah soal
  useEffect(() => {
      localStorage.setItem(`exambit_q_index_${exam.id}`, currentQIndex.toString());
  }, [currentQIndex, exam.id]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); return false; };
    const handleVisibilityChange = () => { if (document.hidden) recordViolation(); };
    const handleBlur = () => { recordViolation(); };
    const handleFullScreenChange = () => { if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) recordViolation(); };
    const recordViolation = () => { setViolations(prev => { const newVal = prev + 1; if (newVal === 5) setShowWarning(true); return newVal; }); };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    window.addEventListener('blur', handleBlur);

    return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('fullscreenchange', handleFullScreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
        window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    const loadQuestions = async () => {
        if(exam.mode === 'NATIVE' && exam.examPackageId) {
            try {
                const [allPackages, allQuestions] = await Promise.all([db.getPackages(), db.getQuestions()]);
                const pkg = allPackages.find(p => p.id === exam.examPackageId);
                if(pkg) { const examQuestions = allQuestions.filter(q => pkg.questionIds.includes(q.id)); setQuestions(examQuestions); }
            } catch(e) { }
        }
    };
    loadQuestions();
  }, [exam]);

  useEffect(() => {
    const timer = setInterval(() => { setTimeLeft(prev => { if (prev <= 0) { clearInterval(timer); return 0; } return prev - 1; }); }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { if (timeLeft === 0) calculateAndFinish('COMPLETED'); }, [timeLeft]);
  
  useEffect(() => { const sendSignal = async () => { try { await db.sendHeartbeat(user); } catch(e) {} }; const interval = setInterval(sendSignal, 30000); return () => clearInterval(interval); }, [user]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateAndFinish = (status: 'COMPLETED' | 'CHEATING_SUSPECTED' = 'COMPLETED') => {
      let score = 0;
      if (exam.mode === 'NATIVE' && questions.length > 0) {
          let correctCount = 0;
          questions.forEach(q => { if (q.type === 'MULTIPLE_CHOICE' && answers[q.id] === q.correctAnswer) correctCount++; });
          score = Math.round((correctCount / questions.length) * 100);
      }
      onFinish(score, status, violations);
  };

  const reEnterFullScreen = () => {
      const elem = document.documentElement as any;
      if (elem.requestFullscreen) elem.requestFullscreen().catch((err: any) => console.error(err));
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
  };

  const currentQuestion = questions[currentQIndex];

  return (
    <div className="h-dvh flex flex-col bg-gray-100 overflow-hidden noselect font-sans">
      {showWarning && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
              <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-red-500 animate-pulse">
                  <div className="mx-auto w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6"><AlertOctagon size={48} /></div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase">Pelanggaran Terdeteksi!</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <p className="text-red-800 font-bold text-xl">Peringatan ke-{violations}</p>
                  </div>
                  <p className="text-gray-600 mb-8 font-medium">Jangan keluar dari aplikasi atau membuka tab lain. Aktivitas Anda dipantau.</p>
                  <Button onClick={() => { setShowWarning(false); reEnterFullScreen(); }} className="w-full bg-red-600 hover:bg-red-700 py-4 text-lg font-bold shadow-lg shadow-red-500/30">KEMBALI KE UJIAN</Button>
              </div>
          </div>
      )}

      {/* Header Compact for Mobile */}
      <div className="bg-[#0f4c81] text-white shadow-md z-30 flex-shrink-0 relative">
        <div className="container mx-auto px-4 h-14 md:h-16 flex justify-between items-center">
            <div className="flex flex-col min-w-0 mr-4">
              <h1 className="font-bold text-base md:text-xl leading-tight truncate tracking-wide text-white">{exam.title}</h1>
              <div className="flex items-center gap-2 text-[10px] md:text-xs text-blue-200 mt-0.5">
                <span className="font-medium text-white truncate max-w-[100px] md:max-w-none">{user.fullName}</span>
                <span className="w-1 h-1 bg-blue-400 rounded-full flex-shrink-0"></span>
                <span>{user.className}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
               <div className="flex flex-col items-end bg-blue-800/50 px-2 md:px-3 py-1 rounded border border-blue-500/30">
                  <span className="hidden md:block text-[10px] text-blue-300 font-bold uppercase tracking-wider">Sisa Waktu</span>
                  <div className={`font-mono text-lg md:text-xl font-bold leading-none ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                     {formatTime(timeLeft)}
                  </div>
               </div>
               
               <Button 
                onClick={() => setShowConfirmFinish(true)} 
                className="h-9 md:h-10 text-xs font-bold shadow-md bg-white text-blue-800 hover:bg-blue-50 border-none flex items-center gap-2 px-3"
               >
                 <LogOut size={14} className="md:hidden" />
                 <LayoutGrid size={16} className="hidden md:block" /> 
                 <span className="hidden md:inline">Dashboard</span>
               </Button>
            </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
          {exam.mode === 'GOOGLE_FORM' ? (
               <div className="flex-1 bg-white w-full h-full relative">
                 {exam.googleFormUrl ? <iframe src={exam.googleFormUrl} className="w-full h-full border-none block" title="Google Form" allow="fullscreen"></iframe> : <div className="p-10 text-center">URL Form Tidak Valid</div>}
               </div>
          ) : (
              <>
                  {/* Left Side: Question Area */}
                  <div className="flex-1 bg-white overflow-y-auto flex flex-col relative z-0">
                      {questions.length > 0 && currentQuestion ? (
                          <div className="max-w-4xl mx-auto p-4 md:p-8 w-full pb-20 md:pb-12">
                              <div className="flex justify-between items-center mb-4 md:mb-6 border-b pb-3 md:pb-4 sticky top-0 bg-white z-10 pt-2">
                                <span className="text-gray-500 font-bold text-sm md:text-lg">Soal No. <span className="text-blue-600 text-xl md:text-2xl ml-1">{currentQIndex + 1}</span></span>
                                <span className="bg-blue-50 text-blue-700 text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 rounded-full uppercase tracking-wide border border-blue-100">{currentQuestion.type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Esai'}</span>
                              </div>
                              
                              <div className="text-base md:text-xl text-gray-800 mb-6 md:mb-8 leading-relaxed font-medium select-text">
                                  {currentQuestion.text}
                              </div>
                              
                              <div className="space-y-3 md:space-y-4">
                                {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options?.map((opt, idx) => (
                                    <label key={idx} className={`flex items-start md:items-center p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group active:scale-[0.99] ${answers[currentQuestion.id] === idx.toString() ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}>
                                        <div className={`mt-0.5 md:mt-0 w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center mr-3 md:mr-4 flex-shrink-0 transition-colors ${answers[currentQuestion.id] === idx.toString() ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                            {answers[currentQuestion.id] === idx.toString() && <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-white rounded-full" />}
                                        </div>
                                        <input type="radio" name={`q-${currentQuestion.id}`} className="hidden" checked={answers[currentQuestion.id] === idx.toString()} onChange={() => setAnswers({...answers, [currentQuestion.id]: idx.toString()})} />
                                        <span className={`text-sm md:text-lg leading-snug ${answers[currentQuestion.id] === idx.toString() ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>{opt}</span>
                                    </label>
                                ))}
                                {currentQuestion.type === 'ESSAY' && (
                                    <textarea 
                                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[150px] md:min-h-[200px] text-base md:text-lg leading-relaxed shadow-inner"
                                        placeholder="Ketik jawaban Anda di sini..."
                                        value={answers[currentQuestion.id] || ''}
                                        onChange={e => setAnswers({...answers, [currentQuestion.id]: e.target.value})}
                                    ></textarea>
                                )}
                              </div>
                          </div>
                      ) : ( <div className="text-center py-20 text-gray-400">{questions.length === 0 ? "Memuat soal..." : "Soal tidak ditemukan."}</div> )}
                  </div>
                  
                  {/* Right/Bottom Side: Navigation & Actions */}
                  {/* On Mobile: It sits at bottom with max height. On Desktop: Full height sidebar on right */}
                  <div className="w-full md:w-72 lg:w-80 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-inner flex-shrink-0 z-20">
                      <div className="p-3 md:p-6 bg-gray-100 md:bg-transparent border-b border-gray-200 flex justify-between items-center md:block">
                         <h3 className="font-bold text-gray-700 md:mb-4 flex items-center gap-2 text-xs md:text-sm uppercase tracking-wide"><LayoutGrid size={16} /> Navigasi Soal</h3>
                         <span className="md:hidden text-xs text-gray-500 font-mono">{answers[currentQuestion?.id || ''] ? 'Terjawab' : 'Belum dijawab'}</span>
                      </div>
                      
                      {/* Grid Container: Scrollable on mobile if too many questions */}
                      <div className="flex-1 overflow-y-auto p-3 md:p-4 max-h-[35vh] md:max-h-full custom-scrollbar bg-gray-50 md:bg-transparent">
                          <div className="grid grid-cols-5 md:grid-cols-5 gap-2 content-start">
                              {questions.map((_, idx) => (
                                  <button key={idx} onClick={() => setCurrentQIndex(idx)}
                                    className={`aspect-square rounded-lg flex items-center justify-center text-xs md:text-sm font-bold transition-all shadow-sm ${
                                        currentQIndex === idx ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1 transform scale-105 z-10' : 
                                        answers[questions[idx].id] ? 'bg-emerald-500 text-white border-transparent' : 'bg-white border border-gray-200 text-gray-600 hover:bg-white hover:border-blue-300'
                                    }`}
                                  >
                                      {idx + 1}
                                  </button>
                              ))}
                          </div>
                      </div>
                      
                      <div className="p-3 md:p-6 bg-white border-t border-gray-200 flex gap-2 md:gap-3">
                              <Button variant="outline" className="flex-1 h-10 md:h-auto" onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))} disabled={currentQIndex === 0}><ChevronLeft size={16}/></Button>
                              <Button variant="outline" className="flex-1 h-10 md:h-auto" onClick={() => setCurrentQIndex(Math.min(questions.length - 1, currentQIndex + 1))} disabled={currentQIndex === questions.length - 1}><ChevronRight size={16}/></Button>
                      </div>
                  </div>
              </>
          )}
      </div>

      <Modal isOpen={showConfirmFinish} onClose={() => setShowConfirmFinish(false)}>
          <div className="text-center py-4">
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6"><LayoutGrid size={40} /></div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Kembali ke Dashboard?</h3>
              <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                 Pastikan Anda telah mengirim jawaban di Google Form (<b>Submit</b>) sebelum keluar dari halaman ini.
              </p>
              <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 py-3" onClick={() => setShowConfirmFinish(false)}>Batal</Button>
                  <Button className="flex-1 py-3 shadow-lg" onClick={() => calculateAndFinish('COMPLETED')}>Ya, Kembali</Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};
