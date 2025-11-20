
import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { User, Exam, Question } from '../types';
import { Button, Card, Modal, Input } from '../components/UI';
import { Clock, AlertTriangle, CheckCircle, ChevronRight, ChevronLeft, Calendar, Play, RefreshCw, Info, Key, User as UserIcon, LogOut, LayoutGrid, BookOpen } from 'lucide-react';

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

  // --- Heartbeat System (Realtime Online Status) ---
  useEffect(() => {
    const sendSignal = async () => {
        try {
            await db.sendHeartbeat(user);
        } catch(e) {
            // Ignore heartbeat errors silently
        }
    };
    
    // Send immediately on load
    sendSignal();

    // Send every 30 seconds
    const interval = setInterval(sendSignal, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Function to fetch and filter exams
  const fetchExams = async () => {
    try {
        const [allExams, allResults] = await Promise.all([
            db.getExams(),
            db.getResults()
        ]);
        
        const now = new Date();
        const filtered = allExams.filter(exam => {
            // 1. Check Active Status
            if (!exam.isActive) return false;
            // 2. Check Class Enrollment
            if (exam.assignedClasses && exam.assignedClasses.length > 0) {
                if (!user.className || !exam.assignedClasses.includes(user.className)) {
                    return false;
                }
            }
            // 3. Check Schedule
            if (exam.startTime) {
                const start = new Date(exam.startTime);
                if (now < start) return false;
            }
            // 4. Check if already completed
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

  const handleSubmitToken = () => {
    if (!selectedExam) return;
    if (inputToken.toUpperCase() === selectedExam.token) {
        setActiveExam(selectedExam); 
        setSelectedExam(null); 
    } else {
        setTokenError('Token tidak valid!');
    }
  };

  const handleFinish = async (score?: number) => {
    if (activeExam) {
      const resultData = {
        examId: activeExam.id,
        studentName: user.fullName || user.username,
        className: user.className || 'Unknown',
        completedAt: new Date().toISOString(),
        status: 'COMPLETED' as const,
        score: score !== undefined ? score : 0
      };

      try {
          await db.submitExam(resultData);
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Student Dashboard Header */}
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
                    Saat ini tidak ada jadwal ujian yang tersedia untuk kelas Anda, atau Anda telah menyelesaikan semua ujian. Pastikan server terhubung.
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

const ExamRoom: React.FC<{ exam: Exam; user: User; onFinish: (score?: number) => void }> = ({ exam, user, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const loadQuestions = async () => {
        if(exam.mode === 'NATIVE' && exam.examPackageId) {
            try {
                // In API version, getQuestions should ideally filter by package ID on server
                // Here we simulate getting all then filtering
                const [allPackages, allQuestions] = await Promise.all([
                    db.getPackages(),
                    db.getQuestions()
                ]);
                const pkg = allPackages.find(p => p.id === exam.examPackageId);
                if(pkg) {
                    const examQuestions = allQuestions.filter(q => pkg.questionIds.includes(q.id));
                    setQuestions(examQuestions);
                }
            } catch(e) { console.error(e); }
        }
    };
    loadQuestions();
  }, [exam]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          calculateAndFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Exam Room also sends heartbeats
  useEffect(() => {
    const sendSignal = async () => {
        try { await db.sendHeartbeat(user); } catch(e) {}
    };
    const interval = setInterval(sendSignal, 30000); // 30s
    return () => clearInterval(interval);
  }, [user]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateAndFinish = () => {
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
      onFinish(score);
  };

  const currentQuestion = questions[currentQIndex];

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <div className="bg-[#0f4c81] text-white shadow-lg z-20 flex-shrink-0 relative border-b border-blue-900">
        <div className="container mx-auto px-4 h-[72px] flex justify-between items-center">
            <div className="flex flex-col min-w-0 mr-4">
              <h1 className="font-bold text-lg md:text-xl leading-tight truncate tracking-wide text-white drop-shadow-sm">{exam.title}</h1>
              <div className="flex items-center gap-2 text-xs md:text-sm text-blue-200 mt-1 truncate">
                <UserIcon size={14} className="opacity-80" />
                <span className="font-medium text-white">{user.fullName}</span>
                <span className="text-blue-400 mx-1 hidden md:inline">•</span>
                <span className="bg-blue-700/60 px-2 py-0.5 rounded-md border border-blue-600/50 text-blue-50 font-mono">{user.className || 'Peserta'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
               <div className="flex flex-col items-end bg-gradient-to-b from-blue-800 to-blue-900 px-3 md:px-4 py-1.5 rounded-lg border border-blue-700 shadow-inner min-w-[100px]">
                  <span className="text-[10px] text-blue-300 uppercase font-bold tracking-widest hidden md:block mb-0.5">Sisa Waktu</span>
                  <div className={`font-mono text-xl md:text-2xl font-bold leading-none flex items-center gap-2 ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                     {timeLeft < 300 && <AlertTriangle size={16} className="md:hidden" />}
                     {formatTime(timeLeft)}
                  </div>
               </div>
               <div className="h-8 w-px bg-blue-700/50 mx-1 hidden md:block"></div>
               <Button variant="danger" onClick={() => setShowConfirmFinish(true)} className="h-10 md:h-11 px-4 md:px-5 text-xs md:text-sm font-bold shadow-lg border-b-4 border-red-800 hover:border-red-700 hover:translate-y-[1px] transition-all active:border-t-4 active:border-b-0 active:translate-y-1 whitespace-nowrap">
                 SELESAI
               </Button>
            </div>
        </div>
      </div>

      {exam.mode === 'GOOGLE_FORM' && (
        <div className="bg-yellow-50 text-yellow-900 text-sm px-4 py-2 text-center border-b border-yellow-200 flex items-center justify-center gap-2 shadow-sm z-10">
            <Info size={16} />
            <span>Setelah mengirim jawaban di formulir bawah ini, <b>JANGAN LUPA</b> klik tombol <b className="text-red-600">SELESAI</b> di pojok kanan atas aplikasi.</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
          {exam.mode === 'GOOGLE_FORM' ? (
               <div className="flex-1 bg-white w-full h-full">
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
                              <div className="text-lg font-medium text-gray-800 mb-6 leading-relaxed">{currentQuestion.text}</div>
                              <div className="space-y-3">
                                {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options?.map((opt, idx) => (
                                    <label key={idx} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${answers[currentQuestion.id] === idx.toString() ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50 border-gray-200'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 text-sm ${answers[currentQuestion.id] === idx.toString() ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{String.fromCharCode(65 + idx)}</div>
                                        <input type="radio" name={`q-${currentQuestion.id}`} className="hidden" checked={answers[currentQuestion.id] === idx.toString()} onChange={() => setAnswers(prev => ({...prev, [currentQuestion.id]: idx.toString()}))} />
                                        <span className="text-gray-700">{opt}</span>
                                    </label>
                                ))}
                                {currentQuestion.type === 'ESSAY' && (
                                    <textarea className="w-full border rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Tulis jawaban Anda di sini..." value={answers[currentQuestion.id] || ''} onChange={(e) => setAnswers(prev => ({...prev, [currentQuestion.id]: e.target.value}))} />
                                )}
                                {currentQuestion.type === 'EXTERNAL_FORM' && (
                                    <div className="p-4 bg-gray-50 border rounded text-center">
                                        <p className="mb-2">Soal ini menggunakan Link Google Form Eksternal.</p>
                                        <a href={currentQuestion.googleFormUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center justify-center gap-1">Buka Soal di Tab Baru <ChevronRight size={14} /></a>
                                    </div>
                                )}
                              </div>
                              <div className="flex justify-between mt-12 pt-6 border-t">
                                  <Button variant="outline" disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(prev => prev - 1)}><ChevronLeft size={16} className="inline mr-1"/> Sebelumnya</Button>
                                  <Button onClick={() => { if(currentQIndex < questions.length - 1) setCurrentQIndex(prev => prev + 1); else setShowConfirmFinish(true); }}>{currentQIndex === questions.length - 1 ? 'Selesai' : <>Selanjutnya <ChevronRight size={16} className="inline ml-1"/></>}</Button>
                              </div>
                          </div>
                      ) : (
                          <div className="text-center py-20 text-gray-500"><p className="mb-4">Memuat soal...</p><Button variant="danger" onClick={() => setShowConfirmFinish(true)}>Akhiri Ujian</Button></div>
                      )}
                  </div>
                  <div className="w-full md:w-72 bg-gray-50 border-l flex flex-col">
                      <div className="p-4 font-bold text-gray-700 border-b bg-white flex items-center gap-2"><LayoutGrid size={18}/> Navigasi Soal</div>
                      <div className="flex-1 p-4 overflow-y-auto">
                          <div className="grid grid-cols-5 gap-2">
                              {questions.map((q, idx) => (
                                  <button key={q.id} onClick={() => setCurrentQIndex(idx)} className={`aspect-square rounded flex items-center justify-center font-bold text-sm transition-all ${currentQIndex === idx ? 'ring-2 ring-blue-600 z-10' : ''} ${answers[q.id] ? 'bg-[#0f4c81] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}>{idx + 1}</button>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>

      <Modal isOpen={showConfirmFinish} onClose={() => setShowConfirmFinish(false)}>
          <div className="text-center py-4">
              <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Akhiri Ujian?</h3>
              <p className="text-gray-600 mb-6">Apakah Anda yakin ingin mengakhiri ujian ini? <br/>{exam.mode === 'GOOGLE_FORM' ? "Pastikan Anda sudah mengirim (Submit) jawaban pada Google Form sebelum menekan tombol ini." : "Pastikan semua jawaban sudah terisi dengan benar."}</p>
              <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setShowConfirmFinish(false)}>Batal</Button>
                  <Button variant="danger" onClick={() => { setShowConfirmFinish(false); calculateAndFinish(); }}>Ya, Saya Selesai</Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};
