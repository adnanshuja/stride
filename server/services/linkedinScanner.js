const { google } = require('googleapis');

function dateToGmailFormat(dateStr) {
  return dateStr.replace(/-/g, '/');
}

function nextDay(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return dateToGmailFormat(d.toISOString().slice(0, 10));
}

exports.scanLinkedInEmails = async function (refreshToken, targetDate) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const query = `from:jobs-noreply@linkedin.com after:${dateToGmailFormat(targetDate)} before:${nextDay(targetDate)} (subject:applied OR subject:"application was sent")`;

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
      const date = headers.find((h) => h.name === 'Date')?.value || '';

      const time = date ? new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '00:00';

      // Parse: "Your application was sent to [Company]"
      let company = 'Unknown';
      let role = 'Position';
      const sentMatch = subject.match(/application was sent to (.+?)$/i);
      if (sentMatch) {
        company = sentMatch[1].trim();
      }
      const appliedMatch = subject.match(/You applied to (.+?) at (.+?)$/i);
      if (appliedMatch) {
        role = appliedMatch[1].trim();
        company = appliedMatch[2].trim();
      }

      results.push({
        source: 'linkedin',
        company,
        role,
        time,
        rawSubject: subject,
      });
    }

    return results;
  } catch (error) {
    return [];
  }
};
