import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { User, Exam, Question } from '../types';
import { Button, Card, Modal, Input } from '../components/UI';
import { Clock, AlertTriangle, CheckCircle, ChevronRight, ChevronLeft, Calendar, Play, RefreshCw, Info, Key, User as UserIcon, LogOut, LayoutGrid, BookOpen, AlertOctagon, ShieldAlert, Maximize } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

export const StudentExam: React.FC<Props> = ({ user, onLogout }) => {
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Token Validation State
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [inputToken, setInputToken] = useState('');
  const [tokenError, setTokenError] = useState('');

  // --- Resume Exam Logic (Persist on Refresh) ---
  useEffect(() => {
    const savedExamStr = localStorage.getItem('exambit_active_exam');
    if (savedExamStr) {
      try {
        const savedExam = JSON.parse(savedExamStr);
        if (savedExam._studentUser === user.username) {
            setActiveExam(savedExam);
        } else {
            localStorage.removeItem('exambit_active_exam');
            localStorage.removeItem('exambit_exam_start_timestamp');
        }
      } catch (e) {
        localStorage.removeItem('exambit_active_exam');
        localStorage.removeItem('exambit_exam_start_timestamp');
      }
    }
  }, [user.username]);

  // --- Heartbeat System (Realtime Online Status) ---
  useEffect(() => {
    const sendSignal = async () => {
        try {
            await db.sendHeartbeat(user);
        } catch(e) { }
    };
    sendSignal();
    const interval = setInterval(sendSignal, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchExams = async () => {
    try {
        const [allExams, allResults] = await Promise.all([
            db.getExams(),
            db.getResults()
        ]);
        
        const now = new Date();
        const filtered = allExams.filter(exam => {
            if (!exam.isActive) return false;
            if (exam.assignedClasses && exam.assignedClasses.length > 0) {
                if (!user.className || !exam.assignedClasses.includes(user.className)) {
                    return false;
                }
            }
            if (exam.startTime) {
                const start = new Date(exam.startTime);
                if (now < start) return false;
            }
            const isDone = allResults.some(r => 
                r.examId === exam.id && 
                r.studentName === (user.fullName || user.username)
            );
            if (isDone) return false;

            return true;
        });
        setAvailableExams(filtered);
    } catch(e) {
        console.error("Failed to fetch exams", e);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchExams();
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchExams();
    const interval = setInterval(fetchExams, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleInitiateExam = (exam: Exam) => {
    setSelectedExam(exam);
    setInputToken('');
    setTokenError('');
  };

  const enterFullScreen = () => {
    const elem = document.documentElement as any;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch((err: any) => console.error("FS Error:", err));
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    }
  };

  const handleSubmitToken = () => {
    if (!selectedExam) return;
    if (inputToken.toUpperCase() === selectedExam.token) {
        enterFullScreen();
        const examState = { ...selectedExam, _studentUser: user.username };
        localStorage.setItem('exambit_active_exam', JSON.stringify(examState));
        
        if (!localStorage.getItem('exambit_exam_start_timestamp')) {
            localStorage.setItem('exambit_exam_start_timestamp', Date.now().toString());
        }

        setActiveExam(examState); 
        setSelectedExam(null); 
    } else {
        setTokenError('Token tidak valid!');
    }
  };

  const handleFinish = async (score?: number, status: 'COMPLETED' | 'CHEATING_SUSPECTED' = 'COMPLETED', violationCount = 0) => {
    if (activeExam) {
      if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => console.error(err));
      }

      const resultData = {
        examId: activeExam.id,
        studentName: user.fullName || user.username,
        className: user.className || 'Unknown',
        completedAt: new Date().toISOString(),
        status: status,
        score: score !== undefined ? score : 0,
        violationCount: violationCount
      };

      try {
          await db.submitExam(resultData);
          localStorage.removeItem('exambit_active_exam');
          localStorage.removeItem('exambit_exam_start_timestamp');
          setIsExamFinished(true);
          setActiveExam(null);
      } catch(e) {
          alert("Gagal menyimpan jawaban. Periksa koneksi internet Anda.");
      }
    }
  };

  const handleReturnToDashboard = () => {
      setIsExamFinished(false);
      fetchExams(); 
  };

  if (isExamFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center py-12">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ujian Selesai!</h2>
          <p className="text-gray-600 mb-6">Jawaban Anda telah tersimpan di server.</p>
          <Button onClick={handleReturnToDashboard}>Kembali ke Dashboard</Button>
        </Card>
      </div>
    );
  }

  if (activeExam) {
    return <ExamRoom exam={activeExam} user={user} onFinish={handleFinish} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col noselect">
      <header className="bg-[#0f4c81] text-white shadow-md sticky top-0 z-10 border-b border-blue-800">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#0f4c81] shadow-sm">
                    <BookOpen size={24} strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="font-bold text-lg leading-tight hidden md:block">SMK Muhammadiyah Kalibawang</h1>
                    <h1 className="font-bold text-lg leading-tight md:hidden">SMK Muh Kalibawang</h1>
                    <p className="text-xs text-blue-200">Computer Based Test</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden md:flex flex-col items-end mr-2">
                 <span className="font-semibold text-sm">{user.fullName}</span>
                 <span className="text-xs bg-blue-700 px-2 py-0.5 rounded text-blue-100 font-mono">{user.className}</span>
               </div>
               <Button 
                 variant="danger" 
                 onClick={onLogout} 
                 className="py-1.5 px-3 text-xs font-bold border border-red-400 hover:bg-red-600 flex items-center gap-2"
               >
                 <LogOut size={14} /> Keluar
               </Button>
            </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <LayoutGrid size={24} className="text-blue-600"/> Daftar Ujian Tersedia
                </h1>
                <p className="text-gray-500 text-sm mt-1">Silakan pilih mata ujian yang aktif sesuai jadwal.</p>
            </div>
            <Button 
                variant="outline" 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                className="flex items-center gap-2"
            >
                <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} /> 
                {isRefreshing ? 'Memuat...' : 'Refresh'}
            </Button>
        </div>
        
        {availableExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-sm p-12 text-center border border-dashed border-gray-300">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <Calendar size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-700">Tidak Ada Ujian Aktif</h3>
                <p className="text-gray-500 max-w-sm mt-2">
                    Saat ini tidak ada jadwal ujian yang tersedia untuk kelas Anda.
                </p>
                <Button variant="outline" onClick={handleRefresh} className="mt-6">Cek Lagi</Button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableExams.map(exam => (
                    <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col group">
                        <div className="bg-[#0f4c81] h-2 w-full group-hover:h-3 transition-all"></div>
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-blue-50 text-[#0f4c81] text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border border-blue-100">
                                    {exam.mode === 'NATIVE' ? 'Aplikasi' : 'Google Form'}
                                </span>
                                {exam.durationMinutes && (
                                    <span className="flex items-center text-xs text-gray-500 gap-1 bg-gray-100 px-2 py-1 rounded">
                                        <Clock size={12} /> {exam.durationMinutes} Menit
                                    </span>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">{exam.title}</h3>
                            <div className="space-y-2 text-sm text-gray-600 mt-4">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-gray-400"/>
                                    <span>Jadwal: {exam.startTime ? new Date(exam.startTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sekarang'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100">
                            <Button onClick={() => handleInitiateExam(exam)} className="w-full flex justify-center items-center gap-2 py-3 text-base bg-[#0f4c81] hover:bg-blue-800">
                                <Play size={18} fill="currentColor" /> Kerjakan Sekarang
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      <Modal isOpen={!!selectedExam} onClose={() => setSelectedExam(null)}>
        <div className="text-center space-y-4 p-2">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Key size={24} />
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-800">Masukkan Token Ujian</h3>
                <p className="text-gray-500 text-sm mt-1">Silakan masukkan token yang diberikan oleh pengawas untuk memulai ujian: <b>{selectedExam?.title}</b></p>
            </div>
            <div className="py-2">
                <Input 
                    value={inputToken} 
                    onChange={(e) => {
                        setInputToken(e.target.value.toUpperCase());
                        setTokenError('');
                    }}
                    placeholder="KETIK TOKEN DISINI"
                    className="text-center font-mono text-2xl tracking-widest uppercase py-3 border-2 focus:border-blue-500"
                    maxLength={10}
                />
                {tokenError && <p className="text-red-500 text-sm mt-2 animate-pulse bg-red-50 p-2 rounded">{tokenError}</p>}
            </div>
            <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedExam(null)}>Batal</Button>
                <Button className="flex-1 bg-[#0f4c81] hover:bg-blue-800" onClick={handleSubmitToken}>Mulai Ujian</Button>
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
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); return false; };
    const handleVisibilityChange = () => { if (document.hidden) recordViolation(); };
    const handleBlur = () => { recordViolation(); };
    const handleFullScreenChange = () => {
        if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
            recordViolation();
        }
    };
    const recordViolation = () => {
        setViolations(prev => {
            const newVal = prev + 1;
            if (newVal === 5) setShowWarning(true);
            return newVal;
        });
    };

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
                if(pkg) {
                    const examQuestions = allQuestions.filter(q => pkg.questionIds.includes(q.id));
                    setQuestions(examQuestions);
                }
            } catch(e) { }
        }
    };
    loadQuestions();
  }, [exam]);

  // TIMER LOGIC: Only decrements time
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // AUTO-FINISH LOGIC: Triggered when timeLeft becomes 0
  // This ensures that when the time runs out, 'calculateAndFinish' is called 
  // with the LATEST state of 'answers' and 'questions'.
  useEffect(() => {
    if (timeLeft === 0) {
        calculateAndFinish('COMPLETED');
    }
  }, [timeLeft]);
  
  useEffect(() => {
    const sendSignal = async () => { try { await db.sendHeartbeat(user); } catch(e) {} };
    const interval = setInterval(sendSignal, 30000); 
    return () => clearInterval(interval);
  }, [user]);

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
          questions.forEach(q => {
              if (q.type === 'MULTIPLE_CHOICE' && answers[q.id] === q.correctAnswer) {
                  correctCount++;
              }
          });
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
    <div className="h-dvh flex flex-col bg-gray-100 overflow-hidden noselect">
      {showWarning && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center shadow-2xl">
                  <div className="mx-auto w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4">
                      <AlertOctagon size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">PERINGATAN PELANGGARAN!</h3>
                  <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                      <p className="text-red-800 font-bold text-lg">Pelanggaran ke-{violations}</p>
                      <p className="text-xs text-red-600 uppercase tracking-wide">Tercatat Sistem</p>
                  </div>
                  <Button onClick={() => { setShowWarning(false); reEnterFullScreen(); }} className="w-full bg-red-600 hover:bg-red-700">SAYA MENGERTI & LANJUTKAN</Button>
              </div>
          </div>
      )}

      <div className="bg-[#0f4c81] text-white shadow-lg z-20 flex-shrink-0 relative border-b border-blue-900">
        <div className="container mx-auto px-4 h-[72px] flex justify-between items-center">
            <div className="flex flex-col min-w-0 mr-4">
              <h1 className="font-bold text-lg md:text-xl leading-tight truncate text-white">{exam.title}</h1>
              <div className="flex items-center gap-2 text-xs md:text-sm text-blue-200 mt-1 truncate">
                <UserIcon size={14} className="opacity-80" />
                <span className="font-medium text-white">{user.fullName}</span>
                <span className="bg-blue-700/60 px-2 py-0.5 rounded-md border border-blue-600/50 text-blue-50 font-mono">{user.className || 'Peserta'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
               <div className="flex flex-col items-end bg-gradient-to-b from-blue-800 to-blue-900 px-3 md:px-4 py-1.5 rounded-lg border border-blue-700 shadow-inner min-w-[100px]">
                  <span className="text-[10px] text-blue-300 uppercase font-bold tracking-widest hidden md:block mb-0.5">Sisa Waktu</span>
                  <div className={`font-mono text-xl md:text-2xl font-bold leading-none flex items-center gap-2 ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                     {formatTime(timeLeft)}
                  </div>
               </div>
               <Button variant="danger" onClick={() => setShowConfirmFinish(true)} className="h-10 md:h-11 px-4 md:px-5 text-xs md:text-sm font-bold shadow-lg border-b-4 border-red-800">
                 SELESAI
               </Button>
            </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
          {exam.mode === 'GOOGLE_FORM' ? (
               <div className="flex-1 bg-white w-full h-full relative">
                 {exam.googleFormUrl ? <iframe src={exam.googleFormUrl} className="w-full h-full border-none block" title="Google Form"></iframe> : <div className="p-10 text-center">URL Form Tidak Valid</div>}
               </div>
          ) : (
              <div className="flex-1 flex flex-col md:flex-row h-full">
                  <div className="flex-1 bg-white p-6 overflow-y-auto">
                      {questions.length > 0 && currentQuestion ? (
                          <div className="max-w-3xl mx-auto pb-20">
                              <div className="flex justify-between mb-4">
                                <span className="text-gray-500 font-bold">Soal No. {currentQIndex + 1}</span>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{currentQuestion.type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Esai'}</span>
                              </div>
                              <div className="text-lg font-medium text-gray-800 mb-6 leading-relaxed noselect">{currentQuestion.text}</div>
                              <div className="space-y-3">
                                {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options?.map((opt, idx) => (
                                    <label key={idx} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${answers[currentQuestion.id] === idx.toString() ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50 border-gray-200'}`}>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${answers[currentQuestion.id] === idx.toString() ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300'}`}>
                                            {answers[currentQuestion.id] === idx.toString() && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        <input 
                                            type="radio" 
                                            name={`q-${currentQuestion.id}`} 
                                            className="hidden" 
                                            checked={answers[currentQuestion.id] === idx.toString()} 
                                            onChange={() => setAnswers({...answers, [currentQuestion.id]: idx.toString()})} 
                                        />
                                        <span className="text-gray-700">{opt}</span>
                                    </label>
                                ))}
                                {currentQuestion.type === 'ESSAY' && (
                                    <textarea 
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ketik jawaban Anda..."
                                        value={answers[currentQuestion.id] || ''}
                                        onChange={e => setAnswers({...answers, [currentQuestion.id]: e.target.value})}
                                    ></textarea>
                                )}
                              </div>
                          </div>
                      ) : (
                          <div className="text-center py-20 text-gray-400">{questions.length === 0 ? "Memuat soal..." : "Soal tidak ditemukan."}</div>
                      )}
                  </div>
                  
                  <div className="w-full md:w-72 bg-gray-50 border-l border-gray-200 p-4 flex flex-col">
                      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><LayoutGrid size={18} /> Navigasi Soal</h3>
                      <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-[200px] md:max-h-full content-start">
                          {questions.map((_, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => setCurrentQIndex(idx)}
                                className={`aspect-square rounded flex items-center justify-center text-sm font-bold transition-colors ${
                                    currentQIndex === idx ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1' : 
                                    answers[questions[idx].id] ? 'bg-green-500 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                  {idx + 1}
                              </button>
                          ))}
                      </div>
                      <div className="mt-auto pt-4 flex gap-2">
                              <Button variant="outline" className="flex-1 text-xs" onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))} disabled={currentQIndex === 0}>Prev</Button>
                              <Button variant="outline" className="flex-1 text-xs" onClick={() => setCurrentQIndex(Math.min(questions.length - 1, currentQIndex + 1))} disabled={currentQIndex === questions.length - 1}>Next</Button>
                      </div>
                  </div>
              </div>
          )}
      </div>

      <Modal isOpen={showConfirmFinish} onClose={() => setShowConfirmFinish(false)}>
          <div className="text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldAlert size={32} /></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Akhiri Ujian?</h3>
              <p className="text-gray-600 text-sm mb-6">Pastikan Anda sudah memeriksa semua jawaban.</p>
              <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowConfirmFinish(false)}>Batal</Button>
                  <Button variant="danger" className="flex-1" onClick={() => calculateAndFinish('COMPLETED')}>Ya, Selesai</Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};