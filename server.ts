import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "10mb" }));

// Helper lấy danh sách Gemini API Keys hợp lệ từ biến môi trường
function getApiKeys(): string[] {
  const found: string[] = [];

  // Ưu tiên key chính GEMINI_API_KEY, sau đó tới các key phụ _1.._5, và các biến Google khác
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_GENAI_API_KEY,
  ];

  const addKey = (val: unknown) => {
    if (typeof val !== "string") return;
    // Bỏ dấu nháy kép/đơn hoặc khoảng trắng / xuống dòng do copy-paste trên dashboard Render
    const cleaned = val.trim().replace(/^["']|["']$/g, "").trim();
    if (cleaned.length > 8 && !found.includes(cleaned)) {
      found.push(cleaned);
    }
  };

  for (const c of candidates) {
    addKey(c);
  }

  // Quét thêm bất kỳ biến môi trường nào có chứa cụm GEMINI_API_KEY (không phân biệt hoa/thường)
  for (const [keyName, val] of Object.entries(process.env)) {
    if (/gemini.*api.*key/i.test(keyName) || /google.*genai.*key/i.test(keyName)) {
      addKey(val);
    }
  }

  return found;
}

const initialKeys = getApiKeys();
if (initialKeys.length === 0) {
  console.warn(
    "[Smart Schedule] CẢNH BÁO: Không tìm thấy GEMINI_API_KEY trong biến môi trường. Các tính năng AI sẽ dùng fallback.",
  );
} else {
  console.log(
    `[Smart Schedule] Đã nạp ${initialKeys.length} Gemini API key(s) từ biến môi trường.`,
  );
}

async function callGeminiSafe(options: any) {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error(
      "Không tìm thấy Gemini API Key. Vui lòng thêm GEMINI_API_KEY vào biến môi trường (Environment Variables) trên Render.",
    );
  }

  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"];
  let lastErr: any = null;

  // Thử lần lượt qua từng key. Với mỗi key, thử các model nếu cần.
  for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
    const apiKey = keys[keyIdx];
    const maskedKey = `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;

    for (const model of models) {
      try {
        const aiClient = new GoogleGenAI({ apiKey });
        const result = await aiClient.models.generateContent({
          ...options,
          model,
        });
        console.log(
          `[AI] ✓ Thành công: model=${model} (Key #${keyIdx + 1}: ${maskedKey})`,
        );
        return result;
      } catch (err: any) {
        lastErr = err;
        const msg = (err?.message || "").toLowerCase();
        console.warn(
          `[AI] ✗ Thất bại: model=${model} (Key #${keyIdx + 1}: ${maskedKey}) -> ${err?.message?.substring(0, 140)}`,
        );

        // Nếu key bị hết quota, 429, hoặc bị lỗi quyền (401, 403, invalid key, token type unsupported)
        // -> chuyển sang key tiếp theo ngay lập tức
        if (
          msg.includes("quota") ||
          msg.includes("resource_exhausted") ||
          msg.includes("429") ||
          msg.includes("401") ||
          msg.includes("403") ||
          msg.includes("invalid") ||
          msg.includes("permission_denied") ||
          msg.includes("unregistered") ||
          msg.includes("access_token_type_unsupported")
        ) {
          break; // Thoát model loop để sang key tiếp theo
        }

        // Lỗi do model (503 overloaded, model not found, etc.) -> thử model tiếp theo với cùng key
        continue;
      }
    }
  }

  throw lastErr;
}

// AI Route 1: Natural Language Schedule Parser & Smart Scheduler
app.post("/api/ai/parse-prompt", async (req, res) => {
  const { prompt, currentEvents = [], userProfile = {}, weekStart } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Thiếu nội dung yêu cầu (prompt)" });
  }

  try {
    const systemInstruction = `Bạn là Trợ lý Xếp thời khóa biểu thông minh (Smart Schedule AI).
Nhiệm vụ của bạn là phân tích yêu cầu ngôn ngữ tự nhiên của người dùng (tiếng Việt hoặc tiếng Anh) và tạo ra danh sách các block thời gian / sự kiện thời khóa biểu hợp lý nhất.

Thông tin ngữ cảnh:
- Ngày bắt đầu tuần hiện tại: ${weekStart || new Date().toISOString()}
- Hồ sơ người dùng: ${JSON.stringify(userProfile)} (ví dụ: phong cách học/làm việc thích sáng hay tối, thời lượng Pomodoro, thời gian nghỉ)
- Các sự kiện/lịch đã có sẵn trong tuần: ${JSON.stringify(currentEvents.map((e: any) => ({ title: e.title, start: e.startTime, end: e.endTime })))}

Yêu cầu logic quan trọng:
1. Tránh trùng lịch với các sự kiện đã có nếu có thể.
2. Tự động chia nhỏ buổi học/làm việc nếu người dùng yêu cầu (ví dụ: "3 buổi mỗi tuần").
3. Nếu có từ khóa như "họp", "meeting", "online", "học trực tuyến", hãy bật cờ hasMeet = true.
4. Gán category phù hợp: "study" (học tập), "work" (công việc), "meeting" (họp), "personal" (cá nhân), "break" (nghỉ ngơi).
5. Phân bổ đều giữa các ngày (Auto-balance), tránh dồn dập vào 1 ngày nếu không được yêu cầu cụ thể.
6. Luôn trả về ISO 8601 strings chuẩn cho startTime và endTime (ví dụ: "2026-09-29T09:00:00").
7. Trả lời kèm giải thích (reasoning) súc tích, thân thiện bằng tiếng Việt.`;

    const response = await callGeminiSafe({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: {
              type: Type.STRING,
              description: "Tóm tắt giải thích cách AI đã bố trí lịch",
            },
            suggestedAction: {
              type: Type.STRING,
              description:
                "Hành động đề xuất (ví dụ: Đã xếp 3 buổi sáng thứ 3, 5, 7)",
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  startTime: {
                    type: Type.STRING,
                    description: "ISO format YYYY-MM-DDTHH:mm:ss",
                  },
                  endTime: {
                    type: Type.STRING,
                    description: "ISO format YYYY-MM-DDTHH:mm:ss",
                  },
                  category: {
                    type: Type.STRING,
                    enum: ["study", "work", "meeting", "personal", "break"],
                  },
                  priority: {
                    type: Type.STRING,
                    enum: ["high", "medium", "low"],
                  },
                  hasMeet: { type: Type.BOOLEAN },
                  color: { type: Type.STRING },
                  pomodoroBlocks: {
                    type: Type.INTEGER,
                    description: "Số block pomodoro ước lượng",
                  },
                },
                required: [
                  "title",
                  "startTime",
                  "endTime",
                  "category",
                  "priority",
                  "hasMeet",
                ],
              },
            },
          },
          required: ["reasoning", "items"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.warn(
      "API error in parse-prompt, using smart deterministic fallback:",
      error?.message,
    );

    // High quality deterministic rule-based fallback
    try {
      const monday = weekStart ? new Date(weekStart) : new Date();
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);

      const lower = prompt.toLowerCase();
      const items: any[] = [];

      let startHour = 9;
      let endHour = 10;
      const timeMatch = lower.match(
        /(?:từ\s*)?(\d{1,2})(?:h|:)(\d{0,2})?(?:\s*(?:đến|-)\s*(\d{1,2})(?:h|:)(\d{0,2})?)?/,
      );
      if (timeMatch && timeMatch[1]) {
        startHour = parseInt(timeMatch[1], 10);
        if (timeMatch[3]) {
          endHour = parseInt(timeMatch[3], 10);
        } else {
          endHour = Math.min(23, startHour + 1);
        }
      }

      const dayOffsets: number[] = [];
      if (
        lower.includes("thứ 2") ||
        lower.includes("thứ hai") ||
        lower.includes("t2")
      )
        dayOffsets.push(0);
      if (
        lower.includes("thứ 3") ||
        lower.includes("thứ ba") ||
        lower.includes("t3")
      )
        dayOffsets.push(1);
      if (
        lower.includes("thứ 4") ||
        lower.includes("thứ tư") ||
        lower.includes("t4")
      )
        dayOffsets.push(2);
      if (
        lower.includes("thứ 5") ||
        lower.includes("thứ năm") ||
        lower.includes("t5")
      )
        dayOffsets.push(3);
      if (
        lower.includes("thứ 6") ||
        lower.includes("thứ sáu") ||
        lower.includes("t6")
      )
        dayOffsets.push(4);
      if (
        lower.includes("thứ 7") ||
        lower.includes("thứ bảy") ||
        lower.includes("t7")
      )
        dayOffsets.push(5);
      if (lower.includes("chủ nhật") || lower.includes("cn"))
        dayOffsets.push(6);

      if (dayOffsets.length === 0) {
        // Thử detect số buổi từ prompt (ví dụ: "4 buổi", "3 lần", "5 sessions")
        const countMatch = lower.match(
          /(\d+)\s*(?:buổi|lần|session|tiết|ngày)/,
        );
        const sessionCount = countMatch
          ? Math.min(parseInt(countMatch[1]), 7)
          : 1;

        // Phân bổ đều trong tuần
        const allDays = [0, 1, 2, 3, 4, 5, 6]; // T2 → CN
        // Ưu tiên sáng sớm tuần
        for (let i = 0; i < sessionCount; i++) {
          dayOffsets.push(allDays[i % 7]);
        }
      }

      let cat = "study";
      if (
        lower.includes("họp") ||
        lower.includes("meet") ||
        lower.includes("báo cáo")
      )
        cat = "meeting";
      else if (
        lower.includes("làm việc") ||
        lower.includes("code") ||
        lower.includes("dự án") ||
        lower.includes("work")
      )
        cat = "work";
      else if (
        lower.includes("gym") ||
        lower.includes("chạy") ||
        lower.includes("cá nhân") ||
        lower.includes("nghỉ")
      )
        cat = "personal";

      const hasMeet =
        lower.includes("họp") ||
        lower.includes("meet") ||
        lower.includes("zoom") ||
        lower.includes("online");
      const cleanTitle =
        prompt.length > 50 ? prompt.substring(0, 47) + "..." : prompt;

      dayOffsets.forEach((offset) => {
        const s = new Date(monday);
        s.setDate(monday.getDate() + offset);
        s.setHours(startHour, 0, 0, 0);

        const e = new Date(s);
        e.setHours(endHour, 0, 0, 0);

        items.push({
          title: cleanTitle,
          description: `Tạo từ yêu cầu: "${prompt}"`,
          startTime: s.toISOString(),
          endTime: e.toISOString(),
          category: cat,
          priority: "medium",
          hasMeet,
          pomodoroBlocks: Math.max(1, Math.round((endHour - startHour) * 2)),
        });
      });

      return res.json({
        reasoning: `Đã phân tích thông minh và xếp ${items.length} buổi lịch trình theo yêu cầu của bạn.`,
        suggestedAction: `Đã xếp ${items.length} sự kiện vào thời khóa biểu`,
        items,
      });
    } catch (fallbackErr: any) {
      return res
        .status(500)
        .json({ error: error.message || "Lỗi xử lý yêu cầu" });
    }
  }
});

