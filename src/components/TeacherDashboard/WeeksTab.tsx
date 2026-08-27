import React, { useState } from 'react';
import { ClassroomState, Question, Week, WeekStatus } from '../../types';
import { extractPptxText } from '../../utils/pptx';
import { SAMPLE_DECKS } from '../../utils/sampleDecks';
import { uid, saveClassroomState } from '../../utils/storage';
import { playClickSound, playStampSound, playSuccessChime } from '../../utils/sound';
import { 
  Plus, 
  Upload, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  Send, 
  BookOpen, 
  Wand2, 
  RefreshCw, 
  FileUp, 
  Layers 
} from 'lucide-react';

interface WeeksTabProps {
  state: ClassroomState;
  onUpdateState: (newState: ClassroomState) => void;
}

export const WeeksTab: React.FC<WeeksTabProps> = ({ state, onUpdateState }) => {
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(
    state.weeks.length > 0 ? state.weeks[0].id : null
  );
  const [newTitle, setNewTitle] = useState('');
  const [newUnitGoal, setNewUnitGoal] = useState('');
  const [isAddingWeek, setIsAddingWeek] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [topicPrompt, setTopicPrompt] = useState('');
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [armedDeleteWeekId, setArmedDeleteWeekId] = useState<string | null>(null);

  const selectedWeek = state.weeks.find((w) => w.id === selectedWeekId) || null;

  // Create empty week module
  const handleCreateWeek = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newWeek: Week = {
      id: uid('wk'),
      title: newTitle.trim(),
      unitTitle: newUnitGoal.trim() || state.className,
      slideText: '',
      quiz: [],
      status: 'no-slides',
      createdAt: Date.now(),
    };

    const updatedState: ClassroomState = {
      ...state,
      weeks: [...state.weeks, newWeek],
    };

    saveClassroomState(updatedState);
    onUpdateState(updatedState);
    setSelectedWeekId(newWeek.id);
    setNewTitle('');
    setNewUnitGoal('');
    setIsAddingWeek(false);
    playSuccessChime();
  };

  // Upload PPTX and extract text + generate 20 questions via server Gemini
  const handlePptxUpload = async (file: File, week: Week) => {
    setIsProcessing(true);
    setErrorMessage('');
    setProcessingStatus('Reading PowerPoint slides & extracting text…');

    try {
      const { text, slideCount } = await extractPptxText(file);
      setProcessingStatus(`Extracted ${slideCount} slides! Authoring 20 questions with Gemini 3.7 Flash…`);

      // Call backend
      const res = await fetch('/api/quiz/generate-from-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideText: text,
          weekTitle: week.title,
          unitGoal: state.unitGoal,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate quiz from server.');
      }

      const data = await res.json();
      const generatedQuiz: Question[] = data.questions;

      const updatedWeek: Week = {
        ...week,
        slideText: text,
        sourceFileName: file.name,
        quiz: generatedQuiz,
        status: 'draft',
      };

      const updatedWeeks = state.weeks.map((w) => (w.id === week.id ? updatedWeek : w));
      const updatedState = { ...state, weeks: updatedWeeks };

      saveClassroomState(updatedState);
      onUpdateState(updatedState);
      playSuccessChime();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error processing PPTX file. Please check file format.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Generate complete week & quiz from a custom topic prompt
  const handleGenerateFromTopic = async () => {
    if (!topicPrompt.trim() || !selectedWeek) return;

    setIsProcessing(true);
    setErrorMessage('');
    setProcessingStatus(`Generating curriculum outline and 20 questions for "${topicPrompt}"…`);

    try {
      const res = await fetch('/api/quiz/generate-from-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicPrompt.trim() }),
      });

      if (!res.ok) {
        throw new Error('Server topic generation error.');
      }

      const data = await res.json();

      const updatedWeek: Week = {
        ...selectedWeek,
        title: selectedWeek.title || data.title || topicPrompt,
        slideText: data.slideText,
        quiz: data.questions,
        status: 'draft',
      };

      const updatedWeeks = state.weeks.map((w) => (w.id === selectedWeek.id ? updatedWeek : w));
      const updatedState = { ...state, weeks: updatedWeeks };

      saveClassroomState(updatedState);
      onUpdateState(updatedState);
      setShowTopicModal(false);
      setTopicPrompt('');
      playSuccessChime();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate topic quiz.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Load a rich sample deck into the selected week
  const handleLoadSampleDeck = (sampleIndex: number, week: Week) => {
    const sample = SAMPLE_DECKS[sampleIndex % SAMPLE_DECKS.length];
    const updatedWeek: Week = {
      ...week,
      title: week.title || sample.title,
      unitTitle: sample.unitTitle,
      slideText: sample.slideText,
      quiz: sample.quiz.map((q, i) => ({ ...q, id: uid(`q_${i}`) })),
      status: 'draft',
    };

    const updatedWeeks = state.weeks.map((w) => (w.id === week.id ? updatedWeek : w));
    const updatedState = { ...state, weeks: updatedWeeks };

    saveClassroomState(updatedState);
    onUpdateState(updatedState);
    playSuccessChime();
  };

  // Save Quiz changes or Toggle Publish
  const handlePublishWeek = (week: Week, newStatus: WeekStatus) => {
    playStampSound();
    const updatedWeek: Week = {
      ...week,
      status: newStatus,
    };

    const updatedWeeks = state.weeks.map((w) => (w.id === week.id ? updatedWeek : w));
    const updatedState = { ...state, weeks: updatedWeeks };

    saveClassroomState(updatedState);
    onUpdateState(updatedState);
  };

  // Delete week
  const handleDeleteWeek = (weekId: string) => {
    if (armedDeleteWeekId === weekId) {
      playStampSound();
      const updatedResults = { ...state.results };
      Object.keys(updatedResults).forEach((sId) => {
        delete updatedResults[sId][weekId];
      });

      const updatedWeeks = state.weeks.filter((w) => w.id !== weekId);
      const updatedState: ClassroomState = {
        ...state,
        weeks: updatedWeeks,
        results: updatedResults,
      };

      saveClassroomState(updatedState);
      onUpdateState(updatedState);
      setSelectedWeekId(updatedWeeks.length > 0 ? updatedWeeks[0].id : null);
      setArmedDeleteWeekId(null);
    } else {
      playClickSound();
      setArmedDeleteWeekId(weekId);
      setTimeout(() => {
        setArmedDeleteWeekId((prev) => (prev === weekId ? null : prev));
      }, 3500);
    }
  };

  // Question editing handlers
  const updateQuestionText = (qi: number, text: string) => {
    if (!selectedWeek) return;
    const newQuiz = [...selectedWeek.quiz];
    newQuiz[qi].question = text;
    updateSelectedWeekQuiz(newQuiz);
  };

  const updateOptionText = (qi: number, oi: number, text: string) => {
    if (!selectedWeek) return;
    const newQuiz = [...selectedWeek.quiz];
    const newOptions = [...newQuiz[qi].options] as [string, string, string, string];
    newOptions[oi] = text;
    newQuiz[qi].options = newOptions;
    updateSelectedWeekQuiz(newQuiz);
  };

  const updateCorrectIndex = (qi: number, oi: number) => {
    if (!selectedWeek) return;
    const newQuiz = [...selectedWeek.quiz];
    newQuiz[qi].correctIndex = oi;
    updateSelectedWeekQuiz(newQuiz);
  };

  const updateSelectedWeekQuiz = (quiz: Question[]) => {
    if (!selectedWeek) return;
    const updatedWeek = { ...selectedWeek, quiz };
    const updatedWeeks = state.weeks.map((w) => (w.id === selectedWeek.id ? updatedWeek : w));
    const updatedState = { ...state, weeks: updatedWeeks };
    saveClassroomState(updatedState);
    onUpdateState(updatedState);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <h2 className="font-serif italic text-2xl text-white">
            Weekly Modules &amp; Slide Quizzes<span className="text-[#D4AF37]">.</span>
          </h2>
          <p className="text-xs font-mono uppercase tracking-widest text-[#666666] mt-1">
            Turn weekly PowerPoint presentations into 20-question comprehension check-ins.
          </p>
        </div>

        <button
          id="create-new-week-btn"
          onClick={() => {
            playClickSound();
            setIsAddingWeek(!isAddingWeek);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0A0A] rounded-xs text-xs font-mono font-semibold uppercase tracking-wider transition cursor-pointer shadow-[0_0_12px_rgba(212,175,55,0.2)] self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Week</span>
        </button>
      </div>

      {/* Add Week Form Drawer */}
      {isAddingWeek && (
        <form onSubmit={handleCreateWeek} className="bg-[#161616] border border-[#1F1F1F] rounded-xs p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-serif italic text-lg text-white">
              Create New Weekly Module<span className="text-[#D4AF37]">.</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingWeek(false)}
              className="text-xs font-mono uppercase tracking-wider text-[#666666] hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-mono text-[#888888] mb-1.5" htmlFor="week-title-input">
                Week &amp; Topic Title
              </label>
              <input
                id="week-title-input"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Week 3: Cell Biology &amp; Mitosis"
                className="w-full px-3.5 py-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-xs text-sm text-white focus:outline-none focus:border-[#D4AF37] transition"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-mono text-[#888888] mb-1.5" htmlFor="week-unit-input">
                Unit Goal / Category (Optional)
              </label>
              <input
                id="week-unit-input"
                type="text"
                value={newUnitGoal}
                onChange={(e) => setNewUnitGoal(e.target.value)}
                placeholder="e.g. Unit 3: Cellular Foundations"
                className="w-full px-3.5 py-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-xs text-sm text-white focus:outline-none focus:border-[#D4AF37] transition"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              id="confirm-create-week-btn"
              className="px-4 py-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0A0A] rounded-xs text-xs font-mono font-semibold uppercase tracking-wider cursor-pointer"
            >
              Create Module &amp; Add Slides
            </button>
          </div>
        </form>
      )}

      {/* Week Selector Ribbon */}
      {state.weeks.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#1F1F1F]">
          {state.weeks.map((week, idx) => {
            const isSelected = week.id === selectedWeekId;
            return (
              <button
                key={week.id}
                id={`select-week-tab-${week.id}`}
                onClick={() => {
                  playClickSound();
                  setSelectedWeekId(week.id);
                  setErrorMessage('');
                }}
                className={`px-4 py-2 rounded-t-xs text-xs font-mono uppercase tracking-wider whitespace-nowrap transition cursor-pointer flex items-center gap-2 border-t border-x ${
                  isSelected
                    ? 'bg-[#161616] border-[#D4AF37]/50 text-[#D4AF37] shadow-sm'
                    : 'bg-[#0A0A0A] border-[#1F1F1F] text-[#666666] hover:text-white hover:border-[#333333]'
                }`}
              >
                <span>W{idx + 1}: {week.title.length > 22 ? `${week.title.slice(0, 22)}…` : week.title}</span>
                {week.status === 'published' ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" title="Published" />
                ) : week.status === 'draft' ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" title="Draft" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" title="Awaiting Slides" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Week Content Display */}
      {!selectedWeek ? (
        <div className="border border-dashed border-[#1F1F1F] rounded-xs p-10 text-center bg-[#161616]">
          <BookOpen className="w-10 h-10 text-[#666666] mx-auto mb-2" />
          <h4 className="font-serif italic text-lg text-white mb-1">
            No weekly modules created yet
          </h4>
          <p className="text-xs text-[#888888] max-w-md mx-auto mb-4 font-light">
            Create your first week to upload a PowerPoint slide deck and generate this week's check-in quiz.
          </p>
          <button
            onClick={() => setIsAddingWeek(true)}
            className="px-4 py-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0A0A] rounded-xs text-xs font-mono font-semibold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Week 1</span>
          </button>
        </div>
      ) : (
        <div className="bg-[#161616] border border-[#1F1F1F] rounded-xs p-6 space-y-6">
          {/* Header of selected week */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F1F1F] pb-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-serif italic text-2xl text-white">
                  {selectedWeek.title}
                </h3>
                {selectedWeek.status === 'published' ? (
                  <span className="bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs">
                    PUBLISHED ✓
                  </span>
                ) : selectedWeek.status === 'draft' ? (
                  <span className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs">
                    DRAFT (Review &amp; Publish)
                  </span>
                ) : (
                  <span className="bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs">
                    AWAITING SLIDES
                  </span>
                )}
              </div>
              <span className="text-xs text-[#888888] font-mono mt-1 block">
                {selectedWeek.quiz.length} Questions &middot; {selectedWeek.sourceFileName ? `Source: ${selectedWeek.sourceFileName}` : 'Generated Presentation'}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {selectedWeek.quiz.length > 0 && (
                <button
                  id="preview-student-quiz-btn"
                  onClick={() => setPreviewModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#121212] border border-[#1F1F1F] hover:border-[#333333] text-white rounded-xs text-xs font-mono uppercase tracking-wider transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Preview Student Quiz</span>
                </button>
              )}

              <button
                id={`del-week-${selectedWeek.id}`}
                onClick={() => handleDeleteWeek(selectedWeek.id)}
                className={`px-3 py-1.5 rounded-xs text-xs font-mono uppercase tracking-wider border transition cursor-pointer ${
                  armedDeleteWeekId === selectedWeek.id
                    ? 'bg-[#EF4444] text-white border-[#EF4444] animate-pulse'
                    : 'bg-transparent text-[#666666] border-[#1F1F1F] hover:text-[#EF4444]'
                }`}
              >
                {armedDeleteWeekId === selectedWeek.id ? 'Confirm Delete' : 'Delete'}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-[#EF4444]/10 border-l-2 border-[#EF4444] p-3.5 rounded-r-xs text-xs text-[#EF4444] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Processing Banner */}
          {isProcessing && (
            <div className="bg-[#121212] border border-[#D4AF37]/40 p-8 rounded-xs text-center space-y-3 shadow-[0_0_25px_rgba(212,175,55,0.1)]">
              <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto" />
              <h4 className="font-serif italic text-lg text-white">
                Gemini 3.7 Flash AI Curriculum Engine<span className="text-[#D4AF37]">.</span>
              </h4>
              <p className="text-xs font-mono text-[#888888]">
                {processingStatus}
              </p>
            </div>
          )}

          {/* STATE: No Slides Uploaded Yet */}
          {!isProcessing && (selectedWeek.status === 'no-slides' || selectedWeek.quiz.length === 0) && (
            <div className="space-y-6">
              {/* Drag & Drop Box */}
              <div
                id="dropzone-pptx-container"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handlePptxUpload(e.dataTransfer.files[0], selectedWeek);
                  }
                }}
                className="border border-dashed border-[#1F1F1F] hover:border-[#D4AF37]/60 rounded-xs p-8 md:p-12 text-center bg-[#121212] hover:bg-[#161616] transition-all duration-300 cursor-pointer flex flex-col items-center justify-center group shadow-lg"
              >
                <div className="w-14 h-14 rounded-full bg-[#161616] border border-[#1F1F1F] flex items-center justify-center text-[#D4AF37] mb-3 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                  <FileUp className="w-7 h-7" />
                </div>
                <h4 className="font-serif italic text-2xl text-white mb-1.5">
                  Upload this week's presentation (.pptx)
                </h4>
                <p className="text-xs text-[#888888] max-w-md mb-6 leading-relaxed font-light">
                  Drag and drop your PowerPoint slide deck here. Our system will extract the slides and use Gemini 3.7 Flash to author a rigorous 20-question multiple-choice check-in.
                </p>

                <label
                  htmlFor="file-upload-input"
                  className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0A0A] rounded-xs text-xs font-mono font-semibold uppercase tracking-wider cursor-pointer inline-flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                >
                  <Upload className="w-4 h-4 text-[#0A0A0A]" />
                  <span>Choose .PPTX File</span>
                </label>
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".pptx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handlePptxUpload(e.target.files[0], selectedWeek);
                    }
                  }}
                />
              </div>

              {/* Alternative Quick-Start Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AI Topic Prompt */}
                <div className="bg-[#121212] border border-[#1F1F1F] hover:border-[#333333] rounded-xs p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-1.5">
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Option A: Generate from Topic</span>
                    </div>
                    <h5 className="font-serif italic text-lg text-white mb-1">
                      No slides file handy?
                    </h5>
                    <p className="text-xs text-[#888888] leading-relaxed mb-4 font-light">
                      Type any lesson topic (e.g. "Photosynthesis", "The Great Depression", "Newtonian Physics") to have Gemini create the presentation slides and 20 check-in questions instantly.
                    </p>
                  </div>
                  <button
                    id="open-topic-generator-btn"
                    onClick={() => {
                      playClickSound();
                      setShowTopicModal(true);
                    }}
                    className="w-full py-2.5 bg-[#161616] border border-[#1F1F1F] hover:border-[#D4AF37] text-white hover:text-[#D4AF37] rounded-xs text-xs font-mono uppercase tracking-widest cursor-pointer flex items-center justify-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Generate via AI Prompt</span>
                  </button>
                </div>

                {/* Sample Prebuilt Decks */}
                <div className="bg-[#121212] border border-[#1F1F1F] hover:border-[#333333] rounded-xs p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#22C55E] mb-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Option B: Pre-built Lesson Decks</span>
                    </div>
                    <h5 className="font-serif italic text-lg text-white mb-1">
                      Load Verified Curriculum
                    </h5>
                    <p className="text-xs text-[#888888] leading-relaxed mb-4 font-light">
                      Choose from fully authored 20-question decks with complete answer keys to explore and test the classroom system immediately.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadSampleDeck(0, selectedWeek)}
                      className="flex-1 py-2 px-2 bg-[#161616] border border-[#1F1F1F] hover:border-[#333333] text-white rounded-xs text-[11px] font-mono uppercase tracking-wider cursor-pointer text-center"
                    >
                      Astronomy Deck
                    </button>
                    <button
                      onClick={() => handleLoadSampleDeck(1, selectedWeek)}
                      className="flex-1 py-2 px-2 bg-[#161616] border border-[#1F1F1F] hover:border-[#333333] text-white rounded-xs text-[11px] font-mono uppercase tracking-wider cursor-pointer text-center"
                    >
                      History Deck
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STATE: Slides Uploaded & Quiz Available (Draft or Published) */}
          {!isProcessing && selectedWeek.quiz.length > 0 && (
            <div className="space-y-6">
              {/* Publication / Status Action Bar */}
              <div className="bg-[#121212] border border-[#1F1F1F] p-5 rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#888888] block">
                    Current Module State
                  </span>
                  <span className="font-serif italic text-lg text-white">
                    {selectedWeek.status === 'published'
                      ? 'Live on Student Dashboards'
                      : 'Draft — Ready for Review & Verification'}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {selectedWeek.status === 'published' ? (
                    <button
                      id="unpublish-week-btn"
                      onClick={() => handlePublishWeek(selectedWeek, 'draft')}
                      className="px-4 py-2 bg-[#161616] border border-[#EF4444]/40 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-xs text-xs font-mono uppercase tracking-wider transition cursor-pointer"
                    >
                      Unpublish (Revert to Draft)
                    </button>
                  ) : (
                    <button
                      id="publish-week-btn"
                      onClick={() => handlePublishWeek(selectedWeek, 'published')}
                      className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0A0A] rounded-xs text-xs font-mono font-semibold uppercase tracking-widest transition cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.25)] flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5 text-[#0A0A0A]" />
                      <span>Publish Check-In to Students</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 20-Question Editor List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif italic text-xl text-white">
                    Quiz Editor ({selectedWeek.quiz.length} Questions)<span className="text-[#D4AF37]">.</span>
                  </h4>
                  <span className="text-xs text-[#888888] font-mono">
                    Select the radio button to designate the correct answer.
                  </span>
                </div>

                {selectedWeek.quiz.map((q, qi) => (
                  <div
                    key={q.id || qi}
                    className="bg-[#121212] border border-[#1F1F1F] rounded-xs p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-[#0A0A0A] border border-[#1F1F1F] text-[#D4AF37] px-2 py-0.5 rounded-xs">
                          Q{qi + 1}
                        </span>
                        <span className="text-[10px] text-[#888888] font-mono uppercase tracking-wider">
                          Question Prompt:
                        </span>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => updateQuestionText(qi, e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-xs text-sm text-white focus:outline-none focus:border-[#D4AF37] font-medium"
                    />

                    {/* Options Grid */}
                    <div className="space-y-2 pt-1">
                      {q.options.map((opt, oi) => {
                        const isCorrect = oi === q.correctIndex;
                        return (
                          <div
                            key={oi}
                            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xs border transition ${
                              isCorrect
                                ? 'bg-[#22C55E]/10 border-[#22C55E]/40'
                                : 'bg-[#161616] border-[#1F1F1F] hover:border-[#333333]'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct-radio-${selectedWeek.id}-${qi}`}
                              checked={isCorrect}
                              onChange={() => updateCorrectIndex(qi, oi)}
                              className="accent-[#22C55E] w-4 h-4 cursor-pointer"
                              title="Set as correct answer"
                            />
                            <span className="font-mono text-xs font-bold text-[#888888] w-4">
                              {String.fromCharCode(65 + oi)}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateOptionText(qi, oi, e.target.value)}
                              className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none"
                            />
                            {isCorrect && (
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#22C55E] bg-[#22C55E]/20 px-1.5 py-0.5 rounded-xs">
                                Correct Key
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="text-xs text-[#888888] bg-[#161616] p-2.5 rounded-xs border border-[#1F1F1F] font-light">
                        <span className="font-mono text-[#D4AF37] uppercase text-[10px] tracking-wider block mb-0.5">Explanation:</span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Topic Prompt Modal */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-xs max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="font-serif italic text-2xl text-white">
                Generate Lesson Quiz from Topic<span className="text-[#D4AF37]">.</span>
              </h3>
            </div>
            <p className="text-xs text-[#888888] leading-relaxed font-light">
              Enter any standard curriculum subject or custom lesson topic. Gemini 3.7 Flash will author comprehensive lesson material and 20 multiple-choice questions automatically.
            </p>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-mono text-[#888888] mb-1.5" htmlFor="topic-input-field">
                Lesson Topic or Standard
              </label>
              <input
                id="topic-input-field"
                type="text"
                value={topicPrompt}
                onChange={(e) => setTopicPrompt(e.target.value)}
                placeholder="e.g. World War II: The European Theater, 1939–1945"
                className="w-full px-3.5 py-2.5 bg-[#161616] border border-[#1F1F1F] rounded-xs text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowTopicModal(false)}
                className="px-4 py-2 bg-[#161616] border border-[#1F1F1F] text-[#888888] hover:text-white rounded-xs text-xs font-mono uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-topic-generation-btn"
                onClick={handleGenerateFromTopic}
                className="px-4 py-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0A0A] font-semibold rounded-xs text-xs font-mono uppercase tracking-widest cursor-pointer flex items-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5 text-[#0A0A0A]" />
                <span>Generate Curriculum &amp; Quiz</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Quiz Preview Modal */}
      {previewModalOpen && selectedWeek && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-xs max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-[#1F1F1F] flex items-center justify-between bg-[#161616]">
              <div>
                <span className="text-[9px] font-mono text-[#D4AF37] font-bold uppercase tracking-[0.2em] block">
                  Student View Preview
                </span>
                <h3 className="font-serif italic text-xl text-white">
                  {selectedWeek.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-3.5 py-1.5 bg-[#121212] border border-[#1F1F1F] hover:border-[#333333] text-white rounded-xs text-xs font-mono uppercase tracking-wider cursor-pointer"
              >
                Close Preview
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 bg-[#0A0A0A]">
              {selectedWeek.quiz.map((q, qi) => (
                <div key={qi} className="bg-[#121212] border border-[#1F1F1F] rounded-xs p-5">
                  <p className="font-medium text-sm text-white mb-3">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className="px-3.5 py-2 bg-[#161616] border border-[#1F1F1F] rounded-xs text-xs text-[#E0E0E0] flex items-center gap-2.5"
                      >
                        <span className="font-mono font-bold text-[#888888]">
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
