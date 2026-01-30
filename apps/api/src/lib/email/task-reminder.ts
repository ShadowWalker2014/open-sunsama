/**
 * Task reminder email functionality
 */
import { escapeHtml, generateEmailHTML } from './template';
import { getResend, getFromEmail, getFrontendUrl } from './client';
import {
  createHeading,
  createParagraph,
  createButton,
  createMutedText,
} from './builders';

// =============================================================================
// TYPES
// =============================================================================

export interface TaskReminderEmailOptions {
  email: string;
  userName?: string;
  taskTitle: string;
  taskNotes?: string;
  startTime: string;
  themeColor?: string;
  taskId?: string;
}

// =============================================================================
// CONTENT GENERATOR
// =============================================================================

/**
 * Generate task reminder email content
 */
export function generateTaskReminderContent(
  userName: string | undefined,
  taskTitle: string,
  taskNotes: string | undefined,
  startTime: string,
  themeColor: string,
  taskId?: string
): string {
  const greeting = userName ? `Hey ${userName},` : 'Hey there,';
  const frontendUrl = getFrontendUrl();
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

// =============================================================================
// EMAIL SENDER
// =============================================================================

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
  const fromEmail = getFromEmail();

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
