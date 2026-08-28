import React from 'react';
import { ClassroomState, QuizSubmission, Student, Week } from '../../types';
import { playClickSound } from '../../utils/sound';
import { CheckCircle2, Play, Eye, BookOpen, Sparkles } from 'lucide-react';

interface StudentHomeProps {
  state: ClassroomState;
  student: Student;
  onStartQuiz: (week: Week) => void;
  onViewFeedback: (week: Week) => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({
  state,
  student,
  onStartQuiz,
  onViewFeedback,
}) => {
  const publishedWeeks = state.weeks.filter((w) => w.status === 'published');
  const studentResults = state.results[student.id] || {};

  const completedCount = publishedWeeks.filter((w) => Boolean(studentResults[w.id])).length;
  const submissionsList: QuizSubmission[] = Object.values(studentResults);

  const overallAverage =
    submissionsList.length > 0
      ? Math.round(
          submissionsList.reduce((acc: number, sub: QuizSubmission) => acc + (sub.score / sub.total) * 100, 0) /
            submissionsList.length
        )
      : null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Student Welcome Banner */}
      <div className="bg-[#121212] border border-[#1F1F1F] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-black font-bold bg-[#D4AF37] inline-block px-2.5 py-1 rounded-md mb-2">
            Student Weekly Ledger
          </span>
          <h2 className="font-serif italic text-3xl text-white">
            Welcome back, {student.name}<span className="text-[#888888]">.</span>
          </h2>
          <p className="text-xs text-[#888888] mt-1 font-mono">
            {completedCount} of {publishedWeeks.length} weekly check-ins completed &middot; Culminating Activity:{' '}
            <strong className="text-white font-medium">{state.culminatingActivityTitle}</strong>
          </p>
        </div>

        {/* High-Contrast Score Stamp */}
        {overallAverage !== null && (
          <div className="ledger-stamp w-28 h-28 rounded-full border border-dashed border-[#D4AF37] flex flex-col items-center justify-center bg-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)] shrink-0 self-center sm:self-auto">
            <span className="font-mono text-3xl font-bold text-black leading-none">
              {overallAverage}%
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-black/80 font-bold mt-1">
              Your Average
            </span>
          </div>
        )}
      </div>

      {/* Available Check-Ins List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-3">
          <h3 className="font-serif italic text-xl text-white">
            Weekly Check-In Quizzes<span className="text-[#888888]">.</span>
          </h3>
          <span className="text-xs font-mono uppercase tracking-wider text-[#666666]">
            Answer all 20 questions each week
          </span>
        </div>

        {publishedWeeks.length === 0 ? (
          <div className="bg-[#121212] border border-dashed border-[#1F1F1F] rounded-2xl p-10 text-center shadow-lg">
            <BookOpen className="w-10 h-10 text-[#666666] mx-auto mb-2" />
            <h4 className="font-serif italic text-lg text-white mb-1">
              No Quizzes Published Yet
            </h4>
            <p className="text-xs text-[#888888] font-light">
              Check back once your teacher publishes this week's 20-question slide check-in.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {publishedWeeks.map((week, idx) => {
              const submission = studentResults[week.id];
              const isCompleted = Boolean(submission);

              return (
                <div
                  key={week.id}
                  className="bg-[#121212] border border-[#1F1F1F] hover:border-[#333333] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-xs bg-[#D4AF37] text-black px-2.5 py-0.5 rounded-md">
                        Week {idx + 1}
                      </span>
                      <h4 className="font-serif italic text-lg text-white">
                        {week.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-[#888888]">
                      <span>{week.quiz.length} Questions</span>
                      <span>&middot;</span>
                      {isCompleted ? (
                        <span className="text-[#22C55E] font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            Completed &middot; Score: {submission.score}/{submission.total} (
                            {Math.round((submission.score / submission.total) * 100)}%)
                          </span>
                        </span>
                      ) : (
                        <span className="text-[#EF4444] font-medium">
                          Not started yet
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-auto">
                    {isCompleted ? (
                      <button
                        id={`review-quiz-btn-${week.id}`}
                        onClick={() => {
                          playClickSound();
                          onViewFeedback(week);
                        }}
                        className="px-4 py-2 bg-[#161616] border border-[#1F1F1F] hover:border-[#555555] text-white hover:text-white rounded-lg text-xs font-mono uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-white" />
                        <span>Review Explanations</span>
                      </button>
                    ) : (
                      <button
                        id={`start-quiz-btn-${week.id}`}
                        onClick={() => {
                          playClickSound();
                          onStartQuiz(week);
                        }}
                        className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#E5C158] text-black rounded-lg text-xs font-mono font-bold uppercase tracking-widest transition cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                      >
                        <Play className="w-3.5 h-3.5 text-black fill-current" />
                        <span>Take Check-In</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Culminating Goal Note */}
      <div className="bg-[#121212] border border-[#1F1F1F] rounded-xl p-5 flex items-start gap-3 shadow-lg">
        <Sparkles className="w-5 h-5 text-white shrink-0 mt-0.5" />
        <div>
          <h5 className="font-serif italic text-sm text-white">
            Why we do weekly check-ins:
          </h5>
          <p className="text-xs text-[#888888] leading-relaxed mt-0.5 font-light">
            Each quiz directly prepares you for the unit culminating activity. Mistakes show you which slide concepts to revisit before the final demonstration.
          </p>
        </div>
      </div>
    </div>
  );
};
