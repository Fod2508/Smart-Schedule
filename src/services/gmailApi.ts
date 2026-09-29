function encodeBase64Url(str: string): string {
  // UTF-8 safe base64 encoding
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendScheduleEmail(
  accessToken: string,
  toEmail: string,
  subject: string,
  htmlContent: string
): Promise<{ id: string; threadId: string }> {
  // Construct RFC 2822 / RFC 822 formatted message
  const utf8Subject = `=?UTF-8?B?${btoa(
    new TextEncoder()
      .encode(subject)
      .reduce((acc, byte) => acc + String.fromCharCode(byte), '')
  )}?=`;

  const emailLines = [
    `To: ${toEmail}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlContent,
  ];

  const rawMessage = emailLines.join('\r\n');
  const encodedEmail = encodeBase64Url(rawMessage);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedEmail,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi gửi email qua Gmail (${res.status})`);
  }

  return await res.json();
}
