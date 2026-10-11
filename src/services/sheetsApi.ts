import { ScheduleItem } from '../types/schedule';

export interface ExportSheetOptions {
  layout?: 'timetable_grid' | 'detailed_list' | 'both';
  weekRange?: { monday: Date; sunday: Date };
}

export async function exportScheduleToNewSpreadsheet(
  accessToken: string,
  title: string,
  items: ScheduleItem[],
  options?: ExportSheetOptions
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const layout = options?.layout || 'both';

  // 1. Tính toán tuần từ Thứ 2 đến Chủ nhật
  let monday: Date;
  let sunday: Date;

  if (options?.weekRange) {
    monday = new Date(options.weekRange.monday);
    sunday = new Date(options.weekRange.sunday);
  } else if (items.length > 0) {
    const firstDate = new Date(items[0].startTime);
    const day = firstDate.getDay();
    const diff = firstDate.getDate() - day + (day === 0 ? -6 : 1);
    monday = new Date(firstDate.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
  } else {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const dayNames = [
    'Thứ 2',
    'Thứ 3',
    'Thứ 4',
    'Thứ 5',
    'Thứ 6',
    'Thứ 7',
    'Chủ Nhật',
  ];

  // 2. Chuẩn bị dữ liệu bảng Lưới Thời Khóa Biểu (Thứ 2 - CN)
  const gridHeaders = [
    'Khung giờ',
    ...weekDays.map(
      (d, i) =>
        `${dayNames[i]} (${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')})`
    ),
  ];

  const categoryLabels: Record<string, string> = {
    study: 'Học tập',
    work: 'Công việc',
    meeting: 'Cuộc họp',
    personal: 'Cá nhân',
    break: 'Nghỉ ngơi',
  };

  const priorityLabels: Record<string, string> = {
    high: 'Cao (Quan trọng)',
    medium: 'Trung bình',
    low: 'Thấp',
  };

  // Xác định khoảng giờ từ sự kiện thực tế (mặc định tối thiểu 06:00 - 22:00)
  let minHour = 6;
  let maxHour = 22;

  items.forEach((item) => {
    const s = new Date(item.startTime).getHours();
    const e = new Date(item.endTime).getHours();
    if (s < minHour) minHour = s;
    if (e > maxHour) maxHour = e;
  });

  minHour = Math.max(0, Math.min(minHour, 7));
  maxHour = Math.min(23, Math.max(maxHour, 21));

  const gridRows: string[][] = [];

  for (let h = minHour; h <= maxHour; h++) {
    const timeLabel = `${String(h).padStart(2, '0')}:00 - ${String(h + 1).padStart(2, '0')}:00`;
    const row = [timeLabel];

    for (let d = 0; d < 7; d++) {
      const targetDay = weekDays[d];
      const targetDateStr = `${targetDay.getFullYear()}-${String(targetDay.getMonth() + 1).padStart(2, '0')}-${String(targetDay.getDate()).padStart(2, '0')}`;

      const matching = items.filter((item) => {
        const itemDate = new Date(item.startTime);
        const itemDateStr = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
        return itemDateStr === targetDateStr && itemDate.getHours() === h;
      });

      if (matching.length === 0) {
        row.push('');
      } else {
        const cellText = matching
          .map((item) => {
            const sHM = new Date(item.startTime).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const eHM = new Date(item.endTime).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const cat = categoryLabels[item.category] || item.category;
            const lines = [
              `📌 ${item.title}`,
              `⏰ ${sHM} - ${eHM} [${cat}]`,
            ];
            if (item.hasMeet || item.meetLink) {
              lines.push(`🔗 Meet: ${item.meetLink || 'Có link Meet'}`);
            }
            if (item.pomodoroBlocks) {
              lines.push(`🍅 ${item.pomodoroBlocks} block`);
            }
            if (item.description) {
              lines.push(`📝 ${item.description}`);
            }
            return lines.join('\n');
          })
          .join('\n───────────────\n');
        row.push(cellText);
      }
    }
    gridRows.push(row);
  }

  // 3. Chuẩn bị dữ liệu bảng Danh sách chi tiết
  const listHeaders = [
    'Môn học / Hoạt động',
    'Thứ',
    'Bắt đầu',
    'Kết thúc',
    'Phân loại',
    'Ưu tiên',
    'Google Meet',
    'Pomodoro (block)',
    'Ghi chú',
  ];

  const listRows = items.map((item) => {
    const sDate = new Date(item.startTime);
    const dayOfWeek = dayNames[sDate.getDay() === 0 ? 6 : sDate.getDay() - 1] || '';
    const start = sDate.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const end = new Date(item.endTime).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return [
      item.title,
      dayOfWeek,
      start,
      end,
      categoryLabels[item.category] || item.category,
      priorityLabels[item.priority] || item.priority,
      item.meetLink || (item.hasMeet ? 'Cần tạo Meet' : 'Không'),
      item.pomodoroBlocks ? `${item.pomodoroBlocks} block` : '-',
      item.description || '',
    ];
  });

  // 4. Khởi tạo danh sách các sheets trong Google Spreadsheet
  const sheetsToCreate: any[] = [];
  const GRID_TITLE = 'Lịch tuần (Thứ 2 - CN)';
  const LIST_TITLE = 'Danh sách chi tiết';

  if (layout === 'timetable_grid') {
    sheetsToCreate.push({
      properties: {
        sheetId: 0,
        title: GRID_TITLE,
        gridProperties: {
          frozenRowCount: 1,
          frozenColumnCount: 1,
        },
      },
    });
  } else if (layout === 'detailed_list') {
    sheetsToCreate.push({
      properties: {
        sheetId: 0,
        title: LIST_TITLE,
        gridProperties: {
          frozenRowCount: 1,
        },
      },
    });
  } else {
    // 'both': Tab 1 là Lịch tuần dạng lưới, Tab 2 là Danh sách chi tiết
    sheetsToCreate.push(
      {
        properties: {
          sheetId: 0,
          title: GRID_TITLE,
          gridProperties: {
            frozenRowCount: 1,
            frozenColumnCount: 1,
          },
        },
      },
      {
        properties: {
          sheetId: 1,
          title: LIST_TITLE,
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      }
    );
  }

  // 5. Tạo Google Spreadsheet qua API
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || `Smart Schedule - Thời khóa biểu (${new Date().toLocaleDateString('vi-VN')})`,
      },
      sheets: sheetsToCreate,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    if (createRes.status === 401) {
      throw new Error(
        'Phiên đăng nhập Google đã hết hạn (401). Vui lòng bấm Gia hạn hoặc kết nối lại Google.'
      );
    }
    throw new Error(err.error?.message || `Lỗi tạo Google Sheet mới (${createRes.status})`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  // 6. Ghi dữ liệu vào các sheets tương ứng
  const dataPayload: any[] = [];

  if (layout === 'timetable_grid' || layout === 'both') {
    dataPayload.push({
      range: `'${GRID_TITLE}'!A1:H${gridRows.length + 1}`,
      values: [gridHeaders, ...gridRows],
    });
  }

  if (layout === 'detailed_list' || layout === 'both') {
    dataPayload.push({
      range: `'${LIST_TITLE}'!A1:I${listRows.length + 1}`,
      values: [listHeaders, ...listRows],
    });
  }

  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataPayload,
      }),
    }
  );

  if (!valuesRes.ok) {
    const err = await valuesRes.json().catch(() => ({}));
    if (valuesRes.status === 401) {
      throw new Error(
        'Phiên đăng nhập Google đã hết hạn (401). Vui lòng bấm Gia hạn hoặc kết nối lại Google.'
      );
    }
    throw new Error(err.error?.message || `Lỗi ghi dữ liệu vào Google Sheet (${valuesRes.status})`);
  }

  // 7. Định dạng giao diện bảng tính (Màu sắc, viền, wrap text, độ rộng cột)
  try {
    const requests: any[] = [];

    // Format cho Sheet Lịch tuần dạng lưới
    if (layout === 'timetable_grid' || layout === 'both') {
      const gridSheetId = 0;

      // Độ rộng cột: Cột thời gian 120px, các cột Thứ 2..CN 185px
      requests.push(
        {
          updateDimensionProperties: {
            range: {
              sheetId: gridSheetId,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: 1,
            },
            properties: {
              pixelSize: 120,
            },
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId: gridSheetId,
              dimension: 'COLUMNS',
              startIndex: 1,
              endIndex: 8,
            },
            properties: {
              pixelSize: 185,
            },
            fields: 'pixelSize',
          },
        }
      );

      // Header row: Xanh ngọc đậm (Teal/Emerald), chữ trắng đậm, căn giữa
      requests.push({
        repeatCell: {
          range: {
            sheetId: gridSheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 8,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.06, green: 0.46, blue: 0.43 },
              textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 1, green: 1, blue: 1 } },
              horizontalAlignment: 'CENTER',
              verticalAlignment: 'MIDDLE',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
        },
      });

      // Cột thời gian (Cột A): Nền xám nhạt, chữ đậm căn giữa
      requests.push({
        repeatCell: {
          range: {
            sheetId: gridSheetId,
            startRowIndex: 1,
            endRowIndex: gridRows.length + 1,
            startColumnIndex: 0,
            endColumnIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.94, green: 0.96, blue: 0.98 },
              textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0.2, green: 0.25, blue: 0.3 } },
              horizontalAlignment: 'CENTER',
              verticalAlignment: 'MIDDLE',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
        },
      });

      // Các ô sự kiện (Cột B..H): Tự động xuống dòng (WRAP), căn lề trên (TOP)
      requests.push({
        repeatCell: {
          range: {
            sheetId: gridSheetId,
            startRowIndex: 1,
            endRowIndex: gridRows.length + 1,
            startColumnIndex: 1,
            endColumnIndex: 8,
          },
          cell: {
            userEnteredFormat: {
              wrapStrategy: 'WRAP',
              verticalAlignment: 'TOP',
              textFormat: { fontSize: 10 },
            },
          },
          fields: 'userEnteredFormat(wrapStrategy,verticalAlignment,textFormat.fontSize)',
        },
      });

      // Kẻ viền bảng (Borders) cho toàn bộ lưới lịch
      requests.push({
        updateBorders: {
          range: {
            sheetId: gridSheetId,
            startRowIndex: 0,
            endRowIndex: gridRows.length + 1,
            startColumnIndex: 0,
            endColumnIndex: 8,
          },
          top: { style: 'SOLID', color: { red: 0.75, green: 0.8, blue: 0.85 } },
          bottom: { style: 'SOLID', color: { red: 0.75, green: 0.8, blue: 0.85 } },
          left: { style: 'SOLID', color: { red: 0.75, green: 0.8, blue: 0.85 } },
          right: { style: 'SOLID', color: { red: 0.75, green: 0.8, blue: 0.85 } },
          innerHorizontal: { style: 'SOLID', color: { red: 0.85, green: 0.88, blue: 0.92 } },
          innerVertical: { style: 'SOLID', color: { red: 0.85, green: 0.88, blue: 0.92 } },
        },
      });
    }

    // Format cho Sheet Danh sách chi tiết
    if (layout === 'detailed_list' || layout === 'both') {
      const listSheetId = layout === 'detailed_list' ? 0 : 1;

      // Header row: Xanh chàm (Indigo), chữ trắng đậm
      requests.push({
        repeatCell: {
          range: {
            sheetId: listSheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 9,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.26, green: 0.36, blue: 0.95 },
              textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 1, green: 1, blue: 1 } },
              horizontalAlignment: 'CENTER',
              verticalAlignment: 'MIDDLE',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
        },
      });

      // Tự động căn chỉnh độ rộng cột
      requests.push({
        autoResizeDimensions: {
          dimensions: {
            sheetId: listSheetId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: 9,
          },
        },
      });
    }

    if (requests.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests,
        }),
      });
    }
  } catch (fmtError) {
    console.warn('Formatting spreadsheet error ignored:', fmtError);
  }

  return { spreadsheetId, spreadsheetUrl };
}

