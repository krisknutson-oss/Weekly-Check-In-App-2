import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Lazy initialize Gemini SDK
let genAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAI;
}

// Sleep helper
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Randomize/shuffle answer options (A, B, C, D) and recalculate correctIndex
function shuffleQuestionOptions<T extends { options: any[]; correctIndex: number }>(q: T): T {
  const originalOptions =
    Array.isArray(q.options) && q.options.length === 4
      ? [...q.options]
      : [
          q.options?.[0] || 'Option A',
          q.options?.[1] || 'Option B',
          q.options?.[2] || 'Option C',
          q.options?.[3] || 'Option D',
        ];

  const validCorrectIdx =
    typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < originalOptions.length
      ? q.correctIndex
      : 0;

  const correctText = originalOptions[validCorrectIdx];

  // Fisher-Yates shuffle array of indices [0, 1, 2, 3]
  const indices = [0, 1, 2, 3];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const shuffledOptions = indices.map((idx) => originalOptions[idx]);
  const newCorrectIndex = shuffledOptions.indexOf(correctText);

  return {
    ...q,
    options: shuffledOptions,
    correctIndex: newCorrectIndex !== -1 ? newCorrectIndex : 0,
  };
}

// Helper: Resilient Gemini API caller with exponential backoff, fast failover on 503, and multi-model fallbacks
async function generateContentWithRetryAndFallback(
  ai: GoogleGenAI,
  options: {
    prompt: string;
    systemInstruction?: string;
    responseSchema?: any;
    models?: string[];
    maxRetries?: number;
  }
): Promise<{ text: string; model: string } | null> {
  const models = options.models || ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  const maxRetries = options.maxRetries ?? 2;

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini] Attempting generation with model=${model} (attempt ${attempt}/${maxRetries})`);
        const response = await ai.models.generateContent({
          model,
          contents: options.prompt,
          config: {
            systemInstruction: options.systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: options.responseSchema,
          },
        });

        const text = response.text?.trim();
        if (text) {
          console.log(`[Gemini] Successfully generated content using model=${model}`);
          return { text, model };
        }
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        const is503HighDemand =
          errorMsg.includes('503') ||
          errorMsg.includes('UNAVAILABLE') ||
          errorMsg.includes('high demand') ||
          errorMsg.includes('overloaded');

        const isTransient =
          is503HighDemand ||
          errorMsg.includes('429') ||
          errorMsg.includes('RESOURCE_EXHAUSTED') ||
          errorMsg.includes('fetch failed') ||
          errorMsg.includes('ECONNRESET') ||
          errorMsg.includes('ETIMEDOUT') ||
          errorMsg.includes('500');

        console.log(`[Gemini] Note on model=${model} (attempt ${attempt}/${maxRetries}): ${is503HighDemand ? 'Temporary high demand (503), testing alternative options...' : errorMsg.slice(0, 120)}`);

        // If it's a 503 high demand spike, quickly try 1 short backoff or switch to next model immediately to avoid blocking user
        if (is503HighDemand && attempt === 1) {
          const quickBackoff = 600 + Math.random() * 400;
          await sleep(quickBackoff);
        } else if (isTransient && attempt < maxRetries) {
          const backoff = 800 * Math.pow(1.5, attempt - 1) + Math.random() * 300;
          await sleep(backoff);
        } else {
          // Switch to next model in list
          break;
        }
      }
    }
  }

  return null;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Endpoint: Generate 20 questions from slide text
app.post('/api/quiz/generate-from-slides', async (req, res) => {
  try {
    const { slideText, weekTitle, unitGoal } = req.body;

    if (!slideText || typeof slideText !== 'string' || slideText.trim().length === 0) {
      return res.status(400).json({ error: 'slideText is required.' });
    }

    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are an expert high school teacher and curriculum specialist creating a 20-question multiple-choice check-in quiz for a classroom unit.
Week / Topic Title: "${weekTitle || 'Weekly Topic'}"
${unitGoal ? `Unit Learning Goal: "${unitGoal}"` : ''}

Slide Content Extracted from the Teacher's Presentation:
---
${slideText.slice(0, 30000)}
---

Instructions:
1. Generate EXACTLY 20 high-quality multiple choice questions based on the slide content above.
2. Each question MUST have EXACTLY 4 distinct, plausible answer options.
3. correctIndex MUST be the integer 0, 1, 2, or 3 pointing to the correct option.
4. Distribute questions evenly across the entire slide deck from beginning to end.
5. Emphasize comprehension, cause-and-effect, factual knowledge, and application rather than trivial formatting details.
6. Provide a concise explanation (1-2 sentences) for why the correct answer is right.
`;

      const geminiResult = await generateContentWithRetryAndFallback(ai, {
        prompt,
        systemInstruction:
          'You write rigorous, fair, pedagogical multiple-choice quizzes for high school classrooms. Always return valid JSON adhering strictly to the response schema.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              description: 'Array of exactly 20 quiz questions',
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: 'The question prompt' },
                  options: {
                    type: Type.ARRAY,
                    description: 'Array of exactly 4 choices',
                    items: { type: Type.STRING },
                  },
                  correctIndex: {
                    type: Type.INTEGER,
                    description: '0-based index of the correct option (0 to 3)',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'Brief explanation of the correct answer',
                  },
                },
                required: ['question', 'options', 'correctIndex'],
              },
            },
          },
          required: ['questions'],
        },
      });

      if (geminiResult) {
        try {
          const parsed = JSON.parse(geminiResult.text);
          if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            const cleaned = parsed.questions.slice(0, 20).map((q: any, idx: number) => {
              const rawQ = {
                id: `q_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
                question: q.question || `Question ${idx + 1}`,
                options: Array.isArray(q.options) && q.options.length === 4
                  ? q.options
                  : [
                      q.options?.[0] || 'Option A',
                      q.options?.[1] || 'Option B',
                      q.options?.[2] || 'Option C',
                      q.options?.[3] || 'Option D',
                    ],
                correctIndex:
                  typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < 4
                    ? q.correctIndex
                    : 0,
                explanation: q.explanation || '',
              };
              return shuffleQuestionOptions(rawQ);
            });

            return res.json({
              questions: cleaned,
              source: geminiResult.model,
            });
          }
        } catch (parseErr) {
          console.warn('[Gemini] JSON parse error on quiz response, falling back to heuristic generator:', parseErr);
        }
      }
    }

    // Dependable heuristic generation if AI is unavailable or degraded
    const fallbackQuestions = generateFallbackQuestions(slideText, weekTitle);
    return res.json({
      questions: fallbackQuestions,
      source: 'smart-generator',
      notice: 'Generated using curriculum slide parser.',
    });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    // Return heuristic questions as dependable fallback
    const fallback = generateFallbackQuestions(req.body.slideText || '', req.body.weekTitle || '');
    return res.json({
      questions: fallback,
      source: 'fallback',
      warning: error.message || 'Used offline generator',
    });
  }
});

// Endpoint: Generate presentation outline and 20 questions from a topic name
app.post('/api/quiz/generate-from-topic', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'topic string is required.' });
    }

    const ai = getGeminiClient();
    if (ai) {
      const prompt = `Create a complete weekly lesson slide curriculum and a 20-question multiple-choice check-in quiz for high school students on the topic: "${topic}".
Include 8-10 slides with key facts, concepts, dates, definitions, and theories, followed by 20 multiple choice questions covering each slide.`;

      const geminiResult = await generateContentWithRetryAndFallback(ai, {
        prompt,
        systemInstruction: 'You are a master educator crafting curriculum slides and assessment quizzes.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            slideText: { type: Type.STRING, description: 'Formatted slide text with [Slide 1], [Slide 2], etc.' },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctIndex'],
              },
            },
          },
          required: ['title', 'slideText', 'questions'],
        },
      });

      if (geminiResult) {
        try {
          const parsed = JSON.parse(geminiResult.text || '{}');
          if (parsed.questions && parsed.questions.length > 0) {
            return res.json({
              title: parsed.title || topic,
              slideText: parsed.slideText || '',
              questions: parsed.questions.slice(0, 20).map((q: any, idx: number) => {
                const rawQ = {
                  id: `q_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
                  question: q.question,
                  options: q.options?.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
                  correctIndex: q.correctIndex ?? 0,
                  explanation: q.explanation || '',
                };
                return shuffleQuestionOptions(rawQ);
              }),
              source: geminiResult.model,
            });
          }
        } catch (parseErr) {
          console.warn('[Gemini] Topic JSON parse error:', parseErr);
        }
      }
    }

    // Heuristic fallback topic
    const slideText = `[Slide 1] Core Introduction to ${topic}: Key definitions, historical background, and fundamental principles.\n[Slide 2] Major Concepts in ${topic}: Core mechanisms, active factors, and foundational terminology.\n[Slide 3] Key Processes: Step-by-step procedures and structural relationships.\n[Slide 4] Real-World Applications: Case studies, contemporary relevance, and impact.\n[Slide 5] Critical Analysis: Debates, perspectives, and problem-solving strategies.\n[Slide 6] Review & Culminating Connections: Preparation for the final unit assessment.`;
    const questions = generateFallbackQuestions(slideText, topic);

    return res.json({
      title: topic,
      slideText,
      questions,
      source: 'smart-curriculum-template',
    });
  } catch (error: any) {
    console.error('Topic generator error:', error);
    const slideText = `[Slide 1] Introduction to ${req.body.topic || 'Lesson'}: Foundational principles and concepts.`;
    const questions = generateFallbackQuestions(slideText, req.body.topic || 'Lesson');
    return res.json({
      title: req.body.topic || 'Weekly Lesson',
      slideText,
      questions,
      source: 'fallback',
      warning: error.message || 'Used offline generator',
    });
  }
});

