const { google } = require('googleapis');

function dateToGmailFormat(dateStr) {
  // '2024-01-15' => '2024/01/15'
  return dateStr.replace(/-/g, '/');
}

function nextDay(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return dateToGmailFormat(d.toISOString().slice(0, 10));
}

function parseRole(subject) {
  const patterns = [
    /application (?:for|regarding|re:?)\s*(.+?)(?:\s*[-–—]|\s*$)/i,
    /re:\s*(.+?)(?:\s*[-–—]|\s*$)/i,
    /applied (?:for|to)\s*(.+?)(?:\s*at|\s*[-–—]|\s*$)/i,
  ];
  for (const p of patterns) {
    const m = subject.match(p);
    if (m) return m[1].trim();
  }
  return 'Position';
}

function extractCompany(toAddress) {
  try {
    const domain = toAddress.split('@')[1];
    if (!domain) return 'Unknown';
    return domain.replace(/^www\./, '').split('.')[0];
  } catch {
    return 'Unknown';
  }
}

exports.scanSentFolder = async function (refreshToken, targetDate) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const query = `in:sent after:${dateToGmailFormat(targetDate)} before:${nextDay(targetDate)} (subject:application OR subject:applied OR subject:"job application" OR subject:resume OR subject:"cover letter")`;

    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 20,
    });

    if (!listRes.data.messages) return [];

    const results = [];
    for (const msg of listRes.data.messages) {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'To', 'Date'],
      });

      const headers = detail.data.payload.headers;
      const subject = headers.find((h) => h.name === 'Subject')?.value || '';
      const to = headers.find((h) => h.name === 'To')?.value || '';
      const date = headers.find((h) => h.name === 'Date')?.value || '';

      const time = date ? new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '00:00';

      results.push({
        source: 'gmail_sent',
        company: extractCompany(to),
        role: parseRole(subject),
        time,
        rawSubject: subject,
      });
    }

    return results;
  } catch (error) {
    return [];
  }
};