export async function readScheduleFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  range?: string
): Promise<Partial<ScheduleItem>[]> {
  // Tự động tìm tên trang tính đầu tiên để tránh lỗi locale Sheet1 vs Trang tính 1
  let targetRange = range;
  if (!targetRange) {
    try {
      const metaRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties.title`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const firstSheetTitle = meta.sheets?.[0]?.properties?.title;
        if (firstSheetTitle) {
          targetRange = `'${firstSheetTitle}'!A2:I100`;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch spreadsheet title metadata:', e);
    }
  }

  if (!targetRange) {
    targetRange = 'A2:I100';
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(targetRange)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error(
        'Phiên đăng nhập Google đã hết hạn (401). Vui lòng bấm Gia hạn hoặc kết nối lại Google.'
      );
    }
    throw new Error(err.error?.message || `Lỗi đọc dữ liệu Google Sheet (${res.status})`);
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  return rows
    .filter((r) => r.length > 0 && r[0])
    .map((r, index) => {
      const title = r[0] || `Hoạt động ${index + 1}`;
      const desc = r[8] || r[7] || '';
      const meet = r[6] || r[5] || '';
      return {
        title,
        description: desc,
        category: 'study',
        priority: 'medium',
        hasMeet: (meet || '').toLowerCase().includes('http'),
        meetLink: (meet || '').startsWith('http') ? meet : undefined,
      };
    });
}
