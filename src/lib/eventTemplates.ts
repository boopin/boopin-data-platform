// Event Tracking Templates - Pre-configured event schemas for common tracking patterns

export interface EventProperty {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required: boolean;
  description: string;
  example?: string | number | boolean;
}

export interface EventTemplate {
  id: string;
  name: string;
  eventType: string;
  category: 'ecommerce' | 'lead_generation' | 'content' | 'saas' | 'navigation';
  icon: string;
  description: string;
  properties: EventProperty[];
  codeSnippet: string;
  useCase: string;
  bestPractices: string[];
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  // E-COMMERCE EVENTS
  {
    id: 'add-to-cart',
    name: 'Add to Cart',
    eventType: 'add_to_cart',
    category: 'ecommerce',
    icon: '🛒',
    description: 'Track when users add products to their shopping cart',
    properties: [
      { name: 'product_id', type: 'string', required: true, description: 'Unique product identifier', example: 'prod_12345' },
      { name: 'product_name', type: 'string', required: true, description: 'Product name', example: 'Wireless Headphones' },
      { name: 'price', type: 'number', required: true, description: 'Product price', example: 99.99 },
      { name: 'quantity', type: 'number', required: true, description: 'Quantity added', example: 1 },
      { name: 'currency', type: 'string', required: true, description: 'Currency code', example: 'USD' },
      { name: 'category', type: 'string', required: false, description: 'Product category', example: 'Electronics' },
      { name: 'brand', type: 'string', required: false, description: 'Product brand', example: 'Sony' },
    ],
    codeSnippet: `// Track Add to Cart event
boopin.track('add_to_cart', {
  product_id: 'prod_12345',
  product_name: 'Wireless Headphones',
  price: 99.99,
  quantity: 1,
  currency: 'USD',
  category: 'Electronics',
  brand: 'Sony'
});`,
    useCase: 'Essential for understanding which products generate interest. Combine with purchase events to calculate cart abandonment rates and optimize checkout flow.',
    bestPractices: [
      'Always include product_id for accurate tracking',
      'Use consistent currency codes across all transactions',
      'Track this before the cart page updates to ensure accuracy',
      'Include category for segmentation analysis'
    ]
  },
  {
    id: 'begin-checkout',
    name: 'Begin Checkout',
    eventType: 'begin_checkout',
    category: 'ecommerce',
    icon: '💳',
    description: 'Track when users start the checkout process',
    properties: [
      { name: 'cart_value', type: 'number', required: true, description: 'Total cart value', example: 249.97 },
      { name: 'currency', type: 'string', required: true, description: 'Currency code', example: 'USD' },
      { name: 'item_count', type: 'number', required: true, description: 'Number of items', example: 3 },
      { name: 'coupon', type: 'string', required: false, description: 'Applied coupon code', example: 'SAVE20' },
    ],
    codeSnippet: `// Track Checkout Start
boopin.track('begin_checkout', {
  cart_value: 249.97,
  currency: 'USD',
  item_count: 3,
  coupon: 'SAVE20'
});`,
    useCase: 'Critical funnel event for measuring checkout abandonment. Use to identify where users drop off in the purchase flow.',
    bestPractices: [
      'Fire this at the first step of checkout (not on cart page)',
      'Include coupon codes to track promotion effectiveness',
      'Track cart_value before discounts for accurate metrics'
    ]
  },
  {
    id: 'purchase',
    name: 'Purchase Complete',
    eventType: 'purchase',
    category: 'ecommerce',
    icon: '✅',
    description: 'Track successful purchases and transactions',
    properties: [
      { name: 'transaction_id', type: 'string', required: true, description: 'Unique order ID', example: 'ORD-2024-001' },
      { name: 'revenue', type: 'number', required: true, description: 'Total revenue', example: 249.97 },
      { name: 'currency', type: 'string', required: true, description: 'Currency code', example: 'USD' },
      { name: 'tax', type: 'number', required: false, description: 'Tax amount', example: 20.00 },
      { name: 'shipping', type: 'number', required: false, description: 'Shipping cost', example: 10.00 },
      { name: 'coupon', type: 'string', required: false, description: 'Applied coupon', example: 'SAVE20' },
      { name: 'payment_method', type: 'string', required: false, description: 'Payment method used', example: 'credit_card' },
    ],
    codeSnippet: `// Track Purchase
boopin.track('purchase', {
  transaction_id: 'ORD-2024-001',
  revenue: 249.97,
  currency: 'USD',
  tax: 20.00,
  shipping: 10.00,
  coupon: 'SAVE20',
  payment_method: 'credit_card'
});`,
    useCase: 'The most critical e-commerce event. Used for revenue tracking, ROI analysis, and conversion attribution.',
    bestPractices: [
      'Use server-side tracking when possible to prevent ad blockers',
      'Always include transaction_id to prevent duplicate counting',
      'Fire only on successful payment confirmation',
      'Include full order details for revenue reconciliation'
    ]
  },
  {
    id: 'product-view',
    name: 'Product View',
    eventType: 'product_view',
    category: 'ecommerce',
    icon: '👁️',
    description: 'Track when users view product detail pages',
    properties: [
      { name: 'product_id', type: 'string', required: true, description: 'Product identifier', example: 'prod_12345' },
      { name: 'product_name', type: 'string', required: true, description: 'Product name', example: 'Wireless Headphones' },
      { name: 'price', type: 'number', required: true, description: 'Product price', example: 99.99 },
      { name: 'category', type: 'string', required: false, description: 'Product category', example: 'Electronics' },
      { name: 'in_stock', type: 'boolean', required: false, description: 'Stock availability', example: true },
    ],
    codeSnippet: `// Track Product View
boopin.track('product_view', {
  product_id: 'prod_12345',
  product_name: 'Wireless Headphones',
  price: 99.99,
  category: 'Electronics',
  in_stock: true
});`,
    useCase: 'Identify popular products and calculate product-to-cart conversion rates. Essential for merchandising decisions.',
    bestPractices: [
      'Track only on actual product detail pages, not listings',
      'Include stock status to identify lost opportunities',
      'Fire immediately on page load'
    ]
  },

