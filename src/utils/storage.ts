import { ClassroomData, ClassroomState, Student, Teacher, Week, QuizSubmission, AppLedgerStore } from '../types';
import { SAMPLE_DECKS } from './sampleDecks';

const STORE_STORAGE_KEY = 'the_weekly_ledger_multi_teacher_store_v1';
const LEGACY_STORAGE_KEY = 'the_weekly_ledger_classroom_v2';
const LAST_SELECTED_CLASS_KEY = 'the_weekly_ledger_last_student_class_id';

export function uid(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function pin4(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function generateClassCode(prefix: string = 'CLS'): string {
  const cleanPrefix = prefix.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'CLS';
  const num = Math.floor(100 + Math.random() * 900);
  return `${cleanPrefix}-${num}`;
}

export async function hashPassword(pw: string): Promise<string> {
  const enc = new TextEncoder().encode('weekly-ledger-salt-2026::' + pw);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateResetCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

// Generate seeded default sample class for initial teacher
function createDefaultSampleClass(teacherId: string): ClassroomData {
  const week1Id = uid('wk');
  const week2Id = uid('wk');

  const weeks: Week[] = [
    {
      ...SAMPLE_DECKS[0],
      id: week1Id,
      createdAt: Date.now() - 14 * 86400000,
    },
    {
      ...SAMPLE_DECKS[1],
      id: week2Id,
      createdAt: Date.now() - 7 * 86400000,
    },
  ];

  const students: Student[] = [
    { id: uid('stu'), name: 'Maya Lin', pin: '4821', createdAt: Date.now() - 20 * 86400000 },
    { id: uid('stu'), name: 'Devon Vance', pin: '7193', createdAt: Date.now() - 20 * 86400000 },
    { id: uid('stu'), name: 'Elena Rostova', pin: '3942', createdAt: Date.now() - 20 * 86400000 },
    { id: uid('stu'), name: 'Marcus Chen', pin: '8204', createdAt: Date.now() - 20 * 86400000 },
    { id: uid('stu'), name: 'Sofia Rodriguez', pin: '1596', createdAt: Date.now() - 20 * 86400000 },
    { id: uid('stu'), name: 'Liam O’Connor', pin: '6480', createdAt: Date.now() - 20 * 86400000 },
    { id: uid('stu'), name: 'Aaliyah Washington', pin: '5317', createdAt: Date.now() - 20 * 86400000 },
    { id: uid('stu'), name: 'Noah Takahashi', pin: '9045', createdAt: Date.now() - 20 * 86400000 },
  ];

  const results: Record<string, Record<string, QuizSubmission>> = {};

  students.forEach((s, idx) => {
    results[s.id] = {};

    const w1Answers = weeks[0].quiz.map((q, qi) => {
      const makesMistake =
        (qi === 5 && idx % 3 === 0) ||
        (qi === 8 && idx % 2 === 0) ||
        (qi === 15 && idx % 4 === 0) ||
        (idx > 5 && qi % 5 === 0);
      if (makesMistake) {
        return (q.correctIndex + 1) % 4;
      }
      return q.correctIndex;
    });
    const w1Score = w1Answers.filter((a, qi) => a === weeks[0].quiz[qi].correctIndex).length;
    results[s.id][week1Id] = {
      answers: w1Answers,
      score: w1Score,
      total: 20,
      submittedAt: Date.now() - (12 - idx) * 86400000,
    };

    if (idx < 6) {
      const w2Answers = weeks[1].quiz.map((q, qi) => {
        const makesMistake =
          (qi === 3 && idx % 2 === 0) ||
          (qi === 9 && idx % 3 === 0) ||
          (qi === 10 && idx % 2 !== 0);
        if (makesMistake) {
          return (q.correctIndex + 1) % 4;
        }
        return q.correctIndex;
      });
      const w2Score = w2Answers.filter((a, qi) => a === weeks[1].quiz[qi].correctIndex).length;
      results[s.id][week2Id] = {
        answers: w2Answers,
        score: w2Score,
        total: 20,
        submittedAt: Date.now() - (4 - idx * 0.5) * 86400000,
      };
    }
  });

  return {
    id: uid('cls'),
    teacherId,
    classCode: 'SCI-301',
    className: 'Period 3: Honors Integrated Social & Natural Sciences',
    subject: 'Integrated Sciences',
    period: 'Period 3',
    unitGoal: 'Master core weekly competencies for the Fall Comprehensive Culminating Exam & Socratic Defense.',
    culminatingActivityTitle: 'Unit Culminating Activity & Socratic Tribunal',
    students,
    weeks,
    results,
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now(),
  };
}

// Initial default system store
export function getInitialAppStore(): AppLedgerStore {
  const defaultTeacherId = uid('tch');
  const defaultTeacher: Teacher = {
    id: defaultTeacherId,
    name: 'Ms. Eleanor Vance',
    email: 'teacher@school.edu',
    // SHA-256 of 'weekly-ledger-salt-2026::teacher123'
    passwordHash: '89db690e54d88e079717b9fe7b9b7e77a28ebf9aa0a6c0c28383cf82fae2be9b',
    role: 'primary',
    subject: 'Integrated Social & Natural Sciences',
    createdAt: Date.now() - 30 * 86400000,
    resetCode: null,
  };

  const defaultClass = createDefaultSampleClass(defaultTeacherId);

  return {
    teachers: [defaultTeacher],
    classes: [defaultClass],
    activeClassIdByTeacher: {
      [defaultTeacherId]: defaultClass.id,
    },
  };
}

// Load entire store from localStorage with migration
export function loadAppStore(): AppLedgerStore {
  try {
    const raw = localStorage.getItem(STORE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppLedgerStore;
      if (parsed && Array.isArray(parsed.teachers) && Array.isArray(parsed.classes)) {
        // Ensure every teacher has an active class
        parsed.teachers.forEach((t) => {
          const teacherClasses = parsed.classes.filter((c) => c.teacherId === t.id);
          if (teacherClasses.length === 0) {
            // Provision an isolated class for this teacher
            const freshClass = createNewIsolatedClass(t.id, `${t.name}'s Classroom`, t.subject || 'General Studies');
            parsed.classes.push(freshClass);
            parsed.activeClassIdByTeacher[t.id] = freshClass.id;
          } else if (!parsed.activeClassIdByTeacher[t.id]) {
            parsed.activeClassIdByTeacher[t.id] = teacherClasses[0].id;
          }
        });
        return parsed;
      }
    }

    // Try migration from legacy single classroom state
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw) as ClassroomState;
        if (legacy && legacy.teachers && legacy.teachers.length > 0) {
          const primaryTeacher = legacy.teachers[0];
          const legacyClass: ClassroomData = {
            id: uid('cls'),
            teacherId: primaryTeacher.id,
            classCode: 'SCI-301',
            className: legacy.className || 'Period 3: Honors Social & Natural Sciences',
            unitGoal: legacy.unitGoal || 'Master core weekly competencies for the culminating assessment.',
            culminatingActivityTitle: legacy.culminatingActivityTitle || 'Unit Culminating Activity & Socratic Tribunal',
            students: legacy.students || [],
            weeks: legacy.weeks || [],
            results: legacy.results || {},
            createdAt: Date.now() - 30 * 86400000,
            updatedAt: Date.now(),
          };

          const newStore: AppLedgerStore = {
            teachers: legacy.teachers,
            classes: [legacyClass],
            activeClassIdByTeacher: {
              [primaryTeacher.id]: legacyClass.id,
            },
          };

          // If other legacy teachers exist, give them their own isolated classes
          legacy.teachers.slice(1).forEach((t) => {
            const extraClass = createNewIsolatedClass(t.id, `${t.name}'s Class`, t.subject || 'General Studies');
            newStore.classes.push(extraClass);
            newStore.activeClassIdByTeacher[t.id] = extraClass.id;
          });

          saveAppStore(newStore);
          return newStore;
        }
      } catch (legacyErr) {
        console.warn('Could not parse legacy data, creating fresh store:', legacyErr);
      }
    }

    const initial = getInitialAppStore();
    saveAppStore(initial);
    return initial;
  } catch (err) {
    console.error('Failed to load ledger store:', err);
    const initial = getInitialAppStore();
    return initial;
  }
}

