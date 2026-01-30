/**
 * Email utilities for Open Sunsama API
 * Uses Resend for transactional emails
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

/**
 * Generate password reset email HTML
 * Clean, minimal, Linear-style design
 */
function generatePasswordResetHTML(
  resetUrl: string,
  userName?: string,
  themeColor: string = '#3b82f6'
): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi there,';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
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
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827; letter-spacing: -0.02em;">
                Reset your password
              </h1>
              
              <p style="margin: 0 0 8px 0; font-size: 15px; line-height: 1.6; color: #374151;">
                ${greeting}
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #374151;">
                We received a request to reset your password. Click the button below to choose a new one.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 0 24px 0;">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: ${themeColor}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 8px; letter-spacing: -0.01em;">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                If you didn't request this, you can safely ignore this email. Your password won't be changed.
              </p>
              
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #9ca3af;">
                Or copy and paste this link into your browser:<br>
                <span style="color: #6b7280; word-break: break-all;">${resetUrl}</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                <p style="margin: 0 0 4px 0; font-size: 13px; color: #9ca3af;">
                  This link expires in 1 hour.
                </p>
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
  
  const fromEmail = process.env.FROM_EMAIL || 'Open Sunsama <noreply@opensunsama.com>';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
  
  // Default to ocean blue if no theme color provided
  const themeColor = userThemeColor || '#3b82f6';
  
  const html = generatePasswordResetHTML(resetUrl, userName, themeColor);
  
  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: 'Reset your password',
    html,
  });
}
