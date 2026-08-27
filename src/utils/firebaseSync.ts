import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  where,
  DocumentData,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ClassroomData, AppLedgerStore, Teacher, QuizSubmission, Student } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Collection References
export const CLASSES_COLLECTION = 'classes';
export const TEACHERS_COLLECTION = 'teachers';
export const SUBMISSIONS_COLLECTION = 'submissions';
export const APP_SYNC_COLLECTION = 'system_sync';

/**
 * Cloud Sync Status State & Listeners
 */
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

let currentSyncStatus: SyncStatus = 'synced';
const statusListeners = new Set<(status: SyncStatus) => void>();

export function setSyncStatus(status: SyncStatus) {
  currentSyncStatus = status;
  statusListeners.forEach((l) => l(status));
}

export function subscribeSyncStatus(listener: (status: SyncStatus) => void): () => void {
  statusListeners.add(listener);
  listener(currentSyncStatus);
  return () => {
    statusListeners.delete(listener);
  };
}

/**
 * Sync an entire ClassroomData object to Firestore
 */
export async function syncClassToCloud(classData: ClassroomData): Promise<void> {
  if (!classData || !classData.id) return;
  try {
    setSyncStatus('syncing');
    const classRef = doc(db, CLASSES_COLLECTION, classData.id);
    await setDoc(
      classRef,
      {
        ...classData,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    setSyncStatus('synced');
  } catch (err) {
    console.error('Failed to sync class to Firestore:', err);
    setSyncStatus('error');
  }
}

/**
 * Save a single teacher to Firestore
 */
export async function syncTeacherToCloud(teacher: Teacher): Promise<void> {
  if (!teacher || !teacher.id) return;
  try {
    const teacherRef = doc(db, TEACHERS_COLLECTION, teacher.id);
    await setDoc(teacherRef, teacher, { merge: true });
  } catch (err) {
    console.error('Failed to sync teacher to Firestore:', err);
  }
}

/**
 * Fetch all classes from Firestore in real time
 */
export function subscribeToAllClasses(
  onClassesUpdate: (classes: ClassroomData[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const classesRef = collection(db, CLASSES_COLLECTION);
    return onSnapshot(
      classesRef,
      (snapshot) => {
        const classes: ClassroomData[] = [];
        snapshot.forEach((d) => {
          classes.push(d.data() as ClassroomData);
        });
        onClassesUpdate(classes);
        setSyncStatus('synced');
      },
      (err) => {
        console.error('Error in classes subscription:', err);
        setSyncStatus('offline');
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    console.error('Could not initialize classes subscription:', err);
    setSyncStatus('offline');
    return () => {};
  }
}

/**
 * Fetch a single class in real time
 */
export function subscribeToClass(
  classId: string,
  onClassUpdate: (classData: ClassroomData | null) => void
): () => void {
  if (!classId) return () => {};
  try {
    const classRef = doc(db, CLASSES_COLLECTION, classId);
    return onSnapshot(
      classRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onClassUpdate(snapshot.data() as ClassroomData);
        } else {
          onClassUpdate(null);
        }
      },
      (err) => {
        console.error(`Error subscribing to class ${classId}:`, err);
      }
    );
  } catch (err) {
    console.error('Error starting class listener:', err);
    return () => {};
  }
}

/**
 * Submit student quiz result directly to cloud (and update classroom document)
 */
export async function submitStudentQuizToCloud(
  classId: string,
  studentId: string,
  weekId: string,
  submission: QuizSubmission
): Promise<void> {
  try {
    setSyncStatus('syncing');
    const classRef = doc(db, CLASSES_COLLECTION, classId);
    const snap = await getDoc(classRef);

    if (snap.exists()) {
      const currentData = snap.data() as ClassroomData;
      const existingResults = currentData.results || {};
      const studentResults = existingResults[studentId] || {};
      studentResults[weekId] = submission;
      existingResults[studentId] = studentResults;

      await updateDoc(classRef, {
        results: existingResults,
        updatedAt: Date.now(),
      });
    }

    // Also write to an individual submissions collection for audit/history
    const subDocId = `${classId}_${studentId}_${weekId}`;
    const subRef = doc(db, SUBMISSIONS_COLLECTION, subDocId);
    await setDoc(subRef, {
      classId,
      studentId,
      weekId,
      ...submission,
    });

    setSyncStatus('synced');
  } catch (err) {
    console.error('Failed to submit student quiz to cloud:', err);
    setSyncStatus('error');
    throw err;
  }
}

/**
 * Fetch a class by Class Code (e.g. 'SCI-301')
 */
export async function fetchClassByCode(classCode: string): Promise<ClassroomData | null> {
  try {
    const clean = classCode.trim().toUpperCase();
    const q = query(collection(db, CLASSES_COLLECTION), where('classCode', '==', clean));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as ClassroomData;
    }
    return null;
  } catch (err) {
    console.error('Failed to query class by code:', err);
    return null;
  }
}

/**
 * Fetch initial data from cloud or push local seed if database is empty
 */
export async function syncLocalStoreWithCloud(localStore: AppLedgerStore): Promise<AppLedgerStore> {
  try {
    setSyncStatus('syncing');
    const classesSnap = await getDocs(collection(db, CLASSES_COLLECTION));
    const teachersSnap = await getDocs(collection(db, TEACHERS_COLLECTION));

    // If cloud is empty, seed it with local store data
    if (classesSnap.empty && localStore.classes.length > 0) {
      for (const cls of localStore.classes) {
        await syncClassToCloud(cls);
      }
      for (const t of localStore.teachers) {
        await syncTeacherToCloud(t);
      }
      setSyncStatus('synced');
      return localStore;
    }

    // If cloud has data, pull classes and teachers
    const cloudClasses: ClassroomData[] = [];
    classesSnap.forEach((d) => cloudClasses.push(d.data() as ClassroomData));

    const cloudTeachers: Teacher[] = [];
    teachersSnap.forEach((d) => cloudTeachers.push(d.data() as Teacher));

    const mergedStore: AppLedgerStore = {
      teachers: cloudTeachers.length > 0 ? cloudTeachers : localStore.teachers,
      classes: cloudClasses.length > 0 ? cloudClasses : localStore.classes,
      activeClassIdByTeacher: { ...localStore.activeClassIdByTeacher },
    };

    // Ensure all teachers have active classes
    mergedStore.teachers.forEach((t) => {
      const tClasses = mergedStore.classes.filter((c) => c.teacherId === t.id);
      if (tClasses.length > 0 && !mergedStore.activeClassIdByTeacher[t.id]) {
        mergedStore.activeClassIdByTeacher[t.id] = tClasses[0].id;
      }
    });

    setSyncStatus('synced');
    return mergedStore;
  } catch (err) {
    console.error('Error during initial cloud sync:', err);
    setSyncStatus('offline');
    return localStore;
  }
}
