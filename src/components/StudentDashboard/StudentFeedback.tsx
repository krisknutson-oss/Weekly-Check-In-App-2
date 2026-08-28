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
      <div className="bg-[#121212] border border-[#1F1F1F] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {isGreatScore ? (
              <span className="bg-[#22C55E] text-black font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>STRONG UNIT MASTERY</span>
              </span>
            ) : (
              <span className="bg-[#D4AF37] text-black font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-black" />
                <span>REVIEW RECOMMENDED</span>
              </span>
            )}
          </div>
          <h3 className="font-serif italic text-2xl sm:text-3xl text-white">
            You scored {submission.score} out of {submission.total}<span className="text-[#888888]">.</span>
          </h3>
          <p className="text-xs text-[#888888] leading-relaxed max-w-md font-light">
            Review the questions you missed below. Use the explanations to prepare for the culminating unit assessment.
          </p>
        </div>

        {/* High-Contrast Score Stamp */}
        <div className="ledger-stamp w-32 h-32 rounded-full border border-dashed border-[#D4AF37] flex flex-col items-center justify-center bg-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)] shrink-0 self-center sm:self-auto">
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
          Question-by-Question Breakdown<span className="text-[#888888]">.</span>
        </h4>

        {week.quiz.map((q, qi) => {
          const studentAnswer = submission.answers[qi];
          const isCorrect = studentAnswer === q.correctIndex;

          return (
            <div
              key={qi}
              className={`p-5 rounded-xl border transition ${
                isCorrect ? 'bg-[#121212] border-[#1F1F1F]' : 'bg-[#121212] border-[#EF4444]/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-xs bg-[#D4AF37] text-black px-2.5 py-0.5 rounded-md">
                  Q{qi + 1}
                </span>

                {isCorrect ? (
                  <span className="text-xs font-mono font-medium text-[#22C55E] flex items-center gap-1.5 bg-[#22C55E]/10 border border-[#22C55E]/30 px-2.5 py-1 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Correct</span>
                  </span>
                ) : (
                  <span className="text-xs font-mono font-medium text-[#EF4444] flex items-center gap-1.5 bg-[#EF4444]/10 border border-[#EF4444]/30 px-2.5 py-1 rounded-md">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Incorrect</span>
                  </span>
                )}
              </div>

              <h5 className="font-medium text-base text-white mb-3">
                {q.question}
              </h5>

              {/* Options */}
              <div className="space-y-1.5 text-xs">
                {q.options.map((opt, oi) => {
                  const isUserSelection = oi === studentAnswer;
                  const isTheCorrectChoice = oi === q.correctIndex;

                  let rowStyle = 'bg-[#161616] border-[#1F1F1F] text-[#888888]';
                  if (isTheCorrectChoice) {
                    rowStyle = 'bg-[#22C55E]/10 border-[#22C55E]/40 font-medium text-[#22C55E]';
                  } else if (isUserSelection && !isCorrect) {
                    rowStyle = 'bg-[#EF4444]/10 border-[#EF4444]/40 text-[#EF4444] line-through';
                  }

                  return (
                    <div
                      key={oi}
                      className={`p-2.5 rounded-lg border flex items-center justify-between gap-2.5 ${rowStyle}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        <span>{opt}</span>
                      </div>

                      {isTheCorrectChoice && (
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-[#22C55E] text-[#0A0A0A] px-2 py-0.5 rounded-md">
                          Correct Answer
                        </span>
                      )}

                      {isUserSelection && !isCorrect && (
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-[#EF4444] text-white px-2 py-0.5 rounded-md">
                          Your Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Rationale Explanation */}
              {q.explanation && (
                <div className="mt-3 bg-[#161616] p-3.5 rounded-lg border border-[#1F1F1F] text-xs text-[#CCCCCC] font-mono font-light">
                  <span className="text-black font-bold bg-[#D4AF37] uppercase text-[10px] tracking-wider inline-block px-2 py-0.5 rounded-md mb-1.5">Explanation:</span>
                  <div>{q.explanation}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
