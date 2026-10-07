import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { User } from "firebase/auth";
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from "./services/firebase";
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
  UiTheme,
} from "./types/schedule";
import {
  listGoogleCalendars,
  listCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "./services/calendarApi";
import {
  listTaskLists,
  listGoogleTasks,
  createGoogleTask,
  markGoogleTaskCompleted,
} from "./services/tasksApi";
import {
  loadLocalSchedule,
  saveLocalSchedule,
  loadUserProfile,
  saveUserProfile,
  DEFAULT_USER_PROFILE,
} from "./services/storage";
import {
  saveEventsToFirestore,
  loadEventsFromFirestore,
  saveProfileToFirestore,
  loadProfileFromFirestore,
  subscribeToEvents,
} from "./services/firestoreService";
import { TEMPLATE_LIBRARY } from "./data/templateLibrary";

// UI Components
import { Navbar } from "./components/Navbar";
import { CalendarGrid } from "./components/CalendarGrid";
import { NaturalLanguageInput } from "./components/NaturalLanguageInput";
import { EventModal } from "./components/EventModal";
import { TasksPanel } from "./components/TasksPanel";
import { ConflictResolverModal } from "./components/ConflictResolverModal";
import { PomodoroTimer } from "./components/PomodoroTimer";
import { SheetsModal } from "./components/SheetsModal";
import { GmailModal } from "./components/GmailModal";
import { AnalyticsModal } from "./components/AnalyticsModal";
import { TemplateLibraryModal } from "./components/TemplateLibraryModal";
import { TodayWidget } from "./components/TodayWidget";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { OcrScannerModal } from "./components/OcrScannerModal";
import { TeamMeetingModal } from "./components/TeamMeetingModal";
import { SmartRescheduleModal } from "./components/SmartRescheduleModal";
import { EnergyMatcherModal } from "./components/EnergyMatcherModal";
import { TravelBufferModal } from "./components/TravelBufferModal";
import { CommandPalette } from "./components/CommandPalette";

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  // Flag để tránh infinite loop: khi Firestore snapshot cập nhật events,
  // không sync ngược lại lên Firestore
  const isLoadingFromFirestoreRef = useRef(false);
  // Ref để cleanup Firestore realtime listener khi logout
  const firestoreUnsubRef = useRef<(() => void) | null>(null);

  // Network state
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Theme state with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "dark") return true;
      if (saved === "light") return false;
      return (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    } catch {
      return false;
    }
  });

  // UI Theme state ("cute" vs "minimal") with localStorage persistence
  const [uiTheme, setUiTheme] = useState<UiTheme>(() => {
    try {
      const saved = localStorage.getItem("smart_schedule_ui_theme");
      if (saved === "cute" || saved === "capybara" || saved === "yohan" || saved === "minimal") return saved;
      return "cute";
    } catch {
      return "cute";
    }
  });

  const handleToggleUiTheme = (newTheme: UiTheme) => {
    setUiTheme(newTheme);
    try {
      localStorage.setItem("smart_schedule_ui_theme", newTheme);
    } catch (e) {
      console.error("Failed to save ui theme:", e);
    }
  };

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    loadUserProfile(),
  );

  // Current Date & View
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"week" | "day" | "agenda">("week");

  // Schedule Events — bắt đầu trống, không có dữ liệu mẫu
  const [events, setEvents] = useState<ScheduleItem[]>(() => {
    const saved = loadLocalSchedule();
    // Chỉ dùng data local nếu có và không phải dữ liệu mẫu init-
    if (
      saved &&
      saved.length > 0 &&
      saved.some((e) => !e.id.startsWith("init-"))
    ) {
      return saved;
    }
    return [];
  });

  // Google Calendar state
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] =
    useState<string>("primary");
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [syncToast, setSyncToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Google Tasks state
  const [taskLists, setTaskLists] = useState<{ id: string; title: string }[]>(
    [],
  );
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>("");
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Modals state
  const [selectedEvent, setSelectedEvent] =
    useState<Partial<ScheduleItem> | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const [activeConflict, setActiveConflict] = useState<ConflictItem | null>(
    null,
  );
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
  const [reschedulePreselectedId, setReschedulePreselectedId] = useState<
    string | null
  >(null);
  const [isEnergyMatcherOpen, setIsEnergyMatcherOpen] = useState(false);
  const [isTravelBufferOpen, setIsTravelBufferOpen] = useState(false);
  const [showEnergyOverlay, setShowEnergyOverlay] = useState<boolean>(() => {
    return localStorage.getItem("smart_schedule_energy_overlay") === "true";
  });

  const handleToggleEnergyOverlay = (val: boolean) => {
    setShowEnergyOverlay(val);
    localStorage.setItem(
      "smart_schedule_energy_overlay",
      val ? "true" : "false",
    );
  };

  const handleUpdateChronotype = (c: Chronotype) => {
    const updated = { ...userProfile, chronotype: c };
    setUserProfile(updated);
    saveUserProfile(updated);
  };

  // Command Palette (Ctrl+K) state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // State riêng cho dialog first-login Firestore — tránh conflict với confirmConfig xóa event
  const [firestoreDialogConfig, setFirestoreDialogConfig] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
  }>({ isOpen: false, onConfirm: () => {} });

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setUser(firebaseUser);
        if (token) {
          setAccessToken(token);
          loadRemoteCalendars(token);
          loadRemoteTasks(token);
          setUserProfile((prev) => ({
            ...prev,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || prev.name,
            avatarUrl: firebaseUser.photoURL || undefined,
          }));
        }

        // Load dữ liệu từ Firestore khi user đăng nhập
        try {
          const [firestoreEvents, firestoreProfile] = await Promise.all([
            loadEventsFromFirestore(firebaseUser.uid),
            loadProfileFromFirestore(firebaseUser.uid),
          ]);

          const isFirstLogin =
            firestoreEvents.length === 0 && !firestoreProfile;
          const hasLocalData =
            loadLocalSchedule().filter((e) => !e.id.startsWith("init-"))
              .length > 0;

          if (firestoreEvents.length > 0) {
            // Có data trên cloud → dùng cloud, bỏ qua local
            setEvents(firestoreEvents);
            saveLocalSchedule(firestoreEvents);
          } else if (isFirstLogin && hasLocalData) {
            // Lần đầu đăng nhập + có data local do người dùng tự tạo → hỏi
            setFirestoreDialogConfig({
              isOpen: true,
              onConfirm: async () => {
                const localEvents = loadLocalSchedule();
                await saveEventsToFirestore(firebaseUser.uid, localEvents);
                setFirestoreDialogConfig((prev) => ({
                  ...prev,
                  isOpen: false,
                }));
              },
            });
          } else if (isFirstLogin) {
            // Lần đầu đăng nhập, chỉ có data mẫu init- → xóa sạch, bắt đầu trống
            setEvents([]);
            saveLocalSchedule([]);
          }

          if (firestoreProfile) {
            setUserProfile((prev) => ({
              ...prev,
              ...firestoreProfile,
              email: firebaseUser.email || firestoreProfile.email,
              name: firebaseUser.displayName || firestoreProfile.name,
              avatarUrl: firebaseUser.photoURL || firestoreProfile.avatarUrl,
            }));
            saveUserProfile(firestoreProfile);
          }
        } catch (e) {
          console.warn("Firestore load failed, using local data:", e);
        }

        // Bắt đầu lắng nghe thay đổi realtime từ Firestore
        if (firestoreUnsubRef.current) firestoreUnsubRef.current();
        firestoreUnsubRef.current = subscribeToEvents(
          firebaseUser.uid,
          (updatedEvents) => {
            isLoadingFromFirestoreRef.current = true;
            setEvents(updatedEvents);
            saveLocalSchedule(updatedEvents);
            // Reset flag sau một tick để useEffect save không sync ngược lại
            setTimeout(() => {
              isLoadingFromFirestoreRef.current = false;
            }, 0);
          },
        );
      },
      () => {
        setUser(null);
        setAccessToken(null);
        // Dừng realtime listener khi logout
        if (firestoreUnsubRef.current) {
          firestoreUnsubRef.current();
          firestoreUnsubRef.current = null;
        }
      },
    );
    return () => {
      unsubscribe();
      if (firestoreUnsubRef.current) firestoreUnsubRef.current();
    };
  }, []);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Save events locally + sync lên Firestore nếu đã đăng nhập
  // Dùng flag để tránh infinite loop khi nhận update từ Firestore realtime
  useEffect(() => {
    saveLocalSchedule(events);
    if (user?.uid && !isLoadingFromFirestoreRef.current) {
      saveEventsToFirestore(user.uid, events).catch((e) =>
        console.warn("Firestore events sync failed:", e),
      );
    }
  }, [events, user?.uid]);

  // Save profile locally + sync lên Firestore nếu đã đăng nhập
  useEffect(() => {
    saveUserProfile(userProfile);
    if (user?.uid) {
      saveProfileToFirestore(user.uid, userProfile).catch((e) =>
        console.warn("Firestore profile sync failed:", e),
      );
    }
  }, [userProfile, user?.uid]);

  // Dark mode effect & persistence
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
        localStorage.setItem("theme", "light");
      }
    } catch (e) {
      console.warn("Theme save failed:", e);
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
          const overlapMinutes = Math.round(
            (overlapEnd - overlapStart) / (1000 * 60),
          );
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
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (customHint?: string) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const emailHint = customHint || user?.email || undefined;
      const res = await googleSignIn(emailHint);
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setUserProfile((prev) => ({
          ...prev,
          email: res.user.email || "",
          name: res.user.displayName || prev.name,
          avatarUrl: res.user.photoURL || undefined,
        }));
        // Load remote data
        loadRemoteCalendars(res.accessToken);
        loadRemoteTasks(res.accessToken);
      }
    } catch (e: any) {
      console.error("Google Sign in failed:", e);
      // Bỏ qua lỗi user tự đóng popup
      if (
        e?.code !== "auth/popup-closed-by-user" &&
        e?.code !== "auth/cancelled-popup-request"
      ) {
        setLoginError(
          e?.message || "Đăng nhập Google thất bại. Vui lòng thử lại.",
        );
      }
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
      console.warn("Could not load Google calendars:", e);
    }
  }, []);

  const handleSyncGoogleCalendar = async () => {
    if (!accessToken) {
      handleLogin();
      return;
    }

    setIsSyncingCalendar(true);
    try {
      let syncedCount = 0;
      const targetCalId = selectedCalendarId;

      // 1. Đồng bộ TẤT CẢ sự kiện trong lịch trình sang Google Calendar (không cần tick từng cái)
      const currentEvents = [...events];
      for (const ev of currentEvents) {
        const calId = ev.googleCalendarId || targetCalId;
        const reminderMins =
          ev.reminderMinutes ?? userProfile.defaultMeetReminderMinutes ?? 30;

        if (!ev.googleEventId) {
          // Chưa có trên Google Calendar -> Tạo mới ngay
          try {
            const gcalRes = await createGoogleCalendarEvent(
              accessToken,
              calId,
              ev,
              ev.hasMeet,
              reminderMins,
            );
            ev.googleEventId = gcalRes.id;
            ev.googleCalendarId = calId;
            ev.isSyncedToGoogle = true;
            if (gcalRes.hangoutLink) ev.meetLink = gcalRes.hangoutLink;
            syncedCount++;
          } catch (pushErr) {
            console.warn(
              "Failed to push unsynced event to Google Calendar:",
              pushErr,
            );
          }
        } else {
          // Đã có trên Google Calendar -> Cập nhật để đồng bộ nội dung mới nhất
          try {
            await updateGoogleCalendarEvent(
              accessToken,
              calId,
              ev.googleEventId,
              ev,
              reminderMins,
            );
            ev.isSyncedToGoogle = true;
            syncedCount++;
          } catch (updateErr) {
            console.warn("Failed to update event on Google Calendar:", updateErr);
          }
        }
      }

      // 2. Tải danh sách sự kiện từ Google Calendar (+- 35 ngày quanh ngày hiện tại)
      const rangeStart = new Date(currentDate);
      rangeStart.setDate(rangeStart.getDate() - 35);
      rangeStart.setHours(0, 0, 0, 0);

      const rangeEnd = new Date(currentDate);
      rangeEnd.setDate(rangeEnd.getDate() + 45);
      rangeEnd.setHours(23, 59, 59, 999);

      let remoteEvents: ScheduleItem[] = [];
      try {
        remoteEvents = await listCalendarEvents(
          accessToken,
          targetCalId,
          rangeStart.toISOString(),
          rangeEnd.toISOString(),
        );
      } catch (listErr) {
        console.warn("Failed to fetch remote events from Google Calendar:", listErr);
      }

      // 3. Hợp nhất 2 chiều thông minh: không mất sự kiện local, nạp sự kiện mới từ Google
      const remoteByGId = new Map(
        remoteEvents.map((r) => [r.googleEventId, r]),
      );

      const mergedLocals = currentEvents.map((local) => {
        if (local.googleEventId && remoteByGId.has(local.googleEventId)) {
          const remote = remoteByGId.get(local.googleEventId)!;
          remoteByGId.delete(local.googleEventId);
          return {
            ...local,
            title: remote.title || local.title,
            startTime: remote.startTime || local.startTime,
            endTime: remote.endTime || local.endTime,
            description: remote.description || local.description,
            meetLink: remote.meetLink || local.meetLink,
            hasMeet: remote.hasMeet || local.hasMeet,
            location: remote.location || local.location,
            isSyncedToGoogle: true,
          };
        }
        return {
          ...local,
          isSyncedToGoogle: true,
        };
      });

      // Bổ sung các sự kiện mới chỉ có trên Google Calendar
      const brandNewRemotes = Array.from(remoteByGId.values());
      const finalEvents = [...mergedLocals, ...brandNewRemotes];

      setEvents(finalEvents);
      saveLocalSchedule(finalEvents);

      setSyncToast({
        message: `Đã đồng bộ tất cả thành công (${finalEvents.length} sự kiện)!`,
        type: "success",
      });
      setTimeout(() => setSyncToast(null), 4000);
    } catch (e: any) {
      console.error("Failed to sync Google calendar:", e);
      setSyncToast({
        message: `Đồng bộ thất bại: ${e.message || "Vui lòng kiểm tra kết nối"}`,
        type: "error",
      });
      setTimeout(() => setSyncToast(null), 5000);
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
        const taskItems = await listGoogleTasks(
          token,
          lists[0].id,
          lists[0].title,
        );
        setTasks(taskItems);
      }
    } catch (e) {
      console.warn("Could not load Google tasks:", e);
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
      const taskItems = await listGoogleTasks(
        accessToken,
        listId,
        found?.title || "",
      );
      setTasks(taskItems);
    } catch (e) {
      console.error("Failed to load tasks for list:", e);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleAddNewTask = async (title: string, due?: string) => {
    if (!accessToken || !selectedTaskListId) return;
    const newTask = await createGoogleTask(
      accessToken,
      selectedTaskListId,
      title,
      undefined,
      due,
    );
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleCompleteGoogleTask = async (task: GoogleTaskItem) => {
    if (!accessToken) return;
    await markGoogleTaskCompleted(accessToken, task.listId, task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  // Schedule task into next available slot
  const handleScheduleTaskToSlot = (task: GoogleTaskItem) => {
    const baseDate = new Date();
    baseDate.setMinutes(0, 0, 0);
    let targetHour = Math.max(8, baseDate.getHours() + 1);
    if (targetHour >= 21) {
      baseDate.setDate(baseDate.getDate() + 1);
      targetHour = 9;
    }

    // Dùng local date string để tránh lỗi timezone UTC vs local
    const localDate = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, "0")}-${String(baseDate.getDate()).padStart(2, "0")}`;
    const startISO = `${localDate}T${String(targetHour).padStart(2, "0")}:00:00`;
    const endISO = `${localDate}T${String(targetHour + 1).padStart(2, "0")}:00:00`;

    const newEvent: ScheduleItem = {
      id: `task-sched-${Date.now()}`,
      title: task.title,
      description: task.notes || "Được lên lịch tự động từ Google Tasks",
      startTime: startISO,
      endTime: endISO,
      category: "work",
      priority: "high",
      pomodoroBlocks: 2,
      source: "google_tasks",
      isSyncedToGoogle: true,
    };

    setEvents((prev) => [...prev, newEvent]);
    setIsTasksOpen(false);
  };

  // Event Mutations with Workspace Confirmation
  const handleSaveEvent = async (eventData: Partial<ScheduleItem>) => {
    const isNew = !eventData.id;
    const eventId = eventData.id || `evt-${Date.now()}`;
    const existing = eventData.id
      ? events.find((e) => e.id === eventData.id)
      : undefined;
    const googleEventId = eventData.googleEventId || existing?.googleEventId;
    const googleCalendarId =
      eventData.googleCalendarId ||
      existing?.googleCalendarId ||
      selectedCalendarId;

    const fullEvent: ScheduleItem = {
      id: eventId,
      title: eventData.title || "(Không có tiêu đề)",
      description: eventData.description,
      startTime: eventData.startTime || new Date().toISOString(),
      endTime:
        eventData.endTime || new Date(Date.now() + 3600000).toISOString(),
      category: eventData.category || "study",
      priority: eventData.priority || "medium",
      location: eventData.location,
      hasMeet: eventData.hasMeet,
      meetLink: eventData.meetLink,
      pomodoroBlocks: eventData.pomodoroBlocks || 1,
      isSyncedToGoogle: eventData.isSyncedToGoogle !== false,
      source: eventData.source || existing?.source || "local",
      bufferMinutes: eventData.bufferMinutes,
      transitMode: eventData.transitMode,
      googleEventId,
      googleCalendarId,
      reminderMinutes: eventData.reminderMinutes,
    };

    // If sync with Google Calendar is requested and accessToken is present
    if (accessToken) {
      const reminderMins =
        eventData.reminderMinutes ??
        userProfile.defaultMeetReminderMinutes ??
        30;
      const targetCalId = fullEvent.googleCalendarId || selectedCalendarId;

      if (fullEvent.isSyncedToGoogle) {
        try {
          if (!fullEvent.googleEventId) {
            // Chưa có trên Google Calendar -> Tạo mới
            const gcalRes = await createGoogleCalendarEvent(
              accessToken,
              targetCalId,
              fullEvent,
              fullEvent.hasMeet,
              reminderMins,
            );
            fullEvent.googleEventId = gcalRes.id;
            fullEvent.googleCalendarId = targetCalId;
            if (gcalRes.hangoutLink) fullEvent.meetLink = gcalRes.hangoutLink;
          } else {
            // ĐÃ CÓ trên Google Calendar -> Cập nhật trực tiếp (PATCH), KHÔNG tạo mới thêm
            await updateGoogleCalendarEvent(
              accessToken,
              targetCalId,
              fullEvent.googleEventId,
              fullEvent,
              reminderMins,
            );
          }
        } catch (err) {
          console.error("Google calendar sync error:", err);
        }
      } else if (existing?.googleEventId && !fullEvent.isSyncedToGoogle) {
        // Bỏ chọn sync Google -> Xóa khỏi Google Calendar
        try {
          await deleteGoogleCalendarEvent(
            accessToken,
            existing.googleCalendarId || selectedCalendarId,
            existing.googleEventId,
          );
          fullEvent.googleEventId = undefined;
        } catch (err) {
          console.error(
            "Failed to delete un-synced event from Google Calendar:",
            err,
          );
        }
      }
    }

    // Auto-create or remove associated travel buffer
    let travelBufferItem: ScheduleItem | null = null;
    if (eventData.bufferMinutes && eventData.bufferMinutes > 0) {
      const bufferEnd = new Date(fullEvent.startTime);
      const bufferStart = new Date(
        bufferEnd.getTime() - eventData.bufferMinutes * 60 * 1000,
      );
      travelBufferItem = {
        id: `buf-for-${eventId}`,
        title: `🚗 Di chuyển: ${eventData.location || fullEvent.title}`,
        description: `Thời gian đệm di chuyển & chuẩn bị (${eventData.bufferMinutes} phút)`,
        startTime: bufferStart.toISOString(),
        endTime: bufferEnd.toISOString(),
        category: "break",
        priority: "high",
        isTravelBuffer: true,
        bufferForEventId: eventId,
        bufferMinutes: eventData.bufferMinutes,
        transitMode: eventData.transitMode || "motorcycle",
        travelDestination: eventData.location,
        color: "#f59e0b",
      };
    }

    setEvents((prev) => {
      // Remove any previous buffer for this event
      const withoutOldBuffer = prev.filter(
        (e) => e.bufferForEventId !== eventId,
      );
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
      title: "Xóa sự kiện",
      message: `Bạn có chắc chắn muốn xóa "${ev.title}"? ${
        ev.googleEventId
          ? "Sự kiện này cũng sẽ được xóa khỏi Google Calendar của bạn."
          : ""
      }`,
      confirmLabel: "Xóa vĩnh viễn",
      isDestructive: true,
      onConfirm: async () => {
        if (ev.googleEventId && accessToken) {
          try {
            await deleteGoogleCalendarEvent(
              accessToken,
              ev.googleCalendarId || selectedCalendarId,
              ev.googleEventId,
            );
          } catch (e) {
            console.error("Failed to delete Google event:", e);
          }
        }
        setEvents((prev) =>
          prev.filter(
            (e) => e.id !== eventId && e.bufferForEventId !== eventId,
          ),
        );
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        setIsEventModalOpen(false);
        setSelectedEvent(null);
      },
    });
  };

  // Drag & Drop / Resize time updater
  const handleUpdateEventTimes = useCallback(
    async (eventId: string, newStartTime: string, newEndTime: string) => {
      const targetEvent = events.find((e) => e.id === eventId);
      if (!targetEvent) return;

      const updatedEvent: ScheduleItem = {
        ...targetEvent,
        startTime: newStartTime,
        endTime: newEndTime,
      };

      setEvents((prev) => {
        const next = prev.map((e) => {
          if (e.id === eventId) return updatedEvent;
          if (e.bufferForEventId === eventId && e.bufferMinutes) {
            const bufEnd = new Date(newStartTime);
            const bufStart = new Date(
              bufEnd.getTime() - e.bufferMinutes * 60 * 1000,
            );
            return {
              ...e,
              startTime: bufStart.toISOString(),
              endTime: bufEnd.toISOString(),
            };
          }
          return e;
        });
        saveLocalSchedule(next);
        return next;
      });

      // Sync to Google Calendar if already synced
      if (accessToken) {
        const calId = targetEvent.googleCalendarId || selectedCalendarId;
        if (targetEvent.googleEventId) {
          try {
            await updateGoogleCalendarEvent(
              accessToken,
              calId,
              targetEvent.googleEventId,
              updatedEvent,
            );
          } catch (err) {
            console.error(
              "Failed to update moved event on Google Calendar:",
              err,
            );
          }
        } else if (targetEvent.isSyncedToGoogle) {
          try {
            const gcalRes = await createGoogleCalendarEvent(
              accessToken,
              calId,
              updatedEvent,
              updatedEvent.hasMeet,
              targetEvent.reminderMinutes ?? 30,
            );
            updatedEvent.googleEventId = gcalRes.id;
            updatedEvent.googleCalendarId = calId;
            setEvents((prev) => {
              const next = prev.map((e) =>
                e.id === eventId ? updatedEvent : e,
              );
              saveLocalSchedule(next);
              return next;
            });
          } catch (err) {
            console.error("Failed to sync moved event to Google Calendar:", err);
          }
        }
      }
    },
    [events, accessToken, selectedCalendarId],
  );

  const handleToggleComplete = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, isCompleted: !e.isCompleted } : e,
      ),
    );
  };

  // AI Resolution Apply
  const handleApplyConflictResolution = (
    option: ConflictResolutionOption,
    conflict: ConflictItem,
  ) => {
    if (
      option.actionType === "shift_event_b" &&
      option.suggestedStartTime &&
      option.suggestedEndTime
    ) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === conflict.eventB.id
            ? {
                ...e,
                startTime: option.suggestedStartTime!,
                endTime: option.suggestedEndTime!,
              }
            : e,
        ),
      );
    } else if (
      option.actionType === "shift_event_a" &&
      option.suggestedStartTime &&
      option.suggestedEndTime
    ) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === conflict.eventA.id
            ? {
                ...e,
                startTime: option.suggestedStartTime!,
                endTime: option.suggestedEndTime!,
              }
            : e,
        ),
      );
    } else if (option.actionType === "shorten") {
      // Dùng targetEventId nếu AI trả về, fallback về eventA
      const targetId = option.targetEventId || conflict.eventA.id;
      const otherEvent =
        targetId === conflict.eventA.id ? conflict.eventB : conflict.eventA;
      setEvents((prev) =>
        prev.map((e) =>
          e.id === targetId
            ? { ...e, endTime: option.suggestedEndTime || otherEvent.startTime }
            : e,
        ),
      );
    }
    setIsConflictModalOpen(false);
    setActiveConflict(null);
  };

  // Natural Language Batch Add
  const handleApplyScheduledItems = (
    newItems: ScheduleItem[],
    _explanation: string,
  ) => {
    setEvents((prev) => [...prev, ...newItems]);
  };

  // Apply Persona Template
  const handleSelectTemplate = (template: TemplateData) => {
    const monday = new Date(currentDate);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);

    const adjustedItems: ScheduleItem[] = template.items.map((it, idx) => {
      const origStart = new Date(it.startTime);
      const origEnd = new Date(it.endTime);

      // Lấy ngày trong tuần từ template (0=Sun..6=Sat), map sang tuần hiện tại
      const origDay = origStart.getDay(); // 0=CN, 1=T2...6=T7
      // Tính offset từ Monday: Mon=0, Tue=1, ... Sun=6
      const dayOffset = origDay === 0 ? 6 : origDay - 1;

      const targetStart = new Date(monday);
      targetStart.setDate(monday.getDate() + dayOffset);
      targetStart.setHours(origStart.getHours(), origStart.getMinutes(), 0, 0);

      const duration = origEnd.getTime() - origStart.getTime();
      const targetEnd = new Date(targetStart.getTime() + duration);

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
  const handleScheduleTeamMeeting = async (
    meetingData: Partial<ScheduleItem>,
    attendees: string[],
  ) => {
    const newMeeting: ScheduleItem = {
      id: `team-meet-${Date.now()}`,
      title: meetingData.title || "Họp Nhóm",
      description:
        meetingData.description || `Họp nhóm với: ${attendees.join(", ")}`,
      startTime: meetingData.startTime || new Date().toISOString(),
      endTime:
        meetingData.endTime || new Date(Date.now() + 3600000).toISOString(),
      category: "meeting",
      priority: "high",
      hasMeet: true,
      isSyncedToGoogle: !!accessToken,
      source: "ai",
    };

    if (accessToken) {
      try {
        const gcalRes = await createGoogleCalendarEvent(
          accessToken,
          selectedCalendarId,
          newMeeting,
          true,
          userProfile.defaultMeetReminderMinutes || 30,
        );
        newMeeting.googleEventId = gcalRes.id;
        if (gcalRes.hangoutLink) newMeeting.meetLink = gcalRes.hangoutLink;
      } catch (e) {
        console.error("Failed to create team meeting on Google Calendar:", e);
      }
    }

    setEvents((prev) => [...prev, newMeeting]);
  };

  // Apply AI Smart Auto-Reschedule
  const handleApplyRescheduledEvents = async (
    updatedEvents: ScheduleItem[],
    _impactSummary: string,
  ) => {
    const updatedMap = new Map<string, ScheduleItem>();
    updatedEvents.forEach((ev) => updatedMap.set(ev.id, ev));

    setEvents((prev) =>
      prev.map((item) =>
        updatedMap.has(item.id) ? updatedMap.get(item.id)! : item,
      ),
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
              ev,
            );
          } catch (e) {
            console.error(
              "Failed to sync rescheduled event to Google Calendar:",
              e,
            );
          }
        }
      }
    }

    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch (e) {}
  };

  return (
    <div className={`min-h-screen relative overflow-x-hidden ${
      uiTheme === "yohan"
        ? "bg-[#FAF9F6] dark:bg-[#121214] text-zinc-900 dark:text-zinc-100"
        : uiTheme === "capybara"
          ? "bg-[#FFF9F2] dark:bg-[#1A1410] text-[#3D2619] dark:text-[#F7EFE8]"
          : "bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
    } flex flex-col font-sans selection:bg-amber-500 selection:text-white transition-colors duration-200`}>
      {/* Cute Floating Bubbles & Sparkles Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Soft Pastel Marshmallow Blobs */}
        <div className="absolute -top-24 -left-24 w-[32rem] h-[32rem] rounded-full bg-gradient-to-tr from-pink-400/20 via-purple-300/15 to-indigo-300/10 blur-[100px] animate-aurora-1 dark:from-purple-900/30 dark:to-pink-900/20" />
        <div className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-bl from-amber-300/15 via-rose-300/15 to-pink-400/10 blur-[100px] animate-aurora-2 dark:from-fuchsia-950/40 dark:to-rose-950/30" />
        <div className="absolute -bottom-24 left-1/4 w-[32rem] h-[32rem] rounded-full bg-gradient-to-tr from-teal-300/15 via-sky-300/15 to-emerald-300/10 blur-[100px] animate-aurora-3 dark:from-teal-950/40 dark:to-indigo-950/30" />

        {/* Cute Floating Whimsical Decors (Soft Clouds & Twinkle Stars) */}
        {uiTheme === "cute" && (
          <>
            <span className="absolute top-20 left-[8%] text-pink-400/30 dark:text-pink-400/20 text-xl font-bold animate-star-twinkle" style={{ animationDelay: "0.2s" }}>✦</span>
            <span className="absolute top-44 right-[12%] text-amber-400/30 dark:text-amber-400/20 text-lg font-bold animate-float-bob" style={{ animationDelay: "1s" }}>✨</span>
            <span className="absolute top-[60%] left-[5%] text-indigo-400/25 dark:text-indigo-400/20 text-2xl font-bold animate-float-bob-slow" style={{ animationDelay: "2s" }}>☁️</span>
            <span className="absolute top-[75%] right-[8%] text-purple-400/30 dark:text-purple-400/20 text-lg font-bold animate-star-twinkle" style={{ animationDelay: "1.5s" }}>✦</span>
            <span className="absolute bottom-16 left-[20%] text-rose-400/25 dark:text-rose-400/15 text-xl font-bold animate-float-bob" style={{ animationDelay: "0.8s" }}>🌸</span>
          </>
        )}

        {/* Capybara Floating Citrus & Zen Leaves Decors */}
        {uiTheme === "capybara" && (
          <>
            <span className="absolute top-20 left-[7%] text-xl font-bold animate-float-bob opacity-40 select-none" style={{ animationDelay: "0.2s" }}>🍊</span>
            <span className="absolute top-44 right-[10%] text-lg font-bold animate-float-bob-slow opacity-40 select-none" style={{ animationDelay: "1s" }}>🍃</span>
            <span className="absolute top-[60%] left-[4%] text-xl font-bold animate-float-bob opacity-30 select-none" style={{ animationDelay: "2s" }}>🌱</span>
            <span className="absolute top-[75%] right-[7%] text-lg font-bold animate-float-bob-slow opacity-40 select-none" style={{ animationDelay: "1.5s" }}>🍊</span>
            <span className="absolute bottom-16 left-[18%] text-base font-bold animate-float-bob opacity-35 select-none" style={{ animationDelay: "0.8s" }}>🍩</span>
          </>
        )}

        {/* Go Yohan Floating Cafe & Comic Decors */}
        {uiTheme === "yohan" && (
          <>
            <span className="absolute top-20 left-[7%] text-xl font-bold animate-float-bob opacity-40 select-none" style={{ animationDelay: "0.2s" }}>☕</span>
            <span className="absolute top-44 right-[10%] text-lg font-bold animate-float-bob-slow opacity-35 select-none" style={{ animationDelay: "1s" }}>👓</span>
            <span className="absolute top-[60%] left-[4%] text-base font-bold animate-float-bob opacity-35 select-none text-rose-500" style={{ animationDelay: "2s" }}>♥</span>
            <span className="absolute top-[75%] right-[7%] text-lg font-bold animate-float-bob-slow opacity-35 select-none" style={{ animationDelay: "1.5s" }}>📋</span>
            <span className="absolute bottom-16 left-[18%] text-base font-bold animate-float-bob opacity-35 select-none" style={{ animationDelay: "0.8s" }}>☕</span>
          </>
        )}
      </div>

      {/* Login error toast */}
      {loginError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-3 bg-rose-600 text-white text-xs font-semibold rounded-2xl shadow-xl animate-in slide-in-from-top-2 duration-200">
          <span>{loginError}</span>
          <button
            onClick={() => setLoginError(null)}
            className="text-white/80 hover:text-white text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sync toast notification */}
      {syncToast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-2xl shadow-xl animate-in slide-in-from-top-2 duration-200 ${
            syncToast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          <span>{syncToast.message}</span>
          <button
            onClick={() => setSyncToast(null)}
            className="text-white/80 hover:text-white text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cảnh báo Firebase chưa cấu hình */}
      {!user &&
        !isLoggingIn &&
        (() => {
          const cfg = (window as any).__FIREBASE_CFG_MISSING__;
          return cfg ? (
            <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-xs text-amber-800 dark:text-amber-300 text-center">
              ⚠️ Chưa cấu hình Firebase — tính năng Google sẽ không hoạt động
              cho đến khi bạn thêm cấu hình Firebase vào{" "}
              <code>firebase-applet-config.json</code>
            </div>
          ) : null;
        })()}

      {/* Top Navbar */}
      <Navbar
        user={user}
        hasWorkspaceToken={!!accessToken}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
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
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isOnline={isOnline}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        uiTheme={uiTheme}
        onToggleUiTheme={handleToggleUiTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Gemini AI Natural Language Input */}
        <NaturalLanguageInput
          uiTheme={uiTheme}
          currentEvents={events}
          userProfile={userProfile}
          onUpdateProfile={(partial) =>
            setUserProfile((prev) => ({ ...prev, ...partial }))
          }
          weekStart={currentDate.toISOString()}
          onApplyScheduledItems={handleApplyScheduledItems}
          onOpenOcrScanner={() => setIsOcrOpen(true)}
        />

        {/* Layout Grid: Today Widget (desktop sidebar) + Timetable Calendar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Calendar Grid (3 columns on desktop) */}
          <div className="lg:col-span-3 space-y-6">
            <CalendarGrid
              uiTheme={uiTheme}
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
                  isSyncedToGoogle: true,
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
              onOpenPomodoroForEvent={(ev) => {
                setPomodoroEvent(ev);
                setIsPomodoroOpen(true);
              }}
              onOpenRescheduleForEvent={(eventId) => {
                setReschedulePreselectedId(eventId);
                setIsRescheduleOpen(true);
              }}
              onUpdateEventTimes={handleUpdateEventTimes}
            />
          </div>

          {/* Right Sidebar: Today's Schedule & Focus Widget */}
          <div className="lg:col-span-1 space-y-4">
            <TodayWidget
              uiTheme={uiTheme}
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

            {/* Quick Actions Card — gọn */}
            <div className={`bg-white dark:bg-zinc-900 ${uiTheme === "cute" ? "rounded-3xl" : "rounded-2xl"} p-4 shadow-sm border border-zinc-200/90 dark:border-zinc-800 text-xs`}>
              <span className="font-semibold text-zinc-500 dark:text-zinc-400 block mb-2 uppercase tracking-wider text-[10px]">
                Google Workspace
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => setIsTasksOpen(true)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 transition flex items-center justify-between"
                >
                  <span>Tasks</span>
                  <span className="text-[10px] text-zinc-400">
                    {tasks.length} việc
                  </span>
                </button>
                <button
                  onClick={() => setIsSheetsOpen(true)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 transition flex items-center justify-between"
                >
                  <span>Sheets</span>
                  <span className="text-[10px] text-zinc-400">Xuất/Nhập</span>
                </button>
                <button
                  onClick={() => setIsGmailOpen(true)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 transition flex items-center justify-between"
                >
                  <span>Gmail Digest</span>
                  <span className="text-[10px] text-zinc-400">Gửi mail</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODALS */}
      {/* Event Create / Edit Modal */}
      <EventModal
        uiTheme={uiTheme}
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
        uiTheme={uiTheme}
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
        activeEvent={pomodoroEvent}
        onPomodoroComplete={(eventId) => {
          if (eventId) {
            setEvents((prev) =>
              prev.map((e) =>
                e.id === eventId
                  ? {
                      ...e,
                      completedPomodoros: (e.completedPomodoros || 0) + 1,
                    }
                  : e,
              ),
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
            title: item.title || "Môn học mới",
            description: item.description || "",
            startTime: item.startTime || new Date().toISOString(),
            endTime:
              item.endTime || new Date(Date.now() + 3600000).toISOString(),
            category: item.category || "study",
            priority: item.priority || "medium",
            hasMeet: item.hasMeet,
            meetLink: item.meetLink,
            source: "sheets",
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
            title: "Xác nhận gửi email qua Gmail",
            message: `Bạn có đồng ý gửi email này qua hộp thư cá nhân của bạn không?`,
            confirmLabel: "Gửi Email",
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
          // Merge: update các event có id trùng, giữ nguyên các event không có trong optimized
          const optimizedMap = new Map(optimized.map((e) => [e.id, e]));
          setEvents((prev) => {
            const updated = prev.map((e) =>
              optimizedMap.has(e.id) ? optimizedMap.get(e.id)! : e,
            );
            // Thêm các event mới (id không tồn tại trong prev)
            const prevIds = new Set(prev.map((e) => e.id));
            const newOnes = optimized.filter((e) => !prevIds.has(e.id));
            return [...updated, ...newOnes];
          });
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

      {/* Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        events={events}
        onSelectEvent={(ev) => {
          setSelectedEvent(ev);
          setIsEventModalOpen(true);
        }}
        onOpenPomodoro={() => setIsPomodoroOpen(true)}
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
        onResetToday={() => setCurrentDate(new Date())}
        onChangeViewMode={setViewMode}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onFocusAiInput={() => {
          const el = document.getElementById("natural-language-input-field");
          el?.focus();
        }}
      />

      {/* User Confirmation Modal (Required by Workspace Integration Skill) */}
      <ConfirmationModal
        uiTheme={uiTheme}
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        cancelLabel={confirmConfig.cancelLabel}
        isDestructive={confirmConfig.isDestructive}
        itemDetails={confirmConfig.itemDetails}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() =>
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }))
        }
      />

      {/* Dialog đồng bộ dữ liệu lần đầu đăng nhập */}
      {firestoreDialogConfig.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl shrink-0">
                ☁️
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                  Đồng bộ dữ liệu lên cloud?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Bạn có lịch trình đã tạo trước đó. Muốn lưu lên tài khoản này
                  không?
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setEvents([]);
                  setFirestoreDialogConfig({
                    isOpen: false,
                    onConfirm: () => {},
                  });
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition"
              >
                Bỏ qua, bắt đầu trống
              </button>
              <button
                onClick={firestoreDialogConfig.onConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                Lưu lên cloud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