// Save entire store to localStorage and sync to Firebase Firestore
export function saveAppStore(store: AppLedgerStore): void {
  try {
    localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save app store:', err);
  }

  // Asynchronously push each class and teacher to cloud
  try {
    import('./firebaseSync').then(({ syncClassToCloud, syncTeacherToCloud }) => {
      store.classes.forEach((c) => syncClassToCloud(c));
      store.teachers.forEach((t) => syncTeacherToCloud(t));
    }).catch(() => {});
  } catch {}
}

// Create a new completely isolated class for a specific teacher
export function createNewIsolatedClass(
  teacherId: string,
  className: string,
  subject: string = 'General Studies',
  period: string = 'Period 1',
  unitGoal?: string,
  culminatingActivityTitle?: string
): ClassroomData {
  return {
    id: uid('cls'),
    teacherId,
    classCode: generateClassCode(subject.slice(0, 3) || 'CLS'),
    className: className.trim(),
    subject: subject.trim(),
    period: period.trim(),
    unitGoal: unitGoal?.trim() || 'Master weekly presentation concepts and key curriculum objectives.',
    culminatingActivityTitle: culminatingActivityTitle?.trim() || 'Final Unit Socratic Examination',
    students: [],
    weeks: [],
    results: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Get all classes strictly belonging to a specific teacher
export function getClassesForTeacher(teacherId: string): ClassroomData[] {
  const store = loadAppStore();
  return store.classes.filter((c) => c.teacherId === teacherId);
}

// Get the active class for a teacher (guaranteeing one exists)
export function getActiveClassForTeacher(teacherId: string): ClassroomData {
  const store = loadAppStore();
  const teacherClasses = store.classes.filter((c) => c.teacherId === teacherId);

  if (teacherClasses.length === 0) {
    const teacher = store.teachers.find((t) => t.id === teacherId);
    const freshClass = createNewIsolatedClass(
      teacherId,
      teacher ? `${teacher.name}'s Classroom` : 'My Classroom',
      teacher?.subject || 'General Studies'
    );
    store.classes.push(freshClass);
    store.activeClassIdByTeacher[teacherId] = freshClass.id;
    saveAppStore(store);
    return freshClass;
  }

  const activeId = store.activeClassIdByTeacher[teacherId];
  const matched = teacherClasses.find((c) => c.id === activeId);
  if (matched) return matched;

  // Fallback to first class
  store.activeClassIdByTeacher[teacherId] = teacherClasses[0].id;
  saveAppStore(store);
  return teacherClasses[0];
}

// Set active class for teacher
export function setActiveClassForTeacher(teacherId: string, classId: string): ClassroomData {
  const store = loadAppStore();
  const targetClass = store.classes.find((c) => c.id === classId && c.teacherId === teacherId);
  if (!targetClass) {
    return getActiveClassForTeacher(teacherId);
  }

  store.activeClassIdByTeacher[teacherId] = classId;
  saveAppStore(store);
  return targetClass;
}

// Add a new class to a teacher's isolated account
export function addClassToTeacher(
  teacherId: string,
  className: string,
  subject: string,
  period: string,
  unitGoal?: string,
  culminatingTitle?: string,
  sourceClassToCopyRosterFrom?: string
): ClassroomData {
  const store = loadAppStore();
  const newClass = createNewIsolatedClass(
    teacherId,
    className,
    subject,
    period,
    unitGoal,
    culminatingTitle
  );

  // If a source class was requested to copy students from
  if (sourceClassToCopyRosterFrom) {
    const sourceClass = store.classes.find((c) => c.id === sourceClassToCopyRosterFrom);
    if (sourceClass && sourceClass.students.length > 0) {
      newClass.students = sourceClass.students.map((stu) => ({
        id: uid('stu'),
        name: stu.name,
        pin: stu.pin,
        avatar: stu.avatar,
        createdAt: Date.now(),
      }));
    }
  }

  store.classes.push(newClass);
  store.activeClassIdByTeacher[teacherId] = newClass.id;
  saveAppStore(store);
  return newClass;
}

// Copy students from one class into another
export function copyStudentsBetweenClasses(
  sourceClassId: string,
  targetClassId: string,
  selectedStudentIds?: string[],
  options: {
    preservePins?: boolean;
    skipExistingNames?: boolean;
  } = { preservePins: true, skipExistingNames: true }
): { copiedCount: number; updatedTargetClass: ClassroomData | null } {
  const store = loadAppStore();
  const sourceClass = store.classes.find((c) => c.id === sourceClassId);
  const targetClass = store.classes.find((c) => c.id === targetClassId);

  if (!sourceClass || !targetClass) {
    return { copiedCount: 0, updatedTargetClass: null };
  }

  const existingNames = new Set(targetClass.students.map((s) => s.name.trim().toLowerCase()));
  const sourceStudents =
    selectedStudentIds && selectedStudentIds.length > 0
      ? sourceClass.students.filter((s) => selectedStudentIds.includes(s.id))
      : sourceClass.students;

  const newStudents: Student[] = [];

  for (const stu of sourceStudents) {
    if (options.skipExistingNames && existingNames.has(stu.name.trim().toLowerCase())) {
      continue;
    }

    newStudents.push({
      id: uid('stu'),
      name: stu.name.trim(),
      pin: options.preservePins ? stu.pin : pin4(),
      avatar: stu.avatar,
      createdAt: Date.now(),
    });
    existingNames.add(stu.name.trim().toLowerCase());
  }

  targetClass.students = [...targetClass.students, ...newStudents];
  targetClass.updatedAt = Date.now();

  saveAppStore(store);
  return { copiedCount: newStudents.length, updatedTargetClass: targetClass };
}

// Update class data
export function updateClassData(updatedClass: ClassroomData): void {
  const store = loadAppStore();
  const idx = store.classes.findIndex((c) => c.id === updatedClass.id);
  if (idx !== -1) {
    store.classes[idx] = {
      ...updatedClass,
      updatedAt: Date.now(),
    };
    saveAppStore(store);
  }
}

// Delete a class (must leave at least one class for the teacher)
export function deleteClassForTeacher(teacherId: string, classId: string): boolean {
  const store = loadAppStore();
  const teacherClasses = store.classes.filter((c) => c.teacherId === teacherId);
  if (teacherClasses.length <= 1) {
    return false; // Cannot delete only class
  }

  store.classes = store.classes.filter((c) => !(c.id === classId && c.teacherId === teacherId));

  // If deleted class was active, point to remaining class
  if (store.activeClassIdByTeacher[teacherId] === classId) {
    const remaining = store.classes.filter((c) => c.teacherId === teacherId);
    store.activeClassIdByTeacher[teacherId] = remaining[0].id;
  }

  saveAppStore(store);
  return true;
}

// Register a new teacher and create their isolated class
export function registerNewTeacherAccount(newTeacher: Teacher, initialClassName?: string): ClassroomData {
  const store = loadAppStore();
  store.teachers.push(newTeacher);

  const freshClass = createNewIsolatedClass(
    newTeacher.id,
    initialClassName || `${newTeacher.name}'s Classroom`,
    newTeacher.subject || 'General Studies'
  );
  store.classes.push(freshClass);
  store.activeClassIdByTeacher[newTeacher.id] = freshClass.id;

  saveAppStore(store);
  return freshClass;
}

// Update teacher profile
export function updateTeacherProfile(updatedTeacher: Teacher): void {
  const store = loadAppStore();
  const idx = store.teachers.findIndex((t) => t.id === updatedTeacher.id);
  if (idx !== -1) {
    store.teachers[idx] = updatedTeacher;
    saveAppStore(store);
  }
}

// Delete a teacher account and all associated classes, rosters, and quizzes
export function deleteTeacherAccount(teacherId: string): { remainingTeachers: Teacher[]; deleted: boolean } {
  const store = loadAppStore();
  const teacherIndex = store.teachers.findIndex((t) => t.id === teacherId);
  if (teacherIndex === -1) {
    return { remainingTeachers: store.teachers, deleted: false };
  }

  // Remove teacher
  store.teachers.splice(teacherIndex, 1);

  // Find classes belonging to this teacher
  const removedClassIds = new Set(store.classes.filter((c) => c.teacherId === teacherId).map((c) => c.id));

  // Remove all classes for this teacher
  store.classes = store.classes.filter((c) => c.teacherId !== teacherId);

  // Clean up active class map
  delete store.activeClassIdByTeacher[teacherId];

  // Clean up last selected class in student storage if it belonged to this teacher
  const lastSelectedClass = getLastSelectedStudentClass();
  if (lastSelectedClass && removedClassIds.has(lastSelectedClass)) {
    if (store.classes.length > 0) {
      saveLastSelectedStudentClass(store.classes[0].id);
    } else {
      try {
        localStorage.removeItem(LAST_SELECTED_CLASS_KEY);
      } catch {}
    }
  }

  saveAppStore(store);
  return { remainingTeachers: store.teachers, deleted: true };
}

// Get all public classes list for student selection
export interface PublicClassInfo {
  id: string;
  className: string;
  classCode: string;
  subject?: string;
  period?: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  studentCount: number;
  weekCount: number;
}

export function getPublicClassesList(): PublicClassInfo[] {
  const store = loadAppStore();
  return store.classes.map((cls) => {
    const teacher = store.teachers.find((t) => t.id === cls.teacherId);
    return {
      id: cls.id,
      className: cls.className,
      classCode: cls.classCode,
      subject: cls.subject,
      period: cls.period,
      teacherId: cls.teacherId,
      teacherName: teacher?.name || 'Class Educator',
      teacherEmail: teacher?.email || '',
      studentCount: cls.students.length,
      weekCount: cls.weeks.filter((w) => w.status === 'published').length,
    };
  });
}

// Get a class by ID
export function getClassById(classId: string): ClassroomData | undefined {
  const store = loadAppStore();
  return store.classes.find((c) => c.id === classId);
}

// Remember student's last selected class
export function saveLastSelectedStudentClass(classId: string): void {
  try {
    localStorage.setItem(LAST_SELECTED_CLASS_KEY, classId);
  } catch {}
}

export function getLastSelectedStudentClass(): string | null {
  try {
    return localStorage.getItem(LAST_SELECTED_CLASS_KEY);
  } catch {
    return null;
  }
}

// Helper to convert ClassroomData into the active ClassroomState
export function buildClassroomStateFromClass(
  classData: ClassroomData,
  teacher: Teacher,
  allTeachers: Teacher[] = []
): ClassroomState {
  return {
    id: classData.id,
    teacherId: classData.teacherId,
    classCode: classData.classCode,
    className: classData.className,
    subject: classData.subject,
    period: classData.period,
    unitGoal: classData.unitGoal,
    culminatingActivityTitle: classData.culminatingActivityTitle,
    students: classData.students,
    weeks: classData.weeks,
    results: classData.results,
    teachers: [teacher, ...allTeachers.filter((t) => t.id !== teacher.id)],
  };
}

// Legacy adapter methods so existing components stay fully operational
export function loadClassroomState(): ClassroomState {
  const store = loadAppStore();
  if (store.teachers.length === 0) {
    const fresh = getInitialAppStore();
    return buildClassroomStateFromClass(fresh.classes[0], fresh.teachers[0], fresh.teachers);
  }
  const teacher = store.teachers[0];
  const activeClass = getActiveClassForTeacher(teacher.id);
  return buildClassroomStateFromClass(activeClass, teacher, store.teachers);
}

export function saveClassroomState(state: ClassroomState): void {
  const store = loadAppStore();
  if (!state.id) {
    // If state lacks id, find or update first class
    if (store.classes.length > 0) {
      state.id = store.classes[0].id;
      state.teacherId = store.classes[0].teacherId;
    }
  }

  const targetClassIdx = store.classes.findIndex((c) => c.id === state.id);
  if (targetClassIdx !== -1) {
    store.classes[targetClassIdx] = {
      ...store.classes[targetClassIdx],
      className: state.className,
      subject: state.subject || store.classes[targetClassIdx].subject,
      period: state.period || store.classes[targetClassIdx].period,
      unitGoal: state.unitGoal,
      culminatingActivityTitle: state.culminatingActivityTitle,
      students: state.students,
      weeks: state.weeks,
      results: state.results,
      updatedAt: Date.now(),
    };
  } else if (state.teacherId) {
    // Create new entry
    const newCls: ClassroomData = {
      id: state.id || uid('cls'),
      teacherId: state.teacherId,
      classCode: state.classCode || generateClassCode('CLS'),
      className: state.className,
      subject: state.subject,
      period: state.period,
      unitGoal: state.unitGoal,
      culminatingActivityTitle: state.culminatingActivityTitle,
      students: state.students,
      weeks: state.weeks,
      results: state.results,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    store.classes.push(newCls);
  }

  // Also sync teachers if provided
  if (state.teachers && state.teachers.length > 0) {
    state.teachers.forEach((t) => {
      const idx = store.teachers.findIndex((existing) => existing.id === t.id);
      if (idx !== -1) {
        store.teachers[idx] = t;
      } else {
        store.teachers.push(t);
      }
    });
  }

  saveAppStore(store);
}

export function resetClassroomDataToDefault(): ClassroomState {
  const freshStore = getInitialAppStore();
  saveAppStore(freshStore);
  return buildClassroomStateFromClass(freshStore.classes[0], freshStore.teachers[0], freshStore.teachers);
}

export const resetClassroomState = resetClassroomDataToDefault;