// Endpoint: AI-guided Class Remediation & Culminating Action Items
app.post('/api/quiz/analyze-results', async (req, res) => {
  try {
    const { weekTitle, questionsWithStats, classAverage } = req.body;
    const ai = getGeminiClient();

    if (ai && Array.isArray(questionsWithStats) && questionsWithStats.length > 0) {
      const struggled = questionsWithStats.filter((q: any) => q.missPct >= 20);
      const prompt = `Analyze classroom performance data for "${weekTitle}". Class average is ${Math.round(classAverage)}%.
Here are the questions where students struggled (miss rate >= 20%):
${JSON.stringify(struggled, null, 2)}

Provide 3 to 5 clear, concrete pedagogical action items for the teacher to help students prepare for the upcoming culminating unit assessment.`;

      const geminiResult = await generateContentWithRetryAndFallback(ai, {
        prompt,
        systemInstruction: 'You are an educational data analyst giving concise actionable advice for classroom teachers.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            actionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ['High', 'Medium', 'Review'] },
                },
                required: ['title', 'description', 'priority'],
              },
            },
          },
          required: ['actionItems'],
        },
      });

      if (geminiResult) {
        try {
          const parsed = JSON.parse(geminiResult.text || '{}');
          if (parsed.actionItems && Array.isArray(parsed.actionItems)) {
            return res.json(parsed);
          }
        } catch (parseErr) {
          console.warn('[Gemini] Analyze results parse error:', parseErr);
        }
      }
    }

    return res.json({
      actionItems: [
        {
          title: 'Review key vocabulary and definitions',
          description: 'Spend 10 minutes at the start of next class revisiting terms with high miss rates.',
          priority: 'High',
        },
        {
          title: 'Conduct a peer-teaching breakout session',
          description: 'Pair students who mastered the core concepts with peers who need additional clarification.',
          priority: 'Medium',
        },
        {
          title: 'Targeted culminating prep warm-up',
          description: 'Present 2-3 sample items identical to high-miss questions before launching the unit test.',
          priority: 'High',
        },
      ],
    });
  } catch (error: any) {
    res.json({
      actionItems: [
        {
          title: 'Revisit difficult question concepts',
          description: 'Review the highest-missed items during morning warmup before the unit test.',
          priority: 'High',
        },
      ],
    });
  }
});

// Helper: Extract phrases/facts from text to create structured 20 questions
function generateFallbackQuestions(text: string, title: string) {
  // Extract lines and sentences
  const rawSegments = text
    .split(/[\n•\-–—;]+|\.\s+/)
    .map((s) => s.replace(/^\[Slide \d+\]\s*/i, '').trim())
    .filter((s) => s.length >= 15 && !s.toLowerCase().startsWith('slide '));

  const count = 20;
  const questions: any[] = [];
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

    questions.push(
      shuffleQuestionOptions({
        id: `q_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        question: `Regarding ${title || 'the lesson presentation'}: Which statement correctly summarizes "${cleanPrompt}"?`,
        options,
        correctIndex: correctIdx,
        explanation: `According to the presentation slides, "${primaryFact.slice(0, 90)}" represents the verified understanding.`,
      })
    );
  }

  return questions;
}

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`The Weekly Ledger server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