  // LEAD GENERATION EVENTS
  {
    id: 'form-start',
    name: 'Form Started',
    eventType: 'form_start',
    category: 'lead_generation',
    icon: '📝',
    description: 'Track when users begin filling out a form',
    properties: [
      { name: 'form_id', type: 'string', required: true, description: 'Unique form identifier', example: 'contact-form' },
      { name: 'form_name', type: 'string', required: true, description: 'Human-readable form name', example: 'Contact Us' },
      { name: 'page_url', type: 'string', required: false, description: 'Page URL', example: '/contact' },
    ],
    codeSnippet: `// Track Form Start
boopin.track('form_start', {
  form_id: 'contact-form',
  form_name: 'Contact Us',
  page_url: window.location.pathname
});`,
    useCase: 'Measure form abandonment by comparing starts to submits. Identify friction points in lead capture.',
    bestPractices: [
      'Fire when user focuses on first form field',
      'Use consistent form_id across all pages',
      'Track even for multi-step forms'
    ]
  },
  {
    id: 'form-submit',
    name: 'Form Submitted',
    eventType: 'form_submit',
    category: 'lead_generation',
    icon: '✉️',
    description: 'Track successful form submissions',
    properties: [
      { name: 'form_id', type: 'string', required: true, description: 'Form identifier', example: 'contact-form' },
      { name: 'form_name', type: 'string', required: true, description: 'Form name', example: 'Contact Us' },
      { name: 'fields_filled', type: 'number', required: false, description: 'Number of fields completed', example: 5 },
      { name: 'lead_value', type: 'number', required: false, description: 'Estimated lead value', example: 500 },
    ],
    codeSnippet: `// Track Form Submit
boopin.track('form_submit', {
  form_id: 'contact-form',
  form_name: 'Contact Us',
  fields_filled: 5,
  lead_value: 500
});`,
    useCase: 'Core conversion event for lead generation sites. Use to track lead quality and calculate CPL (Cost Per Lead).',
    bestPractices: [
      'Fire only after successful server validation',
      'Include lead_value for ROI calculations',
      'Match form_id with form_start event'
    ]
  },
  {
    id: 'newsletter-signup',
    name: 'Newsletter Signup',
    eventType: 'newsletter_signup',
    category: 'lead_generation',
    icon: '📧',
    description: 'Track newsletter and email list subscriptions',
    properties: [
      { name: 'list_name', type: 'string', required: true, description: 'Newsletter list', example: 'Weekly Newsletter' },
      { name: 'source', type: 'string', required: false, description: 'Signup source', example: 'footer' },
      { name: 'incentive', type: 'string', required: false, description: 'Signup incentive offered', example: '10% discount' },
    ],
    codeSnippet: `// Track Newsletter Signup
boopin.track('newsletter_signup', {
  list_name: 'Weekly Newsletter',
  source: 'footer',
  incentive: '10% discount'
});`,
    useCase: 'Build email lists and measure content marketing effectiveness. Track which incentives drive signups.',
    bestPractices: [
      'Track different lists separately',
      'Include source to optimize placement',
      'Fire after email confirmation if using double opt-in'
    ]
  },
  {
    id: 'demo-request',
    name: 'Demo Requested',
    eventType: 'demo_request',
    category: 'lead_generation',
    icon: '🎬',
    description: 'Track product demo or consultation requests',
    properties: [
      { name: 'product', type: 'string', required: false, description: 'Product requested', example: 'Enterprise Plan' },
      { name: 'company_size', type: 'string', required: false, description: 'Company size', example: '50-200' },
      { name: 'urgency', type: 'string', required: false, description: 'Urgency level', example: 'this_month' },
    ],
    codeSnippet: `// Track Demo Request
boopin.track('demo_request', {
  product: 'Enterprise Plan',
  company_size: '50-200',
  urgency: 'this_month'
});`,
    useCase: 'High-intent B2B conversion event. Prioritize leads based on urgency and company size.',
    bestPractices: [
      'Capture qualification data in properties',
      'Route high-urgency leads immediately',
      'Track demo-to-customer conversion separately'
    ]
  },