// AI Route 2: Auto-balance & Break Optimizer
app.post("/api/ai/optimize-schedule", async (req, res) => {
  const { events = [], userProfile = {} } = req.body;

  try {
    const systemInstruction = `Bạn là Chuyên gia Tối ưu Hóa Năng suất & Thời gian (Productivity Optimization AI).
Hãy rà soát danh sách lịch trình hiện tại của người dùng, phân tích sự mất cân bằng, thiếu giờ nghỉ ngơi, hoặc các phiên học/làm việc kéo dài quá sức.
Hồ sơ người dùng: ${JSON.stringify(userProfile)}

Hãy đưa ra:
1. Đánh giá tổng quan điểm số năng suất (0-100) và lý do.
2. Danh sách các đề xuất cải thiện cụ thể (chèn break, đổi giờ để hợp với chronotype, v.v.).
3. Danh sách sự kiện sau khi đã được tối ưu hoặc thêm các block "Nghỉ ngơi / Pomodoro break".`;

    const response = await callGeminiSafe({
      contents: `Tối ưu hóa lịch trình sau:\n${JSON.stringify(events, null, 2)}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productivityScore: { type: Type.INTEGER },
            scoreExplanation: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            optimizedEvents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  category: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  hasMeet: { type: Type.BOOLEAN },
                  isBreak: { type: Type.BOOLEAN },
                },
                required: [
                  "title",
                  "startTime",
                  "endTime",
                  "category",
                  "priority",
                ],
              },
            },
          },
          required: [
            "productivityScore",
            "scoreExplanation",
            "suggestions",
            "optimizedEvents",
          ],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.warn("Error in optimize-schedule, using fallback:", error?.message);
    const completedCount = events.filter((e: any) => e.isCompleted).length;
    const baseScore = Math.min(95, Math.max(65, 75 + completedCount * 5));
    return res.json({
      productivityScore: baseScore,
      scoreExplanation: `Lịch trình được tối ưu hóa cân bằng giữa thời gian tập trung và nghỉ ngơi (Điểm: ${baseScore}/100).`,
      suggestions: [
        "Duy trì các khoảng nghỉ 10-15 phút giữa các buổi làm việc kéo dài hơn 90 phút.",
        "Xếp nhiệm vụ khó và đòi hỏi tập trung cao vào đầu ngày khi năng lượng dồi dào nhất.",
        "Dành 20-30 phút sau bữa trưa để thả lỏng cơ thể và phục hồi tinh thần.",
      ],
      optimizedEvents: events,
    });
  }
});

// AI Route 3: Conflict Resolution
app.post("/api/ai/resolve-conflicts", async (req, res) => {
  const { conflictA, conflictB, allEvents = [] } = req.body;

  try {
    const prompt = `Hai sự kiện sau đây đang bị trùng lặp thời gian trong lịch trình:
Sự kiện 1: ${JSON.stringify(conflictA)}
Sự kiện 2: ${JSON.stringify(conflictB)}

Lịch trình xung quanh:
${JSON.stringify(allEvents.map((e: any) => ({ title: e.title, start: e.startTime, end: e.endTime })))}

Hãy phân tích mức độ ưu tiên, tính chất cuộc hẹn, và đề xuất 3 phương án giải quyết cụ thể (ví dụ: dời sự kiện ít ưu tiên hơn sang slot trống gần nhất, rút ngắn 1 trong 2 sự kiện, hoặc chuyển sang buổi khác).`;

    const response = await callGeminiSafe({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.STRING,
              description: "Phân tích nguyên nhân và ảnh hưởng",
            },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  pros: { type: Type.STRING },
                  cons: { type: Type.STRING },
                  actionType: {
                    type: Type.STRING,
                    enum: [
                      "shift_event_a",
                      "shift_event_b",
                      "shorten",
                      "split",
                    ],
                  },
                  suggestedStartTime: { type: Type.STRING },
                  suggestedEndTime: { type: Type.STRING },
                  targetEventId: { type: Type.STRING },
                },
                required: ["id", "title", "description", "actionType"],
              },
            },
          },
          required: ["analysis", "options"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.warn("Error in resolve-conflicts, using fallback:", error?.message);
    const titleA = conflictA?.title || "Sự kiện 1";
    const titleB = conflictB?.title || "Sự kiện 2";
    const endA = new Date(conflictA?.endTime || Date.now());
    const durB =
      new Date(conflictB?.endTime || Date.now()).getTime() -
        new Date(conflictB?.startTime || Date.now()).getTime() ||
      60 * 60 * 1000;
    const shiftedStartB = endA;
    const shiftedEndB = new Date(shiftedStartB.getTime() + durB);

    return res.json({
      analysis: `Xung đột thời gian giữa "${titleA}" và "${titleB}". Cần điều chỉnh giờ để tránh chồng chéo.`,
      options: [
        {
          id: "opt-shift-b",
          title: `Dời "${titleB}" bắt đầu ngay sau khi "${titleA}" kết thúc`,
          description: `Bắt đầu lúc ${shiftedStartB.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}, kết thúc lúc ${shiftedEndB.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}.`,
          pros: "Bảo toàn thời lượng gốc của cả 2 sự kiện.",
          cons: "Sự kiện sau kết thúc muộn hơn kế hoạch ban đầu.",
          actionType: "shift_event_b",
          suggestedStartTime: shiftedStartB.toISOString(),
          suggestedEndTime: shiftedEndB.toISOString(),
          targetEventId: conflictB?.id,
        },
        {
          id: "opt-shorten-a",
          title: `Rút ngắn "${titleA}" để kết thúc khi "${titleB}" bắt đầu`,
          description: `Rút ngắn kết thúc lúc ${new Date(conflictB?.startTime || Date.now()).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}.`,
          pros: "Không làm thay đổi giờ của sự kiện thứ hai.",
          cons: "Sự kiện đầu tiên bị rút ngắn thời gian.",
          actionType: "shorten",
          suggestedStartTime: conflictA?.startTime,
          suggestedEndTime: conflictB?.startTime,
          targetEventId: conflictA?.id,
        },
      ],
    });
  }
});

// AI Route 4: Generate Digest Email for Gmail
app.post("/api/ai/generate-email-summary", async (req, res) => {
  const { events = [], period = "today", recipientName = "Bạn" } = req.body;
  try {
    const prompt = `Soạn thảo một email tổng hợp lịch trình (${period === "today" ? "Hôm nay" : "Tuần này"}) cho người dùng:
Tên: ${recipientName}
Danh sách các sự kiện/nhiệm vụ:
${JSON.stringify(events, null, 2)}

Yêu cầu:
1. Tiêu đề email (subject) rõ ràng, hấp dẫn, có emoji.
2. Nội dung email dạng HTML đẹp, hiện đại, có các thẻ <div>, <h3>, <ul>, <span style="..."> màu sắc trang nhã, phân chia rõ:
   - Điểm nhấn ưu tiên hàng đầu (Top Priorities)
   - Lịch học/làm việc chi tiết theo mốc thời gian
   - Các buổi có link Google Meet trực tuyến
   - Lời khuyên nghỉ ngơi và lời chúc năng suất.
3. Giọng văn tiếng Việt truyền cảm hứng, chuyên nghiệp.`;

    const response = await callGeminiSafe({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            htmlBody: { type: Type.STRING },
            plainTextSummary: { type: Type.STRING },
          },
          required: ["subject", "htmlBody", "plainTextSummary"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.warn(
      "Error generating email summary, using fallback:",
      error?.message,
    );
    const eventCount = events.length;
    return res.json({
      subject: `📅 Tổng kết lịch trình ${period === "today" ? "hôm nay" : "tuần này"} (${eventCount} sự kiện)`,
      htmlBody: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #1f2937;">
          <h2 style="color: #4f46e5;">Chào ${recipientName}! 👋</h2>
          <p>Dưới đây là tổng hợp lịch trình ${period === "today" ? "trong ngày hôm nay" : "trong tuần"} của bạn:</p>
          <ul>
            ${events.map((e: any) => `<li><strong>${e.title}</strong> (${new Date(e.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })})</li>`).join("")}
          </ul>
          <p style="color: #6b7280; font-size: 13px;">Chúc bạn một ngày làm việc và học tập hiệu quả, tràn đầy năng lượng! ✨</p>
        </div>
      `,
      plainTextSummary: `Lịch trình có ${eventCount} sự kiện cần hoàn thành. Chúc bạn một ngày làm việc năng suất!`,
    });
  }
});

