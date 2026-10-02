/**
 * firestoreService.ts
 * Sync lịch trình và profile người dùng lên Firestore.
 *
 * Cấu trúc Firestore:
 *   users/{userId}/events/{eventId}   → ScheduleItem
 *   users/{userId}/profile/data       → UserProfile
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { ScheduleItem, UserProfile } from "../types/schedule";

// ─── EVENTS ─────────────────────────────────────────────────────────────────

/**
 * Lưu toàn bộ events lên Firestore.
 * Chia nhỏ batch để tránh giới hạn 500 ops/batch của Firestore.
 * Chỉ xóa docs không còn tồn tại, không xóa hết rồi ghi lại.
 */
export async function saveEventsToFirestore(
  userId: string,
  events: ScheduleItem[],
): Promise<void> {
  const colRef = collection(db, "users", userId, "events");

  // Lấy danh sách docs hiện có
  const snapshot = await getDocs(colRef);
  const existingIds = snapshot.docs.map((d) => d.id);
  const newIds = new Set(events.map((e) => e.id));

  // Ids cần xóa (không còn trong events mới)
  const toDelete = existingIds.filter((id) => !newIds.has(id));

  // Flush batch khi đạt 499 ops
  let batch = writeBatch(db);
  let opCount = 0;

  const flush = async () => {
    if (opCount > 0) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  };

  for (const id of toDelete) {
    if (opCount >= 499) await flush();
    batch.delete(doc(colRef, id));
    opCount++;
  }

  for (const ev of events) {
    if (opCount >= 499) await flush();
    batch.set(doc(colRef, ev.id), ev);
    opCount++;
  }

  await flush();
}

/** Tải toàn bộ events từ Firestore */
export async function loadEventsFromFirestore(
  userId: string,
): Promise<ScheduleItem[]> {
  const colRef = collection(db, "users", userId, "events");
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((d) => d.data() as ScheduleItem);
}

/** Lưu/cập nhật một event đơn lẻ */
export async function saveEventToFirestore(
  userId: string,
  event: ScheduleItem,
): Promise<void> {
  const ref = doc(db, "users", userId, "events", event.id);
  await setDoc(ref, event);
}

/** Xóa một event */
export async function deleteEventFromFirestore(
  userId: string,
  eventId: string,
): Promise<void> {
  const ref = doc(db, "users", userId, "events", eventId);
  await deleteDoc(ref);
}

/**
 * Lắng nghe realtime — tự động cập nhật khi Firestore thay đổi.
 * Trả về hàm unsubscribe để dừng lắng nghe.
 */
export function subscribeToEvents(
  userId: string,
  onChange: (events: ScheduleItem[]) => void,
): Unsubscribe {
  const colRef = collection(db, "users", userId, "events");
  return onSnapshot(colRef, (snapshot) => {
    const events = snapshot.docs.map((d) => d.data() as ScheduleItem);
    onChange(events);
  });
}

// ─── PROFILE ────────────────────────────────────────────────────────────────

/** Lưu profile người dùng lên Firestore */
export async function saveProfileToFirestore(
  userId: string,
  profile: UserProfile,
): Promise<void> {
  const ref = doc(db, "users", userId, "profile", "data");
  await setDoc(ref, profile);
}

/** Tải profile từ Firestore */
export async function loadProfileFromFirestore(
  userId: string,
): Promise<UserProfile | null> {
  const ref = doc(db, "users", userId, "profile", "data");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}