  // CONTENT ENGAGEMENT EVENTS
  {
    id: 'video-play',
    name: 'Video Play',
    eventType: 'video_play',
    category: 'content',
    icon: '▶️',
    description: 'Track when users start playing videos',
    properties: [
      { name: 'video_id', type: 'string', required: true, description: 'Video identifier', example: 'vid_123' },
      { name: 'video_title', type: 'string', required: true, description: 'Video title', example: 'Product Demo 2024' },
      { name: 'duration', type: 'number', required: false, description: 'Video duration in seconds', example: 180 },
      { name: 'autoplay', type: 'boolean', required: false, description: 'Started automatically', example: false },
    ],
    codeSnippet: `// Track Video Play
boopin.track('video_play', {
  video_id: 'vid_123',
  video_title: 'Product Demo 2024',
  duration: 180,
  autoplay: false
});`,
    useCase: 'Measure video content engagement. Identify which videos drive the most interest.',
    bestPractices: [
      'Distinguish autoplay from user-initiated plays',
      'Track completion separately with video_complete',
      'Include video duration for completion rate calculations'
    ]
  },
  {
    id: 'video-complete',
    name: 'Video Complete',
    eventType: 'video_complete',
    category: 'content',
    icon: '🎬',
    description: 'Track when users watch videos to completion',
    properties: [
      { name: 'video_id', type: 'string', required: true, description: 'Video identifier', example: 'vid_123' },
      { name: 'video_title', type: 'string', required: true, description: 'Video title', example: 'Product Demo 2024' },
      { name: 'watch_time', type: 'number', required: false, description: 'Actual watch time', example: 175 },
      { name: 'completion_rate', type: 'number', required: false, description: 'Percentage watched', example: 97 },
    ],
    codeSnippet: `// Track Video Complete
boopin.track('video_complete', {
  video_id: 'vid_123',
  video_title: 'Product Demo 2024',
  watch_time: 175,
  completion_rate: 97
});`,
    useCase: 'High-engagement indicator. Users who complete videos are typically more qualified leads.',
    bestPractices: [
      'Define "complete" as 95%+ watched (not 100%)',
      'Track at what percentage users typically drop off',
      'Use for lead scoring in B2B funnels'
    ]
  },
  {
    id: 'article-read',
    name: 'Article Read',
    eventType: 'article_read',
    category: 'content',
    icon: '📖',
    description: 'Track when users read blog posts or articles',
    properties: [
      { name: 'article_id', type: 'string', required: true, description: 'Article identifier', example: 'blog-123' },
      { name: 'title', type: 'string', required: true, description: 'Article title', example: 'Getting Started Guide' },
      { name: 'category', type: 'string', required: false, description: 'Content category', example: 'Tutorials' },
      { name: 'word_count', type: 'number', required: false, description: 'Article word count', example: 1500 },
      { name: 'scroll_depth', type: 'number', required: false, description: 'Scroll percentage', example: 85 },
    ],
    codeSnippet: `// Track Article Read (fire at 75% scroll)
boopin.track('article_read', {
  article_id: 'blog-123',
  title: 'Getting Started Guide',
  category: 'Tutorials',
  word_count: 1500,
  scroll_depth: 75
});`,
    useCase: 'Measure content effectiveness. Identify which topics resonate with your audience.',
    bestPractices: [
      'Fire at 75% scroll depth (indicates actual reading)',
      'Track category for content strategy insights',
      'Use for content-based retargeting'
    ]
  },
  {
    id: 'download',
    name: 'File Download',
    eventType: 'download',
    category: 'content',
    icon: '⬇️',
    description: 'Track when users download files or resources',
    properties: [
      { name: 'file_name', type: 'string', required: true, description: 'Downloaded file name', example: 'whitepaper-2024.pdf' },
      { name: 'file_type', type: 'string', required: true, description: 'File extension', example: 'pdf' },
      { name: 'file_size', type: 'number', required: false, description: 'File size in KB', example: 2048 },
      { name: 'resource_type', type: 'string', required: false, description: 'Resource category', example: 'whitepaper' },
    ],
    codeSnippet: `// Track File Download
boopin.track('download', {
  file_name: 'whitepaper-2024.pdf',
  file_type: 'pdf',
  file_size: 2048,
  resource_type: 'whitepaper'
});`,
    useCase: 'High-intent event for content marketing. Track which resources generate the most interest.',
    bestPractices: [
      'Fire when download actually starts, not on click',
      'Track resource type for performance analysis',
      'Gate valuable resources behind form fills'
    ]
  },

