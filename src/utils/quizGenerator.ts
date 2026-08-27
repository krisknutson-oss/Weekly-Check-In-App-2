import { Question } from '../types';

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

    // Distribute correct option across 0..3
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

    questions.push({
      id: `q_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      question: `Regarding ${title || 'the lesson presentation'}: Which statement correctly summarizes "${cleanPrompt}"?`,
      options: finalOptions,
      correctIndex: correctIdx,
      explanation: `According to the presentation slides, "${primaryFact.slice(0, 90)}" represents the verified understanding.`,
    });
  }

  return questions;
}