// AI Route 5: OCR Timetable from Image or PDF
app.post("/api/ai/ocr-schedule", async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = "image/jpeg",
      weekStart,
      userNote,
    } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Thiếu dữ liệu ảnh hoặc file PDF" });
    }

    // Strip data URL header if present
    const base64Data = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, "");

    const systemInstruction = `Bạn là Trợ lý OCR và Xếp thời khóa biểu thông minh (Smart Schedule Multimodal OCR).
Nhiệm vụ của bạn là nhận diện, bóc tách và phân tích ảnh chụp/ảnh chụp màn hình/tài liệu PDF thời khóa biểu học tập, lịch công tác, lịch thi của trường học hoặc tổ chức.

Ngữ cảnh:
- Ngày đầu tuần hiện tại: ${weekStart || new Date().toISOString()}
- Ghi chú bổ sung từ người dùng: ${userNote || "Không có"}

Quy tắc phân tích:
1. Đọc kỹ các bảng cột trong ảnh: Thứ 2 (Mon) đến Chủ nhật (Sun), Tiết học/Khung giờ (ví dụ: Tiết 1-3 = 07:00-09:30, hoặc ghi rõ giờ 07:30 - 09:15), Tên môn học, Mã phòng học, Tên giảng viên.
2. Ánh xạ các ngày trong tuần trong ảnh (Thứ 2, Thứ 3, ..., Thứ 7, CN) vào đúng các ngày thực tế của tuần ${weekStart || "hiện tại"}. Giữ đúng định dạng ISO YYYY-MM-DDTHH:mm:ss.
3. Nếu ảnh là lịch học online (ghi Zoom, Meet, Teams, trực tuyến) hãy bật hasMeet = true.
4. Gán category chính xác: "study" (học tập, lên lớp, thi), "work" (dạy học, chấm bài, công tác), "meeting" (họp, sinh hoạt lớp), "personal", "break".
5. Bóc tách phòng học/địa điểm vào trường "location" (ví dụ: "Phòng A302", "Giảng đường B").
6. Ước tính số pomodoroBlocks dựa vào thời lượng (mỗi 45-60 phút học = 1-2 block).
7. Trả về bảng tổng quan (summary) và danh sách các sự kiện được trích xuất chính xác.`;

    const response = await callGeminiSafe({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: "Hãy đọc và trích xuất toàn bộ thời khóa biểu, lịch học, lịch thi từ tài liệu này.",
            },
          ],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description:
                "Mô tả tóm tắt những gì AI đã trích xuất được từ ảnh",
            },
            totalItemsDetected: { type: Type.INTEGER },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  startTime: {
                    type: Type.STRING,
                    description: "ISO format YYYY-MM-DDTHH:mm:ss",
                  },
                  endTime: {
                    type: Type.STRING,
                    description: "ISO format YYYY-MM-DDTHH:mm:ss",
                  },
                  category: {
                    type: Type.STRING,
                    enum: ["study", "work", "meeting", "personal", "break"],
                  },
                  priority: {
                    type: Type.STRING,
                    enum: ["high", "medium", "low"],
                  },
                  location: { type: Type.STRING },
                  hasMeet: { type: Type.BOOLEAN },
                  pomodoroBlocks: { type: Type.INTEGER },
                },
                required: [
                  "title",
                  "startTime",
                  "endTime",
                  "category",
                  "priority",
                  "hasMeet",
                ],
              },
            },
          },
          required: ["summary", "totalItemsDetected", "items"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Error in OCR schedule endpoint:", error);
    const keys = getApiKeys();
    if (keys.length === 0) {
      return res.status(503).json({
        error:
          "Tính năng OCR cần Gemini API Key. Vui lòng thêm GEMINI_API_KEY vào biến môi trường (Environment Variables) trên Render.",
        summary: "Chưa cấu hình API Key",
        totalItemsDetected: 0,
        items: [],
      });
    }
    return res.status(500).json({
      error:
        `Lỗi nhận diện AI: ${error?.message || "Không thể xử lý ảnh"}. Vui lòng thử lại hoặc kiểm tra API key.`,
      summary: "Không thể nhận diện ảnh",
      totalItemsDetected: 0,
      items: [],
    });
  }
});

