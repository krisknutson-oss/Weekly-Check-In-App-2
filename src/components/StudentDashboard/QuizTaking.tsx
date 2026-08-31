import React, { useState, useEffect, useCallback } from 'react';
import { Question, Student, Week } from '../../types';
import { playClickSound, playStampSound, playSuccessChime } from '../../utils/sound';
import { ArrowLeft, Check, AlertCircle, Send } from 'lucide-react';

interface QuizTakingProps {
  student: Student;
  week: Week;
  onSubmitAnswers: (answers: number[]) => void;
  onCancel: () => void;
}

export const QuizTaking: React.FC<QuizTakingProps> = ({
  student,
  week,
  onSubmitAnswers,
  onCancel,
}) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState('');

  const totalQuestions = week.quiz.length;
  const answeredCount = Object.keys(answers).length;
  const currentQuestion = week.quiz[currentIdx];

  // Option selection
  const selectOption = (optionIndex: number) => {
    playClickSound();
    setAnswers((prev) => ({
      ...prev,
      [currentIdx]: optionIndex,
    }));
    setErrorMessage('');
  };

  // Keyboard shortcut listener: 1-4 or A-D to select option, ArrowLeft/ArrowRight to navigate
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === '1' || e.key.toLowerCase() === 'a') {
        selectOption(0);
      } else if (e.key === '2' || e.key.toLowerCase() === 'b') {
        selectOption(1);
      } else if (e.key === '3' || e.key.toLowerCase() === 'c') {
        selectOption(2);
      } else if (e.key === '4' || e.key.toLowerCase() === 'd') {
        selectOption(3);
      } else if (e.key === 'ArrowRight' && currentIdx < totalQuestions - 1) {
        setCurrentIdx((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentIdx > 0) {
        setCurrentIdx((prev) => prev - 1);
      }
    },
    [currentIdx, totalQuestions]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSubmit = () => {
    if (answeredCount < totalQuestions) {
      setErrorMessage(
        `Please answer all 20 questions before submitting (${totalQuestions - answeredCount} unanswered remaining).`
      );
      playClickSound();
      return;
    }

    playSuccessChime();
    const orderedAnswers = week.quiz.map((_, idx) => answers[idx]);
    onSubmitAnswers(orderedAnswers);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Top Exam Header */}
      <div className="bg-gradient-to-b from-[#191919] to-[#121212] border border-white/[0.08] rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_12px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div>
          <button
            onClick={() => {
              if (window.confirm('Leave check-in? Your answers will not be saved.')) {
                onCancel();
              }
            }}
            className="text-[11px] font-mono uppercase tracking-widest text-[#888888] hover:text-[#EF4444] inline-flex items-center gap-1.5 mb-1.5 cursor-pointer transition px-2.5 py-1 rounded-lg hover:bg-white/[0.05]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel &amp; Exit</span>
          </button>
          <h2 className="font-serif italic text-xl sm:text-2xl text-white">
            {week.title}
          </h2>
          <span className="text-xs font-mono text-[#888888]">
            Student: <strong className="text-white font-medium">{student.name}</strong>
          </span>
        </div>

        {/* Progress Pill */}
        <div className="text-right self-end sm:self-auto">
          <div className="font-mono text-xs font-semibold text-[var(--gold)] bg-gradient-to-b from-[#222222] to-[#151515] border border-[var(--gold)]/30 px-4 py-2 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            {answeredCount} / {totalQuestions} Answered
          </div>
        </div>
      </div>

      {/* Question Jump Ribbon */}
      <div className="bg-gradient-to-b from-[#181818] to-[#111111] border border-white/[0.08] p-3.5 rounded-2xl flex flex-wrap gap-2 justify-center shadow-[0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
        {week.quiz.map((_, idx) => {
          const isAnswered = answers[idx] !== undefined;
          const isCurrent = idx === currentIdx;

          return (
            <button
              key={idx}
              id={`jump-question-btn-${idx + 1}`}
              onClick={() => {
                playClickSound();
                setCurrentIdx(idx);
              }}
              className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center justify-center border shadow-xs ${
                isCurrent
                  ? 'bg-gradient-to-b from-[var(--gold-light,#E5C158)] to-[var(--gold,#D4AF37)] text-black border-[var(--gold)] scale-110 shadow-[0_4px_14px_rgba(212,175,55,0.4),inset_0_1px_0_rgba(255,255,255,0.4)]'
                  : isAnswered
                  ? 'bg-gradient-to-b from-[#22C55E]/20 to-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/40 shadow-inner'
                  : 'bg-gradient-to-b from-[#1A1A1A] to-[#131313] text-[#777777] border-white/[0.06] hover:text-white hover:border-white/[0.15]'
              }`}
              title={`Question ${idx + 1} ${isAnswered ? '(Answered)' : '(Unanswered)'}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 p-4 rounded-2xl text-xs text-[#EF4444] flex items-center gap-2.5 font-mono shadow-inner">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Current Question Paper Card */}
      {currentQuestion && (
        <div className="bg-gradient-to-b from-[#181818] to-[#111111] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] space-y-6 relative">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
            <span className="font-mono font-bold text-xs uppercase bg-gradient-to-b from-[#222222] to-[#161616] border border-white/[0.1] text-[var(--gold)] px-3 py-1.5 rounded-xl tracking-wider shadow-xs">
              Question {currentIdx + 1} of {totalQuestions}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777]">
              Press <kbd className="px-1.5 py-0.5 bg-[#181818] border border-white/[0.1] text-white rounded-md">A</kbd> <kbd className="px-1.5 py-0.5 bg-[#181818] border border-white/[0.1] text-white rounded-md">B</kbd> <kbd className="px-1.5 py-0.5 bg-[#181818] border border-white/[0.1] text-white rounded-md">C</kbd> <kbd className="px-1.5 py-0.5 bg-[#181818] border border-white/[0.1] text-white rounded-md">D</kbd> or click
            </span>
          </div>

          {/* Question Text */}
          <h3 className="font-serif italic text-lg sm:text-xl text-white leading-relaxed">
            {currentQuestion.question}
          </h3>

          {/* 4 Choices */}
          <div className="space-y-3 pt-2">
            {currentQuestion.options.map((opt, oi) => {
              const isSelected = answers[currentIdx] === oi;
              const letter = String.fromCharCode(65 + oi);

              return (
                <div
                  key={oi}
                  id={`choice-option-${oi}`}
                  onClick={() => selectOption(oi)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center gap-4 ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#222222] to-[#161616] border-[var(--gold)] shadow-[0_6px_20px_rgba(212,175,55,0.2),inset_0_1px_0_rgba(255,255,255,0.12)]'
                      : 'bg-gradient-to-b from-[#141414] to-[#0E0E0E] border-white/[0.06] hover:bg-gradient-to-b hover:from-[#1C1C1C] hover:to-[#141414] hover:border-white/[0.14] shadow-[0_4px_12px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs border ${
                      isSelected
                        ? 'bg-gradient-to-b from-[var(--gold-light,#E5C158)] to-[var(--gold,#D4AF37)] text-black border-[var(--gold)] shadow-sm'
                        : 'bg-[#181818] text-[#888888] border-white/[0.08]'
                    }`}
                  >
                    {letter}
                  </div>
                  <span className="text-sm sm:text-base text-white flex-1 leading-snug font-light">
                    {opt}
                  </span>
                  {isSelected && <Check className="w-5 h-5 text-[var(--gold)] shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-white/[0.07] pt-5">
            <button
              id="prev-question-btn"
              disabled={currentIdx === 0}
              onClick={() => {
                playClickSound();
                setCurrentIdx((prev) => Math.max(0, prev - 1));
              }}
              className="px-5 py-2.5 bg-gradient-to-b from-[#202020] to-[#151515] hover:from-[#282828] hover:to-[#1C1C1C] border border-white/[0.08] rounded-xl text-xs font-mono uppercase tracking-wider text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] active:scale-98"
            >
              &larr; Previous
            </button>

            {currentIdx < totalQuestions - 1 ? (
              <button
                id="next-question-btn"
                onClick={() => {
                  playClickSound();
                  setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1));
                }}
                className="px-5 py-2.5 bg-gradient-to-b from-[var(--gold-light,#E5C158)] to-[var(--gold,#D4AF37)] hover:brightness-110 text-black rounded-xl text-xs font-mono font-semibold uppercase tracking-wider cursor-pointer shadow-[0_4px_14px_rgba(212,175,55,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] active:scale-98"
              >
                Next &rarr;
              </button>
            ) : (
              <button
                id="submit-exam-answers-btn"
                onClick={handleSubmit}
                className="px-7 py-3 bg-gradient-to-b from-[var(--gold-light,#E5C158)] to-[var(--gold,#D4AF37)] hover:brightness-110 text-black rounded-2xl text-xs font-mono font-bold uppercase tracking-widest cursor-pointer shadow-[0_8px_24px_rgba(212,175,55,0.35),inset_0_1px_0_rgba(255,255,255,0.45)] flex items-center gap-2 active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Submit Final Check-In</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