  // SAAS / PRODUCT EVENTS
  {
    id: 'trial-start',
    name: 'Trial Started',
    eventType: 'trial_start',
    category: 'saas',
    icon: '🚀',
    description: 'Track when users start a free trial',
    properties: [
      { name: 'plan_name', type: 'string', required: true, description: 'Trial plan', example: 'Pro Plan' },
      { name: 'trial_days', type: 'number', required: true, description: 'Trial duration', example: 14 },
      { name: 'requires_card', type: 'boolean', required: false, description: 'Credit card required', example: false },
    ],
    codeSnippet: `// Track Trial Start
boopin.track('trial_start', {
  plan_name: 'Pro Plan',
  trial_days: 14,
  requires_card: false
});`,
    useCase: 'Critical SaaS conversion event. Track trial-to-paid conversion rates by plan.',
    bestPractices: [
      'Fire immediately after account creation',
      'Track plan tier for cohort analysis',
      'Include trial length for conversion comparison'
    ]
  },
  {
    id: 'feature-used',
    name: 'Feature Used',
    eventType: 'feature_used',
    category: 'saas',
    icon: '⚡',
    description: 'Track when users engage with product features',
    properties: [
      { name: 'feature_name', type: 'string', required: true, description: 'Feature identifier', example: 'export_csv' },
      { name: 'feature_category', type: 'string', required: false, description: 'Feature group', example: 'reporting' },
      { name: 'user_tier', type: 'string', required: false, description: 'User plan tier', example: 'pro' },
    ],
    codeSnippet: `// Track Feature Usage
boopin.track('feature_used', {
  feature_name: 'export_csv',
  feature_category: 'reporting',
  user_tier: 'pro'
});`,
    useCase: 'Measure feature adoption and usage patterns. Identify which features drive retention.',
    bestPractices: [
      'Track all key features consistently',
      'Use for onboarding optimization',
      'Identify power users vs casual users'
    ]
  },
  {
    id: 'upgrade',
    name: 'Plan Upgrade',
    eventType: 'upgrade',
    category: 'saas',
    icon: '⬆️',
    description: 'Track when users upgrade their subscription',
    properties: [
      { name: 'from_plan', type: 'string', required: true, description: 'Previous plan', example: 'Basic' },
      { name: 'to_plan', type: 'string', required: true, description: 'New plan', example: 'Pro' },
      { name: 'mrr_change', type: 'number', required: false, description: 'MRR increase', example: 50 },
      { name: 'trigger', type: 'string', required: false, description: 'Upgrade trigger', example: 'limit_reached' },
    ],
    codeSnippet: `// Track Plan Upgrade
boopin.track('upgrade', {
  from_plan: 'Basic',
  to_plan: 'Pro',
  mrr_change: 50,
  trigger: 'limit_reached'
});`,
    useCase: 'Revenue expansion tracking. Identify which features or limits drive upgrades.',
    bestPractices: [
      'Track trigger reason for product insights',
      'Calculate upgrade conversion rates by cohort',
      'Use for pricing optimization'
    ]
  },