// AI Route 6: Team Free Slot Finder & Meeting Poll
app.post("/api/ai/find-team-slots", async (req, res) => {
  const {
    meetingTitle = "Họp Nhóm",
    durationMinutes = 60,
    attendees = [],
    currentEvents = [],
    memberConstraints = "",
    weekStart,
  } = req.body;
  try {
    const systemInstruction = `Bạn là Trợ lý Điều phối Cuộc họp & Tìm giờ trống chung cho Team (Team Smart Meeting Finder AI).
Nhiệm vụ của bạn là phân tích lịch trình hiện tại của người tổ chức và các ràng buộc, thời gian rảnh/bận của các thành viên trong nhóm, từ đó đề xuất 3 đến 4 khung giờ vàng (candidate slots) tốt nhất để họp.

Ngữ cảnh:
- Ngày đầu tuần hiện tại: ${weekStart || new Date().toISOString()}
- Tiêu đề cuộc họp: ${meetingTitle}
- Thời lượng: ${durationMinutes} phút
- Danh sách thành viên tham gia: ${JSON.stringify(attendees)}
- Lịch trình đã có của người tổ chức: ${JSON.stringify(currentEvents.map((e: any) => ({ title: e.title, start: e.startTime, end: e.endTime })))}
- Ràng buộc hoặc ghi chú thời gian của các thành viên: ${memberConstraints || "Không có ràng buộc đặc biệt, ưu tiên khung giờ hành chính làm việc hiệu quả"}

Quy tắc tìm kiếm:
1. KHÔNG được trùng vào các lịch đã có của người tổ chức.
2. Tôn trọng tối đa các ràng buộc của thành viên (ví dụ nếu ai đó bận sáng thứ 3, không xếp vào sáng thứ 3).
3. Ưu tiên khung giờ vàng từ 09:00 - 11:30 hoặc 14:00 - 17:00 các ngày trong tuần (Thứ 2 đến Thứ 6), tránh giờ ăn trưa (12:00 - 13:30) và quá muộn sau 18:00 trừ khi được yêu cầu.
4. Đánh giá matchScore (0 - 100) cho từng slot.
5. Soạn thảo một đoạn pollSummaryText súc tích, chuyên nghiệp bằng tiếng Việt có emoji, sẵn sàng copy để gửi Zalo / Slack / Telegram hoặc Email cho nhóm bình chọn.`;

    const response = await callGeminiSafe({
      contents: `Hãy tìm các khung giờ trống lý tưởng nhất cho cuộc họp "${meetingTitle}" kéo dài ${durationMinutes} phút.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: {
              type: Type.STRING,
              description:
                "Phân tích tổng quan về việc bố trí giờ họp cho nhóm",
            },
            candidateSlots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  startTime: {
                    type: Type.STRING,
                    description: "ISO format YYYY-MM-DDTHH:mm:ss",
                  },
                  endTime: {
                    type: Type.STRING,
                    description: "ISO format YYYY-MM-DDTHH:mm:ss",
                  },
                  matchScore: {
                    type: Type.INTEGER,
                    description: "Độ phù hợp từ 0-100",
                  },
                  suitabilityReason: { type: Type.STRING },
                  pros: { type: Type.STRING },
                  recommended: { type: Type.BOOLEAN },
                },
                required: [
                  "id",
                  "startTime",
                  "endTime",
                  "matchScore",
                  "suitabilityReason",
                  "recommended",
                ],
              },
            },
            pollSummaryText: {
              type: Type.STRING,
              description:
                "Nội dung bảng khảo sát giờ họp định dạng text đẹp để gửi vào group chat",
            },
          },
          required: ["reasoning", "candidateSlots", "pollSummaryText"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.warn("Error finding team slots, using fallback:", error?.message);
    const baseDate = new Date();
    const candidateSlots = [
      {
        id: "slot-1",
        startTime: new Date(baseDate.setHours(9, 30, 0, 0)).toISOString(),
        endTime: new Date(baseDate.setHours(10, 30, 0, 0)).toISOString(),
        matchScore: 95,
        suitabilityReason:
          "Khung giờ vàng buổi sáng, tinh thần minh mẫn, không vướng giờ ăn trưa.",
        pros: "Thời điểm năng lượng cao nhất cho họp nhóm thảo luận ý tưởng.",
        recommended: true,
      },
      {
        id: "slot-2",
        startTime: new Date(baseDate.setHours(14, 30, 0, 0)).toISOString(),
        endTime: new Date(baseDate.setHours(15, 30, 0, 0)).toISOString(),
        matchScore: 88,
        suitabilityReason: "Đầu giờ chiều sau khi đã hoàn thành giờ nghỉ trưa.",
        pros: "Phù hợp cập nhật tiến độ công việc trong ngày.",
        recommended: false,
      },
    ];

    return res.json({
      reasoning: "Đã tìm thấy 2 khung giờ trống tối ưu cho nhóm thảo luận.",
      candidateSlots,
      pollSummaryText: `📊 Bình chọn giờ họp "${meetingTitle}":\n1️⃣ Sáng 09:30 - 10:30\n2️⃣ Chiều 14:30 - 15:30\n👉 Mọi người vào bình chọn giúp mình nhé!`,
    });
  }
});

// AI Route 7: Smart Auto-Reschedule when Delayed (Dời lịch thông minh khi bị trễ việc)
app.post("/api/ai/smart-reschedule", async (req, res) => {
  const {
    delayedEventId,
    delayMinutes = 45,
    reason = "Việc trước kéo dài hơn dự kiến",
    strategy = "prioritize", // 'prioritize' | 'push_all' | 'overflow_tomorrow'
    currentEvents = [],
    targetDate = new Date().toISOString(),
  } = req.body;
  try {
    const systemInstruction = `Bạn là Trợ lý Điều phối Lịch trình AI Chuyên sâu (Smart Auto-Reschedule AI).
Nhiệm vụ của bạn là giải quyết "hiệu ứng Domino" khi một công việc bị trễ hoặc kéo dài thêm thời gian, giúp người dùng sắp xếp lại toàn bộ các công việc tiếp theo một cách khoa học, thông minh, không bị quá tải và không bỏ lỡ các việc quan trọng.

Thông tin bối cảnh:
- Ngày xảy ra trễ việc: ${targetDate}
- ID sự kiện bị trễ: ${delayedEventId || "Không xác định (trễ từ thời điểm hiện tại)"}
- Số phút bị trễ/kéo dài: ${delayMinutes} phút
- Lý do trễ: ${reason}
- Chiến lược người dùng chọn:
  * "prioritize": Ưu tiên thông minh - BẢO VỆ tối đa các cuộc họp cố định (category: meeting, hasMeet), sự kiện ưu tiên cao (priority: high) và deadline. Dời hoặc nén các việc linh hoạt (học tập cá nhân, thể thao, việc cá nhân, giải lao) vào các khoảng trống hoặc cuối ngày.
  * "push_all": Đẩy lùi nối tiếp - Tịnh tiến lùi tất cả các sự kiện tiếp theo đúng ${delayMinutes} phút, giữ nguyên thời lượng của từng việc.
  * "overflow_tomorrow": Dời sang ngày mai - Giữ các việc quan trọng trong ngày, dời các việc linh hoạt/ưu tiên thấp sang ngày hôm sau để người dùng được nghỉ ngơi đúng giờ, tránh thức khuya làm việc quá sức.
- Danh sách sự kiện hiện tại:
${JSON.stringify(
  currentEvents.map((e: any) => ({
    id: e.id,
    title: e.title,
    startTime: e.startTime,
    endTime: e.endTime,
    category: e.category,
    priority: e.priority,
    hasMeet: e.hasMeet,
  })),
)}

Quy tắc thực hiện:
1. Xác định sự kiện bị trễ: Nếu có delayedEventId, kéo dài endTime của sự kiện đó thêm ${delayMinutes} phút (hoặc dời nó theo lý do).
2. Xử lý các sự kiện tiếp theo:
   - Đảm bảo KHÔNG CÒN xung đột thời gian (trùng giờ).
   - Thêm khoảng đệm tối thiểu 5-10 phút giữa các sự kiện lớn để người dùng kịp chuẩn bị.
   - Giữ nguyên các thuộc tính quan trọng của sự kiện (id, title, category, priority, hasMeet...).
   - Cập nhật startTime và endTime chuẩn định dạng ISO YYYY-MM-DDTHH:mm:ss.
3. Tạo giải thích ngắn gọn, đồng cảm và súc tích (explanation) bằng tiếng Việt.
4. Tóm tắt tác động (impactSummary) ví dụ: "Đã dời 3 công việc, bảo toàn 1 cuộc họp quan trọng, tạo 10 phút nghỉ ngơi".
5. Liệt kê rõ chi tiết từng thay đổi trong mảng changes (originalTime, newTime, action, reason).`;

    const response = await callGeminiSafe({
      contents: `Hãy dời lịch và tái cấu trúc các sự kiện bị ảnh hưởng do trễ ${delayMinutes} phút (Lý do: "${reason}", Chiến lược: "${strategy}").`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: {
              type: Type.STRING,
              description:
                "Lời giải thích và phân tích giải pháp dời lịch của AI",
            },
            impactSummary: {
              type: Type.STRING,
              description: "Tóm tắt ngắn gọn các tác động của việc dời lịch",
            },
            changes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  eventId: { type: Type.STRING },
                  title: { type: Type.STRING },
                  originalTime: { type: Type.STRING },
                  newTime: { type: Type.STRING },
                  action: {
                    type: Type.STRING,
                    enum: [
                      "delayed",
                      "shifted",
                      "shortened",
                      "moved_to_tomorrow",
                      "unchanged",
                    ],
                  },
                  reason: { type: Type.STRING },
                },
                required: [
                  "eventId",
                  "title",
                  "originalTime",
                  "newTime",
                  "action",
                  "reason",
                ],
              },
            },
            updatedEvents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    enum: ["study", "work", "meeting", "personal", "break"],
                  },
                  priority: {
                    type: Type.STRING,
                    enum: ["high", "medium", "low"],
                  },
                  location: { type: Type.STRING },
                  hasMeet: { type: Type.BOOLEAN },
                  meetLink: { type: Type.STRING },
                  pomodoroBlocks: { type: Type.INTEGER },
                  isSyncedToGoogle: { type: Type.BOOLEAN },
                  googleEventId: { type: Type.STRING },
                },
                required: [
                  "id",
                  "title",
                  "startTime",
                  "endTime",
                  "category",
                  "priority",
                  "hasMeet",
                ],
              },
            },
          },
          required: [
            "explanation",
            "impactSummary",
            "changes",
            "updatedEvents",
          ],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.warn(
      "Error in smart reschedule endpoint, using fallback:",
      error?.message,
    );
    const delayMs = (delayMinutes || 30) * 60 * 1000;
    const changes: any[] = [];
    let delayedFound = false;

    const updatedEvents = currentEvents.map((ev: any) => {
      const origStart = new Date(ev.startTime);
      const origEnd = new Date(ev.endTime);

      if (ev.id === delayedEventId || (!delayedEventId && !delayedFound)) {
        delayedFound = true;
        const newEnd = new Date(origEnd.getTime() + delayMs);
        changes.push({
          eventId: ev.id,
          title: ev.title,
          originalTime: `${origStart.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${origEnd.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`,
          newTime: `${origStart.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${newEnd.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`,
          action: "delayed",
          reason: `Kéo dài thêm ${delayMinutes} phút: ${reason}`,
        });
        return { ...ev, endTime: newEnd.toISOString() };
      }

      if (delayedFound) {
        const newStart = new Date(origStart.getTime() + delayMs);
        const newEnd = new Date(origEnd.getTime() + delayMs);
        changes.push({
          eventId: ev.id,
          title: ev.title,
          originalTime: `${origStart.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${origEnd.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`,
          newTime: `${newStart.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${newEnd.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`,
          action: "shifted",
          reason: `Tịnh tiến dời lùi ${delayMinutes} phút để tránh xung đột lịch`,
        });
        return {
          ...ev,
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
        };
      }

      return ev;
    });

    return res.json({
      explanation: `Đã dời lùi các công việc bị ảnh hưởng thêm ${delayMinutes} phút để bạn xử lý thoải mái mà không bị chồng chéo lịch.`,
      impactSummary: `Đã điều chỉnh ${changes.length} sự kiện liên quan.`,
      changes,
      updatedEvents,
    });
  }
});

// AI Route 8: AI Energy-to-Task Matcher (Xếp lịch theo năng lượng sinh học)
app.post("/api/ai/match-energy", async (req, res) => {
  try {
    const { events = [], chronotype = "balanced", weekStart } = req.body;

    const systemInstruction = `Bạn là Chuyên gia Khoa học Nhịp sinh học & Hiệu suất Cá nhân (Chronobiology & High Performance Coach AI).
Nhiệm vụ của bạn là rà soát lịch trình của người dùng, phân tích mức độ phù hợp sinh học (Energy-to-Task Alignment) và tự động xếp lại lịch dựa trên Chronotype:

1. 'morning_bird' (Chim buổi sáng):
   - Đỉnh cao năng lượng (Peak Focus): 07:00 - 11:30. Khung giờ minh mẫn nhất, tự động xếp: Môn khó, học thi, viết luận, lập trình, tư duy chiến lược.
   - Khung sụt giảm (Post-lunch Slump): 13:00 - 15:30. Não bộ hạ nhiệt sau ăn trưa, xếp: Việc nhẹ nhàng, check email, dọn dẹp tài liệu, họp cập nhật ngắn.
   - Khung hồi phục (Recovery): 16:30 - 21:30. Thể thao, hoạt động cá nhân, thư giãn.

2. 'night_owl' (Cú đêm):
   - Khởi động chậm / Hồi phục (Recovery & Slow Start): 08:00 - 11:00. Thức dậy, thể thao nhẹ, việc cá nhân đơn giản.
   - Khung việc nhẹ / Slump: 13:30 - 15:30. Email, việc hành chính, sắp xếp bàn làm việc.
   - Đỉnh cao năng lượng (Peak Focus): 16:30 - 22:30+. Năng lượng sáng tạo và tập trung cao nhất, xếp: Nhiệm vụ khó, nghiên cứu, code thuật toán, viết bài.

3. 'balanced' (Nhịp cân bằng):
   - Đỉnh cao năng lượng (Peak Focus): 09:00 - 12:30. Xếp công việc trọng tâm nhất (Eat the Frog), bài tập lớn, môn khó.
   - Khung sụt giảm (Post-lunch Slump): 13:30 - 15:30. Xếp: Check email, phân loại tài liệu, họp định kỳ nhẹ nhàng.
   - Khung hồi phục (Recovery): 18:00 - 22:00. Thể dục thể thao, sở thích cá nhân, nghỉ ngơi.

YÊU CẦU ĐẦU RA:
1. energyAlignmentScore (0-100) và lời giải thích ngắn (scoreExplanation).
2. Lời khuyên cụ thể cho chronotype (chronotypeAdvice).
3. Mô tả các khung giờ peak, slump, recovery của người dùng.
4. Mảng audits: Đánh giá từng sự kiện hiện tại xem có bị xếp lệch nhịp sinh học không (isOptimal, mismatchReason, suggestedSlotTime).
5. Mảng optimizedEvents: Danh sách sự kiện sau khi AI đã dời giờ sang khung năng lượng chuẩn sinh học, KHÔNG ĐƯỢC TRÙNG LỊCH giữa các sự kiện trong cùng 1 ngày. Giữ nguyên id, title, category, priority, hasMeet. Thêm energyLevel ('peak_focus' | 'light_admin' | 'recovery') và reasoning (lý do dời).`;

    const response = await callGeminiSafe({
      contents: `Hãy phân tích và tối ưu hóa lịch trình sau theo nhịp sinh học "${chronotype}":\nTuần bắt đầu: ${weekStart || new Date().toISOString()}\nDanh sách sự kiện:\n${JSON.stringify(events, null, 2)}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chronotype: { type: Type.STRING },
            energyAlignmentScore: { type: Type.INTEGER },
            scoreExplanation: { type: Type.STRING },
            chronotypeAdvice: { type: Type.STRING },
            peakHoursDescription: { type: Type.STRING },
            slumpHoursDescription: { type: Type.STRING },
            recoveryHoursDescription: { type: Type.STRING },
            mismatchesCount: { type: Type.INTEGER },
            audits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  eventId: { type: Type.STRING },
                  taskTitle: { type: Type.STRING },
                  detectedEnergyLevel: {
                    type: Type.STRING,
                    enum: ["peak_focus", "light_admin", "recovery"],
                  },
                  currentSlotTime: { type: Type.STRING },
                  isOptimal: { type: Type.BOOLEAN },
                  mismatchReason: { type: Type.STRING },
                  suggestedSlotTime: { type: Type.STRING },
                },
                required: [
                  "eventId",
                  "taskTitle",
                  "detectedEnergyLevel",
                  "currentSlotTime",
                  "isOptimal",
                ],
              },
            },
            optimizedEvents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    enum: ["study", "work", "meeting", "personal", "break"],
                  },
                  priority: {
                    type: Type.STRING,
                    enum: ["high", "medium", "low"],
                  },
                  energyLevel: {
                    type: Type.STRING,
                    enum: ["peak_focus", "light_admin", "recovery"],
                  },
                  reasoning: { type: Type.STRING },
                  hasMeet: { type: Type.BOOLEAN },
                },
                required: [
                  "id",
                  "title",
                  "startTime",
                  "endTime",
                  "category",
                  "priority",
                  "energyLevel",
                ],
              },
            },
          },
          required: [
            "chronotype",
            "energyAlignmentScore",
            "scoreExplanation",
            "chronotypeAdvice",
            "peakHoursDescription",
            "slumpHoursDescription",
            "recoveryHoursDescription",
            "mismatchesCount",
            "audits",
            "optimizedEvents",
          ],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.error(
      "Error in AI energy matcher endpoint, utilizing intelligent fallback:",
      error,
    );
    try {
      const { events = [], chronotype = "balanced" } = req.body;
      const isMorning = chronotype === "morning_bird";
      const isNight = chronotype === "night_owl";

      const peakWindow = isMorning
        ? { start: 8, end: 12 }
        : isNight
          ? { start: 17, end: 21 }
          : { start: 9, end: 12 };
      const slumpWindow = { start: 13, end: 15 };
      const recoveryWindow = isMorning
        ? { start: 17, end: 20 }
        : isNight
          ? { start: 8, end: 11 }
          : { start: 18, end: 21 };

      let mismatchesCount = 0;
      const audits = events.map((ev: any) => {
        const startH = new Date(ev.startTime).getHours();
        const titleLower = (ev.title || "").toLowerCase();
        let detectedLevel: "peak_focus" | "light_admin" | "recovery" =
          "light_admin";

        if (
          ev.category === "study" ||
          ev.priority === "high" ||
          titleLower.includes("toán") ||
          titleLower.includes("thi") ||
          titleLower.includes("code") ||
          titleLower.includes("luận") ||
          titleLower.includes("dự án") ||
          titleLower.includes("sprint") ||
          titleLower.includes("chiến lược")
        ) {
          detectedLevel = "peak_focus";
        } else if (
          ev.category === "break" ||
          ev.category === "personal" ||
          titleLower.includes("gym") ||
          titleLower.includes("chạy") ||
          titleLower.includes("nghỉ") ||
          titleLower.includes("thể thao")
        ) {
          detectedLevel = "recovery";
        }

        let isOptimal = true;
        let mismatchReason = "";
        let suggestedSlotTime = "";

        if (detectedLevel === "peak_focus") {
          if (startH < peakWindow.start || startH >= peakWindow.end) {
            isOptimal = false;
            mismatchesCount++;
            mismatchReason = `Nhiệm vụ cần tập trung sâu đang xếp ngoài giờ vàng (${peakWindow.start}:00 - ${peakWindow.end}:00)`;
            suggestedSlotTime = `${peakWindow.start.toString().padStart(2, "0")}:00`;
          }
        } else if (detectedLevel === "light_admin") {
          if (startH >= peakWindow.start && startH < peakWindow.end) {
            isOptimal = false;
            mismatchesCount++;
            mismatchReason = `Việc nhẹ nhàng đang chiếm khung giờ vàng tập trung`;
            suggestedSlotTime = `${slumpWindow.start.toString().padStart(2, "0")}:00`;
          }
        }

        return {
          eventId: ev.id,
          taskTitle: ev.title,
          detectedEnergyLevel: detectedLevel,
          currentSlotTime: `${startH.toString().padStart(2, "0")}:00`,
          isOptimal,
          mismatchReason,
          suggestedSlotTime,
        };
      });

      const energyAlignmentScore = Math.max(
        40,
        Math.min(
          100,
          Math.round(100 - (mismatchesCount / Math.max(1, events.length)) * 50),
        ),
      );

      let peakCursor = peakWindow.start;
      let slumpCursor = slumpWindow.start;
      let recoveryCursor = recoveryWindow.start;
      let currentDay = "";

      const optimizedEvents = events.map((ev: any) => {
        const audit = audits.find((a: any) => a.eventId === ev.id);
        const level = audit ? audit.detectedEnergyLevel : "light_admin";
        const oldStart = new Date(ev.startTime);
        const oldEnd = new Date(ev.endTime);
        const durationMs = Math.max(
          30 * 60 * 1000,
          oldEnd.getTime() - oldStart.getTime(),
        );

        // Reset cursors khi sang ngày mới để tránh overlap cross-day
        const evDay = `${oldStart.getFullYear()}-${oldStart.getMonth()}-${oldStart.getDate()}`;
        if (evDay !== currentDay) {
          currentDay = evDay;
          peakCursor = peakWindow.start;
          slumpCursor = slumpWindow.start;
          recoveryCursor = recoveryWindow.start;
        }

        let targetHour = oldStart.getHours();
        let reasoning = "Khung giờ phù hợp với mức năng lượng.";

        if (level === "peak_focus") {
          targetHour = peakCursor;
          // Advance cursor by event duration in hours (min 1h)
          const durationHours = Math.ceil(durationMs / (60 * 60 * 1000));
          peakCursor = Math.min(peakWindow.end - 1, peakCursor + durationHours);
          reasoning = `Đã dời vào khung giờ vàng đỉnh cao (${peakWindow.start}:00 - ${peakWindow.end}:00) để tối đa năng suất.`;
        } else if (level === "light_admin") {
          targetHour = slumpCursor;
          const durationHours = Math.ceil(durationMs / (60 * 60 * 1000));
          slumpCursor = Math.min(
            slumpWindow.end + 1,
            slumpCursor + durationHours,
          );
          reasoning = `Đã dời vào khung sụt giảm sau bữa trưa (${slumpWindow.start}:00 - ${slumpWindow.end}:00) cho việc nhẹ nhàng.`;
        } else if (level === "recovery") {
          targetHour = recoveryCursor;
          const durationHours = Math.ceil(durationMs / (60 * 60 * 1000));
          recoveryCursor = Math.min(
            recoveryWindow.end,
            recoveryCursor + durationHours,
          );
          reasoning = `Đã dời vào khung hồi phục (${recoveryWindow.start}:00) để tái tạo năng lượng.`;
        }

        const newStart = new Date(oldStart);
        newStart.setHours(targetHour, 0, 0, 0);
        const newEnd = new Date(newStart.getTime() + durationMs);

        return {
          id: ev.id,
          title: ev.title,
          description: ev.description,
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
          category: ev.category,
          priority: ev.priority,
          energyLevel: level,
          reasoning,
          hasMeet: ev.hasMeet,
        };
      });

      return res.json({
        chronotype,
        energyAlignmentScore,
        scoreExplanation: `Phát hiện ${mismatchesCount} công việc chưa tối ưu theo nhịp sinh học ${chronotype}. Điểm đạt ${energyAlignmentScore}/100.`,
        chronotypeAdvice: isMorning
          ? "Bạn thuộc nhóm Chim Buổi Sáng: Hãy giải quyết toàn bộ bài tập khó, dự án lớn trước 11:30. Chiều sau ăn trưa chỉ check email và làm việc nhẹ."
          : isNight
            ? "Bạn thuộc nhóm Cú Đêm: Buổi sáng chỉ khởi động nhẹ và làm việc đơn giản. Hãy dồn toàn bộ sáng tạo và công việc phức tạp vào khung từ 17:00 trở đi."
            : 'Bạn thuộc nhóm Nhịp Cân Bằng: Khung 9h-12h là thời điểm vàng để "Eat the Frog" (xử lý việc khó nhất). Hãy nghỉ ngơi sau bữa trưa để nạp lại năng lượng.',
        peakHoursDescription: `${peakWindow.start}:00 - ${peakWindow.end}:00`,
        slumpHoursDescription: `${slumpWindow.start}:00 - ${slumpWindow.end}:30`,
        recoveryHoursDescription: `${recoveryWindow.start}:00 - ${recoveryWindow.end}:00`,
        mismatchesCount,
        audits,
        optimizedEvents,
      });
    } catch (fallbackErr: any) {
      return res.status(500).json({
        error: error.message || "Lỗi xếp lịch theo năng lượng sinh học",
      });
    }
  }
});

// AI Route 9: AI Travel Buffer & Preparation Time Analyzer
app.post("/api/ai/analyze-travel-buffers", async (req, res) => {
  const {
    events = [],
    defaultTransitMode = "motorcycle",
    defaultBufferMinutes = 25,
  } = req.body;

  try {
    const systemInstruction = `Bạn là Trợ lý Điều phối Di chuyển Đô thị & Quản lý Thời gian (Urban Mobility & Travel Buffer AI).
Vấn đề giải quyết: Người dùng thường đặt 2 sự kiện offline liên tiếp (ví dụ: kết thúc lúc 09:00 tại Quận 1, sự kiện tiếp theo bắt đầu lúc 09:00 tại Quận 7) mà không chèn thời gian di chuyển và đệm nghỉ, dẫn đến luôn bị trễ giờ hoặc kiệt sức vì kẹt xe.

Nhiệm vụ của bạn:
1. Quét danh sách sự kiện, xác định các sự kiện có địa điểm bên ngoài (physical locations như trường học, công ty, quán cafe, quận/huyện, bệnh viện, sân bóng...).
2. Phát hiện các cặp sự kiện liên tiếp nhau trong cùng một ngày có nguy cơ trễ giờ (Travel Hazards / Zero-buffer):
   - Sự kiện A kết thúc và sự kiện B bắt đầu ngay lập tức (khoảng trống = 0 phút).
   - Hoặc khoảng trống giữa hai sự kiện < 15-30 phút không đủ để di chuyển giữa hai địa điểm.
3. Ước lượng thời gian di chuyển thực tế (recommendedBufferMinutes: 15-45 phút tùy khoảng cách giữa các quận/địa điểm và tình trạng kẹt xe giờ cao điểm).
4. Tạo danh sách các khối đệm di chuyển (suggestedBuffers) với tiêu đề như "🚗 Di chuyển: [Địa điểm A] ➔ [Địa điểm B]" hoặc "🚗 Di chuyển & Chuẩn bị: [Địa điểm B]".
5. Tạo danh sách lịch đã được tái cấu trúc (autoShiftedEvents): Chèn các khối đệm vào trước sự kiện B, nếu cần hãy dời sự kiện B lùi lại để tránh trùng giờ.`;

    const response = await callGeminiSafe({
      contents: `Hãy quét và phân tích thời gian di chuyển cho danh sách sự kiện sau:\nPhương tiện mặc định: ${defaultTransitMode}, Đệm tối thiểu: ${defaultBufferMinutes} phút.\nSự kiện:\n${JSON.stringify(events, null, 2)}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            offlineEventsCount: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            hazards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  previousEventId: { type: Type.STRING },
                  previousTitle: { type: Type.STRING },
                  nextEventId: { type: Type.STRING },
                  nextTitle: { type: Type.STRING },
                  originLocation: { type: Type.STRING },
                  destinationLocation: { type: Type.STRING },
                  actualGapMinutes: { type: Type.INTEGER },
                  recommendedBufferMinutes: { type: Type.INTEGER },
                  estimatedTrafficNote: { type: Type.STRING },
                },
                required: [
                  "id",
                  "previousTitle",
                  "nextTitle",
                  "originLocation",
                  "destinationLocation",
                  "actualGapMinutes",
                  "recommendedBufferMinutes",
                  "estimatedTrafficNote",
                ],
              },
            },
            suggestedBuffers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  targetEventId: { type: Type.STRING },
                  targetTitle: { type: Type.STRING },
                  bufferMinutes: { type: Type.INTEGER },
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  origin: { type: Type.STRING },
                  destination: { type: Type.STRING },
                  transitMode: {
                    type: Type.STRING,
                    enum: ["motorcycle", "car", "transit", "walking"],
                  },
                  note: { type: Type.STRING },
                },
                required: [
                  "targetEventId",
                  "targetTitle",
                  "bufferMinutes",
                  "startTime",
                  "endTime",
                  "destination",
                  "note",
                ],
              },
            },
          },
          required: [
            "offlineEventsCount",
            "summary",
            "hazards",
            "suggestedBuffers",
          ],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.error(
      "Error in travel buffer endpoint, using intelligent fallback:",
      error,
    );

    // High quality rule-based fallback
    try {
      const nonBufferEvents = events.filter((e: any) => !e.isTravelBuffer);
      const eventsByDay: Record<string, any[]> = {};

      nonBufferEvents.forEach((ev: any) => {
        const dayStr = new Date(ev.startTime).toISOString().split("T")[0];
        if (!eventsByDay[dayStr]) eventsByDay[dayStr] = [];
        eventsByDay[dayStr].push(ev);
      });

      const hazards: any[] = [];
      const suggestedBuffers: any[] = [];
      let offlineEventsCount = 0;

      Object.entries(eventsByDay).forEach(([dayStr, dayEvents]) => {
        // Sort chronologically
        dayEvents.sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        );

        for (let i = 0; i < dayEvents.length; i++) {
          const current = dayEvents[i];
          const hasLocation = !!(current.location && current.location.trim());
          if (hasLocation || !current.hasMeet) offlineEventsCount++;

          if (i < dayEvents.length - 1) {
            const next = dayEvents[i + 1];
            const endCurrent = new Date(current.endTime).getTime();
            const startNext = new Date(next.startTime).getTime();
            const gapMinutes = Math.round(
              (startNext - endCurrent) / (1000 * 60),
            );

            const locA = current.location || "Địa điểm trước";
            const locB = next.location || "Địa điểm sau";

            // Check if there is a travel hazard (0 min gap or < 25 mins between different offline locations)
            if (
              gapMinutes < defaultBufferMinutes &&
              (!current.hasMeet || !next.hasMeet)
            ) {
              const recommended = Math.max(defaultBufferMinutes, 25);
              const note = `Di chuyển từ "${locA}" sang "${locB}" cần khoảng ${recommended} phút đệm dự phòng kẹt xe.`;

              const hazardId = `hazard-${current.id}-${next.id}`;
              hazards.push({
                id: hazardId,
                previousEventId: current.id,
                previousTitle: current.title,
                nextEventId: next.id,
                nextTitle: next.title,
                originLocation: locA,
                destinationLocation: locB,
                actualGapMinutes: Math.max(0, gapMinutes),
                recommendedBufferMinutes: recommended,
                estimatedTrafficNote: note,
              });

              // Buffer times
              const bufferEnd = new Date(next.startTime);
              const bufferStart = new Date(
                bufferEnd.getTime() - recommended * 60 * 1000,
              );

              suggestedBuffers.push({
                targetEventId: next.id,
                targetTitle: next.title,
                bufferMinutes: recommended,
                startTime: bufferStart.toISOString(),
                endTime: bufferEnd.toISOString(),
                origin: locA,
                destination: locB,
                transitMode: defaultTransitMode,
                note,
              });
            }
          }
        }
      });

      return res.json({
        offlineEventsCount,
        summary:
          hazards.length > 0
            ? `Phát hiện ${hazards.length} khoảng chuyển tiếp di chuyển gấp rút (< ${defaultBufferMinutes} phút) cần chèn thời gian đệm.`
            : "Lịch trình di chuyển của bạn đã có đủ khoảng đệm an toàn giữa các địa điểm.",
        hazards,
        suggestedBuffers,
      });
    } catch (fallbackErr: any) {
      return res
        .status(500)
        .json({ error: error.message || "Lỗi phân tích thời gian di chuyển" });
    }
  }
});

// Health check endpoint — dùng cho cron job ping để giữ server khỏi sleep
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// AI Diagnostics / Debug Status endpoint — dùng kiểm tra trạng thái API keys & kết nối Gemini trên Render
app.get("/api/ai/debug-status", async (_req, res) => {
  const keys = getApiKeys();
  const maskedKeys = keys.map((k, idx) => ({
    index: idx + 1,
    masked: `${k.substring(0, 8)}...${k.substring(k.length - 4)}`,
    length: k.length,
    prefix: k.substring(0, 4),
  }));

  const pingTest: {
    tested: boolean;
    success: boolean;
    modelUsed: string;
    latencyMs: number;
    responsePreview?: string;
    error?: string;
  } = {
    tested: false,
    success: false,
    modelUsed: "",
    latencyMs: 0,
  };

  if (keys.length > 0) {
    pingTest.tested = true;
    const start = Date.now();
    try {
      const response = await callGeminiSafe({
        contents: "Xin chào, hãy trả lời đúng 2 từ: Sẵn sàng",
      });
      pingTest.success = true;
      pingTest.latencyMs = Date.now() - start;
      pingTest.modelUsed = "gemini-2.0-flash";
      pingTest.responsePreview = response?.text?.trim()?.substring(0, 50);
    } catch (err: any) {
      pingTest.success = false;
      pingTest.latencyMs = Date.now() - start;
      pingTest.error = err?.message || String(err);
    }
  }

  res.json({
    status: pingTest.success
      ? "healthy"
      : keys.length === 0
        ? "no_keys"
        : "api_error",
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || "development",
    totalKeysDetected: keys.length,
    keys: maskedKeys,
    geminiPingTest: pingTest,
  });
});

// Vite middleware in dev or static files in production
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Smart Schedule] Server started on port ${PORT}`);
});
