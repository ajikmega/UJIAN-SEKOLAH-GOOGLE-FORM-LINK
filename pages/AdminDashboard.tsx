
import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Exam, ClassGroup, Question, ExamPackage, ExamMode } from '../types';
import { Button, Input, Card, Modal } from '../components/UI';
import { Plus, Trash, Play, Square, LogOut, BarChart, Users, FileText, Database, RefreshCw, CheckCircle, Link as LinkIcon, ExternalLink, Home, Activity, UserCheck, Monitor, Calendar, Clock, UploadCloud, Edit, Trash2, BookOpen, Settings } from 'lucide-react';

export const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'exams' | 'classes' | 'questions' | 'analytics' | 'settings'>('dashboard');
  const [exams, setExams] = useState<Exam[]>([]);
  
  const loadExams = async () => {
      try {
        const data = await db.getExams();
        setExams(data);
      } catch (e) {
          console.error("Failed to load exams", e);
      }
  };

  useEffect(() => {
    loadExams();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navbar */}
      <header className="bg-blue-700 text-white shadow-md sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white text-blue-700 rounded flex items-center justify-center">
                <BookOpen size={20} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold tracking-wide">SMK Muh Kalibawang <span className="font-normal text-sm opacity-80">Panel Admin</span></h1>
          </div>
          <Button variant="danger" onClick={onLogout} className="text-sm py-1"><LogOut size={14} className="inline mr-1"/> Keluar</Button>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-6 flex gap-6 flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-2">
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Home size={18} />} label="Ringkasan" />
          <NavButton active={activeTab === 'exams'} onClick={() => setActiveTab('exams')} icon={<BarChart size={18} />} label="Manajemen Ujian" />
          <NavButton active={activeTab === 'questions'} onClick={() => setActiveTab('questions')} icon={<Database size={18} />} label="Bank Soal (Form)" />
          <NavButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<FileText size={18} />} label="Analisis & Hasil" />
          <NavButton active={activeTab === 'classes'} onClick={() => setActiveTab('classes')} icon={<Users size={18} />} label="Kelas & Siswa" />
          <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18} />} label="Pengaturan" />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && <DashboardOverview />}
          {activeTab === 'exams' && <ExamManager exams={exams} onUpdate={loadExams} />}
          {activeTab === 'classes' && <ClassManager />}
          {activeTab === 'questions' && <QuestionBank />}
          {activeTab === 'analytics' && <AnalyticsDashboard exams={exams} />}
          {activeTab === 'settings' && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${active ? 'bg-blue-100 text-blue-700 font-medium shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// --- Dashboard Overview ---
const DashboardOverview: React.FC = () => {
    const [stats, setStats] = useState({ activeExams: 0, completedStudents: 0, onlineStudents: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await db.getGlobalStats();
                setStats(data);
            } catch (e) {
                console.error("Stats load error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 10000); // 10s refresh
        return () => clearInterval(interval);
    }, []);

    if(loading) return <div className="p-10 text-center text-gray-500">Memuat statistik server...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Dashboard Ringkasan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCardLarge 
                    icon={<Monitor size={32} />} 
                    label="Siswa Online" 
                    value={stats.onlineStudents} 
                    color="bg-blue-600" 
                    desc="Sesi aktif terdeteksi"
                />
                <StatCardLarge 
                    icon={<UserCheck size={32} />} 
                    label="Siswa Selesai" 
                    value={stats.completedStudents} 
                    color="bg-green-600" 
                    desc="Total riwayat ujian selesai"
                />
                <StatCardLarge 
                    icon={<Activity size={32} />} 
                    label="Ujian Aktif" 
                    value={stats.activeExams} 
                    color="bg-purple-600" 
                    desc="Ujian sedang berlangsung"
                />
            </div>
        </div>
    );
};

const StatCardLarge: React.FC<{ icon: React.ReactNode, label: string, value: number, color: string, desc: string }> = ({ icon, label, value, color, desc }) => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex">
        <div className={`${color} w-24 flex items-center justify-center text-white`}>
            {icon}
        </div>
        <div className="p-6 flex-1">
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{label}</p>
            <p className="text-4xl font-bold text-gray-800 my-1">{value}</p>
            <p className="text-xs text-gray-400">{desc}</p>
        </div>
    </div>
);

// --- Exam Management ---
const ExamManager: React.FC<{ exams: Exam[], onUpdate: () => void }> = ({ exams, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formQuestions, setFormQuestions] = useState<Question[]>([]);
  const [availableClasses, setAvailableClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newExam, setNewExam] = useState<Partial<Exam>>({ 
    title: '', token: '', durationMinutes: 60, mode: 'GOOGLE_FORM', googleFormUrl: '', assignedClasses: [] 
  });
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  useEffect(() => {
      if(isModalOpen) {
          const loadData = async () => {
            try {
                const [qData, cData] = await Promise.all([db.getQuestions(), db.getClasses()]);
                setFormQuestions(qData.filter(q => q.type === 'EXTERNAL_FORM'));
                setAvailableClasses(cData);
            } catch(e) {
                console.error("Failed to load dependency data", e);
            }
          }
          loadData();
      }
  }, [isModalOpen]);

  const handleOpenCreate = () => {
      setEditingId(null);
      setNewExam({ title: '', token: '', durationMinutes: 60, mode: 'GOOGLE_FORM', googleFormUrl: '', assignedClasses: [] });
      setScheduleDate('');
      setScheduleTime('');
      setIsModalOpen(true);
  };

  const handleOpenEdit = (exam: Exam) => {
      setEditingId(exam.id);
      setNewExam({...exam});
      
      if (exam.startTime) {
          const d = new Date(exam.startTime);
          const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
          const timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
          setScheduleDate(dateStr);
          setScheduleTime(timeStr);
      } else {
          setScheduleDate('');
          setScheduleTime('');
      }
      
      setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
      if (window.confirm("Apakah Anda yakin ingin menghapus ujian ini? Data yang dihapus tidak dapat dikembalikan.")) {
          setLoading(true);
          await db.deleteExam(id);
          setLoading(false);
          onUpdate();
      }
  };

  const handleSave = async () => {
    if (newExam.title && newExam.token) {
      let startTime = undefined;
      if (scheduleDate && scheduleTime) {
          startTime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      }

      const examData = { ...newExam, startTime };

      setLoading(true);
      try {
          if (editingId) {
              await db.updateExam({ ...examData, id: editingId } as Exam);
          } else {
              await db.addExam({ ...examData, id: '', isActive: false } as Exam);
          }
          setIsModalOpen(false);
          onUpdate();
      } catch(e) {
          alert("Gagal menyimpan ujian");
      } finally {
          setLoading(false);
      }
    }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    setLoading(true);
    await db.updateExamStatus(id, !current);
    setLoading(false);
    onUpdate();
  };

  const handleSelectFormFromBank = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const qId = e.target.value;
      const q = formQuestions.find(fq => fq.id === qId);
      if (q && q.googleFormUrl) {
          setNewExam({...newExam, googleFormUrl: q.googleFormUrl});
      }
  };

  const handleClassToggle = (className: string) => {
      const current = newExam.assignedClasses || [];
      if (current.includes(className)) {
          setNewExam({ ...newExam, assignedClasses: current.filter(c => c !== className) });
      } else {
          setNewExam({ ...newExam, assignedClasses: [...current, className] });
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Daftar Ujian</h2>
        <Button onClick={handleOpenCreate} disabled={loading}><Plus size={16} className="inline mr-1"/> Tambah Ujian</Button>
      </div>
      
      {loading && <div className="h-1 bg-blue-200 overflow-hidden"><div className="w-full h-full bg-blue-600 animate-pulse"></div></div>}

      <div className="grid gap-4">
        {exams.map(exam => (
          <Card key={exam.id} className={`border-l-4 ${exam.isActive ? 'border-green-500' : 'border-gray-300'}`}>
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
              <div>
                <h3 className="font-bold text-lg">{exam.title}</h3>
                <div className="flex flex-wrap gap-2 mt-1 mb-2">
                    <span className="text-xs font-mono bg-gray-200 px-2 py-0.5 rounded flex items-center">Token: {exam.token}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{exam.mode === 'NATIVE' ? 'Aplikasi' : 'Google Form'}</span>
                    {exam.startTime && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded flex items-center gap-1">
                            <Calendar size={10} /> {new Date(exam.startTime).toLocaleDateString()} {new Date(exam.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    )}
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                    <p className="flex items-center gap-2"><Clock size={14}/> Durasi: {exam.durationMinutes} menit</p>
                    <p className="flex items-center gap-2"><Users size={14}/> Peserta: {exam.assignedClasses && exam.assignedClasses.length > 0 ? exam.assignedClasses.join(', ') : 'Semua Kelas'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start">
                  <Button variant="outline" className="text-sm py-1 px-2 text-blue-600 hover:text-blue-800 border-blue-200 hover:bg-blue-50" onClick={() => handleOpenEdit(exam)} disabled={loading}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="outline" className="text-sm py-1 px-2 text-red-600 hover:text-red-800 border-red-200 hover:bg-red-50" onClick={(e) => {e.stopPropagation(); handleDelete(exam.id);}} disabled={loading}>
                    <Trash2 size={16} />
                  </Button>
                  <Button variant={exam.isActive ? "danger" : "success"} className="text-sm py-1 ml-2" onClick={() => toggleStatus(exam.id, exam.isActive)} disabled={loading}>
                    {exam.isActive ? <><Square size={14} className="inline mr-1"/> Stop</> : <><Play size={14} className="inline mr-1"/> Mulai</>}
                  </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3 className="text-xl font-bold mb-4">{editingId ? 'Edit Ujian' : 'Buat Ujian Baru'}</h3>
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
          {/* ... Form Inputs ... */}
          <div>
            <label className="block text-sm font-medium mb-1">Judul Ujian</label>
            <Input value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} placeholder="Contoh: PAS Matematika Wajib" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium mb-1">Token</label>
                <Input value={newExam.token} onChange={e => setNewExam({...newExam, token: e.target.value.toUpperCase()})} placeholder="MATH01" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Durasi (Menit)</label>
                <Input type="number" value={newExam.durationMinutes} onChange={e => setNewExam({...newExam, durationMinutes: parseInt(e.target.value)})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium mb-1">Tanggal Mulai</label>
                <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Waktu Mulai</label>
                <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
            </div>
          </div>
          <div>
              <label className="block text-sm font-medium mb-2">Enrollment Kelas (Peserta)</label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border p-2 rounded bg-gray-50">
                  {availableClasses.map(cls => (
                      <label key={cls.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={newExam.assignedClasses?.includes(cls.name) || false} onChange={() => handleClassToggle(cls.name)} className="rounded text-blue-600" />
                          {cls.name}
                      </label>
                  ))}
              </div>
          </div>
          <div className="space-y-3 bg-blue-50 p-3 rounded border border-blue-100">
              <div>
                  <label className="block text-sm font-bold mb-1 text-blue-800">Pilih dari Bank Link Form</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2" onChange={handleSelectFormFromBank}>
                      <option value="">-- Pilih Link Tersimpan --</option>
                      {formQuestions.map(q => <option key={q.id} value={q.id}>{q.text} ({q.topic})</option>)}
                  </select>
              </div>
              <div className="text-center text-xs text-gray-400 font-bold my-1">- ATAU -</div>
              <div>
                  <label className="block text-sm font-medium mb-1">Paste URL Google Form Manual</label>
                  <Input value={newExam.googleFormUrl} onChange={e => setNewExam({...newExam, googleFormUrl: e.target.value})} placeholder="https://docs.google.com/forms/..." />
              </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={loading}>{loading ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Buat Ujian')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- Question Bank ---
const QuestionBank: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isQModalOpen, setIsQModalOpen] = useState(false);
    const [newQ, setNewQ] = useState<Partial<Question>>({ type: 'EXTERNAL_FORM', topic: '', text: '', googleFormUrl: '' });
    const [loading, setLoading] = useState(false);

    const loadQuestions = async () => {
        setLoading(true);
        const data = await db.getQuestions();
        setQuestions(data.filter(q => q.type === 'EXTERNAL_FORM'));
        setLoading(false);
    };

    useEffect(() => { loadQuestions(); }, []);

    const handleAddQuestion = async () => {
        if(newQ.text && newQ.topic && newQ.googleFormUrl) {
            setLoading(true);
            await db.addQuestion({ ...newQ, id: '', type: 'EXTERNAL_FORM' } as Question);
            setIsQModalOpen(false);
            setNewQ({ type: 'EXTERNAL_FORM', topic: '', text: '', googleFormUrl: '' });
            loadQuestions();
        }
    };

    const handleDelete = async (id: string) => {
        if(window.confirm("Hapus link ini dari bank soal?")) {
            setLoading(true);
            await db.deleteQuestion(id);
            loadQuestions();
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden min-h-[500px] flex flex-col">
            <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-700">Bank Link Google Form</h3>
                <Button onClick={() => setIsQModalOpen(true)} disabled={loading}><Plus size={14} className="inline mr-1"/> Tambah Link Form</Button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
                {loading && <p className="text-center text-gray-500">Memuat data...</p>}
                {!loading && questions.length === 0 && <p className="text-center text-gray-500 py-10">Belum ada link Google Form tersimpan.</p>}
                <div className="space-y-3">
                    {questions.map(q => (
                        <div key={q.id} className="border rounded p-4 hover:bg-gray-50 flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex gap-2 mb-1">
                                    <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-1 rounded inline-flex items-center gap-1"><LinkIcon size={10}/> {q.topic}</span>
                                </div>
                                <p className="font-bold text-gray-800 text-lg">{q.text}</p>
                                <div className="mt-1 text-sm text-blue-600 truncate flex items-center gap-1"><ExternalLink size={12} /> <a href={q.googleFormUrl} target="_blank" rel="noreferrer" className="hover:underline">{q.googleFormUrl}</a></div>
                            </div>
                            <Button variant="danger" className="ml-4 px-3 py-1 text-xs" onClick={(e) => {e.stopPropagation(); handleDelete(q.id);}} disabled={loading}><Trash size={14} /></Button>
                        </div>
                    ))}
                </div>
            </div>
            <Modal isOpen={isQModalOpen} onClose={() => setIsQModalOpen(false)}>
                <h3 className="font-bold text-lg mb-4">Tambah Link Google Form</h3>
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium mb-1">Mata Pelajaran / Topik</label><Input placeholder="Contoh: Biologi" value={newQ.topic} onChange={e => setNewQ({...newQ, topic: e.target.value})} /></div>
                    <div><label className="block text-sm font-medium mb-1">Nama Form / Judul Soal</label><Input placeholder="Contoh: Soal Harian Bab 3" value={newQ.text} onChange={e => setNewQ({...newQ, text: e.target.value})} /></div>
                    <div><label className="block text-sm font-medium mb-1">Link URL Google Form</label><Input placeholder="https://docs.google.com/forms/..." value={newQ.googleFormUrl} onChange={e => setNewQ({...newQ, googleFormUrl: e.target.value})} /></div>
                    <div className="pt-4 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsQModalOpen(false)}>Batal</Button>
                        <Button onClick={handleAddQuestion} disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Link'}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// --- Analytics Dashboard ---
const AnalyticsDashboard: React.FC<{ exams: Exam[] }> = ({ exams }) => {
    const [selectedExamId, setSelectedExamId] = useState('');
    const [stats, setStats] = useState<any>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadStats = async () => {
            if(selectedExamId) {
                setLoading(true);
                try {
                    const data = await db.getExamStats(selectedExamId);
                    setStats(data);
                } catch(e) {}
                setLoading(false);
            } else {
                setStats(null);
            }
        }
        loadStats();
    }, [selectedExamId]);

    const handleSync = async () => {
        if(!selectedExamId) return;
        const url = prompt("Masukkan Link Spreadsheet Hasil (Google Sheets/Excel Online):");
        if(!url) return;
        setIsSyncing(true);
        try {
            const addedCount = await db.syncGoogleFormResults(selectedExamId);
            alert(`Berhasil menarik data! ${addedCount} nilai siswa telah masuk ke sistem.`);
            // Refresh stats
            const data = await db.getExamStats(selectedExamId);
            setStats(data);
        } catch(e) {
            alert("Gagal melakukan sinkronisasi. Cek server.");
        }
        setIsSyncing(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Ujian untuk Dianalisis</label>
                        <select className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
                            <option value="">-- Pilih Ujian --</option>
                            {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                        </select>
                    </div>
                    <div className="md:mt-6 w-full md:w-auto">
                        <Button onClick={handleSync} disabled={!selectedExamId || isSyncing} variant="outline" className="w-full md:w-auto flex items-center justify-center gap-2">
                            {isSyncing ? <RefreshCw size={16} className="animate-spin"/> : <UploadCloud size={16}/>}
                            {isSyncing ? 'Menarik Data...' : 'Tarik Data (Sync)'}
                        </Button>
                    </div>
                </div>
            </Card>

            {loading && <div className="text-center py-10">Memuat data analisis...</div>}

            {!loading && stats ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard label="Total Siswa" value={stats.totalStudents} color="bg-blue-500" />
                        <StatCard label="Rata-rata Nilai" value={stats.averageScore} color="bg-indigo-500" />
                        <StatCard label="Nilai Tertinggi" value={stats.highestScore} color="bg-green-500" />
                        <StatCard label="Lulus (KKM 75)" value={`${stats.passCount} / ${stats.totalStudents}`} color="bg-teal-600" />
                    </div>
                    {/* ... Charts & Table (same as before) ... */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <Card title="Ranking Siswa">
                            <div className="overflow-y-auto max-h-64">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0 shadow-sm z-10">
                                        <tr><th className="text-left p-2 font-bold text-gray-600">Nama</th><th className="text-left p-2 font-bold text-gray-600">Kelas</th><th className="text-right p-2 font-bold text-gray-600">Nilai</th></tr>
                                    </thead>
                                    <tbody>
                                        {[...stats.results].sort((a: any, b: any) => b.score - a.score).map((r: any, i: number) => (
                                            <tr key={i} className="border-b hover:bg-blue-50 transition-colors">
                                                <td className="p-2">{r.studentName}</td>
                                                <td className="p-2 text-gray-500">{r.className}</td>
                                                <td className={`p-2 text-right font-bold ${r.score >= 75 ? 'text-green-600' : 'text-red-500'}`}>{r.score}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                         </Card>
                    </div>
                </>
            ) : (
                !loading && <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-dashed"><BarChart size={48} className="mx-auto mb-2 opacity-30" /><p>Pilih ujian di atas lalu klik "Tarik Data" untuk melihat hasil.</p></div>
            )}
        </div>
    );
};

const StatCard: React.FC<{ label: string, value: string | number, color: string }> = ({ label, value, color }) => (
    <div className={`${color} text-white p-4 rounded-lg shadow-md`}>
        <p className="text-blue-100 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
);

// --- Class Manager ---
const ClassManager: React.FC = () => {
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [loading, setLoading] = useState(false);
    
    const loadClasses = async () => {
        setLoading(true);
        try { const data = await db.getClasses(); setClasses(data); } catch(e) {}
        setLoading(false);
    };
    useEffect(() => { loadClasses(); }, []);

    const handleAdd = async () => {
        const input = document.getElementById('newClassInput') as HTMLInputElement;
        const val = input.value;
        if(val) { 
            setLoading(true);
            await db.addClass(val); 
            input.value = ''; 
            loadClasses();
        }
    };

    const handleDelete = async (id: string) => {
        if(window.confirm("Hapus kelas?")) {
            setLoading(true);
            await db.deleteClass(id);
            loadClasses();
        }
    };

    return (
        <Card title="Manajemen Kelas">
              <div className="flex gap-2 mb-4">
                <Input placeholder="Nama Kelas Baru (e.g. XII-IPA-1)" id="newClassInput" />
                <Button onClick={handleAdd} disabled={loading}>Tambah</Button>
              </div>
              {loading && <p className="text-sm text-gray-500">Memuat...</p>}
              <ul className="divide-y">
                {classes.map(c => (
                  <li key={c.id} className="py-3 px-2 hover:bg-gray-50 flex justify-between items-center">
                      <span>{c.name}</span>
                      <div className="flex items-center gap-3">
                        <Button variant="danger" className="px-2 py-1" onClick={(e) => {e.stopPropagation(); handleDelete(c.id);}} disabled={loading}><Trash size={14} /></Button>
                      </div>
                  </li>
                ))}
              </ul>
        </Card>
    )
};

// --- Settings Panel ---
const SettingsPanel: React.FC = () => {
    const [loading, setLoading] = useState(false);
    
    const handleReset = async () => {
        setLoading(true);
        await db.resetDatabase();
        setLoading(false);
    };

    return (
        <Card title="Pengaturan Sistem">
            <div className="space-y-4">
                <div className="p-4 border rounded bg-red-50 border-red-200">
                    <h4 className="font-bold text-red-800 mb-2">Zone Bahaya</h4>
                    <p className="text-sm text-red-600 mb-3">Tindakan di bawah ini akan mempengaruhi database server secara permanen.</p>
                    <Button variant="danger" onClick={handleReset} disabled={loading}>
                        {loading ? 'Memproses...' : 'Reset Database (Hapus Semua Data)'}
                    </Button>
                </div>
                <div className="p-4 border rounded bg-gray-50">
                    <h4 className="font-bold text-gray-800 mb-2">Informasi API</h4>
                    <p className="text-sm text-gray-600">Frontend ini terhubung ke endpoint API yang dikonfigurasi di <code>services/dbService.ts</code>. Pastikan backend PHP sudah berjalan.</p>
                </div>
            </div>
        </Card>
    );
};
