import React, { useState, useRef } from 'react';
import { ClassroomState, QuizSubmission, Student, Teacher } from '../../types';
import { pin4, uid, saveClassroomState } from '../../utils/storage';
import { playClickSound, playStampSound, playSuccessChime } from '../../utils/sound';
import {
  UserPlus,
  Trash2,
  Printer,
  KeyRound,
  Copy,
  Check,
  Users,
  Sparkles,
  AlertCircle,
  Download,
  ExternalLink,
  Scissors,
  LayoutGrid,
  List,
  FileSpreadsheet,
  HelpCircle,
  CheckCircle2,
  Share2,
  QrCode,
  Globe,
} from 'lucide-react';

interface StudentsTabProps {
  state: ClassroomState;
  currentTeacher: Teacher;
  onUpdateState: (newState: ClassroomState) => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  state,
  currentTeacher,
  onUpdateState,
}) => {
  const [newName, setNewName] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [armedDeleteId, setArmedDeleteId] = useState<string | null>(null);
  const [armedDeleteTeacherId, setArmedDeleteTeacherId] = useState<string | null>(null);

  // Print Sheet Customization State
  const [printLayout, setPrintLayout] = useState<'slips' | 'table'>('slips');
  const [cardsPerRow, setCardsPerRow] = useState<2 | 3>(2);
  const [customNote, setCustomNote] = useState('Enter this 4-digit PIN on the student portal for weekly reviews.');
  const [copiedRosterFeedback, setCopiedRosterFeedback] = useState(false);
  const [printNotification, setPrintNotification] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const getStudentShareUrl = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?class=${encodeURIComponent(state.classCode || '')}`;
  };

  const handleCopyShareLink = () => {
    const url = getStudentShareUrl();
    navigator.clipboard.writeText(url);
    setCopiedShareLink(true);
    playSuccessChime();
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  const printIframeRef = useRef<HTMLIFrameElement | null>(null);
  const publishedWeeks = state.weeks.filter((w) => w.status === 'published');

  // Add single student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newStudent: Student = {
      id: uid('stu'),
      name: newName.trim(),
      pin: pin4(),
      createdAt: Date.now(),
    };

    const updatedState: ClassroomState = {
      ...state,
      students: [...state.students, newStudent],
    };

    saveClassroomState(updatedState);
    onUpdateState(updatedState);
    setNewName('');
    playSuccessChime();
  };

  // Bulk add students from pasted lines
  const handleBulkAdd = () => {
    const lines = bulkInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const newStudents: Student[] = lines.map((name) => ({
      id: uid('stu'),
      name,
      pin: pin4(),
      createdAt: Date.now(),
    }));

    const updatedState: ClassroomState = {
      ...state,
      students: [...state.students, ...newStudents],
    };

    saveClassroomState(updatedState);
    onUpdateState(updatedState);
    setBulkInput('');
    setShowBulkModal(false);
    playSuccessChime();
  };

  // Delete student with arm confirmation
  const handleDeleteStudent = (studentId: string) => {
    if (armedDeleteId === studentId) {
      playStampSound();
      const updatedResults = { ...state.results };
      delete updatedResults[studentId];

      const updatedState: ClassroomState = {
        ...state,
        students: state.students.filter((s) => s.id !== studentId),
        results: updatedResults,
      };

      saveClassroomState(updatedState);
      onUpdateState(updatedState);
      setArmedDeleteId(null);
    } else {
      playClickSound();
      setArmedDeleteId(studentId);
      setTimeout(() => {
        setArmedDeleteId((prev) => (prev === studentId ? null : prev));
      }, 3500);
    }
  };

  // Delete co-teacher
  const handleDeleteTeacher = (teacherId: string) => {
    if (state.teachers.length <= 1) return;

    if (armedDeleteTeacherId === teacherId) {
      playStampSound();
      const updatedState: ClassroomState = {
        ...state,
        teachers: state.teachers.filter((t) => t.id !== teacherId),
      };
      saveClassroomState(updatedState);
      onUpdateState(updatedState);
      setArmedDeleteTeacherId(null);
    } else {
      playClickSound();
      setArmedDeleteTeacherId(teacherId);
      setTimeout(() => {
        setArmedDeleteTeacherId((prev) => (prev === teacherId ? null : prev));
      }, 3500);
    }
  };

  // Copy individual student PIN
  const copyStudentPin = (student: Student) => {
    navigator.clipboard.writeText(`${student.name} — PIN: ${student.pin}`);
    setCopiedId(student.id);
    playClickSound();
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Student Average calculation
  const getStudentAverage = (studentId: string) => {
    const studentSubs: QuizSubmission[] = Object.values(state.results[studentId] || {});
    if (studentSubs.length === 0) return null;
    const totalPct = studentSubs.reduce((acc: number, sub: QuizSubmission) => acc + (sub.score / sub.total) * 100, 0);
    return Math.round(totalPct / studentSubs.length);
  };

  // Build clean HTML for print view
  const generatePrintableHTML = () => {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const isSlips = printLayout === 'slips';
    const gridClass = cardsPerRow === 3 ? 'grid-3' : 'grid-2';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Student PIN Slips - ${state.className}</title>
  <style>
    @page {
      size: letter portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #111111;
      margin: 0;
      padding: 0;
    }
    .sheet-header {
      border-bottom: 2px solid #111111;
      padding-bottom: 8px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .sheet-title {
      font-family: Georgia, serif;
      font-size: 20px;
      font-weight: bold;
      margin: 0 0 3px 0;
      color: #111111;
    }
    .sheet-meta {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      color: #444444;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .slip-card {
      border: 1.5px dashed #444444;
      border-radius: 4px;
      padding: 12px 14px;
      background: #fafafa;
      page-break-inside: avoid;
      break-inside: avoid;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 135px;
    }
    .slip-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .slip-badge {
      font-family: ui-monospace, monospace;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #444444;
    }
    .slip-class {
      font-family: ui-monospace, monospace;
      font-size: 8.5px;
      color: #666666;
    }
    .student-name {
      font-family: Georgia, serif;
      font-size: 16px;
      font-weight: 700;
      margin: 0 0 6px 0;
      color: #000000;
    }
    .pin-box {
      background: #ffffff;
      border: 1.5px solid #222222;
      border-radius: 3px;
      padding: 6px 8px;
      text-align: center;
      margin: 4px 0 6px 0;
    }
    .pin-label {
      font-family: ui-monospace, monospace;
      font-size: 8.5px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #666666;
      display: block;
      margin-bottom: 2px;
    }
    .pin-val {
      font-family: "Courier New", Courier, monospace;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.25em;
      color: #000000;
    }
    .slip-note {
      font-size: 9px;
      color: #555555;
      line-height: 1.3;
      margin-top: 4px;
    }
    .scissors-indicator {
      font-size: 9px;
      color: #777777;
      text-align: right;
      font-family: ui-monospace, monospace;
    }
    .roster-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .roster-table th,
    .roster-table td {
      border: 1px solid #333333;
      padding: 6px 10px;
      font-size: 11px;
      text-align: left;
    }
    .roster-table th {
      background: #f2f2f2;
      font-family: ui-monospace, monospace;
      text-transform: uppercase;
      font-size: 9.5px;
      letter-spacing: 0.05em;
    }
    .table-pin {
      font-family: ui-monospace, monospace;
      font-weight: bold;
      letter-spacing: 0.15em;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="sheet-header">
    <div>
      <div class="sheet-title">${state.className} &mdash; Student Login PINs</div>
      <div class="sheet-meta">
        Educator: ${currentTeacher.name} &bull; ${state.subject || 'General'} &bull; ${state.period || 'Period 1'}
      </div>
    </div>
    <div class="sheet-meta" style="text-align: right;">
      <span>${today}</span><br>
      <span>${state.students.length} Enrolled Students</span>
    </div>
  </div>

  ${
    isSlips
      ? `<div class="${gridClass}">
          ${state.students
            .map(
              (stu) => `
          <div class="slip-card">
            <div>
              <div class="slip-top">
                <span class="slip-badge">&#9986; Login Slip</span>
                <span class="slip-class">${state.className}</span>
              </div>
              <div class="student-name">${stu.name}</div>
            </div>
            <div>
              <div class="pin-box">
                <span class="pin-label">Your 4-Digit Login PIN</span>
                <span class="pin-val">${stu.pin}</span>
              </div>
              <div class="slip-note">${customNote || 'Enter PIN on student check-in portal.'}</div>
            </div>
          </div>
          `
            )
            .join('')}
        </div>`
      : `<table class="roster-table">
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Student Full Name</th>
              <th style="width: 140px;">4-Digit PIN</th>
              <th style="width: 120px;">Class / Period</th>
              <th>Teacher Signature / Verification</th>
            </tr>
          </thead>
          <tbody>
            ${state.students
              .map(
                (stu, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td style="font-weight: 600;">${stu.name}</td>
              <td><span class="table-pin">${stu.pin}</span></td>
              <td>${state.period || 'Period 1'}</td>
              <td style="color: #bbb;">&nbsp;</td>
            </tr>
            `
              )
              .join('')}
          </tbody>
        </table>`
  }
</body>
</html>`;
  };

  // 1. Direct Print via sandboxed iframe (most reliable across all iframe parent wrappers)
  const handlePrintSheet = () => {
    playClickSound();
    setPrintNotification('Opening print preview...');

    try {
      const html = generatePrintableHTML();
      let iframe = printIframeRef.current;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
        printIframeRef.current = iframe;
      }

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();

        setTimeout(() => {
          try {
            iframe?.contentWindow?.focus();
            iframe?.contentWindow?.print();
            setPrintNotification('Print dialog sent to printer.');
            setTimeout(() => setPrintNotification(null), 3000);
          } catch {
            // Fallback to window.print if iframe print is restricted
            window.print();
          }
        }, 300);
      } else {
        window.print();
      }
    } catch {
      window.print();
    }
  };

  // 2. Open in dedicated new tab for full-screen printing
  const handleOpenInNewTab = () => {
    playClickSound();
    const html = generatePrintableHTML();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const newTab = window.open(blobUrl, '_blank');
    if (newTab) {
      newTab.focus();
      setPrintNotification('Opened print sheet in new window.');
      setTimeout(() => setPrintNotification(null), 3000);
    } else {
      // If popup blocked, download instead
      handleDownloadHTML();
    }
  };

  // 3. Download standalone HTML sheet
  const handleDownloadHTML = () => {
    playClickSound();
    const html = generatePrintableHTML();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = state.className.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = url;
    link.download = `Student_PIN_Cards_${safeName}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    playSuccessChime();
    setPrintNotification('Downloaded printable HTML sheet.');
    setTimeout(() => setPrintNotification(null), 3500);
  };

  // 4. Copy Roster as CSV / Spreadsheet TSV
  const handleCopyRoster = () => {
    playClickSound();
    const lines = [
      ['Student Name', 'PIN', 'Class', 'Period'].join('\t'),
      ...state.students.map((s) => [s.name, s.pin, state.className, state.period || 'Period 1'].join('\t')),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedRosterFeedback(true);
    playSuccessChime();
    setPrintNotification('Copied roster data (Name & PIN) to clipboard!');
    setTimeout(() => {
      setCopiedRosterFeedback(false);
      setPrintNotification(null), 3000;
    }, 2500);
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F1F1F] pb-5">
        <div>
          <h2 className="font-serif italic text-2xl text-white">
            Classroom Roster &amp; Student PINs<span className="text-[#888888]">.</span>
          </h2>
          <p className="text-xs font-mono uppercase tracking-widest text-[#888888] mt-1">
            Students access weekly check-in quizzes by entering their unique 4-digit PIN.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="open-share-link-modal-btn"
            onClick={() => {
              playClickSound();
              setShowShareModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1A1A1A] border border-[#2F2F2F] hover:border-[var(--gold)]/50 rounded-xs text-[11px] font-mono uppercase tracking-wider text-white transition cursor-pointer"
            title="Share direct student check-in link with your class"
          >
            <Share2 className="w-3.5 h-3.5 text-[var(--gold)]" />
            <span>Share Class Link</span>
          </button>

          <button
            id="open-bulk-add-modal-btn"
            onClick={() => {
              playClickSound();
              setShowBulkModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#161616] border border-[#1F1F1F] hover:border-[#333333] rounded-xs text-[11px] font-mono uppercase tracking-wider text-[#E0E0E0] hover:text-white transition cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-white" />
            <span>Bulk Add</span>
          </button>

          <button
            id="open-print-pins-btn"
            onClick={() => {
              playClickSound();
              setShowPrintModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-bold rounded-xs text-[11px] font-mono uppercase tracking-wider transition cursor-pointer shadow-[0_0_12px_rgba(212,175,55,0.2)]"
          >
            <Printer className="w-3.5 h-3.5 text-black" />
            <span>Print PIN Sheet</span>
          </button>
        </div>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleAddStudent} className="bg-[#161616] border border-[#1F1F1F] rounded-xs p-4 flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex-1 w-full">
          <label htmlFor="new-student-name" className="block text-[10px] uppercase tracking-[0.2em] font-mono text-[#888888] mb-1.5">
            Add New Student to Roster
          </label>
          <input
            id="new-student-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Student Full Name (e.g. Kai Nakamura)"
            className="w-full px-3.5 py-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-xs text-sm text-white focus:outline-none focus:border-[#555555] transition"
          />
        </div>
        <button
          type="submit"
          id="add-student-submit-btn"
          className="w-full sm:w-auto px-4 py-2 bg-[#1F1F1F] border border-[#333333] hover:border-[#555555] text-white hover:text-white text-xs uppercase tracking-widest font-mono rounded-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 self-end"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Student</span>
        </button>
      </form>

      {/* Roster Table */}
      {state.students.length === 0 ? (
        <div className="border border-dashed border-[#1F1F1F] rounded-xs p-10 text-center bg-[#161616]">
          <Users className="w-10 h-10 text-[#666666] mx-auto mb-2" />
          <h4 className="font-serif italic text-lg text-white mb-1">
            No students enrolled yet
          </h4>
          <p className="text-xs text-[#888888] max-w-md mx-auto font-light">
            Add students above or use Bulk Add to paste your class roster. Each student will receive a secure 4-digit PIN.
          </p>
        </div>
      ) : (
        <div className="bg-[#121212] border border-[#1F1F1F] rounded-xs overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#161616] border-b border-[#1F1F1F] font-mono text-[10px] uppercase tracking-[0.2em] text-[#888888]">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Login PIN</th>
                  <th className="py-3 px-4">Completed Checks</th>
                  <th className="py-3 px-4">Class Standing</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {state.students.map((student) => {
                  const completed = Object.keys(state.results[student.id] || {}).length;
                  const avg = getStudentAverage(student.id);

                  return (
                    <tr key={student.id} className="hover:bg-[#161616] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white">
                        {student.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="bg-[#D4AF37] text-black px-2.5 py-0.5 rounded-xs font-mono text-xs font-bold tracking-widest">
                            {student.pin}
                          </span>
                          <button
                            id={`copy-pin-${student.id}`}
                            onClick={() => copyStudentPin(student)}
                            className="text-[#666666] hover:text-white p-1 rounded cursor-pointer transition-colors"
                            title="Copy student PIN"
                          >
                            {copiedId === student.id ? (
                              <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#888888]">
                        <span className="font-semibold text-white">{completed}</span> / {publishedWeeks.length} weeks
                      </td>
                      <td className="py-3.5 px-4">
                        {avg === null ? (
                          <span className="text-xs text-[#555555] font-mono">—</span>
                        ) : (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-xs font-mono text-xs font-bold ${
                              avg >= 80
                                ? 'bg-[#22C55E] text-black'
                                : avg >= 60
                                ? 'bg-[#D4AF37] text-black'
                                : 'bg-[#EF4444] text-white'
                            }`}
                          >
                            {avg}% Avg
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          id={`del-student-${student.id}`}
                          onClick={() => handleDeleteStudent(student.id)}
                          className={`px-2.5 py-1 rounded-xs text-[11px] font-mono uppercase tracking-wider transition cursor-pointer border ${
                            armedDeleteId === student.id
                              ? 'bg-[#EF4444] text-white border-[#EF4444] animate-pulse'
                              : 'bg-transparent text-[#666666] border-[#1F1F1F] hover:text-[#EF4444] hover:border-[#EF4444]/50'
                          }`}
                        >
                          {armedDeleteId === student.id ? 'Confirm Remove' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Teacher Account Section */}
      <div className="pt-6 border-t border-[#1F1F1F]">
        <h3 className="font-serif italic text-lg text-white mb-3">
          Registered Co-Teachers &amp; Staff<span className="text-[#D4AF37]">.</span>
        </h3>
        <div className="bg-[#121212] border border-[#1F1F1F] rounded-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#161616] border-b border-[#1F1F1F] font-mono text-[10px] uppercase tracking-[0.2em] text-[#888888]">
                <th className="py-2.5 px-4">Educator Name</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F1F]">
              {state.teachers.map((tch) => (
                <tr key={tch.id} className="hover:bg-[#161616] transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-white">
                    {tch.name} {tch.id === currentTeacher.id && <span className="text-[#D4AF37] font-normal text-[11px]">(You)</span>}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[#888888]">{tch.email}</td>
                  <td className="py-2.5 px-4 uppercase font-mono text-[10px] text-[#666666]">{tch.role || 'Teacher'}</td>
                  <td className="py-2.5 px-4 text-right">
                    {state.teachers.length > 1 && tch.id !== currentTeacher.id && (
                      <button
                        onClick={() => handleDeleteTeacher(tch.id)}
                        className={`px-2 py-0.5 rounded-xs text-[10px] font-mono uppercase tracking-wider border transition cursor-pointer ${
                          armedDeleteTeacherId === tch.id
                            ? 'bg-[#EF4444] text-white border-[#EF4444]'
                            : 'bg-transparent text-[#666666] border-[#1F1F1F] hover:text-[#EF4444]'
                        }`}
                      >
                        {armedDeleteTeacherId === tch.id ? 'Confirm Remove' : 'Remove'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-xs max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <h3 className="font-serif italic text-2xl text-white mb-2">
              Bulk Add Students<span className="text-[#D4AF37]">.</span>
            </h3>
            <p className="text-xs text-[#888888] mb-4 font-light">
              Paste or type student names (one per line). A unique 4-digit PIN will be automatically assigned to each.
            </p>

            <textarea
              id="bulk-students-textarea"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={7}
              placeholder="Amara Khan&#10;Benjamin Hayes&#10;Chloe Tremblay&#10;Dominic Silva"
              className="w-full p-3 bg-[#161616] border border-[#1F1F1F] rounded-xs text-sm text-white font-mono mb-4 focus:outline-none focus:border-[#D4AF37]"
            />

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 bg-[#161616] border border-[#1F1F1F] text-[#888888] hover:text-white rounded-xs text-xs font-mono uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="bulk-add-confirm-btn"
                onClick={handleBulkAdd}
                className="px-4 py-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0A0A] font-semibold rounded-xs text-xs font-mono uppercase tracking-widest cursor-pointer"
              >
                Enroll Students
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          COMPREHENSIVE STUDENT PIN PRINT SHEET MODAL
          ========================================================================= */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
          <div className="bg-[#121212] border border-[#222222] rounded-xs max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#1F1F1F] bg-[#161616] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="font-serif italic text-xl text-white">
                    Student PIN Distribution Sheet<span className="text-[#D4AF37]">.</span>
                  </h3>
                </div>
                <p className="text-xs font-mono uppercase tracking-widest text-[#888888] mt-0.5">
                  {state.className} &bull; {state.subject || 'General'} &bull; {state.period || 'Period 1'} &bull; {state.students.length} Students
                </p>
              </div>

              {/* Primary Print Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="print-sheet-primary-btn"
                  onClick={handlePrintSheet}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0A0A] rounded-xs text-xs font-mono font-semibold uppercase tracking-wider transition cursor-pointer shadow-[0_0_12px_rgba(212,175,55,0.3)]"
                >
                  <Printer className="w-3.5 h-3.5 text-[#0A0A0A]" />
                  <span>Print Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  title="Open high-res printable document in a standalone new browser window"
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] text-[#E0E0E0] hover:text-white rounded-xs text-xs font-mono uppercase tracking-wider transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="hidden sm:inline">New Tab</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadHTML}
                  title="Download standalone printable HTML file"
                  className="p-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] text-[#CCCCCC] hover:text-white rounded-xs transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleCopyRoster}
                  title="Copy roster table (Name & PIN) to clipboard"
                  className="p-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] text-[#CCCCCC] hover:text-[#D4AF37] rounded-xs transition cursor-pointer"
                >
                  {copiedRosterFeedback ? <Check className="w-4 h-4 text-[#22C55E]" /> : <FileSpreadsheet className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-3 py-2 bg-[#161616] border border-[#1F1F1F] hover:border-[#333333] text-[#888888] hover:text-white rounded-xs text-xs font-mono uppercase tracking-wider transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Notification Banner */}
            {printNotification && (
              <div className="bg-[#D4AF37]/10 border-b border-[#D4AF37]/30 px-4 py-2 text-xs font-mono text-[#D4AF37] flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{printNotification}</span>
              </div>
            )}

            {/* Format & Customization Toolbar */}
            <div className="p-3 sm:px-5 sm:py-3 bg-[#0E0E0E] border-b border-[#1F1F1F] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[#666666] uppercase text-[10px] tracking-wider">Layout:</span>
                <div className="flex bg-[#161616] border border-[#262626] rounded-xs p-0.5">
                  <button
                    type="button"
                    onClick={() => setPrintLayout('slips')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xs transition cursor-pointer ${
                      printLayout === 'slips'
                        ? 'bg-[#222222] text-[#D4AF37] font-semibold'
                        : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>Cut-out Slips</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintLayout('table')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xs transition cursor-pointer ${
                      printLayout === 'table'
                        ? 'bg-[#222222] text-[#D4AF37] font-semibold'
                        : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    <List className="w-3 h-3" />
                    <span>Ledger Table</span>
                  </button>
                </div>

                {printLayout === 'slips' && (
                  <div className="hidden sm:flex items-center gap-1.5 ml-2">
                    <span className="text-[#666666] uppercase text-[10px] tracking-wider">Cards/Row:</span>
                    <button
                      type="button"
                      onClick={() => setCardsPerRow(2)}
                      className={`px-2 py-0.5 rounded-xs border text-[11px] cursor-pointer ${
                        cardsPerRow === 2 ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' : 'border-[#262626] text-[#777777]'
                      }`}
                    >
                      2 (Large)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardsPerRow(3)}
                      className={`px-2 py-0.5 rounded-xs border text-[11px] cursor-pointer ${
                        cardsPerRow === 3 ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' : 'border-[#262626] text-[#777777]'
                      }`}
                    >
                      3 (Compact)
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <span className="text-[#666666] uppercase text-[10px] tracking-wider shrink-0 hidden md:inline">Note:</span>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Custom student instruction note..."
                  className="w-full px-2.5 py-1 bg-[#161616] border border-[#222222] rounded-xs text-[11px] text-[#CCCCCC] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Interactive Preview Canvas */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-[#0A0A0A] flex-1">
              <div
                id="student-pin-printable-sheet"
                className="bg-[#121212] border border-[#1F1F1F] rounded-xs p-5 sm:p-6 shadow-inner text-left"
              >
                {/* Print Sheet Header Preview */}
                <div className="border-b border-[#262626] pb-3 mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <h4 className="font-serif italic text-lg text-white">
                      {state.className} &mdash; Student Login PIN Distribution
                    </h4>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#888888] mt-0.5">
                      Educator: {currentTeacher.name} &bull; {state.subject || 'General'} &bull; {state.period || 'Period 1'}
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-[#666666] sm:text-right">
                    <span>{new Date().toLocaleDateString()}</span> &bull; <span>{state.students.length} Students</span>
                  </div>
                </div>

                {state.students.length === 0 ? (
                  <div className="py-12 text-center text-[#666666] font-mono text-xs">
                    No students currently enrolled in this class.
                  </div>
                ) : printLayout === 'slips' ? (
                  <div
                    className={`grid gap-3.5 ${
                      cardsPerRow === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
                    }`}
                  >
                    {state.students.map((student) => (
                      <div
                        key={student.id}
                        className="border border-dashed border-[#333333] hover:border-[#D4AF37]/60 p-3.5 rounded-xs bg-[#161616] flex flex-col justify-between transition-colors relative group"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-[#222222] pb-1.5 mb-2">
                            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#D4AF37] flex items-center gap-1 font-semibold">
                              <Scissors className="w-2.5 h-2.5" />
                              <span>Login Slip</span>
                            </span>
                            <span className="text-[9px] font-mono text-[#666666]">
                              {state.className}
                            </span>
                          </div>

                          <h5 className="font-serif italic text-base text-white my-1 font-semibold">
                            {student.name}
                          </h5>
                        </div>

                        <div>
                          <div className="my-2 bg-[#0A0A0A] border border-[#262626] py-2 px-3 rounded-xs text-center">
                            <span className="text-[8.5px] font-mono text-[#777777] uppercase tracking-widest block mb-0.5">
                              Your 4-Digit Login PIN
                            </span>
                            <span className="font-mono text-xl font-bold tracking-[0.25em] text-[#D4AF37]">
                              {student.pin}
                            </span>
                          </div>

                          <div className="text-[9.5px] text-[#888888] font-sans leading-tight mt-1.5 flex items-start justify-between gap-1">
                            <span>{customNote || 'Enter PIN on student check-in portal.'}</span>
                            <button
                              type="button"
                              onClick={() => copyStudentPin(student)}
                              className="text-[#666666] hover:text-[#D4AF37] p-0.5 shrink-0 transition"
                              title="Copy this student's PIN"
                            >
                              {copiedId === student.id ? (
                                <Check className="w-3 h-3 text-[#22C55E]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Ledger Table Preview */
                  <div className="overflow-x-auto border border-[#222222] rounded-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#181818] border-b border-[#262626] font-mono text-[9.5px] uppercase tracking-wider text-[#888888]">
                          <th className="py-2.5 px-3 w-10">#</th>
                          <th className="py-2.5 px-3">Student Full Name</th>
                          <th className="py-2.5 px-3 w-32">4-Digit PIN</th>
                          <th className="py-2.5 px-3 w-28">Class Period</th>
                          <th className="py-2.5 px-3 text-right">Quick Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F1F1F]">
                        {state.students.map((stu, i) => (
                          <tr key={stu.id} className="hover:bg-[#181818]">
                            <td className="py-2.5 px-3 font-mono text-[#666666]">{i + 1}</td>
                            <td className="py-2.5 px-3 font-medium text-white">{stu.name}</td>
                            <td className="py-2.5 px-3 font-mono text-sm font-bold tracking-widest text-[#D4AF37]">
                              {stu.pin}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[#888888]">{state.period || 'Period 1'}</td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => copyStudentPin(stu)}
                                className="text-xs text-[#888888] hover:text-[#D4AF37] font-mono inline-flex items-center gap-1 cursor-pointer"
                              >
                                {copiedId === stu.id ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                                <span>Copy</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:px-5 sm:py-3.5 border-t border-[#1F1F1F] bg-[#161616] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[#777777] font-mono shrink-0">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Tip: Print uses crisp high-contrast black ink and dashed scissors cut lines.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintSheet}
                  className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0A0A] font-semibold rounded-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Send to Printer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Class Link Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#121212] border border-[#2A2A2A] rounded-sm max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[var(--gold)]" />
                <h3 className="font-serif italic text-lg text-white">
                  Student Class Access Link<span className="text-[#888888]">.</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-xs font-mono text-[#888888] hover:text-white cursor-pointer px-2 py-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-[#AAAAAA] leading-relaxed">
                Students on other computers or phones can open this link to connect to your class, pick their name from the roster, and take active weekly quizzes with live score synchronization.
              </p>

              {/* Class Code & Direct Link */}
              <div className="bg-[#181818] border border-[#2A2A2A] rounded-xs p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#888888]">
                    Classroom Code
                  </span>
                  <span className="font-mono text-sm font-bold text-[var(--gold)] bg-[#222222] px-2.5 py-0.5 rounded-xs">
                    {state.classCode}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#888888] block mb-1.5">
                    Direct Student Link
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getStudentShareUrl()}
                      className="w-full px-3 py-2 bg-[#0E0E0E] border border-[#333333] rounded-xs text-xs font-mono text-white select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyShareLink}
                      className="px-4 py-2 bg-[var(--gold)] hover:bg-[#E5C158] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xs cursor-pointer transition shrink-0 flex items-center gap-1.5"
                    >
                      {copiedShareLink ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-[11px] font-mono text-[#888888] space-y-1.5 bg-[#161616] p-3 rounded-xs border border-[#202020]">
                <div className="text-[#CCCCCC] font-medium mb-1">How students connect:</div>
                <div className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">1.</span>
                  <span>Open the link above on any laptop, Chromebook, or tablet.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">2.</span>
                  <span>Select their name and enter their 4-digit PIN.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">3.</span>
                  <span>Their quiz scores will sync straight to your Results tab.</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-[#202020] hover:bg-[#2A2A2A] text-white text-xs font-mono uppercase tracking-wider rounded-xs cursor-pointer transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
