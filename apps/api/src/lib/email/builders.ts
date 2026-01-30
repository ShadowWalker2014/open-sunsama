/**
 * Styled content builders for email templates
 */
import { escapeHtml } from './template';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Task item for email lists
 */
export interface EmailTaskItem {
  title: string;
  priority?: 'P0' | 'P1' | 'P2' | 'P3';
  estimatedMins?: number;
  isCompleted?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Priority colors for task badges
 */
const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  P0: { bg: '#fef2f2', text: '#dc2626' },
  P1: { bg: '#fff7ed', text: '#ea580c' },
  P2: { bg: '#fffbeb', text: '#d97706' },
  P3: { bg: '#f0fdf4', text: '#16a34a' },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format minutes to a human-readable duration
 */
export function formatDuration(minutes: number): string {
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
export function groupTasksByPriority(
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
// CONTENT BUILDERS
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
