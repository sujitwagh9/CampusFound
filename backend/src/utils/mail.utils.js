import nodemailer from 'nodemailer';
import { config } from '../config.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: config.mail.user, pass: config.mail.pass },
});

// When mail is disabled (tests, demos) messages are kept here instead of sent,
// so tests can check what would have gone out.
export const outbox = [];

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const link = (path) => `${config.frontendUrl}${path}`;
const itemLink = (item) => link(`/items/${item._id}`);

/**
 * Branded email layout (inline styles, since email clients ignore <style>).
 * `lines` are paragraphs of plain text; `details` an optional list of label/value rows.
 */
const render = ({ heading, lines = [], details = [], action, footnote }) => {
  const p = (t) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#2b2925">${escapeHtml(t)}</p>`;
  const rows = details
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;font-size:13px;color:#77716a;width:120px">${escapeHtml(k)}</td><td style="padding:6px 0;font-size:14px;color:#1d1b18;font-weight:600">${escapeHtml(v)}</td></tr>`
    )
    .join('');
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f2ea;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fffdf8;border:1.5px solid #1d1b18;border-radius:14px;overflow:hidden">
    <tr><td style="background:#fdc93b;border-bottom:1.5px solid #1d1b18;padding:14px 24px;font-weight:700;font-size:16px;color:#1d1b18">CampusFound</td></tr>
    <tr><td style="padding:28px 24px 8px">
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#1d1b18">${escapeHtml(heading)}</h1>
      ${lines.map(p).join('')}
      ${rows ? `<table role="presentation" style="margin:4px 0 18px;border-top:1px dashed #d8d0c2;border-bottom:1px dashed #d8d0c2;width:100%">${rows}</table>` : ''}
      ${action ? `<p style="margin:8px 0 22px"><a href="${action.url}" style="display:inline-block;background:#fdc93b;color:#1d1b18;text-decoration:none;font-weight:700;font-size:14px;padding:11px 18px;border:1.5px solid #1d1b18;border-radius:10px">${escapeHtml(action.label)}</a></p>` : ''}
    </td></tr>
    <tr><td style="padding:14px 24px 22px;font-size:12px;line-height:1.5;color:#8a8379;border-top:1px solid #ece5d8">${escapeHtml(footnote || 'You’re receiving this because you have a CampusFound account.')}</td></tr>
  </table></body></html>`;
  const text = [
    heading,
    '',
    ...lines,
    ...(details.length ? ['', ...details.map(([k, v]) => `${k}: ${v}`)] : []),
    ...(action ? ['', `${action.label}: ${action.url}`] : []),
    '',
    '— CampusFound',
  ].join('\n');
  return { html, text };
};

/**
 * Sends an email in the background. Mail failures are logged and never
 * break the request that triggered them.
 */
const send = ({ to, subject, ...content }) => {
  const { html, text } = render(content);
  if (config.mail.disabled) {
    outbox.push({ to, subject, text, html });
    console.log(`[mail] disabled (test/MAIL_DISABLED), not sending "${subject}" to ${to}`);
    return Promise.resolve();
  }
  if (!config.mail.user || !config.mail.pass) {
    console.warn(`[mail] EMAIL_USER/EMAIL_PASS not set, skipping "${subject}" to ${to}`);
    return Promise.resolve();
  }
  return transporter
    .sendMail({ from: `"CampusFound" <${config.mail.user}>`, to, subject, text, html })
    .then(() => console.log(`[mail] "${subject}" sent to ${to}`))
    .catch((err) => console.error(`[mail] failed to send "${subject}" to ${to}:`, err.message));
};

// Confirmations of the user's own actions can be turned off in their profile
const ACTIVITY_FOOTNOTE = 'You’re receiving this because activity emails are on. You can turn them off under Profile → Settings.';
const sendActivity = (user, message) =>
  user?.email && user.emailActivity !== false ? send({ to: user.email, footnote: ACTIVITY_FOOTNOTE, ...message }) : Promise.resolve();

// Security notices always go out, regardless of preferences
const SECURITY_FOOTNOTE = 'This is a security notice and can’t be turned off. If this wasn’t you, reset your password straight away.';

const typeWord = (item) => (item.type?.toLowerCase() === 'found' ? 'found' : 'lost');
const itemDetails = (item) => [
  ['Item', item.title],
  ['Type', typeWord(item) === 'found' ? 'Found' : 'Lost'],
  ['Category', item.category === 'College-Id' ? 'College ID' : item.category],
  ['Location', item.location],
];

/* ---------------------------------------------------------------- */
/* Account                                                          */
/* ---------------------------------------------------------------- */

export const sendWelcomeMail = (user) =>
  send({
    to: user.email,
    subject: 'Welcome to CampusFound',
    heading: `Welcome, ${user.username}!`,
    lines: [
      'Your account is ready. You can now report things you’ve lost or found, and claim items that belong to you.',
      'We’ll email you when something you report gets a possible match, and whenever there’s news about your items or claims.',
    ],
    action: { label: 'Explore found items', url: link('/explore?type=found') },
  });

export const sendPasswordResetMail = (to, resetLink) =>
  send({
    to,
    subject: 'Password reset - CampusFound',
    heading: 'Reset your password',
    lines: ['We received a request to reset your password. This link is valid for 1 hour.', 'If you didn’t ask for this, you can ignore this email; your password won’t change.'],
    action: { label: 'Choose a new password', url: resetLink },
    footnote: SECURITY_FOOTNOTE,
  });

export const sendPasswordChangedMail = (user, how = 'changed') =>
  send({
    to: user.email,
    subject: 'Your CampusFound password was changed',
    heading: 'Your password was changed',
    lines: [
      `Hi ${user.username}, the password for your account was ${how === 'reset' ? 'reset using an emailed link' : 'changed from your profile'}.`,
      'For your safety, you’ve been signed out on your other devices.',
    ],
    details: [['When', new Date().toUTCString()]],
    action: { label: 'Review your account', url: link('/profile') },
    footnote: SECURITY_FOOTNOTE,
  });

export const sendSignedOutEverywhereMail = (user) =>
  send({
    to: user.email,
    subject: 'You were signed out of all devices',
    heading: 'Signed out everywhere',
    lines: [`Hi ${user.username}, every session on your account was just signed out, including the device you used.`],
    details: [['When', new Date().toUTCString()]],
    action: { label: 'Sign in again', url: link('/login') },
    footnote: SECURITY_FOOTNOTE,
  });

export const sendUsernameChangedMail = (user, oldUsername) =>
  sendActivity(user, {
    subject: 'Your username was changed',
    heading: 'Username updated',
    lines: ['Your CampusFound username was changed. Items you report will now show your new name.'],
    details: [
      ['Old username', oldUsername],
      ['New username', user.username],
    ],
    action: { label: 'View your profile', url: link('/profile') },
  });

/* ---------------------------------------------------------------- */
/* Items                                                            */
/* ---------------------------------------------------------------- */

export const sendItemReportedMail = (user, item, matchCount = 0) =>
  sendActivity(user, {
    subject: `You reported "${item.title}" as ${typeWord(item)}`,
    heading: `Your ${typeWord(item)} item report is live`,
    lines: [
      typeWord(item) === 'found'
        ? 'Thanks for helping! Your report is now visible on Explore, so the owner can find and claim it.'
        : 'Your report is now visible on Explore. We’ll email you as soon as a similar found item is reported.',
      ...(matchCount ? [`Good news: we already found ${matchCount} possible ${matchCount === 1 ? 'match' : 'matches'}. Take a look.`] : []),
    ],
    details: itemDetails(item),
    action: { label: matchCount ? 'See possible matches' : 'View your report', url: itemLink(item) },
  });

export const sendItemUpdatedMail = (user, item, changedFields) =>
  sendActivity(user, {
    subject: `You updated "${item.title}"`,
    heading: 'Your report was updated',
    lines: [`You changed: ${changedFields.join(', ')}.`],
    details: itemDetails(item),
    action: { label: 'View your report', url: itemLink(item) },
  });

export const sendItemStatusByOwnerMail = (user, item) => {
  const resolved = item.status === 'resolved';
  return sendActivity(user, {
    subject: resolved ? `"${item.title}" marked as resolved` : `"${item.title}" reopened`,
    heading: resolved ? 'Marked as resolved 🎉' : 'Report reopened',
    lines: [
      resolved
        ? 'Great news! Your report is closed and no longer shows as open on Explore.'
        : 'Your report is open again and visible on Explore.',
    ],
    details: itemDetails(item),
    action: { label: 'View your report', url: itemLink(item) },
  });
};

// An admin changed the status of someone else's item
export const sendStatusChangeMail = (user, item, newStatus) =>
  send({
    to: user.email,
    subject: `Status update for "${item.title}"`,
    heading: 'An admin updated your report',
    lines: [`The status of your item is now “${newStatus.replace('_', ' ')}”.`],
    details: itemDetails(item),
    action: { label: 'View your report', url: itemLink(item) },
  });

export const sendItemDeletedMail = (user, item, byAdmin = false) =>
  byAdmin
    ? send({
        to: user.email,
        subject: `"${item.title}" was removed`,
        heading: 'Your report was removed by an admin',
        lines: ['A campus admin removed this report. If you think this is a mistake, please contact the lost & found desk.'],
        details: itemDetails(item),
      })
    : sendActivity(user, {
        subject: `You deleted "${item.title}"`,
        heading: 'Report deleted',
        lines: ['Your report and any claims on it have been permanently deleted.'],
        details: itemDetails(item),
        action: { label: 'Report another item', url: link('/add-item') },
      });

export const sendPossibleMatchMail = (owner, lostItem, foundItem) =>
  send({
    to: owner.email,
    subject: `Possible match for your lost "${lostItem.title}"`,
    heading: 'We may have found your item',
    lines: [`Hi ${owner.username}, someone just reported a found item that looks like the “${lostItem.title}” you lost.`],
    details: [
      ['Found item', foundItem.title],
      ['Found at', foundItem.location],
    ],
    action: { label: 'Is this yours?', url: itemLink(foundItem) },
  });

/* ---------------------------------------------------------------- */
/* Claims                                                           */
/* ---------------------------------------------------------------- */

export const sendClaimSubmittedMail = (claimant, item) =>
  sendActivity(claimant, {
    subject: `Your claim for "${item.title}" was sent`,
    heading: 'Claim submitted',
    lines: [
      'Thanks! An admin will compare your description with the item and get back to you.',
      'You’ll get another email as soon as there’s a decision.',
    ],
    details: [...itemDetails(item), ['Status', 'Pending review']],
    action: { label: 'Track your claims', url: link('/dashboard?tab=claims') },
  });

export const sendClaimRequestMail = (reporter, item, claimer) =>
  send({
    to: reporter.email,
    subject: `Claim request for "${item.title}"`,
    heading: 'Someone claimed an item you found',
    lines: [`Hello ${reporter.username}, ${claimer.username} says the “${item.title}” you reported belongs to them.`, 'An admin will verify the claim and you’ll be notified of the outcome.'],
    action: { label: 'View the item', url: itemLink(item) },
  });

export const sendClaimDecisionMail = (claimant, item, approved) =>
  send({
    to: claimant.email,
    subject: approved ? 'Claim approved' : 'Claim rejected',
    heading: approved ? 'Your claim was approved 🎉' : 'Your claim was rejected',
    lines: [
      approved
        ? `Hello ${claimant.username}, your claim for “${item.title}” has been approved. Please collect it from ${item.location} or the campus lost & found desk.`
        : `Hello ${claimant.username}, your claim for “${item.title}” was rejected by an admin. If you believe this is a mistake, please contact the lost & found desk.`,
    ],
    action: { label: 'View your claims', url: link('/dashboard?tab=claims') },
  });

export const sendItemClaimedMail = (reporter, item) =>
  send({
    to: reporter.email,
    subject: `"${item.title}" has been claimed`,
    heading: 'It’s going home 🎉',
    lines: [`Hello ${reporter.username}, the “${item.title}” you reported has been verified and claimed by its owner. Thank you for helping!`],
    action: { label: 'View the item', url: itemLink(item) },
  });
