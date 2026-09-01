import { Question } from '../types';

/**
 * Shuffles the answer options (A, B, C, D) for a single question and updates the correctIndex
 */
export function shuffleQuestionOptions<T extends { options: [string, string, string, string] | string[]; correctIndex: number }>(q: T): T {
  const originalOptions = [...q.options];
  const validCorrectIdx =
    typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < originalOptions.length
      ? q.correctIndex
      : 0;
  const correctText = originalOptions[validCorrectIdx];

  // Fisher-Yates shuffle array of indices
  const indices = originalOptions.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const shuffledOptions = indices.map((idx) => originalOptions[idx]) as [string, string, string, string];
  const newCorrectIndex = shuffledOptions.indexOf(correctText);

  return {
    ...q,
    options: shuffledOptions,
    correctIndex: newCorrectIndex !== -1 ? newCorrectIndex : 0,
  };
}

/**
 * Shuffles/randomizes the answer choices for an entire array of questions
 */
export function randomizeQuizOptions(quiz: Question[]): Question[] {
  return quiz.map((q) => shuffleQuestionOptions(q));
}

/**
 * Client-side heuristic quiz generator for offline/static deployment (e.g. GitHub Pages)
 * Extracts key sentences, concepts, and terms from slide text and builds 20 multiple choice questions.
 */
export function generateClientFallbackQuestions(text: string, title: string): Question[] {
  const rawSegments = text
    .split(/[\n•\-–—;]+|\.\s+/)
    .map((s) => s.replace(/^\[Slide \d+\]\s*/i, '').trim())
    .filter((s) => s.length >= 15 && !s.toLowerCase().startsWith('slide '));

  const count = 20;
  const questions: Question[] = [];
  const segments = rawSegments.length > 0 ? rawSegments : [`Foundational overview of ${title || 'this topic'}`];

  for (let i = 0; i < count; i++) {
    const primaryFact = segments[i % segments.length];
    const secondaryFact = segments[(i + 1) % segments.length] || 'standard core principles';
    const cleanPrompt = primaryFact.length > 110 ? `${primaryFact.slice(0, 110)}...` : primaryFact;

    // Distribute correct option across 0..3 initially
    const correctIdx = i % 4;
    const correctOption = `It accurately describes: "${primaryFact.slice(0, 80)}${primaryFact.length > 80 ? '...' : ''}"`;
    const distractor1 = `It applies exclusively under extreme experimental conditions rather than typical scenarios`;
    const distractor2 = `It represents an early hypothetical conjecture that was replaced in modern study`;
    const distractor3 = `It describes ${secondaryFact.slice(0, 50)} rather than the primary concept`;

    const options: string[] = [];
    let distractorIdx = 0;
    const distractors = [distractor1, distractor2, distractor3];

    for (let optIdx = 0; optIdx < 4; optIdx++) {
      if (optIdx === correctIdx) {
        options.push(correctOption);
      } else {
        options.push(distractors[distractorIdx++ % distractors.length]);
      }
    }

    const finalOptions: [string, string, string, string] = [
      options[0] || 'Option A',
      options[1] || 'Option B',
      options[2] || 'Option C',
      options[3] || 'Option D',
    ];

    const rawQuestion: Question = {
      id: `q_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      question: `Regarding ${title || 'the lesson presentation'}: Which statement correctly summarizes "${cleanPrompt}"?`,
      options: finalOptions,
      correctIndex: correctIdx,
      explanation: `According to the presentation slides, "${primaryFact.slice(0, 90)}" represents the verified understanding.`,
    };

    questions.push(shuffleQuestionOptions(rawQuestion));
  }

  return questions;
}
