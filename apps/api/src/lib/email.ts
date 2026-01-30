/**
 * Email utilities for Open Sunsama API
 * Uses Resend for transactional emails
 *
 * Unified email template system with Linear-style design:
 * - Clean, minimal, professional
 * - Consistent typography and spacing
 * - Theme color support for personalization
 */
import { Resend } from 'resend';

// Lazy initialization of Resend client
let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Theme color mapping (colorTheme string -> hex color)
export const THEME_COLOR_MAP: Record<string, string> = {
  ocean: '#3b82f6',
  forest: '#16a34a',
  sunset: '#f97316',
  lavender: '#8b5cf6',
  rose: '#ec4899',
  amber: '#eab308',
  slate: '#64748b',
  default: '#1f2937',
};

/**
 * Get hex color from theme name
 */
export function getThemeHexColor(colorTheme?: string): string {
  const defaultColor = '#3b82f6'; // ocean blue
  if (!colorTheme) return defaultColor;
  return THEME_COLOR_MAP[colorTheme] ?? defaultColor;
}

// =============================================================================
// STYLED CONTENT BUILDERS
// =============================================================================

/**
 * Create a heading (h1 style)
 */
export function createHeading(text: string): string {
  return `<h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827; letter-spacing: -0.02em;">${escapeHtml(text)}</h1>`;
}

/**
 * Create a paragraph (body text)
 */
export function createParagraph(text: string): string {
  return `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">${escapeHtml(text)}</p>`;
}

/**
 * Create a CTA button
 */
export function createButton(
  text: string,
  url: string,
  themeColor: string = '#3b82f6'
): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding: 8px 0 16px 0;">
      <a href="${escapeHtml(url)}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: ${themeColor}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 8px; letter-spacing: -0.01em;">
        ${escapeHtml(text)}
      </a>
    </td>
  </tr>
</table>`.trim();
}

/**
 * Create a horizontal divider
 */
export function createDivider(): string {
  return `<div style="border-top: 1px solid #e5e7eb; margin: 24px 0;"></div>`;
}

/**
 * Create muted/small text
 */
export function createMutedText(text: string): string {
  return `<p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.5; color: #9ca3af;">${escapeHtml(text)}</p>`;
}

/**
 * Create a secondary text (slightly larger than muted)
 */
export function createSecondaryText(text: string): string {
  return `<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #6b7280;">${escapeHtml(text)}</p>`;
}

/**
 * Task item for email lists
 */
export interface EmailTaskItem {
  title: string;
  priority?: 'P0' | 'P1' | 'P2' | 'P3';
  estimatedMins?: number;
  isCompleted?: boolean;
}

/**
 * Priority colors for task badges
 */
const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  P0: { bg: '#fef2f2', text: '#dc2626' },
  P1: { bg: '#fff7ed', text: '#ea580c' },
  P2: { bg: '#fffbeb', text: '#d97706' },
  P3: { bg: '#f0fdf4', text: '#16a34a' },
};

/**
 * Create a task list for daily summary emails
 */
export function createTaskList(tasks: EmailTaskItem[]): string {
  if (tasks.length === 0) {
    return `<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #6b7280; font-style: italic;">No tasks scheduled</p>`;
  }

  const taskRows = tasks
    .map((task) => {
      const checkIcon = task.isCompleted
        ? `<span style="color: #16a34a; font-size: 14px;">✓</span>`
        : `<span style="color: #d1d5db; font-size: 14px;">○</span>`;

      const titleStyle = task.isCompleted
        ? 'color: #9ca3af; text-decoration: line-through;'
        : 'color: #111827;';

      const priorityBadge = task.priority
        ? `<span style="display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: 500; border-radius: 4px; background-color: ${PRIORITY_COLORS[task.priority]?.bg || '#f3f4f6'}; color: ${PRIORITY_COLORS[task.priority]?.text || '#6b7280'}; margin-left: 8px;">${task.priority}</span>`
        : '';

      const timeEstimate =
        task.estimatedMins && !task.isCompleted
          ? `<span style="font-size: 12px; color: #9ca3af; margin-left: 8px;">${task.estimatedMins}m</span>`
          : '';

      return `
<tr>
  <td style="padding: 8px 0; vertical-align: top; width: 24px;">
    ${checkIcon}
  </td>
  <td style="padding: 8px 0 8px 8px; vertical-align: top;">
    <span style="font-size: 14px; ${titleStyle}">${escapeHtml(task.title)}</span>
    ${priorityBadge}
    ${timeEstimate}
  </td>
</tr>`;
    })
    .join('');

  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 8px 0 16px 0;">
  ${taskRows}
</table>`.trim();
}

/**
 * Create a stats row (for daily summary)
 */
export function createStatsRow(stats: Array<{ label: string; value: string | number }>): string {
  const statItems = stats
    .map(
      (stat) => `
<td style="padding: 12px 16px; text-align: center; background-color: #f9fafb; border-radius: 8px;">
  <div style="font-size: 20px; font-weight: 600; color: #111827; letter-spacing: -0.02em;">${escapeHtml(String(stat.value))}</div>
  <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${escapeHtml(stat.label)}</div>
</td>`
    )
    .join('<td style="width: 12px;"></td>');

  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
  <tr>
    ${statItems}
  </tr>
</table>`.trim();
}

