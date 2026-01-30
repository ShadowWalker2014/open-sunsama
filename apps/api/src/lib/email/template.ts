/**
 * Base email HTML template generation
 * Linear-style design: clean, minimal, professional
 */

// =============================================================================
// CORE CONSTANTS
// =============================================================================

export const EMAIL_COLORS = {
  background: '#f9fafb',
  cardBackground: '#ffffff',
  text: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  border: '#e5e7eb',
  defaultTheme: '#3b82f6',
} as const;

export const EMAIL_FONTS = {
  family:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
} as const;

export const EMAIL_SPACING = {
  padding: '32px',
  gap: '16px',
  borderRadius: '12px',
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

// =============================================================================
// BASE EMAIL TEMPLATE
// =============================================================================

export interface GenerateEmailHTMLOptions {
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
    themeColor = EMAIL_COLORS.defaultTheme,
    footerText,
  } = options;

  const footerContent = footerText
    ? `<p style="margin: 0 0 4px 0; font-size: 13px; color: ${EMAIL_COLORS.textLight};">${escapeHtml(footerText)}</p>`
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
<body style="margin: 0; padding: 0; font-family: ${EMAIL_FONTS.family}; background-color: ${EMAIL_COLORS.background}; -webkit-font-smoothing: antialiased;">
  <!-- Preheader text (hidden preview text) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${escapeHtml(preheader)}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${EMAIL_COLORS.background};">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 520px; margin: 0 auto; background-color: ${EMAIL_COLORS.cardBackground}; border-radius: ${EMAIL_SPACING.borderRadius}; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <!-- Logo -->
          <tr>
            <td style="padding: ${EMAIL_SPACING.padding} ${EMAIL_SPACING.padding} 0 ${EMAIL_SPACING.padding};">
              <div style="font-size: 20px; font-weight: 600; color: ${EMAIL_COLORS.text}; letter-spacing: -0.02em;">
                Open Sunsama
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: ${EMAIL_SPACING.padding};">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 0 ${EMAIL_SPACING.padding} ${EMAIL_SPACING.padding} ${EMAIL_SPACING.padding};">
              <div style="border-top: 1px solid ${EMAIL_COLORS.border}; padding-top: 24px;">
                ${footerContent}
                <p style="margin: 0; font-size: 13px; color: ${EMAIL_COLORS.textLight};">
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
