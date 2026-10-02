/**
 * UTF-8 safe base64url encode — dùng cho toàn bộ raw email message
 */
function encodeBase64Url(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * UTF-8 safe base64 encode chỉ cho subject header
 * Tránh crash InvalidCharacterError khi subject có tiếng Việt hoặc emoji
 */
function encodeSubjectHeader(subject: string): string {
  const utf8Bytes = new TextEncoder().encode(subject);
  let binary = "";
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

export async function sendScheduleEmail(
  accessToken: string,
  toEmail: string,
  subject: string,
  htmlContent: string,
): Promise<{ id: string; threadId: string }> {
  const utf8Subject = encodeSubjectHeader(subject);

  const emailLines = [
    `To: ${toEmail}`,
    `Subject: ${utf8Subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    htmlContent,
  ];

  const rawMessage = emailLines.join("\r\n");
  const encodedEmail = encodeBase64Url(rawMessage);

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedEmail }),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error?.message || `Lỗi gửi email qua Gmail (${res.status})`,
    );
  }

  return await res.json();
}
