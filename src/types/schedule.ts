export type EventCategory = "study" | "work" | "meeting" | "personal" | "break";
export type PriorityLevel = "high" | "medium" | "low";
export type UserPersona = "student" | "teacher" | "freelancer" | "team";
export type Chronotype = "morning_bird" | "night_owl" | "balanced";
export type UiTheme = "cute" | "capybara" | "yohan" | "minimal";

export interface ScheduleItem {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  category: EventCategory;
  priority: PriorityLevel;
  hasMeet?: boolean;
  meetLink?: string;
  googleEventId?: string;
  googleCalendarId?: string;
  isSyncedToGoogle?: boolean;
  isCompleted?: boolean;
  pomodoroBlocks?: number;
  completedPomodoros?: number;
  color?: string;
  recurrence?: "none" | "daily" | "weekly" | "monthly";
  source?: "local" | "google_calendar" | "google_tasks" | "sheets" | "ai";
  location?: string;
  energyLevel?: TaskEnergyLevel;
  isTravelBuffer?: boolean;
  bufferForEventId?: string;
  travelOrigin?: string;
  travelDestination?: string;
  transitMode?: TransitMode;
  bufferMinutes?: number;
  reminderMinutes?: number;
}

export type TransitMode = "motorcycle" | "car" | "transit" | "walking";

export interface TravelConflictWarning {
  id: string;
  previousEvent?: ScheduleItem;
  nextEvent?: ScheduleItem;
  previousEventId?: string;
  previousTitle?: string;
  nextEventId?: string;
  nextTitle?: string;
  originLocation: string;
  destinationLocation: string;
  actualGapMinutes: number;
  recommendedBufferMinutes: number;
  estimatedTrafficNote?: string;
}

export interface TravelScanResult {
  hazards: TravelConflictWarning[];
  offlineEventsCount: number;
  summary?: string;
  suggestedBuffers: Array<{
    targetEventId: string;
    targetTitle: string;
    bufferMinutes: number;
    startTime: string;
    endTime: string;
    origin: string;
    destination: string;
    transitMode: TransitMode;
    note: string;
  }>;
}

export type TaskEnergyLevel = "peak_focus" | "light_admin" | "recovery";

export interface EnergyAuditItem {
  eventId: string;
  taskTitle: string;
  detectedEnergyLevel: TaskEnergyLevel;
  currentSlotTime: string;
  isOptimal: boolean;
  mismatchReason?: string;
  suggestedSlotTime?: string;
}

export interface EnergyMatchResult {
  chronotype: Chronotype;
  energyAlignmentScore: number;
  scoreExplanation: string;
  chronotypeAdvice: string;
  peakHoursDescription: string;
  slumpHoursDescription: string;
  recoveryHoursDescription: string;
  audits: EnergyAuditItem[];
  mismatchesCount: number;
  optimizedEvents: Array<{
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    category: EventCategory;
    priority: PriorityLevel;
    energyLevel: TaskEnergyLevel;
    reasoning?: string;
    hasMeet?: boolean;
  }>;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primary?: boolean;
  selected?: boolean;
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  due?: string; // ISO format
  status: "needsAction" | "completed";
  listId: string;
  listTitle: string;
  scheduledEventId?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  persona: UserPersona;
  chronotype: Chronotype;
  pomodoroFocusMinutes: number;
  pomodoroBreakMinutes: number;
  dailyWorkLimitHours: number;
  defaultMeetReminderMinutes: number;
  autoSyncWithGoogle: boolean;
}

export interface ConflictItem {
  eventA: ScheduleItem;
  eventB: ScheduleItem;
  overlapMinutes: number;
}

export interface ConflictResolutionOption {
  id: string;
  title: string;
  description: string;
  pros: string;
  cons: string;
  actionType: "shift_event_a" | "shift_event_b" | "shorten" | "split";
  suggestedStartTime?: string;
  suggestedEndTime?: string;
  targetEventId?: string;
}

export interface TemplateData {
  id: string;
  name: string;
  persona: UserPersona;
  description: string;
  icon: string;
  items: Omit<ScheduleItem, "id">[];
}
