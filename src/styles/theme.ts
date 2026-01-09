// Professional white theme for Pulse Analytics

export const colors = {
  // Background colors
  background: '#f8fafc',
  backgroundSecondary: '#f1f5f9',

  // Card and surface colors
  surface: '#ffffff',
  surfaceHover: '#f8fafc',

  // Border colors
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderDark: '#cbd5e1',

  // Text colors
  textPrimary: '#1e293b',
  textSecondary: '#475569',
  textTertiary: '#64748b',
  textMuted: '#94a3b8',

  // Brand colors
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  primaryDark: '#1d4ed8',
  primaryBg: '#eff6ff',

  // Accent colors
  success: '#10b981',
  successBg: '#d1fae5',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  error: '#ef4444',
  errorBg: '#fee2e2',
  info: '#06b6d4',
  infoBg: '#cffafe',

  // Status colors
  live: '#10b981',
  active: '#2563eb',
  inactive: '#94a3b8',
};

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
  dropdown: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.06)',
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  xxxl: '48px',
};

export const borderRadius = {
  sm: '6px',
  base: '8px',
  md: '10px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

// Reusable component styles
export const cardStyle = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: borderRadius.lg,
  padding: spacing.xl,
  boxShadow: shadows.sm,
};

export const headerStyle = {
  background: colors.surface,
  borderBottom: `1px solid ${colors.border}`,
  padding: '16px 32px',
  position: 'sticky' as const,
  top: 0,
  zIndex: 100,
  boxShadow: shadows.sm,
};

export const inputStyle = {
  padding: '10px 14px',
  borderRadius: borderRadius.base,
  border: `1px solid ${colors.borderDark}`,
  background: colors.surface,
  color: colors.textPrimary,
  fontSize: '14px',
  outline: 'none',
  fontWeight: 500,
};

export const buttonPrimaryStyle = {
  padding: '10px 18px',
  borderRadius: borderRadius.base,
  border: 'none',
  background: colors.primary,
  color: '#ffffff',
  fontSize: '14px',
  cursor: 'pointer',
  fontWeight: 600,
  boxShadow: shadows.sm,
};

export const buttonSecondaryStyle = {
  padding: '10px 18px',
  borderRadius: borderRadius.base,
  border: `1px solid ${colors.border}`,
  background: colors.surface,
  color: colors.textPrimary,
  fontSize: '14px',
  cursor: 'pointer',
  fontWeight: 500,
};

export const statCardStyle = {
  ...cardStyle,
  padding: spacing.lg,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: spacing.sm,
};

export const pageContainerStyle = {
  minHeight: '100vh',
  background: colors.background,
};

export const mainContentStyle = {
  maxWidth: '1600px',
  margin: '0 auto',
  padding: spacing.xxl,
};
