/**
 * Password reset email functionality
 */
import { escapeHtml, generateEmailHTML } from './template';
import { getResend, getFromEmail, getFrontendUrl } from './client';
import {
  createHeading,
  createParagraph,
  createButton,
  createSecondaryText,
  createMutedText,
} from './builders';

// =============================================================================
// CONTENT GENERATOR
// =============================================================================

/**
 * Generate password reset email content using the base template
 */
export function generatePasswordResetContent(
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

// =============================================================================
// EMAIL SENDER
// =============================================================================

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
  const fromEmail = getFromEmail();
  const frontendUrl = getFrontendUrl();
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
