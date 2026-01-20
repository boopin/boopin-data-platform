// Segment Templates - Pre-configured segment blueprints for common use cases

export interface SegmentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'conversion' | 'engagement' | 'lead' | 'reengagement';
  icon: string;
  rules: SegmentRule[];
  useCase: string; // Explains when to use this template
}

export interface SegmentRule {
  type: string;
  operator: string;
  value: string | number | boolean;
}

export const SEGMENT_TEMPLATES: SegmentTemplate[] = [
  {
    id: 'form-abandoners',
    name: 'Form Abandoners',
    description: 'Visitors who started but didn\'t submit forms',
    category: 'conversion',
    icon: '📝',
    rules: [
      { type: 'event_type', operator: 'equals', value: 'form_start' },
      { type: 'event_type', operator: 'not_equals', value: 'form_submit' }
    ],
    useCase: 'Retarget users who showed interest by starting a form but didn\'t complete it. Great for Google/Meta ads or email campaigns.'
  },
  {
    id: 'high-value-visitors',
    name: 'High-Value Visitors',
    description: '5+ page views in last 30 days',
    category: 'engagement',
    icon: '⭐',
    rules: [
      { type: 'page_views', operator: 'greater_or_equal', value: 5 },
      { type: 'last_seen_days', operator: 'less_or_equal', value: 30 }
    ],
    useCase: 'Target highly engaged visitors for upsells, premium content, or exclusive offers. They\'re already interested in your content.'
  },
  {
    id: 'repeat-visitors',
    name: 'Repeat Visitors',
    description: 'Visited your site 3+ times',
    category: 'engagement',
    icon: '🔄',
    rules: [
      { type: 'total_events', operator: 'greater_or_equal', value: 3 }
    ],
    useCase: 'Identify loyal visitors who keep coming back. Excellent candidates for newsletter signups or community invitations.'
  },
  {
    id: 'email-captured',
    name: 'Email Captured',
    description: 'Identified visitors with email addresses',
    category: 'lead',
    icon: '📧',
    rules: [
      { type: 'has_email', operator: 'equals', value: 'true' }
    ],
    useCase: 'All visitors you\'ve successfully identified with an email. Use for email marketing campaigns or lookalike audiences.'
  },
  {
    id: 'phone-captured',
    name: 'Phone Captured',
    description: 'Identified visitors with phone numbers',
    category: 'lead',
    icon: '📱',
    rules: [
      { type: 'has_phone', operator: 'equals', value: 'true' }
    ],
    useCase: 'Visitors who provided phone numbers. Perfect for SMS campaigns or high-intent outreach.'
  },
  {
    id: 'recent-converters',
    name: 'Recent Converters',
    description: 'Completed a conversion in last 7 days',
    category: 'conversion',
    icon: '✅',
    rules: [
      { type: 'event_type', operator: 'equals', value: 'form_submit' },
      { type: 'last_seen_days', operator: 'less_or_equal', value: 7 }
    ],
    useCase: 'Fresh leads who just converted. Strike while the iron is hot with immediate follow-up or upsell campaigns.'
  },
  {
    id: 'inactive-users',
    name: 'Inactive Users',
    description: 'No activity in 30+ days but have email',
    category: 'reengagement',
    icon: '😴',
    rules: [
      { type: 'last_seen_days', operator: 'greater_than', value: 30 },
      { type: 'has_email', operator: 'equals', value: 'true' }
    ],
    useCase: 'Re-engage dormant users with special offers, "we miss you" campaigns, or new feature announcements.'
  },
  {
    id: 'highly-inactive',
    name: 'Highly Inactive',
    description: 'No activity in 90+ days',
    category: 'reengagement',
    icon: '💤',
    rules: [
      { type: 'last_seen_days', operator: 'greater_than', value: 90 },
      { type: 'has_email', operator: 'equals', value: 'true' }
    ],
    useCase: 'Win-back campaign for users who haven\'t engaged in months. Consider sunset policies or re-activation offers.'
  },
  {
    id: 'mobile-users',
    name: 'Mobile Users',
    description: 'Primarily use mobile devices',
    category: 'engagement',
    icon: '📱',
    rules: [
      { type: 'device', operator: 'equals', value: 'mobile' }
    ],
    useCase: 'Target mobile-specific experiences, app downloads, or mobile-optimized offers.'
  },
  {
    id: 'desktop-users',
    name: 'Desktop Users',
    description: 'Primarily use desktop devices',
    category: 'engagement',
    icon: '💻',
    rules: [
      { type: 'device', operator: 'equals', value: 'desktop' }
    ],
    useCase: 'Target with desktop-specific features, software downloads, or detailed content better suited for larger screens.'
  },
  {
    id: 'new-visitors',
    name: 'New Visitors',
    description: 'First visit within last 7 days',
    category: 'engagement',
    icon: '🆕',
    rules: [
      { type: 'last_seen_days', operator: 'less_or_equal', value: 7 },
      { type: 'total_events', operator: 'less_or_equal', value: 5 }
    ],
    useCase: 'Welcome new visitors with onboarding content, introductory offers, or guided tours of your product/service.'
  },
  {
    id: 'organic-visitors',
    name: 'Organic Traffic',
    description: 'Came from organic search',
    category: 'engagement',
    icon: '🔍',
    rules: [
      { type: 'utm_source', operator: 'equals', value: 'google' }
    ],
    useCase: 'Visitors who found you via search engines. They\'re actively looking for solutions - nurture them with relevant content.'
  },
  {
    id: 'paid-traffic',
    name: 'Paid Ad Traffic',
    description: 'Came from paid advertising',
    category: 'conversion',
    icon: '💰',
    rules: [
      { type: 'utm_medium', operator: 'equals', value: 'cpc' }
    ],
    useCase: 'Track ROI on paid campaigns and optimize conversion paths for your ad spend. Create lookalike audiences.'
  },
  {
    id: 'identified-not-converted',
    name: 'Identified But Not Converted',
    description: 'Have email but haven\'t submitted forms',
    category: 'lead',
    icon: '🎯',
    rules: [
      { type: 'is_identified', operator: 'equals', value: 'true' },
      { type: 'event_type', operator: 'not_equals', value: 'form_submit' }
    ],
    useCase: 'Leads who gave their email but haven\'t taken the next step. Nurture with targeted content to move them down the funnel.'
  }
];

// Group templates by category for UI display
export const TEMPLATE_CATEGORIES = [
  {
    key: 'conversion',
    label: 'Conversion',
    description: 'Optimize conversion rates and track form submissions',
    icon: '✅'
  },
  {
    key: 'engagement',
    label: 'Engagement',
    description: 'Measure and improve user engagement',
    icon: '⭐'
  },
  {
    key: 'lead',
    label: 'Lead Generation',
    description: 'Build and manage your lead database',
    icon: '📧'
  },
  {
    key: 'reengagement',
    label: 'Re-engagement',
    description: 'Win back inactive users',
    icon: '🔄'
  }
] as const;

export function getTemplatesByCategory(category: string): SegmentTemplate[] {
  return SEGMENT_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateById(id: string): SegmentTemplate | undefined {
  return SEGMENT_TEMPLATES.find(t => t.id === id);
}
