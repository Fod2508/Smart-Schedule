import { ScheduleItem, UserProfile, ConflictResolutionOption } from '../types/schedule';

export interface ParseResult {
  reasoning: string;
  suggestedAction?: string;
  items: Array<{
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    category: ScheduleItem['category'];
    priority: ScheduleItem['priority'];
    hasMeet: boolean;
    pomodoroBlocks?: number;
    color?: string;
  }>;
}

export interface OptimizationResult {
  productivityScore: number;
  scoreExplanation: string;
  suggestions: string[];
  optimizedEvents: Array<{
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    category: ScheduleItem['category'];
    priority: ScheduleItem['priority'];
    hasMeet?: boolean;
    isBreak?: boolean;
  }>;
}

export interface ConflictResult {
  analysis: string;
  options: ConflictResolutionOption[];
}

export interface EmailSummaryResult {
  subject: string;
  htmlBody: string;
  plainTextSummary: string;
}

export interface OcrScheduleResult {
  summary: string;
  totalItemsDetected: number;
  items: Array<{
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    category: ScheduleItem['category'];
    priority: ScheduleItem['priority'];
    location?: string;
    hasMeet: boolean;
    pomodoroBlocks?: number;
  }>;
}

export interface TeamCandidateSlot {
  id: string;
  startTime: string;
  endTime: string;
  matchScore: number;
  suitabilityReason: string;
  pros?: string;
  recommended: boolean;
  votes?: {
    yes: string[];
    maybe: string[];
    no: string[];
  };
}

export interface TeamSlotFinderResult {
  reasoning: string;
  candidateSlots: TeamCandidateSlot[];
  pollSummaryText: string;
}

export async function findTeamSlotsWithAI(
  meetingTitle: string,
  durationMinutes: number,
  attendees: string[],
  currentEvents: ScheduleItem[],
  memberConstraints: string,
  weekStart: string
): Promise<TeamSlotFinderResult> {
  const res = await fetch('/api/ai/find-team-slots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      meetingTitle,
      durationMinutes,
      attendees,
      currentEvents,
      memberConstraints,
      weekStart,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Lỗi khi tìm giờ họp cho team');
  }

  return await res.json();
}

export async function parseScheduleFromImageOrPdf(
  imageBase64: string,
  mimeType: string,
  weekStart: string,
  userNote?: string
): Promise<OcrScheduleResult> {
  const res = await fetch('/api/ai/ocr-schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType, weekStart, userNote }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Lỗi khi nhận diện thời khóa biểu từ ảnh/tài liệu');
  }

  return await res.json();
}

export async function parseNaturalLanguageSchedule(
  prompt: string,
  currentEvents: ScheduleItem[],
  userProfile: UserProfile,
  weekStart: string
): Promise<ParseResult> {
  const res = await fetch('/api/ai/parse-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, currentEvents, userProfile, weekStart }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Lỗi khi AI phân tích câu lệnh');
  }

  return await res.json();
}

export async function optimizeScheduleWithAI(
  events: ScheduleItem[],
  userProfile: UserProfile
): Promise<OptimizationResult> {
  const res = await fetch('/api/ai/optimize-schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events, userProfile }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Lỗi khi AI tối ưu hóa thời khóa biểu');
  }

  return await res.json();
}

export async function resolveScheduleConflictWithAI(
  conflictA: ScheduleItem,
  conflictB: ScheduleItem,
  allEvents: ScheduleItem[]
): Promise<ConflictResult> {
  const res = await fetch('/api/ai/resolve-conflicts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conflictA, conflictB, allEvents }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Lỗi khi AI phân tích xung đột lịch');
  }

  return await res.json();
}

export async function generateEmailSummaryWithAI(
  events: ScheduleItem[],
  period: 'today' | 'week',
  recipientName: string
): Promise<EmailSummaryResult> {
  const res = await fetch('/api/ai/generate-email-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events, period, recipientName }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Lỗi khi AI soạn thảo email tổng kết');
  }

  return await res.json();
}

export interface RescheduleChange {
  eventId: string;
  title: string;
  originalTime: string;
  newTime: string;
  action: 'delayed' | 'shifted' | 'shortened' | 'moved_to_tomorrow' | 'unchanged';
  reason: string;
}

export interface SmartRescheduleResult {
  explanation: string;
  impactSummary: string;
  changes: RescheduleChange[];
  updatedEvents: ScheduleItem[];
}

export async function smartRescheduleWithAI(
  delayedEventId: string | null,
  delayMinutes: number,
  reason: string,
  strategy: 'prioritize' | 'push_all' | 'overflow_tomorrow',
  currentEvents: ScheduleItem[],
  targetDate: string
): Promise<SmartRescheduleResult> {
  const res = await fetch('/api/ai/smart-reschedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      delayedEventId,
      delayMinutes,
      reason,
      strategy,
      currentEvents,
      targetDate,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Lỗi khi AI thực hiện dời lịch');
  }

  return await res.json();
}

export async function matchEnergyScheduleWithAI(
  events: ScheduleItem[],
  chronotype: 'morning_bird' | 'night_owl' | 'balanced',
  weekStart: string
): Promise<import('../types/schedule').EnergyMatchResult> {
  const res = await fetch('/api/ai/match-energy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events,
      chronotype,
      weekStart,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Lỗi khi AI xếp lịch theo năng lượng sinh học');
  }

  return await res.json();
}

export async function analyzeTravelBuffersWithAI(
  events: ScheduleItem[],
  defaultTransitMode: import('../types/schedule').TransitMode = 'motorcycle',
  defaultBufferMinutes: number = 25
): Promise<import('../types/schedule').TravelScanResult> {
  const res = await fetch('/api/ai/analyze-travel-buffers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events,
      defaultTransitMode,
      defaultBufferMinutes,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Lỗi khi AI phân tích thời gian di chuyển');
  }

  return await res.json();
}


