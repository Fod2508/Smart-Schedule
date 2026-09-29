import { GoogleTaskItem } from '../types/schedule';

export async function listTaskLists(accessToken: string): Promise<{ id: string; title: string }[]> {
  try {
    const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Lỗi tải danh sách Google Tasks (${res.status})`);
    }

    const data = await res.json();
    return (data.items || []).map((list: any) => ({
      id: list.id,
      title: list.title,
    }));
  } catch (error: any) {
    console.error('listTaskLists error:', error);
    throw error;
  }
}

export async function listGoogleTasks(accessToken: string, listId: string, listTitle: string): Promise<GoogleTaskItem[]> {
  try {
    const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks?showCompleted=false&showHidden=false`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Lỗi tải công việc từ Google Tasks (${res.status})`);
    }

    const data = await res.json();
    return (data.items || [])
      .filter((t: any) => t.title && t.status !== 'completed')
      .map((t: any): GoogleTaskItem => ({
        id: t.id,
        title: t.title,
        notes: t.notes || '',
        due: t.due,
        status: t.status,
        listId,
        listTitle,
      }));
  } catch (error: any) {
    console.error('listGoogleTasks error:', error);
    throw error;
  }
}

export async function createGoogleTask(
  accessToken: string,
  listId: string,
  title: string,
  notes?: string,
  due?: string
): Promise<GoogleTaskItem> {
  const body: any = { title };
  if (notes) body.notes = notes;
  if (due) body.due = due;

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi tạo task mới (${res.status})`);
  }

  const data = await res.json();
  return {
    id: data.id,
    title: data.title,
    notes: data.notes,
    due: data.due,
    status: data.status,
    listId,
    listTitle: '',
  };
}

export async function markGoogleTaskCompleted(
  accessToken: string,
  listId: string,
  taskId: string
): Promise<boolean> {
  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'completed',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi cập nhật trạng thái task (${res.status})`);
  }

  return true;
}
