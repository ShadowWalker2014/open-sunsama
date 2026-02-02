/**
 * Daily summary email functionality
 */
import { generateEmailHTML } from './template';
import { getResend, getFromEmail, getFrontendUrl } from './client';
import {
  createHeading,
  createParagraph,
  createButton,
  createStatsRow,
  createDivider,
  createTaskList,
  formatDuration,
  groupTasksByPriority,
  type EmailTaskItem,
} from './builders';

// =============================================================================
// TYPES
// =============================================================================

export interface DailySummaryEmailOptions {
  email: string;
  userName?: string;
  tasks: EmailTaskItem[];
  themeColor?: string;
  /** Date string in YYYY-MM-DD format (already in user's timezone) */
  date: string;
}

// =============================================================================
// CONTENT GENERATOR
// =============================================================================

/**
 * Format a YYYY-MM-DD date string to a human-readable format (e.g., "Monday, February 2")
 */
function formatDateString(dateStr: string): string {
  // Parse the date string (YYYY-MM-DD)
  const parts = dateStr.split('-');
  const year = parseInt(parts[0] ?? '2026', 10);
  const month = parseInt(parts[1] ?? '1', 10);
  const day = parseInt(parts[2] ?? '1', 10);
  
  // Create a date object - we use noon to avoid any DST edge cases
  // Note: month is 0-indexed in JavaScript Date
  const date = new Date(year, month - 1, day, 12, 0, 0);
  
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  
  return `${weekdays[date.getDay()]}, ${months[date.getMonth()]} ${day}`;
}

/**
 * Generate daily summary email content
 */
export function generateDailySummaryContent(
  userName: string | undefined,
  tasks: EmailTaskItem[],
  themeColor: string,
  date: string
): string {
  const greeting = userName ? `Good morning, ${userName}!` : 'Good morning!';
  // Format the date string (already in user's timezone)
  const dateStr = formatDateString(date);

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

  const frontendUrl = getFrontendUrl();

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

// =============================================================================
// EMAIL SENDER
// =============================================================================

/**
 * Send daily summary email
 */
export async function sendDailySummaryEmail(
  options: DailySummaryEmailOptions
): Promise<void> {
  const { email, userName, tasks, themeColor = '#3b82f6', date } = options;

  const resend = getResend();
  const fromEmail = getFromEmail();

  // Format the date string (already in user's timezone)
  const dateStr = formatDateString(date);

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