// =============================================================================
// BASE EMAIL TEMPLATE
// =============================================================================

interface GenerateEmailHTMLOptions {
  title: string;
  preheader: string;
  content: string;
  themeColor?: string;
  footerText?: string;
}

/**
 * Generate the base email HTML template
 * Linear-style design: clean, minimal, professional
 */
export function generateEmailHTML(options: GenerateEmailHTMLOptions): string {
  const {
    title,
    preheader,
    content,
    themeColor = '#3b82f6',
    footerText,
  } = options;

  const footerContent = footerText
    ? `<p style="margin: 0 0 4px 0; font-size: 13px; color: #9ca3af;">${escapeHtml(footerText)}</p>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; -webkit-font-smoothing: antialiased;">
  <!-- Preheader text (hidden preview text) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${escapeHtml(preheader)}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <!-- Logo -->
          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <div style="font-size: 20px; font-weight: 600; color: #111827; letter-spacing: -0.02em;">
                Open Sunsama
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                ${footerContent}
                <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                  © Open Sunsama
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Format minutes to a human-readable duration
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
}

/**
 * Group tasks by priority
 */
function groupTasksByPriority(
  tasks: EmailTaskItem[]
): { P0: EmailTaskItem[]; P1: EmailTaskItem[]; P2: EmailTaskItem[]; P3: EmailTaskItem[]; none: EmailTaskItem[] } {
  const groups = {
    P0: [] as EmailTaskItem[],
    P1: [] as EmailTaskItem[],
    P2: [] as EmailTaskItem[],
    P3: [] as EmailTaskItem[],
    none: [] as EmailTaskItem[],
  };

  for (const task of tasks) {
    const key = task.priority || 'none';
    if (key in groups) {
      groups[key as keyof typeof groups].push(task);
    } else {
      groups.none.push(task);
    }
  }

  return groups;
}

// =============================================================================
// EMAIL GENERATORS
// =============================================================================

/**
 * Generate password reset email content using the base template
 */
function generatePasswordResetContent(
  resetUrl: string,
  userName?: string,
  themeColor: string = '#3b82f6'
): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi there,';

  return [
    createHeading('Reset your password'),
    createParagraph(greeting),
    createParagraph(
      "We received a request to reset your password. Click the button below to choose a new one."
    ),
    createButton('Reset password', resetUrl, themeColor),
    createSecondaryText(
      "If you didn't request this, you can safely ignore this email. Your password won't be changed."
    ),
    createMutedText(`Or copy and paste this link into your browser:`),
    `<p style="margin: 0; font-size: 13px; line-height: 1.5; color: #6b7280; word-break: break-all;">${escapeHtml(resetUrl)}</p>`,
  ].join('\n');
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName?: string,
  userThemeColor?: string
): Promise<void> {
  const resend = getResend();

  const fromEmail =
    process.env.FROM_EMAIL || 'Open Sunsama <noreply@opensunsama.com>';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  // Default to ocean blue if no theme color provided
  const themeColor = userThemeColor || '#3b82f6';

  const content = generatePasswordResetContent(resetUrl, userName, themeColor);
  const html = generateEmailHTML({
    title: 'Reset your password',
    preheader: 'Reset your Open Sunsama password',
    content,
    themeColor,
    footerText: 'This link expires in 1 hour.',
  });

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: 'Reset your password',
    html,
  });
}

// =============================================================================
// DAILY SUMMARY EMAIL
// =============================================================================

interface DailySummaryEmailOptions {
  email: string;
  userName?: string;
  tasks: EmailTaskItem[];
  themeColor?: string;
  date: Date;
}

/**
 * Generate daily summary email content
 */
function generateDailySummaryContent(
  userName: string | undefined,
  tasks: EmailTaskItem[],
  themeColor: string,
  date: Date
): string {
  const greeting = userName ? `Good morning, ${userName}!` : 'Good morning!';
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const totalEstimatedMins = tasks
    .filter((t) => !t.isCompleted)
    .reduce((sum, t) => sum + (t.estimatedMins || 0), 0);

  // Group tasks by priority
  const grouped = groupTasksByPriority(tasks.filter((t) => !t.isCompleted));
  const priorityOrder = ['P0', 'P1', 'P2', 'P3', 'none'] as const;

  // Build task sections
  const taskSections: string[] = [];
  for (const priority of priorityOrder) {
    const priorityTasks = grouped[priority];
    if (priorityTasks.length > 0) {
      const priorityLabel =
        priority === 'none' ? 'Other tasks' : `${priority} - Priority`;
      taskSections.push(`
<div style="margin-bottom: 16px;">
  <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">${priorityLabel}</p>
  ${createTaskList(priorityTasks)}
</div>`);
    }
  }

  // Add completed tasks section if any
  const completedTasksList = tasks.filter((t) => t.isCompleted);
  if (completedTasksList.length > 0) {
    taskSections.push(`
<div style="margin-bottom: 16px;">
  <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Completed</p>
  ${createTaskList(completedTasksList)}
</div>`);
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  return [
    createHeading(`Your day: ${dateStr}`),
    createParagraph(greeting),
    createParagraph("Here's what's on your schedule for today."),
    createStatsRow([
      { label: 'Total tasks', value: totalTasks },
      { label: 'Completed', value: completedTasks },
      { label: 'Est. time', value: formatDuration(totalEstimatedMins) },
    ]),
    createDivider(),
    ...taskSections,
    createButton('Open Sunsama', `${frontendUrl}/app`, themeColor),
  ].join('\n');
}

/**
 * Send daily summary email
 */
export async function sendDailySummaryEmail(
  options: DailySummaryEmailOptions
): Promise<void> {
  const { email, userName, tasks, themeColor = '#3b82f6', date } = options;

  const resend = getResend();
  const fromEmail =
    process.env.FROM_EMAIL || 'Open Sunsama <noreply@opensunsama.com>';

  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const content = generateDailySummaryContent(userName, tasks, themeColor, date);
  const html = generateEmailHTML({
    title: `Your day: ${dateStr}`,
    preheader: `You have ${tasks.length} tasks scheduled for today`,
    content,
    themeColor,
  });

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: `Your day: ${dateStr}`,
    html,
  });
}

// =============================================================================
// TASK REMINDER EMAIL
// =============================================================================

interface TaskReminderEmailOptions {
  email: string;
  userName?: string;
  taskTitle: string;
  taskNotes?: string;
  startTime: string;
  themeColor?: string;
  taskId?: string;
}

/**
 * Generate task reminder email content
 */
function generateTaskReminderContent(
  userName: string | undefined,
  taskTitle: string,
  taskNotes: string | undefined,
  startTime: string,
  themeColor: string,
  taskId?: string
): string {
  const greeting = userName ? `Hey ${userName},` : 'Hey there,';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const viewUrl = taskId ? `${frontendUrl}/app?task=${taskId}` : `${frontendUrl}/app`;

  const notesSection = taskNotes
    ? `
<div style="margin: 16px 0; padding: 12px 16px; background-color: #f9fafb; border-radius: 8px; border-left: 3px solid ${themeColor};">
  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #374151;">${escapeHtml(taskNotes)}</p>
</div>`
    : '';

  return [
    createHeading('Task starting soon'),
    createParagraph(greeting),
    createParagraph(`Your task "${taskTitle}" is scheduled to start at ${startTime}.`),
    notesSection,
    createButton('View Task', viewUrl, themeColor),
    createMutedText("You're receiving this because you have task reminders enabled."),
  ].join('\n');
}

/**
 * Send task reminder email
 */
export async function sendTaskReminderEmail(
  options: TaskReminderEmailOptions
): Promise<void> {
  const {
    email,
    userName,
    taskTitle,
    taskNotes,
    startTime,
    themeColor = '#3b82f6',
    taskId,
  } = options;

  const resend = getResend();
  const fromEmail =
    process.env.FROM_EMAIL || 'Open Sunsama <noreply@opensunsama.com>';

  const content = generateTaskReminderContent(
    userName,
    taskTitle,
    taskNotes,
    startTime,
    themeColor,
    taskId
  );

  const html = generateEmailHTML({
    title: `Reminder: ${taskTitle}`,
    preheader: `Your task "${taskTitle}" starts at ${startTime}`,
    content,
    themeColor,
  });

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: `Reminder: ${taskTitle} at ${startTime}`,
    html,
  });
}
