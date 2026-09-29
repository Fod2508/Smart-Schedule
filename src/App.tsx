import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/firebase';
import {
  ScheduleItem,
  GoogleCalendar,
  GoogleTaskItem,
  UserProfile,
  ConflictItem,
  ConflictResolutionOption,
  TemplateData,
  UserPersona,
  Chronotype,
} from './types/schedule';
import {
  listGoogleCalendars,
  listCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from './services/calendarApi';
import {
  listTaskLists,
  listGoogleTasks,
  createGoogleTask,
  markGoogleTaskCompleted,
} from './services/tasksApi';
import {
  loadLocalSchedule,
  saveLocalSchedule,
  loadUserProfile,
  saveUserProfile,
  DEFAULT_USER_PROFILE,
} from './services/storage';
import { TEMPLATE_LIBRARY } from './data/templateLibrary';

// UI Components
import { Navbar } from './components/Navbar';
import { CalendarGrid } from './components/CalendarGrid';
import { NaturalLanguageInput } from './components/NaturalLanguageInput';
import { EventModal } from './components/EventModal';
import { TasksPanel } from './components/TasksPanel';
import { ConflictResolverModal } from './components/ConflictResolverModal';
import { PomodoroTimer } from './components/PomodoroTimer';
import { SheetsModal } from './components/SheetsModal';
import { GmailModal } from './components/GmailModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { TemplateLibraryModal } from './components/TemplateLibraryModal';
import { TodayWidget } from './components/TodayWidget';
import { ConfirmationModal } from './components/ConfirmationModal';
import { OcrScannerModal } from './components/OcrScannerModal';
import { TeamMeetingModal } from './components/TeamMeetingModal';
import { SmartRescheduleModal } from './components/SmartRescheduleModal';
import { EnergyMatcherModal } from './components/EnergyMatcherModal';
import { TravelBufferModal } from './components/TravelBufferModal';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Network state
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadUserProfile());

  // Current Date & View
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'agenda'>('week');

  // Schedule Events
  const [events, setEvents] = useState<ScheduleItem[]>(() => {
    const saved = loadLocalSchedule();
    if (saved && saved.length > 0) return saved;
    // Default initial template (Student Exam Week)
    const initialTpl = TEMPLATE_LIBRARY[0];
    return initialTpl.items.map((it, idx) => ({
      ...it,
      id: `init-${idx}`,
    }));
  });

  // Google Calendar state
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary');
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  // Google Tasks state
  const [taskLists, setTaskLists] = useState<{ id: string; title: string }[]>([]);
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>('');
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<Partial<ScheduleItem> | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const [activeConflict, setActiveConflict] = useState<ConflictItem | null>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [pomodoroEvent, setPomodoroEvent] = useState<ScheduleItem | null>(null);

  const [isSheetsOpen, setIsSheetsOpen] = useState(false);
  const [isGmailOpen, setIsGmailOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isTeamMeetingOpen, setIsTeamMeetingOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [reschedulePreselectedId, setReschedulePreselectedId] = useState<string | null>(null);
  const [isEnergyMatcherOpen, setIsEnergyMatcherOpen] = useState(false);
  const [isTravelBufferOpen, setIsTravelBufferOpen] = useState(false);
  const [showEnergyOverlay, setShowEnergyOverlay] = useState<boolean>(() => {
    return localStorage.getItem('smart_schedule_energy_overlay') === 'true';
  });

  const handleToggleEnergyOverlay = (val: boolean) => {
    setShowEnergyOverlay(val);
    localStorage.setItem('smart_schedule_energy_overlay', val ? 'true' : 'false');
  };

  const handleUpdateChronotype = (c: Chronotype) => {
    const updated = { ...userProfile, chronotype: c };
    setUserProfile(updated);
    saveUserProfile(updated);
  };

  // Confirmation Modal state (Mandatory for Workspace operations)
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    itemDetails?: string[];
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setUser(firebaseUser);
        if (token) {
          setAccessToken(token);
          setUserProfile((prev) => ({
            ...prev,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || prev.name,
            avatarUrl: firebaseUser.photoURL || undefined,
          }));
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save events & profile locally
  useEffect(() => {
    saveLocalSchedule(events);
  }, [events]);

  useEffect(() => {
    saveUserProfile(userProfile);
  }, [userProfile]);

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Conflict Detection: Find any overlapping items
  const conflicts = useMemo<ConflictItem[]>(() => {
    const list: ConflictItem[] = [];
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const evA = events[i];
        const evB = events[j];
        const startA = new Date(evA.startTime).getTime();
        const endA = new Date(evA.endTime).getTime();
        const startB = new Date(evB.startTime).getTime();
        const endB = new Date(evB.endTime).getTime();

        // Check overlap
        if (startA < endB && startB < endA) {
          const overlapStart = Math.max(startA, startB);
          const overlapEnd = Math.min(endA, endB);
          const overlapMinutes = Math.round((overlapEnd - overlapStart) / (1000 * 60));
          if (overlapMinutes > 0) {
            list.push({
              eventA: evA,
              eventB: evB,
              overlapMinutes,
            });
          }
        }
      }
    }
    return list;
  }, [events]);

  // Sign In with Google
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setUserProfile((prev) => ({
          ...prev,
          email: res.user.email || '',
          name: res.user.displayName || prev.name,
          avatarUrl: res.user.photoURL || undefined,
        }));
        // Load remote data
        loadRemoteCalendars(res.accessToken);
        loadRemoteTasks(res.accessToken);
      }
    } catch (e: any) {
      console.error('Google Sign in failed:', e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setCalendars([]);
    setTasks([]);
  };

  // Google Calendar integration
  const loadRemoteCalendars = useCallback(async (token: string) => {
    try {
      const cals = await listGoogleCalendars(token);
      setCalendars(cals);
      const primary = cals.find((c) => c.primary) || cals[0];
      if (primary) setSelectedCalendarId(primary.id);
    } catch (e) {
      console.warn('Could not load Google calendars:', e);
    }
  }, []);

  const handleSyncGoogleCalendar = async () => {
    if (!accessToken) {
      handleLogin();
      return;
    }

    setIsSyncingCalendar(true);
    try {
      // Get current week window
      const monday = new Date(currentDate);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 7);
      sunday.setHours(23, 59, 59, 999);

      const remoteEvents = await listCalendarEvents(
        accessToken,
        selectedCalendarId,
        monday.toISOString(),
        sunday.toISOString()
      );

      // Merge remote events with local non-synced events
      setEvents((prev) => {
        const localOnly = prev.filter((e) => !e.googleEventId);
        return [...localOnly, ...remoteEvents];
      });
    } catch (e: any) {
      console.error('Failed to sync Google calendar:', e);
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  // Google Tasks integration
  const loadRemoteTasks = useCallback(async (token: string) => {
    setIsLoadingTasks(true);
    try {
      const lists = await listTaskLists(token);
      setTaskLists(lists);
      if (lists.length > 0) {
        setSelectedTaskListId(lists[0].id);
        const taskItems = await listGoogleTasks(token, lists[0].id, lists[0].title);
        setTasks(taskItems);
      }
    } catch (e) {
      console.warn('Could not load Google tasks:', e);
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  const handleSelectTaskList = async (listId: string) => {
    if (!accessToken) return;
    setSelectedTaskListId(listId);
    setIsLoadingTasks(true);
    try {
      const found = taskLists.find((l) => l.id === listId);
      const taskItems = await listGoogleTasks(accessToken, listId, found?.title || '');
      setTasks(taskItems);
    } catch (e) {
      console.error('Failed to load tasks for list:', e);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleAddNewTask = async (title: string, due?: string) => {
    if (!accessToken || !selectedTaskListId) return;
    const newTask = await createGoogleTask(accessToken, selectedTaskListId, title, undefined, due);
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleCompleteGoogleTask = async (task: GoogleTaskItem) => {
    if (!accessToken) return;
    await markGoogleTaskCompleted(accessToken, task.listId, task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  // Schedule task into next available slot
  const handleScheduleTaskToSlot = (task: GoogleTaskItem) => {
    // Find next free 1-hour slot starting tomorrow or today afternoon
    const baseDate = new Date();
    baseDate.setMinutes(0, 0, 0);
    let targetHour = Math.max(8, baseDate.getHours() + 1);
    if (targetHour >= 21) {
      baseDate.setDate(baseDate.getDate() + 1);
      targetHour = 9;
    }

    const startISO = `${baseDate.toISOString().split('T')[0]}T${targetHour
      .toString()
      .padStart(2, '0')}:00:00`;
    const endISO = `${baseDate.toISOString().split('T')[0]}T${(targetHour + 1)
      .toString()
      .padStart(2, '0')}:00:00`;

    const newEvent: ScheduleItem = {
      id: `task-sched-${Date.now()}`,
      title: task.title,
      description: task.notes || 'Được lên lịch tự động từ Google Tasks',
      startTime: startISO,
      endTime: endISO,
      category: 'work',
      priority: 'high',
      pomodoroBlocks: 2,
      source: 'google_tasks',
    };

    setEvents((prev) => [...prev, newEvent]);
    setIsTasksOpen(false);
  };

  // Event Mutations with Workspace Confirmation
  const handleSaveEvent = async (eventData: Partial<ScheduleItem>) => {
    const isNew = !eventData.id;
    const eventId = eventData.id || `evt-${Date.now()}`;
    const fullEvent: ScheduleItem = {
      id: eventId,
      title: eventData.title || '(Không có tiêu đề)',
      description: eventData.description,
      startTime: eventData.startTime || new Date().toISOString(),
      endTime: eventData.endTime || new Date(Date.now() + 3600000).toISOString(),
      category: eventData.category || 'study',
      priority: eventData.priority || 'medium',
      location: eventData.location,
      hasMeet: eventData.hasMeet,
      meetLink: eventData.meetLink,
      pomodoroBlocks: eventData.pomodoroBlocks || 1,
      isSyncedToGoogle: eventData.isSyncedToGoogle,
      source: eventData.source || 'local',
      bufferMinutes: eventData.bufferMinutes,
      transitMode: eventData.transitMode,
    };

    // If sync with Google Calendar is requested and accessToken is present
    if (fullEvent.isSyncedToGoogle && accessToken) {
      try {
        if (isNew || !fullEvent.googleEventId) {
          const gcalRes = await createGoogleCalendarEvent(
            accessToken,
            selectedCalendarId,
            fullEvent,
            fullEvent.hasMeet
          );
          fullEvent.googleEventId = gcalRes.id;
          if (gcalRes.hangoutLink) fullEvent.meetLink = gcalRes.hangoutLink;
        } else if (fullEvent.googleEventId) {
          await updateGoogleCalendarEvent(
            accessToken,
            selectedCalendarId,
            fullEvent.googleEventId,
            fullEvent
          );
        }
      } catch (err) {
        console.error('Google calendar sync error:', err);
      }
    }

    // Auto-create or remove associated travel buffer
    let travelBufferItem: ScheduleItem | null = null;
    if (eventData.bufferMinutes && eventData.bufferMinutes > 0) {
      const bufferEnd = new Date(fullEvent.startTime);
      const bufferStart = new Date(bufferEnd.getTime() - eventData.bufferMinutes * 60 * 1000);
      travelBufferItem = {
        id: `buf-for-${eventId}`,
        title: `🚗 Di chuyển: ${eventData.location || fullEvent.title}`,
        description: `Thời gian đệm di chuyển & chuẩn bị (${eventData.bufferMinutes} phút)`,
        startTime: bufferStart.toISOString(),
        endTime: bufferEnd.toISOString(),
        category: 'break',
        priority: 'high',
        isTravelBuffer: true,
        bufferForEventId: eventId,
        bufferMinutes: eventData.bufferMinutes,
        transitMode: eventData.transitMode || 'motorcycle',
        travelDestination: eventData.location,
        color: '#f59e0b',
      };
    }

    setEvents((prev) => {
      // Remove any previous buffer for this event
      const withoutOldBuffer = prev.filter((e) => e.bufferForEventId !== eventId);
      const exists = withoutOldBuffer.some((e) => e.id === eventId);
      let nextList = exists
        ? withoutOldBuffer.map((e) => (e.id === eventId ? fullEvent : e))
        : [...withoutOldBuffer, fullEvent];

      if (travelBufferItem) {
        nextList.push(travelBufferItem);
      }
      return nextList;
    });

    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;

    // Show Confirmation Dialog (Required by Workspace Integration skill)
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa sự kiện',
      message: `Bạn có chắc chắn muốn xóa "${ev.title}"? ${
        ev.googleEventId ? 'Sự kiện này cũng sẽ được xóa khỏi Google Calendar của bạn.' : ''
      }`,
      confirmLabel: 'Xóa vĩnh viễn',
      isDestructive: true,
      onConfirm: async () => {
        if (ev.googleEventId && accessToken) {
          try {
            await deleteGoogleCalendarEvent(accessToken, selectedCalendarId, ev.googleEventId);
          } catch (e) {
            console.error('Failed to delete Google event:', e);
          }
        }
        setEvents((prev) => prev.filter((e) => e.id !== eventId && e.bufferForEventId !== eventId));
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        setIsEventModalOpen(false);
        setSelectedEvent(null);
      },
    });
  };

  const handleToggleComplete = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, isCompleted: !e.isCompleted } : e))
    );
  };

  // AI Resolution Apply
  const handleApplyConflictResolution = (
    option: ConflictResolutionOption,
    conflict: ConflictItem
  ) => {
    if (option.actionType === 'shift_event_b' && option.suggestedStartTime && option.suggestedEndTime) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === conflict.eventB.id
            ? { ...e, startTime: option.suggestedStartTime!, endTime: option.suggestedEndTime! }
            : e
        )
      );
    } else if (option.actionType === 'shift_event_a' && option.suggestedStartTime && option.suggestedEndTime) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === conflict.eventA.id
            ? { ...e, startTime: option.suggestedStartTime!, endTime: option.suggestedEndTime! }
            : e
        )
      );
    } else if (option.actionType === 'shorten') {
      // Shorten event A to end before event B starts
      setEvents((prev) =>
        prev.map((e) =>
          e.id === conflict.eventA.id ? { ...e, endTime: conflict.eventB.startTime } : e
        )
      );
    }
    setIsConflictModalOpen(false);
    setActiveConflict(null);
  };

  // Natural Language Batch Add
  const handleApplyScheduledItems = (newItems: ScheduleItem[], _explanation: string) => {
    setEvents((prev) => [...prev, ...newItems]);
  };

  // Apply Persona Template
  const handleSelectTemplate = (template: TemplateData) => {
    const monday = new Date(currentDate);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);

    const adjustedItems: ScheduleItem[] = template.items.map((it, idx) => {
      // Map to current week's days
      const origStart = new Date(it.startTime);
      const origEnd = new Date(it.endTime);
      const dayOffset = idx % 5; // Monday to Friday

      const targetStart = new Date(monday);
      targetStart.setDate(monday.getDate() + dayOffset);
      targetStart.setHours(origStart.getHours(), origStart.getMinutes(), 0);

      const targetEnd = new Date(targetStart);
      targetEnd.setHours(origEnd.getHours(), origEnd.getMinutes(), 0);

      return {
        ...it,
        id: `tpl-${Date.now()}-${idx}`,
        startTime: targetStart.toISOString(),
        endTime: targetEnd.toISOString(),
      };
    });

    setEvents(adjustedItems);
  };

  // Schedule Team Meeting from Slot Finder / Poll
  const handleScheduleTeamMeeting = async (meetingData: Partial<ScheduleItem>, attendees: string[]) => {
    const newMeeting: ScheduleItem = {
      id: `team-meet-${Date.now()}`,
      title: meetingData.title || 'Họp Nhóm',
      description: meetingData.description || `Họp nhóm với: ${attendees.join(', ')}`,
      startTime: meetingData.startTime || new Date().toISOString(),
      endTime: meetingData.endTime || new Date(Date.now() + 3600000).toISOString(),
      category: 'meeting',
      priority: 'high',
      hasMeet: true,
      isSyncedToGoogle: !!accessToken,
      source: 'ai',
    };

    if (accessToken) {
      try {
        const gcalRes = await createGoogleCalendarEvent(
          accessToken,
          selectedCalendarId,
          newMeeting,
          true
        );
        newMeeting.googleEventId = gcalRes.id;
        if (gcalRes.hangoutLink) newMeeting.meetLink = gcalRes.hangoutLink;
      } catch (e) {
        console.error('Failed to create team meeting on Google Calendar:', e);
      }
    }

    setEvents((prev) => [...prev, newMeeting]);
  };

  // Apply AI Smart Auto-Reschedule
  const handleApplyRescheduledEvents = async (updatedEvents: ScheduleItem[], _impactSummary: string) => {
    const updatedMap = new Map<string, ScheduleItem>();
    updatedEvents.forEach((ev) => updatedMap.set(ev.id, ev));

    setEvents((prev) =>
      prev.map((item) => (updatedMap.has(item.id) ? updatedMap.get(item.id)! : item))
    );

    // If user has connected Google Calendar, sync updated events
    if (accessToken) {
      for (const ev of updatedEvents) {
        if (ev.isSyncedToGoogle && ev.googleEventId) {
          try {
            await updateGoogleCalendarEvent(
              accessToken,
              selectedCalendarId,
              ev.googleEventId,
              ev
            );
          } catch (e) {
            console.error('Failed to sync rescheduled event to Google Calendar:', e);
          }
        }
      }
    }

    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        user={user}
        hasWorkspaceToken={!!accessToken}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        persona={userProfile.persona}
        onPersonaChange={(p) => setUserProfile((prev) => ({ ...prev, persona: p }))}
        conflictCount={conflicts.length}
        onOpenConflicts={() => {
          if (conflicts.length > 0) {
            setActiveConflict(conflicts[0]);
            setIsConflictModalOpen(true);
          }
        }}
        onOpenPomodoro={() => {
          setPomodoroEvent(null);
          setIsPomodoroOpen(true);
        }}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenSheets={() => setIsSheetsOpen(true)}
        onOpenGmail={() => setIsGmailOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenTasks={() => setIsTasksOpen(true)}
        onOpenOcrScanner={() => setIsOcrOpen(true)}
        onOpenTeamMeeting={() => setIsTeamMeetingOpen(true)}
        onOpenReschedule={() => {
          setReschedulePreselectedId(null);
          setIsRescheduleOpen(true);
        }}
        onOpenEnergyMatcher={() => setIsEnergyMatcherOpen(true)}
        onOpenTravelBuffer={() => setIsTravelBufferOpen(true)}
        isOnline={isOnline}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Gemini AI Natural Language Input */}
        <NaturalLanguageInput
          currentEvents={events}
          userProfile={userProfile}
          onUpdateProfile={(partial) => setUserProfile((prev) => ({ ...prev, ...partial }))}
          weekStart={currentDate.toISOString()}
          onApplyScheduledItems={handleApplyScheduledItems}
          onOpenOcrScanner={() => setIsOcrOpen(true)}
        />

        {/* Layout Grid: Today Widget (desktop sidebar) + Timetable Calendar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Calendar Grid (3 columns on desktop) */}
          <div className="lg:col-span-3 space-y-6">
            <CalendarGrid
              currentDate={currentDate}
              onNavigateDate={(offsetDays) => {
                const next = new Date(currentDate);
                next.setDate(next.getDate() + offsetDays);
                setCurrentDate(next);
              }}
              onResetToday={() => setCurrentDate(new Date())}
              events={events}
              conflicts={conflicts}
              onSelectEvent={(ev) => {
                setSelectedEvent(ev);
                setIsEventModalOpen(true);
              }}
              onNewEventAtSlot={(startISO, endISO) => {
                setSelectedEvent({
                  startTime: startISO,
                  endTime: endISO,
                });
                setIsEventModalOpen(true);
              }}
              onResolveConflict={(conflict) => {
                setActiveConflict(conflict);
                setIsConflictModalOpen(true);
              }}
              onToggleComplete={handleToggleComplete}
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
              onSyncGoogleCalendar={handleSyncGoogleCalendar}
              isSyncing={isSyncingCalendar}
              chronotype={userProfile.chronotype}
              showEnergyOverlay={showEnergyOverlay}
              onOpenEnergyMatcher={() => setIsEnergyMatcherOpen(true)}
              onOpenTravelBuffer={() => setIsTravelBufferOpen(true)}
            />
          </div>

          {/* Right Sidebar: Today's Schedule & Focus Widget */}
          <div className="lg:col-span-1 space-y-4">
            <TodayWidget
              events={events}
              onSelectEvent={(ev) => {
                setSelectedEvent(ev);
                setIsEventModalOpen(true);
              }}
              onOpenPomodoroForEvent={(ev) => {
                setPomodoroEvent(ev);
                setIsPomodoroOpen(true);
              }}
              onToggleComplete={handleToggleComplete}
              onOpenReschedule={(eventId) => {
                setReschedulePreselectedId(eventId || null);
                setIsRescheduleOpen(true);
              }}
              onOpenTravelBuffer={() => setIsTravelBufferOpen(true)}
            />

            {/* Quick Actions Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 shadow-sm border border-zinc-200/90 dark:border-zinc-800 space-y-2 text-xs">
              <span className="font-bold text-zinc-700 dark:text-zinc-300 block mb-2">
                Hệ sinh thái Google
              </span>

              <button
                onClick={() => setIsTasksOpen(true)}
                className="w-full text-left px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-zinc-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition flex items-center justify-between"
              >
                <span>Google Tasks ({tasks.length} task)</span>
                <span className="text-[10px] font-bold text-emerald-600">Đồng bộ</span>
              </button>

              <button
                onClick={() => setIsSheetsOpen(true)}
                className="w-full text-left px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-zinc-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition flex items-center justify-between"
              >
                <span>Google Sheets</span>
                <span className="text-[10px] font-bold text-emerald-600">Xuất/Nhập</span>
              </button>

              <button
                onClick={() => setIsGmailOpen(true)}
                className="w-full text-left px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-700 dark:text-zinc-300 hover:text-rose-700 dark:hover:text-rose-300 transition flex items-center justify-between"
              >
                <span>Gmail Schedule Digest</span>
                <span className="text-[10px] font-bold text-rose-600">Gửi mail</span>
              </button>

              <button
                onClick={() => setIsOcrOpen(true)}
                className="w-full text-left px-3 py-2 rounded-xl bg-violet-50/70 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-800 dark:text-violet-200 transition flex items-center justify-between border border-violet-200/60 dark:border-violet-800/60"
              >
                <span className="font-semibold">Quét TKB từ Ảnh / PDF</span>
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">Gemini OCR</span>
              </button>

              <button
                onClick={() => setIsTeamMeetingOpen(true)}
                className="w-full text-left px-3 py-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 transition flex items-center justify-between border border-indigo-200/60 dark:border-indigo-800/60"
              >
                <span className="font-semibold">Giờ Họp Team & Poll</span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Smart Finder</span>
              </button>

              <button
                onClick={() => {
                  setReschedulePreselectedId(null);
                  setIsRescheduleOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-200 transition flex items-center justify-between border border-amber-200/60 dark:border-amber-800/60"
              >
                <span className="font-semibold">Dời Lịch Trễ AI</span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Auto-Reschedule</span>
              </button>

              <button
                onClick={() => setIsEnergyMatcherOpen(true)}
                className="w-full text-left px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-900 dark:text-amber-200 transition flex items-center justify-between border border-amber-300/70 dark:border-amber-700/60"
              >
                <span className="font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Nhịp Sinh Học AI
                </span>
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">Energy Matcher</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* MODALS */}
      {/* Event Create / Edit Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        event={selectedEvent}
        onClose={() => {
          setIsEventModalOpen(false);
          setSelectedEvent(null);
        }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        onOpenRescheduleForEvent={(eventId) => {
          setReschedulePreselectedId(eventId);
          setIsRescheduleOpen(true);
        }}
        hasGoogleConnected={!!accessToken}
      />

      {/* Google Tasks Drawer */}
      <TasksPanel
        isOpen={isTasksOpen}
        onClose={() => setIsTasksOpen(false)}
        tasks={tasks}
        taskLists={taskLists}
        selectedListId={selectedTaskListId}
        onSelectTaskList={handleSelectTaskList}
        onScheduleTaskToSlot={handleScheduleTaskToSlot}
        onAddNewTask={handleAddNewTask}
        onCompleteTask={handleCompleteGoogleTask}
        isLoading={isLoadingTasks}
        hasGoogleConnected={!!accessToken}
        onConnectGoogle={handleLogin}
      />

      {/* Conflict Resolver Modal with AI */}
      <ConflictResolverModal
        isOpen={isConflictModalOpen}
        conflict={activeConflict}
        allEvents={events}
        onClose={() => {
          setIsConflictModalOpen(false);
          setActiveConflict(null);
        }}
        onApplyResolution={handleApplyConflictResolution}
      />

      {/* Pomodoro Timer Modal */}
      <PomodoroTimer
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
        activeEvent={pomodoroEvent}
        onPomodoroComplete={(eventId) => {
          if (eventId) {
            setEvents((prev) =>
              prev.map((e) =>
                e.id === eventId
                  ? { ...e, completedPomodoros: (e.completedPomodoros || 0) + 1 }
                  : e
              )
            );
          }
        }}
      />

      {/* Google Sheets Modal */}
      <SheetsModal
        isOpen={isSheetsOpen}
        onClose={() => setIsSheetsOpen(false)}
        events={events}
        accessToken={accessToken}
        onImportItems={(imported) => {
          const newItems: ScheduleItem[] = imported.map((item, idx) => ({
            id: `import-${Date.now()}-${idx}`,
            title: item.title || 'Môn học mới',
            description: item.description || '',
            startTime: item.startTime || new Date().toISOString(),
            endTime: item.endTime || new Date(Date.now() + 3600000).toISOString(),
            category: item.category || 'study',
            priority: item.priority || 'medium',
            hasMeet: item.hasMeet,
            meetLink: item.meetLink,
            source: 'sheets',
          }));
          setEvents((prev) => [...prev, ...newItems]);
        }}
        onConnectGoogle={handleLogin}
      />

      {/* Gmail Digest Modal */}
      <GmailModal
        isOpen={isGmailOpen}
        onClose={() => setIsGmailOpen(false)}
        events={events}
        userEmail={userProfile.email}
        userName={userProfile.name}
        accessToken={accessToken}
        onConnectGoogle={handleLogin}
        onRequestConfirmSend={(onConfirmSend, details) => {
          setConfirmConfig({
            isOpen: true,
            title: 'Xác nhận gửi email qua Gmail',
            message: `Bạn có đồng ý gửi email này qua hộp thư cá nhân của bạn không?`,
            confirmLabel: 'Gửi Email',
            isDestructive: false,
            itemDetails: [details],
            onConfirm: async () => {
              setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
              await onConfirmSend();
            },
          });
        }}
      />

      {/* Analytics & Productivity Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        events={events}
        userProfile={userProfile}
        onApplyOptimizedEvents={(optimized) => {
          setEvents(optimized);
        }}
      />

      {/* Template Library Modal */}
      <TemplateLibraryModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Multimodal OCR Timetable Scanner Modal */}
      <OcrScannerModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        weekStart={currentDate.toISOString()}
        onApplyOcrItems={(newItems, _summary) => {
          setEvents((prev) => [...prev, ...newItems]);
        }}
      />

      {/* Team Free Slot Finder & Meeting Poll Modal */}
      <TeamMeetingModal
        isOpen={isTeamMeetingOpen}
        onClose={() => setIsTeamMeetingOpen(false)}
        currentEvents={events}
        weekStart={currentDate.toISOString()}
        onScheduleMeeting={handleScheduleTeamMeeting}
      />

      {/* Smart Auto-Reschedule when delayed Modal */}
      <SmartRescheduleModal
        isOpen={isRescheduleOpen}
        onClose={() => {
          setIsRescheduleOpen(false);
          setReschedulePreselectedId(null);
        }}
        currentEvents={events}
        preselectedEventId={reschedulePreselectedId}
        targetDate={currentDate.toISOString()}
        onApplyRescheduledEvents={handleApplyRescheduledEvents}
      />

      {/* AI Energy-to-Task Matcher Modal */}
      <EnergyMatcherModal
        isOpen={isEnergyMatcherOpen}
        onClose={() => setIsEnergyMatcherOpen(false)}
        events={events}
        currentChronotype={userProfile.chronotype}
        onUpdateChronotype={handleUpdateChronotype}
        onApplyOptimizedEvents={(optimized) => {
          setEvents(optimized);
          saveLocalSchedule(optimized);
        }}
        currentDate={currentDate}
        showEnergyOverlay={showEnergyOverlay}
        onToggleEnergyOverlay={handleToggleEnergyOverlay}
      />

      {/* AI Travel Buffer & Preparation Time Modal */}
      <TravelBufferModal
        isOpen={isTravelBufferOpen}
        onClose={() => setIsTravelBufferOpen(false)}
        events={events}
        onApplyBuffers={(newEvents) => {
          setEvents(newEvents);
          saveLocalSchedule(newEvents);
        }}
      />

      {/* User Confirmation Modal (Required by Workspace Integration Skill) */}
      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        cancelLabel={confirmConfig.cancelLabel}
        isDestructive={confirmConfig.isDestructive}
        itemDetails={confirmConfig.itemDetails}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
