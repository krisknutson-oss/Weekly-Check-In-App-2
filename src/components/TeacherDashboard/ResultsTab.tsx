import React, { useState } from 'react';
import { ClassroomState, Question, Student, Week } from '../../types';
import { playClickSound, playStampSound } from '../../utils/sound';
import { 
  Users, 
  Presentation, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  FileSpreadsheet, 
  Printer, 
  Eye, 
  HelpCircle, 
  TrendingUp, 
  AlertTriangle, 
  Check, 
  Clock 
} from 'lucide-react';

interface ResultsTabProps {
  state: ClassroomState;
}

export const ResultsTab: React.FC<ResultsTabProps> = ({ state }) => {
  const publishedWeeks = state.weeks.filter((w) => w.status === 'published');
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(
    publishedWeeks.length > 0 ? publishedWeeks[0].id : null
  );
  const [viewMode, setViewMode] = useState<'individual' | 'class'>('individual');
  const [inspectedStudentId, setInspectedStudentId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const selectedWeek = state.weeks.find((w) => w.id === selectedWeekId) || null;

  if (publishedWeeks.length === 0) {
    return (
      <div className="border border-dashed border-[#1F1F1F] rounded-xs p-12 text-center bg-[#161616]">
        <Presentation className="w-10 h-10 text-[#666666] mx-auto mb-2" />
        <h4 className="font-serif italic text-xl text-white mb-1">
          No Published Quizzes Yet
        </h4>
        <p className="text-xs text-[#888888] max-w-md mx-auto font-light">
          Publish a weekly check-in from the <strong className="text-white">Weeks &amp; Quizzes</strong> tab so students can submit their answers and generate analytics.
        </p>
      </div>
    );
  }

  // Calculate stats for selected week
  const studentSubmissions = state.students
    .map((s) => ({
      student: s,
      result: selectedWeek ? (state.results[s.id] || {})[selectedWeek.id] || null : null,
    }));

  const submittedRows = studentSubmissions.filter((x) => x.result !== null);
  const totalEnrolled = state.students.length;
  const submittedCount = submittedRows.length;

  const classAverage =
    submittedCount > 0
      ? Math.round(
          submittedRows.reduce((acc, row) => acc + (row.result!.score / row.result!.total) * 100, 0) /
            submittedCount
        )
      : 0;

  // Question-by-question breakdown
  const questionStats = (selectedWeek?.quiz || []).map((q, qi) => {
    const missedCount = submittedRows.filter((r) => r.result!.answers[qi] !== q.correctIndex).length;
    const missPct = submittedCount > 0 ? Math.round((missedCount / submittedCount) * 100) : 0;
    return {
      index: qi,
      question: q,
      missedCount,
      correctCount: submittedCount - missedCount,
      missPct,
    };
  });

  const struggleRanked = [...questionStats].sort((a, b) => b.missPct - a.missPct);
  const actionableItems = struggleRanked.filter((item) => item.missPct >= 20).slice(0, 4);

  // CSV Export
  const handleExportCSV = () => {
    if (!selectedWeek) return;
    setIsExporting(true);

    const headers = ['Student Name', 'PIN', 'Score', 'Total Questions', 'Percentage', 'Submitted Date'];
    const rows = studentSubmissions.map(({ student, result }) => [
      `"${student.name}"`,
      student.pin,
      result ? result.score : 'N/A',
      result ? result.total : selectedWeek.quiz.length,
      result ? `${Math.round((result.score / result.total) * 100)}%` : 'Not Submitted',
      result ? new Date(result.submittedAt).toLocaleDateString() : '—',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedWeek.title.replace(/[^a-z0-9]/gi, '_')}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExporting(false);
  };

  const inspectedStudent = state.students.find((s) => s.id === inspectedStudentId);
  const inspectedResult =
    inspectedStudent && selectedWeek ? (state.results[inspectedStudent.id] || {})[selectedWeek.id] : null;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <h2 className="font-serif italic text-2xl text-white">
            Assessment Results &amp; Analytics<span className="text-[#888888]">.</span>
          </h2>
          <p className="text-xs font-mono uppercase tracking-widest text-[#888888] mt-1">
            Monitor student mastery and evaluate classroom readiness for the unit culminating activity.
          </p>
        </div>

        {/* Week Selector Dropdown & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            id="results-week-select"
            value={selectedWeek?.id || ''}
            onChange={(e) => {
              playClickSound();
              setSelectedWeekId(e.target.value);
            }}
            className="px-3.5 py-2 bg-[#161616] border border-[#1F1F1F] rounded-xs text-xs font-mono text-white focus:outline-none focus:border-[#555555] cursor-pointer"
          >
            {publishedWeeks.map((w) => (
              <option key={w.id} value={w.id} className="bg-[#161616] text-white">
                {w.title}
              </option>
            ))}
          </select>

          <button
            id="export-results-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#161616] border border-[#1F1F1F] hover:border-[#333333] rounded-xs text-xs font-mono uppercase tracking-wider text-white transition cursor-pointer"
            title="Download CSV of student scores"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 border-b border-[#1F1F1F]">
        <button
          id="view-individual-results-tab"
          onClick={() => {
            playClickSound();
            setViewMode('individual');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xs text-[11px] font-mono uppercase tracking-wider transition cursor-pointer border-t border-x ${
            viewMode === 'individual'
              ? 'bg-[#161616] border-white/50 text-white font-bold -mb-px'
              : 'bg-[#0A0A0A] border-[#1F1F1F] text-[#666666] hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-white" />
          <span>Individual Submissions</span>
        </button>

        <button
          id="view-class-overview-tab"
          onClick={() => {
            playClickSound();
            setViewMode('class');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xs text-[11px] font-mono uppercase tracking-wider transition cursor-pointer border-t border-x ${
            viewMode === 'class'
              ? 'bg-[#161616] border-white/50 text-white font-bold -mb-px'
              : 'bg-[#0A0A0A] border-[#1F1F1F] text-[#666666] hover:text-white'
          }`}
        >
          <Presentation className="w-3.5 h-3.5 text-white" />
          <span>Class Overview</span>
        </button>
      </div>

      {/* Main Panel Body */}
      <div className="bg-[#161616] border border-[#1F1F1F] border-t-0 rounded-b-xs p-6 shadow-xl">
        {/* VIEW 1: Individual Results */}
        {viewMode === 'individual' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#888888]">
                Confidential student submissions for <strong className="text-white">{selectedWeek?.title}</strong>.
              </p>
              <span className="font-mono text-xs bg-[#121212] text-[#D4AF37] font-semibold px-3 py-1 rounded-xs border border-[#1F1F1F]">
                {submittedCount} of {totalEnrolled} Submissions
              </span>
            </div>

            <div className="bg-[#121212] border border-[#1F1F1F] rounded-xs overflow-hidden shadow-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#161616] border-b border-[#1F1F1F] font-mono text-[10px] uppercase tracking-[0.2em] text-[#888888]">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">PIN</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Submission Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F1F]">
                  {studentSubmissions.map(({ student, result }) => {
                    const pct = result ? Math.round((result.score / result.total) * 100) : null;
                    return (
                      <tr key={student.id} className="hover:bg-[#161616] transition-colors">
                        <td className="py-3.5 px-4 font-medium text-white">
                          {student.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-[#888888]">
                          {student.pin}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-white">
                          {result ? `${result.score} / ${result.total}` : '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          {pct !== null ? (
                            <span
                              className={`font-mono text-xs font-bold px-2 py-0.5 rounded-xs ${
                                pct >= 80
                                  ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30'
                                  : pct >= 60
                                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30'
                                  : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30'
                              }`}
                            >
                              {pct}%
                            </span>
                          ) : (
                            <span className="text-xs text-[#555555] font-mono">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono">
                          {result ? (
                            <span className="text-[#22C55E] font-medium flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <span className="text-[#888888] font-medium flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {result && (
                            <button
                              id={`view-student-answers-${student.id}`}
                              onClick={() => {
                                playClickSound();
                                setInspectedStudentId(student.id);
                              }}
                              className="px-3 py-1 bg-[#161616] border border-[#1F1F1F] hover:border-[#D4AF37] text-white hover:text-[#D4AF37] rounded-xs text-xs font-mono uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer transition"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                              <span>Inspect</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 2: Class Overview (Projector Ready) */}
        {viewMode === 'class' && (
          <div className="space-y-8">
            {/* Header Stamp Card */}
            <div className="text-center py-6 bg-[#121212] border border-[#1F1F1F] rounded-xs p-6 shadow-xl relative overflow-hidden">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#888888] block mb-2">
                Classroom Standing &middot; {selectedWeek?.title}
              </span>

              {/* Sophisticated Dark Class Average Stamp */}
              <div className="ledger-stamp w-32 h-32 rounded-full border border-dashed border-[#D4AF37] mx-auto flex flex-col items-center justify-center bg-[#161616] my-3 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                <span className="font-mono text-4xl font-bold text-[#D4AF37] leading-none">
                  {submittedCount > 0 ? `${classAverage}%` : '—'}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#888888] mt-1">
                  Class Average
                </span>
              </div>

              <p className="text-xs text-[#888888] font-mono mt-3 font-light">
                {submittedCount} of {totalEnrolled} students submitted &middot; Culminating Readiness:{' '}
                <strong className={`ml-1 ${classAverage >= 75 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {classAverage >= 80 ? 'HIGH' : classAverage >= 65 ? 'MODERATE' : 'NEEDS TARGETED REVISION'}
                </strong>
              </p>
            </div>

            {/* Struggle & Question Distribution Chart */}
            <div className="bg-[#121212] border border-[#1F1F1F] rounded-xs p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-serif italic text-xl text-white">
                    Where the Class Struggled (Question Breakdown)<span className="text-[#D4AF37]">.</span>
                  </h4>
                  <p className="text-xs text-[#888888] font-light">
                    Higher bars represent questions where a larger percentage of students made errors.
                  </p>
                </div>
              </div>

              {/* CSS Bar Chart of 20 questions */}
              <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-20 gap-1.5 items-end h-40 pt-6 pb-2 border-b border-[#1F1F1F]">
                {questionStats.map((stat) => {
                  const isHighMiss = stat.missPct >= 35;
                  const isModerateMiss = stat.missPct >= 20;

                  return (
                    <div key={stat.index} className="flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip on hover */}
                      <div className="hidden group-hover:block absolute bottom-full mb-2 bg-[#0A0A0A] border border-[#1F1F1F] text-white text-[10px] p-2.5 rounded-xs shadow-2xl z-20 w-48 pointer-events-none font-mono">
                        <div className="font-bold text-[#D4AF37]">Q{stat.index + 1}: {stat.missPct}% Missed</div>
                        <div className="text-[9px] mt-1 line-clamp-2 text-[#888888]">{stat.question.question}</div>
                      </div>

                      {/* Bar */}
                      <div
                        className={`w-full rounded-t-xs transition-all duration-300 ${
                          isHighMiss
                            ? 'bg-[#EF4444]'
                            : isModerateMiss
                            ? 'bg-[#D4AF37]'
                            : 'bg-[#22C55E]'
                        }`}
                        style={{ height: `${Math.max(8, stat.missPct)}%` }}
                      />
                      <span className="text-[10px] font-mono text-[#666666] mt-1 font-semibold">
                        Q{stat.index + 1}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-6 mt-4 text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#22C55E]" />
                  <span className="text-[#888888]">Strong Mastery (&lt;20% Missed)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#D4AF37]" />
                  <span className="text-[#888888]">Moderate Focus (20–34%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#EF4444]" />
                  <span className="text-[#888888]">Critical Revisit (≥35%)</span>
                </div>
              </div>
            </div>

            {/* Action Items for Culminating Unit Activity */}
            <div className="bg-[#121212] border border-[#1F1F1F] rounded-xs p-6 space-y-4 shadow-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                <h4 className="font-serif italic text-xl text-white">
                  Action Items Before Culminating Activity<span className="text-[#D4AF37]">.</span>
                </h4>
              </div>

              {actionableItems.length === 0 ? (
                <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 p-4 rounded-xs text-xs text-[#22C55E] font-mono">
                  <strong>Exceptional Unit Readiness!</strong> No question exceeded the 20% classroom error threshold. Students are well-prepared for the culminating assessment.
                </div>
              ) : (
                <div className="space-y-3">
                  {actionableItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-[#161616] border border-[#1F1F1F] p-4 rounded-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#D4AF37]">
                          Revisit Concept (Q{item.index + 1}) &middot; {item.missPct}% Missed by Class
                        </span>
                        <span className="text-[9px] font-mono bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] px-2 py-0.5 rounded-xs font-bold uppercase tracking-wider">
                          Priority Review
                        </span>
                      </div>
                      <p className="font-medium text-sm text-white">
                        {item.question.question}
                      </p>
                      <p className="text-xs text-[#888888] pt-1">
                        <strong className="text-[#22C55E]">Correct Core Understanding:</strong>{' '}
                        {item.question.options[item.question.correctIndex]}
                      </p>
                      {item.question.explanation && (
                        <p className="text-[11px] text-[#666666] italic font-light">
                          Rationale: {item.question.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Inspect Student Exam Modal */}
      {inspectedStudent && inspectedResult && selectedWeek && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-xs max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-[#1F1F1F] flex items-center justify-between bg-[#161616]">
              <div>
                <span className="text-[9px] font-mono text-[#D4AF37] font-bold uppercase tracking-[0.2em] block">
                  Exam Submission Inspection
                </span>
                <h3 className="font-serif italic text-xl text-white">
                  {inspectedStudent.name} &middot; {selectedWeek.title}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold bg-[#0A0A0A] border border-[#1F1F1F] text-[#D4AF37] px-3 py-1.5 rounded-xs">
                  Score: {inspectedResult.score} / {inspectedResult.total} (
                  {Math.round((inspectedResult.score / inspectedResult.total) * 100)}%)
                </span>
                <button
                  onClick={() => setInspectedStudentId(null)}
                  className="px-3.5 py-1.5 bg-[#121212] border border-[#1F1F1F] hover:border-[#333333] text-white rounded-xs text-xs font-mono uppercase tracking-wider cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 bg-[#0A0A0A]">
              {selectedWeek.quiz.map((q, qi) => {
                const chosen = inspectedResult.answers[qi];
                const isCorrect = chosen === q.correctIndex;

                return (
                  <div
                    key={qi}
                    className={`p-4 rounded-xs border ${
                      isCorrect ? 'bg-[#121212] border-[#1F1F1F]' : 'bg-[#121212] border-[#EF4444]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs text-[#888888]">
                        Question {qi + 1}
                      </span>
                      {isCorrect ? (
                        <span className="text-xs font-mono text-[#22C55E] font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Correct (+1)
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-[#EF4444] font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect (0)
                        </span>
                      )}
                    </div>

                    <p className="font-medium text-sm text-white mb-3">
                      {q.question}
                    </p>

                    <div className="space-y-1.5 text-xs">
                      {q.options.map((opt, oi) => {
                        const isStudentChoice = oi === chosen;
                        const isTheCorrectAnswer = oi === q.correctIndex;

                        return (
                          <div
                            key={oi}
                            className={`p-2.5 rounded-xs border flex items-center justify-between ${
                              isTheCorrectAnswer
                                ? 'bg-[#22C55E]/10 border-[#22C55E]/40 font-medium text-[#22C55E]'
                                : isStudentChoice
                                ? 'bg-[#EF4444]/10 border-[#EF4444]/40 text-[#EF4444] line-through'
                                : 'bg-[#161616] border-[#1F1F1F] text-[#888888]'
                            }`}
                          >
                            <span>
                              {String.fromCharCode(65 + oi)}. {opt}
                            </span>
                            {isTheCorrectAnswer && (
                              <span className="text-[9px] uppercase font-mono font-bold">
                                Correct Answer
                              </span>
                            )}
                            {isStudentChoice && !isTheCorrectAnswer && (
                              <span className="text-[9px] uppercase font-mono font-bold">
                                Selected
                              </span>
                            )}
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
    </div>
  );
};
