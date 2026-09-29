import { ScheduleItem } from '../types/schedule';

export async function exportScheduleToNewSpreadsheet(
  accessToken: string,
  title: string,
  items: ScheduleItem[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // 1. Create new spreadsheet
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
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi tạo Google Sheet mới (${createRes.status})`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  // 2. Prepare rows
  const headers = [
    'Môn học / Hoạt động',
    'Bắt đầu',
    'Kết thúc',
    'Phân loại',
    'Ưu tiên',
    'Google Meet',
    'Pomodoro (block)',
    'Ghi chú',
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

  const rows = items.map((item) => {
    const start = new Date(item.startTime).toLocaleString('vi-VN', {
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const end = new Date(item.endTime).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return [
      item.title,
      start,
      end,
      categoryLabels[item.category] || item.category,
      priorityLabels[item.priority] || item.priority,
      item.meetLink || (item.hasMeet ? 'Cần tạo Meet' : 'Không'),
      item.pomodoroBlocks ? `${item.pomodoroBlocks} block` : '-',
      item.description || '',
    ];
  });

  // 3. Populate values
  const range = 'Sheet1!A1:H' + (rows.length + 1);
  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [headers, ...rows],
      }),
    }
  );

  if (!valuesRes.ok) {
    const err = await valuesRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi ghi dữ liệu vào Google Sheet (${valuesRes.status})`);
  }

  // 4. Format header style (Deep indigo background, white bold text)
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 8,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.26, green: 0.36, blue: 0.95 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 8,
              },
            },
          },
        ],
      }),
    });
  } catch (fmtError) {
    console.warn('Formatting spreadsheet error ignored:', fmtError);
  }

  return { spreadsheetId, spreadsheetUrl };
}

export async function readScheduleFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  range: string = 'Sheet1!A2:H50'
): Promise<Partial<ScheduleItem>[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi đọc dữ liệu Google Sheet (${res.status})`);
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  return rows
    .filter((r) => r.length > 0 && r[0])
    .map((r, index) => {
      const title = r[0] || `Hoạt động ${index + 1}`;
      const desc = r[7] || '';
      return {
        title,
        description: desc,
        category: 'study',
        priority: 'medium',
        hasMeet: (r[5] || '').toLowerCase().includes('http'),
        meetLink: (r[5] || '').startsWith('http') ? r[5] : undefined,
      };
    });
}
