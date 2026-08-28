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
      <div className="bg-[#121212] border border-[#1F1F1F] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <button
            onClick={() => {
              if (window.confirm('Leave check-in? Your answers will not be saved.')) {
                onCancel();
              }
            }}
            className="text-[11px] font-mono uppercase tracking-widest text-[#888888] hover:text-[#EF4444] inline-flex items-center gap-1 mb-1 cursor-pointer transition"
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
          <div className="font-mono text-xs font-semibold text-[#D4AF37] bg-[#161616] border border-[#1F1F1F] px-3.5 py-1.5 rounded-lg">
            {answeredCount} / {totalQuestions} Answered
          </div>
        </div>
      </div>

      {/* Question Jump Ribbon */}
      <div className="bg-[#121212] border border-[#1F1F1F] p-3 rounded-xl flex flex-wrap gap-1.5 justify-center shadow-md">
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
              className={`w-7 h-7 rounded-md text-xs font-mono font-bold transition cursor-pointer flex items-center justify-center border ${
                isCurrent
                  ? 'bg-[#D4AF37] text-[#0A0A0A] border-[#D4AF37] scale-110 shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                  : isAnswered
                  ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/40'
                  : 'bg-[#161616] text-[#666666] border-[#1F1F1F] hover:text-white hover:border-[#333333]'
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
        <div className="bg-[#EF4444]/10 border-l-2 border-[#EF4444] p-3.5 rounded-r-lg text-xs text-[#EF4444] flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Current Question Paper Card */}
      {currentQuestion && (
        <div className="bg-[#121212] border border-[#1F1F1F] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
          <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4">
            <span className="font-mono font-bold text-xs uppercase bg-[#161616] border border-[#1F1F1F] text-[#D4AF37] px-2.5 py-1 rounded-md tracking-wider">
              Question {currentIdx + 1} of {totalQuestions}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666]">
              Press <kbd className="px-1.5 py-0.5 bg-[#161616] border border-[#1F1F1F] text-white rounded-sm">A</kbd> <kbd className="px-1.5 py-0.5 bg-[#161616] border border-[#1F1F1F] text-white rounded-sm">B</kbd> <kbd className="px-1.5 py-0.5 bg-[#161616] border border-[#1F1F1F] text-white rounded-sm">C</kbd> <kbd className="px-1.5 py-0.5 bg-[#161616] border border-[#1F1F1F] text-white rounded-sm">D</kbd> or click
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
                  className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer flex items-center gap-3.5 ${
                    isSelected
                      ? 'bg-[#161616] border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                      : 'bg-[#0A0A0A] border-[#1F1F1F] hover:bg-[#161616] hover:border-[#333333]'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center font-mono font-bold text-xs border ${
                      isSelected
                        ? 'bg-[#D4AF37] text-[#0A0A0A] border-[#D4AF37]'
                        : 'bg-[#161616] text-[#888888] border-[#1F1F1F]'
                    }`}
                  >
                    {letter}
                  </div>
                  <span className="text-sm sm:text-base text-white flex-1 leading-snug font-light">
                    {opt}
                  </span>
                  {isSelected && <Check className="w-5 h-5 text-[#D4AF37] shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-[#1F1F1F] pt-5">
            <button
              id="prev-question-btn"
              disabled={currentIdx === 0}
              onClick={() => {
                playClickSound();
                setCurrentIdx((prev) => Math.max(0, prev - 1));
              }}
              className="px-4 py-2 bg-[#161616] border border-[#1F1F1F] rounded-lg text-xs font-mono uppercase tracking-wider text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#333333] cursor-pointer"
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
                className="px-4 py-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0A0A] rounded-lg text-xs font-mono font-semibold uppercase tracking-wider cursor-pointer shadow-sm"
              >
                Next &rarr;
              </button>
            ) : (
              <button
                id="submit-exam-answers-btn"
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0A0A] rounded-lg text-xs font-mono font-bold uppercase tracking-widest cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Final Check-In</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
