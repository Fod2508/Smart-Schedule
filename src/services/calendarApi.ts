import { ScheduleItem, GoogleCalendar } from "../types/schedule";

export async function listGoogleCalendars(
  accessToken: string,
): Promise<GoogleCalendar[]> {
  try {
    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.error?.message || `Lỗi tải danh sách lịch (${res.status})`,
      );
    }

    const data = await res.json();
    return (data.items || []).map((cal: any) => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description,
      backgroundColor: cal.backgroundColor,
      foregroundColor: cal.foregroundColor,
      primary: cal.primary || false,
      selected: cal.selected !== false,
    }));
  } catch (error: any) {
    console.error("listGoogleCalendars error:", error);
    throw error;
  }
}

export async function listCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
): Promise<ScheduleItem[]> {
  try {
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    );
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("timeMax", timeMax);
    url.searchParams.set("maxResults", "250");

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.error?.message || `Lỗi tải sự kiện lịch (${res.status})`,
      );
    }

    const data = await res.json();
    return (data.items || [])
      .filter((ev: any) => ev.start && (ev.start.dateTime || ev.start.date))
      .map((ev: any): ScheduleItem => {
        const startTime = ev.start.dateTime || `${ev.start.date}T08:00:00`;
        const endTime = ev.end.dateTime || `${ev.end.date}T09:00:00`;
        const meetLink =
          ev.hangoutLink ||
          ev.conferenceData?.entryPoints?.find(
            (ep: any) => ep.entryPointType === "video",
          )?.uri;

        // infer category
        let category: ScheduleItem["category"] = "personal";
        const sumLower = (ev.summary || "").toLowerCase();
        if (
          sumLower.includes("học") ||
          sumLower.includes("toán") ||
          sumLower.includes("văn") ||
          sumLower.includes("thi") ||
          sumLower.includes("study") ||
          sumLower.includes("class")
        ) {
          category = "study";
        } else if (
          sumLower.includes("họp") ||
          sumLower.includes("meet") ||
          sumLower.includes("sync") ||
          sumLower.includes("standup")
        ) {
          category = "meeting";
        } else if (
          sumLower.includes("dự án") ||
          sumLower.includes("work") ||
          sumLower.includes("task") ||
          sumLower.includes("code") ||
          sumLower.includes("làm việc")
        ) {
          category = "work";
        } else if (
          sumLower.includes("nghỉ") ||
          sumLower.includes("break") ||
          sumLower.includes("ăn")
        ) {
          category = "break";
        }

        return {
          id: `gcal-${ev.id}`,
          title: ev.summary || "(Không có tiêu đề)",
          description: ev.description || "",
          startTime,
          endTime,
          category,
          priority: "medium",
          hasMeet: !!meetLink,
          meetLink: meetLink || undefined,
          googleEventId: ev.id,
          googleCalendarId: calendarId,
          isSyncedToGoogle: true,
          location: ev.location,
          source: "google_calendar",
        };
      });
  } catch (error: any) {
    console.error("listCalendarEvents error:", error);
    throw error;
  }
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  item: ScheduleItem,
  addMeetLink: boolean = false,
  reminderMinutes: number = 30,
): Promise<any> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`;

  // Build reminders: luôn có email + popup để nhận notification trên điện thoại
  const reminderOverrides: { method: string; minutes: number }[] = [
    { method: "email", minutes: reminderMinutes }, // gửi email trước X phút
    { method: "popup", minutes: Math.min(10, reminderMinutes) }, // popup 10 phút trước (hoặc ít hơn nếu reminder ngắn)
  ];

  // Thêm popup thứ 2 nếu reminder đủ dài
  if (reminderMinutes >= 30) {
    reminderOverrides.push({ method: "popup", minutes: 5 });
  }

  const body: any = {
    summary: item.title,
    description:
      item.description || (item.category ? `Danh mục: ${item.category}` : ""),
    start: {
      dateTime: item.startTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: item.endTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    location: item.location || undefined,
    reminders: {
      useDefault: false,
      overrides: reminderOverrides,
    },
  };

  if (addMeetLink || item.hasMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error?.message ||
        `Lỗi tạo sự kiện trên Google Calendar (${res.status})`,
    );
  }

  return await res.json();
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  item: Partial<ScheduleItem>,
  reminderMinutes?: number,
): Promise<any> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`;

  const body: any = {};
  if (item.title) body.summary = item.title;
  if (item.description !== undefined) body.description = item.description;
  if (item.location !== undefined) body.location = item.location || null;
  if (item.startTime) {
    body.start = {
      dateTime: item.startTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
  if (item.endTime) {
    body.end = {
      dateTime: item.endTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  // Sync reminders nếu được chỉ định
  if (reminderMinutes !== undefined) {
    const overrides: { method: string; minutes: number }[] = [
      { method: "email", minutes: reminderMinutes },
      { method: "popup", minutes: Math.min(10, reminderMinutes) },
    ];
    if (reminderMinutes >= 30) {
      overrides.push({ method: "popup", minutes: 5 });
    }
    body.reminders = { useDefault: false, overrides };
  }

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error?.message ||
        `Lỗi cập nhật sự kiện trên Google Calendar (${res.status})`,
    );
  }

  return await res.json();
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
): Promise<boolean> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error?.message ||
        `Lỗi xóa sự kiện trên Google Calendar (${res.status})`,
    );
  }

  return true;
}
