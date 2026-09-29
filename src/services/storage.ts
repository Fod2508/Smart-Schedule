import { ScheduleItem, UserProfile } from '../types/schedule';

const SCHEDULE_STORAGE_KEY = 'smart_schedule_events_v1';
const PROFILE_STORAGE_KEY = 'smart_schedule_profile_v1';
const SYNC_QUEUE_KEY = 'smart_schedule_sync_queue_v1';

export interface PendingSyncAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  calendarId: string;
  event: Partial<ScheduleItem>;
  timestamp: number;
}

export function loadLocalSchedule(): ScheduleItem[] {
  try {
    const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load local schedule:', e);
    return [];
  }
}

export function saveLocalSchedule(items: ScheduleItem[]): void {
  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save local schedule:', e);
  }
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Người dùng',
  email: '',
  persona: 'student',
  chronotype: 'morning_bird',
  pomodoroFocusMinutes: 25,
  pomodoroBreakMinutes: 5,
  dailyWorkLimitHours: 8,
  defaultMeetReminderMinutes: 10,
  autoSyncWithGoogle: true,
};

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PROFILE;
    return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_USER_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile:', e);
  }
}

export function queueSyncAction(action: Omit<PendingSyncAction, 'timestamp'>): void {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    const queue: PendingSyncAction[] = raw ? JSON.parse(raw) : [];
    queue.push({ ...action, timestamp: Date.now() });
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to queue sync action:', e);
  }
}

export function getSyncQueue(): PendingSyncAction[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function clearSyncQueue(): void {
  localStorage.removeItem(SYNC_QUEUE_KEY);
}
