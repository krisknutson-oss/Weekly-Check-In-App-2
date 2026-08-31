import React, { useEffect } from 'react';
import { QuizSubmission, Student, Week } from '../../types';
import { playClickSound, playSuccessChime } from '../../utils/sound';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, ArrowLeft, Sparkles, AlertTriangle } from 'lucide-react';

interface StudentFeedbackProps {
  student: Student;
  week: Week;
  submission: QuizSubmission;
  onBackToHome: () => void;
}

export const StudentFeedback: React.FC<StudentFeedbackProps> = ({
  student,
  week,
  submission,
  onBackToHome,
}) => {
  const percentage = Math.round((submission.score / submission.total) * 100);
  const isGreatScore = percentage >= 80;

  useEffect(() => {
    if (isGreatScore) {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#E5C158', '#FFFFFF', '#22C55E'],
      });
    }
  }, [isGreatScore]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <button
            id="feedback-back-to-home-btn"
            onClick={() => {
              playClickSound();
              onBackToHome();
            }}
            className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-[#888888] hover:text-white mb-1 cursor-pointer transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h2 className="font-serif italic text-2xl text-white">
            {week.title} — Feedback &amp; Review<span className="text-[#888888]">.</span>
          </h2>
          <span className="text-xs font-mono text-[#888888]">
            Student: <strong className="text-white font-medium">{student.name}</strong>
          </span>
        </div>

        <button
          onClick={onBackToHome}
          className="px-4 py-2 bg-[#161616] border border-[#1F1F1F] hover:border-[#333333] text-white rounded-lg text-xs font-mono uppercase tracking-wider cursor-pointer transition self-start sm:self-auto"
        >
          Return to All Weeks
        </button>
      </div>

      {/* Score Summary Box */}
      <div className="bg-gradient-to-b from-[#181818] to-[#111111] border border-white/[0.08] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-[0_16px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            {isGreatScore ? (
              <span className="bg-[#22C55E] text-black font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_2px_8px_rgba(34,197,94,0.3)]">
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>STRONG UNIT MASTERY</span>
              </span>
            ) : (
              <span className="bg-[var(--gold)] text-black font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_2px_8px_rgba(212,175,55,0.3)]">
                <AlertTriangle className="w-3.5 h-3.5 text-black" />
                <span>REVIEW RECOMMENDED</span>
              </span>
            )}
          </div>
          <h3 className="font-serif italic text-2xl sm:text-3xl text-white">
            You scored {submission.score} out of {submission.total}<span className="text-[var(--gold)]">.</span>
          </h3>
          <p className="text-xs text-[#888888] leading-relaxed max-w-md font-light">
            Review the questions you missed below. Use the explanations to prepare for the culminating unit assessment.
          </p>
        </div>

        {/* High-Contrast Score Stamp */}
        <div className="ledger-stamp w-32 h-32 rounded-full border-2 border-dashed border-[var(--gold)] flex flex-col items-center justify-center bg-[var(--gold)] shadow-[0_8px_25px_rgba(212,175,55,0.35)] shrink-0 self-center sm:self-auto">
          <span className="font-mono text-4xl font-bold text-black leading-none">
            {percentage}%
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-black/80 font-bold mt-1">
            Final Score
          </span>
        </div>
      </div>

      {/* Detailed Question Review List */}
      <div className="space-y-4">
        <h4 className="font-serif italic text-xl text-white">
          Question-by-Question Breakdown<span className="text-[var(--gold)]">.</span>
        </h4>

        {week.quiz.map((q, qi) => {
          const studentAnswer = submission.answers[qi];
          const isCorrect = studentAnswer === q.correctIndex;

          return (
            <div
              key={qi}
              className={`p-6 rounded-2xl border transition shadow-[0_6px_18px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)] ${
                isCorrect ? 'bg-gradient-to-b from-[#161616] to-[#111111] border-white/[0.08]' : 'bg-gradient-to-b from-[#181313] to-[#120E0E] border-[#EF4444]/30'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono font-bold text-xs bg-[var(--gold)] text-black px-3 py-1 rounded-lg shadow-xs">
                  Q{qi + 1}
                </span>

                {isCorrect ? (
                  <span className="text-xs font-mono font-medium text-[#22C55E] flex items-center gap-1.5 bg-[#22C55E]/15 border border-[#22C55E]/30 px-3 py-1 rounded-full shadow-inner">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Correct</span>
                  </span>
                ) : (
                  <span className="text-xs font-mono font-medium text-[#EF4444] flex items-center gap-1.5 bg-[#EF4444]/15 border border-[#EF4444]/30 px-3 py-1 rounded-full shadow-inner">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Incorrect</span>
                  </span>
                )}
              </div>

              <h5 className="font-medium text-base text-white mb-3.5">
                {q.question}
              </h5>

              {/* Options */}
              <div className="space-y-2 text-xs">
                {q.options.map((opt, oi) => {
                  const isUserSelection = oi === studentAnswer;
                  const isTheCorrectChoice = oi === q.correctIndex;

                  let rowStyle = 'bg-[#151515] border-white/[0.06] text-[#888888]';
                  if (isTheCorrectChoice) {
                    rowStyle = 'bg-[#22C55E]/15 border-[#22C55E]/40 font-medium text-[#22C55E] shadow-xs';
                  } else if (isUserSelection && !isCorrect) {
                    rowStyle = 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444] line-through shadow-xs';
                  }

                  return (
                    <div
                      key={oi}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${rowStyle}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold">
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        <span>{opt}</span>
                      </div>

                      {isTheCorrectChoice && (
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-[#22C55E] text-[#0A0A0A] px-2.5 py-1 rounded-full shadow-xs">
                          Correct Answer
                        </span>
                      )}

                      {isUserSelection && !isCorrect && (
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-[#EF4444] text-white px-2.5 py-1 rounded-full shadow-xs">
                          Your Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Rationale Explanation */}
              {q.explanation && (
                <div className="mt-4 bg-[#141414] p-4 rounded-xl border border-white/[0.07] text-xs text-[#CCCCCC] font-mono font-light shadow-inner">
                  <span className="text-black font-bold bg-[var(--gold)] uppercase text-[10px] tracking-wider inline-block px-2.5 py-0.5 rounded-md mb-2 shadow-xs">Explanation:</span>
                  <div className="leading-relaxed">{q.explanation}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