  // NAVIGATION EVENTS
  {
    id: 'search',
    name: 'Site Search',
    eventType: 'search',
    category: 'navigation',
    icon: '🔍',
    description: 'Track when users perform site searches',
    properties: [
      { name: 'query', type: 'string', required: true, description: 'Search query', example: 'wireless headphones' },
      { name: 'results_count', type: 'number', required: false, description: 'Number of results', example: 42 },
      { name: 'filter_applied', type: 'boolean', required: false, description: 'Filters used', example: true },
    ],
    codeSnippet: `// Track Site Search
boopin.track('search', {
  query: 'wireless headphones',
  results_count: 42,
  filter_applied: true
});`,
    useCase: 'Understand what users are looking for. Optimize content and product catalog based on search queries.',
    bestPractices: [
      'Track zero-result searches to identify gaps',
      'Analyze top queries for content ideas',
      'Track search-to-conversion rate'
    ]
  },
  {
    id: 'filter-applied',
    name: 'Filter Applied',
    eventType: 'filter_applied',
    category: 'navigation',
    icon: '🎚️',
    description: 'Track when users apply filters or sorting',
    properties: [
      { name: 'filter_type', type: 'string', required: true, description: 'Filter category', example: 'price' },
      { name: 'filter_value', type: 'string', required: true, description: 'Filter value', example: '50-100' },
      { name: 'page_type', type: 'string', required: false, description: 'Page context', example: 'product_listing' },
    ],
    codeSnippet: `// Track Filter Application
boopin.track('filter_applied', {
  filter_type: 'price',
  filter_value: '50-100',
  page_type: 'product_listing'
});`,
    useCase: 'Understand user preferences and search behavior. Optimize filter defaults and prominence.',
    bestPractices: [
      'Track each filter separately',
      'Analyze popular filter combinations',
      'Use for personalization'
    ]
  },
];

// Group templates by category
export const EVENT_TEMPLATE_CATEGORIES = [
  {
    key: 'ecommerce',
    label: 'E-commerce',
    description: 'Track online shopping behavior and transactions',
    icon: '🛍️'
  },
  {
    key: 'lead_generation',
    label: 'Lead Generation',
    description: 'Capture form submissions and lead quality',
    icon: '📋'
  },
  {
    key: 'content',
    label: 'Content Engagement',
    description: 'Measure content performance and engagement',
    icon: '📄'
  },
  {
    key: 'saas',
    label: 'SaaS / Product',
    description: 'Track product usage and subscriptions',
    icon: '💼'
  },
  {
    key: 'navigation',
    label: 'Navigation',
    description: 'Understand user browsing patterns',
    icon: '🧭'
  }
] as const;

export function getEventTemplatesByCategory(category: string): EventTemplate[] {
  return EVENT_TEMPLATES.filter(t => t.category === category);
}

export function getEventTemplateById(id: string): EventTemplate | undefined {
  return EVENT_TEMPLATES.find(t => t.id === id);
}
