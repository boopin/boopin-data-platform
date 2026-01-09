# 🎯 Boopin Data Platform - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Installation & Setup](#installation--setup)
4. [Tracking Capabilities](#tracking-capabilities)
5. [Use Cases](#use-cases)
6. [Advanced Features](#advanced-features)
7. [Audience Segments](#audience-segments)
8. [Export & Integrations](#export--integrations)
9. [Future Roadmap](#future-roadmap)

---

## Overview

**Boopin Data Platform** is a comprehensive, privacy-first analytics and audience segmentation platform designed for multi-site tracking. It provides real-time visitor insights, advanced behavioral tracking, and powerful audience segmentation with native integrations to major advertising platforms.

### Key Differentiators
- ✅ **Multi-site support** - Manage multiple websites from one dashboard
- ✅ **Single tracking code** - Deploy once via GTM, track everything automatically
- ✅ **Privacy-focused** - Self-hosted data, GDPR compliant
- ✅ **Real-time analytics** - Live visitor tracking and instant insights
- ✅ **Advanced segmentation** - Create custom audiences based on 50+ behavioral signals
- ✅ **Ad platform ready** - Export segments to Google, Meta, LinkedIn directly

---

## Core Features

### 📊 Analytics Dashboard
- **Real-time metrics**: Total visitors, page views, sessions, bounce rate
- **Visitor insights**: New vs returning, identified users, device breakdown
- **Geographic data**: Country and city-level visitor analytics
- **Traffic sources**: UTM tracking, referrer analysis, campaign attribution
- **Top pages**: Most visited pages with engagement metrics
- **Event breakdown**: Track all user interactions automatically

### 👥 Live Visitor Tracking
- See active visitors on your site in real-time
- Current page being viewed
- Location (country, city)
- Device type (desktop, mobile, tablet)
- Time spent on site
- Number of pages viewed in session
- Entry source and UTM parameters

### 🎯 Audience Segments
Create custom audiences based on:
- **Behavioral data**: Page views, event counts, visited pages
- **Demographics**: Country, city
- **Technology**: Device type (desktop, mobile, tablet)
- **Campaign data**: UTM source, medium, campaign
- **Engagement**: Last seen, time on site, scroll depth
- **E-commerce**: Purchase behavior, cart actions, product views
- **User actions**: Form submissions, signups, logins
- **Content engagement**: Video plays, downloads, searches

### 📈 Reports & Comparisons
- Compare any two date ranges
- Analyze growth trends
- Export reports to CSV/JSON
- Track KPIs over time
- Identify seasonal patterns

### 🔍 Visitor Profiles
- Detailed individual visitor timelines
- Complete event history
- Session tracking
- Device and location history
- Engagement metrics per visitor

### 📉 Cohort Analysis
- Group users by signup date or first visit
- Track retention over time
- Identify user lifecycle patterns
- Compare cohort performance

### 🔄 Funnel Analysis
- Multi-step funnel tracking
- Conversion rate at each step
- Drop-off analysis
- Time between steps
- Optimization insights

### 🚨 Error Tracking
- Automatic JavaScript error capture
- Error frequency and patterns
- Affected users and browsers
- Stack traces for debugging
- Real-time error monitoring

### 📝 Form Analytics
- Track all forms automatically (no extra code needed)
- Form start, completion, and abandonment rates
- Field-level completion tracking
- Time to complete analysis
- Drop-off point identification

### 🛤️ User Journeys
- Visualize complete user paths
- Common navigation patterns
- Entry and exit pages
- Session flow analysis

---

## Installation & Setup

### Step 1: Get Your Site ID

1. Log in to your Boopin Data Platform
2. Navigate to **Settings** or **Sites**
3. Copy your unique Site ID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Step 2: Deploy via Google Tag Manager (Recommended)

#### Create a New Tag in GTM:

1. Go to your GTM container
2. Click **Tags** → **New**
3. Name it: "Boopin Analytics"
4. Choose **Tag Type**: Custom HTML
5. Paste this code:

```html
<script>
  (function() {
    var _bp = window._bp || [];
    _bp.push(['init', 'YOUR_SITE_ID_HERE']); // Replace with your actual Site ID
    window._bp = _bp;

    var script = document.createElement('script');
    script.src = 'https://pulse-analytics-data-platform.vercel.app/pixel.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
```

6. **Trigger**: Select "All Pages" (Page View trigger)
7. Click **Save**
8. Click **Submit** to publish your changes

### Step 3: Direct Installation (Alternative)

If you're not using GTM, add this code directly before the `</head>` tag on all pages:

```html
<script>
  (function() {
    var _bp = window._bp || [];
    _bp.push(['init', 'YOUR_SITE_ID_HERE']);
    window._bp = _bp;

    var script = document.createElement('script');
    script.src = 'https://pulse-analytics-data-platform.vercel.app/pixel.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
```

### Step 4: Verify Installation

1. Visit your website
2. Open browser DevTools (F12) → Console
3. Look for: `[PulseAnalytics] Initialized successfully`
4. Check your Boopin dashboard's **Live Visitors** page
5. You should see your visit appear within seconds

---

## Tracking Capabilities

### 🔥 Automatic Tracking (No Extra Code Required)

Once installed, the pixel **automatically** tracks:

#### 1. **Page Views**
- Every page visit
- Page URL, path, and title
- Referrer information
- UTM parameters

#### 2. **All Forms** (Across Your Entire Site)
- Form starts (when user focuses on first field)
- Field-by-field completion tracking
- Form submissions
- Form abandonments
- Time to complete
- Works on ALL forms automatically - contact, signup, checkout, newsletter, etc.

#### 3. **Click Tracking**
- Button clicks
- Link clicks
- Outbound link detection
- Element identification (ID, class, text)

#### 4. **Engagement Metrics**
- Time on page (30s, 1min, 3min, 5min, 10min milestones)
- Scroll depth (25%, 50%, 75%, 100%)
- Active engagement time
- Page leave detection

#### 5. **JavaScript Errors**
- Runtime errors
- Unhandled promise rejections
- Error messages and stack traces
- Affected URLs

#### 6. **Session Data**
- Unique visitor ID (anonymous)
- Session ID and duration
- Device information
- Screen resolution
- Browser details

### 🛒 Manual E-commerce Tracking

For e-commerce events, add these calls in your code:

#### Product Views
```javascript
window.pulseAnalytics.productView({
  id: 'PROD-123',
  name: 'Premium Headphones',
  price: 299.99,
  category: 'Electronics',
  brand: 'AudioTech'
});
```

#### Add to Cart
```javascript
window.pulseAnalytics.addToCart({
  id: 'PROD-123',
  name: 'Premium Headphones',
  price: 299.99,
  category: 'Electronics'
}, 1); // quantity
```

#### Begin Checkout
```javascript
window.pulseAnalytics.beginCheckout({
  items: cartItems,
  items_count: 3,
  total: 899.99,
  currency: 'AED'
});
```

#### Purchase Complete
```javascript
window.pulseAnalytics.purchase({
  order_id: 'ORD-12345',
  total: 899.99,
  subtotal: 849.99,
  tax: 50.00,
  shipping: 0,
  currency: 'AED',
  items: orderItems,
  payment_method: 'card'
});
```

### 👤 User Identification

#### Identify Users
```javascript
window.pulseAnalytics.identify('user@example.com', {
  name: 'John Doe',
  phone: '+971501234567',
  company: 'Acme Corp',
  plan: 'premium'
});
```

#### Track Signups
```javascript
window.pulseAnalytics.signUp('email', {
  email: 'user@example.com',
  source: 'homepage_cta'
});
```

#### Track Logins
```javascript
window.pulseAnalytics.login('email');
```

### 🎥 Content Engagement

#### Video Tracking
```javascript
// Video start
window.pulseAnalytics.videoStart({
  id: 'video-123',
  title: 'Product Demo',
  duration: 180,
  provider: 'youtube'
});

// Video completion
window.pulseAnalytics.videoComplete({
  id: 'video-123',
  title: 'Product Demo',
  watch_time: 175
});
```

#### File Downloads
```javascript
window.pulseAnalytics.fileDownload({
  name: 'product-brochure.pdf',
  type: 'pdf',
  size: 2048000,
  url: '/downloads/brochure.pdf'
});
```

#### Search Tracking
```javascript
window.pulseAnalytics.search('wireless headphones', 24);
```

### 📞 Lead Generation

#### Lead Form Submission
```javascript
window.pulseAnalytics.leadForm('Contact Form', {
  email: 'lead@example.com',
  interest: 'Enterprise Plan',
  source: 'pricing_page'
});
```

#### Callback Request
```javascript
window.pulseAnalytics.callbackRequest('+971501234567', {
  preferred_time: 'afternoon',
  service: 'Consultation'
});
```

---

## Use Cases

### 1. **E-commerce Store**
**Goal**: Increase conversions and reduce cart abandonment

**Implementation**:
- ✅ Track product views and add-to-cart events
- ✅ Create segment: "Added to cart but didn't purchase in last 7 days"
- ✅ Export to Meta Custom Audiences for retargeting
- ✅ Track checkout abandonment points
- ✅ Analyze funnel: Product → Cart → Checkout → Purchase

**Results**:
- Identify drop-off points in checkout
- Retarget cart abandoners with personalized ads
- Measure campaign ROI with UTM tracking

### 2. **SaaS Company**
**Goal**: Improve trial-to-paid conversion

**Implementation**:
- ✅ Track signups, feature usage, and engagement
- ✅ Create segments:
  - "Trial users who haven't logged in for 3 days"
  - "Active users viewing pricing page"
  - "Users who watched onboarding video"
- ✅ Identify high-intent users for sales outreach
- ✅ Track feature adoption cohorts

**Results**:
- Proactive re-engagement campaigns
- Identify power users for upsell
- Optimize onboarding flow

### 3. **Lead Generation Business**
**Goal**: Maximize form conversions and lead quality

**Implementation**:
- ✅ Track form starts, completions, and abandonments
- ✅ Create segments:
  - "Started form but didn't submit"
  - "Visited 3+ pages from Google Ads"
  - "Downloaded whitepaper from LinkedIn"
- ✅ Analyze which traffic sources bring highest quality leads
- ✅ Track form field drop-off points

**Results**:
- Optimize form design (reduce fields causing abandonment)
- Retarget form abandoners
- Improve lead scoring

### 4. **Content Publisher**
**Goal**: Increase engagement and return visitors

**Implementation**:
- ✅ Track scroll depth and time on page
- ✅ Monitor video completion rates
- ✅ Create segments:
  - "Read 3+ articles this month"
  - "Watched video but didn't subscribe"
  - "High engagement visitors (10+ min on site)"
- ✅ Track content performance by traffic source

**Results**:
- Identify best-performing content
- Retarget engaged readers for subscriptions
- Optimize content length and format

### 5. **Multi-location Service Business**
**Goal**: Optimize local marketing campaigns

**Implementation**:
- ✅ Track visitors by city and country
- ✅ Create location-based segments:
  - "Dubai visitors from Google search"
  - "Abu Dhabi visitors who visited services page"
- ✅ Track callback requests by location
- ✅ Monitor UTM campaigns by region

**Results**:
- Create geo-targeted ad campaigns
- Optimize local SEO
- Allocate marketing budget by location performance

---

## Advanced Features

### Cohort Analysis

**What it does**: Groups users by a common characteristic (e.g., signup date) and tracks their behavior over time.

**Example**:
- Cohort: Users who signed up in January
- Track: How many returned in Week 1, Week 2, Week 3, Week 4
- Result: Identify retention patterns and engagement drop-offs

**Use it for**:
- Measuring product stickiness
- Evaluating onboarding effectiveness
- Comparing cohort performance across feature releases

### Funnel Analysis

**What it does**: Tracks user progression through multi-step processes.

**Example Funnel**:
1. Landing Page View
2. Product Page View
3. Add to Cart
4. Checkout Started
5. Purchase Completed

**Insights**:
- Conversion rate at each step
- Where users drop off
- Time between steps
- Device-specific performance

### User Journeys

**What it does**: Visualizes the complete path users take through your site.

**Insights**:
- Most common entry pages
- Popular navigation paths
- Exit pages
- Session duration by journey

---

## Audience Segments

### Creating Powerful Segments

Segments let you group visitors based on behavioral and demographic criteria. All rules must match (AND logic).

#### Available Rule Types:

**Engagement Metrics:**
- Page Views Count (greater than, less than, equals)
- Total Events Count
- Last Seen (days ago)

**Behavioral:**
- Visited Specific Page (contains URL)
- Has Event Type (purchase, signup, form_submit, etc.)

**Demographics:**
- Country (equals/not equals)
- City (equals/not equals)
- Device Type (desktop, mobile, tablet)

**Campaign Tracking:**
- UTM Source (e.g., "google", "facebook")
- UTM Medium (e.g., "cpc", "email", "social")
- UTM Campaign (e.g., "summer_sale")
- Referrer (contains domain)

**User Status:**
- Is Identified (has email/user ID)

#### Example Segments:

**1. High-Intent Shoppers**
- Event Type equals "add_to_cart"
- Event Type NOT equals "purchase"
- Last Seen less than 7 days
- Country equals "United Arab Emirates"

**2. Content Enthusiasts**
- Page Views greater than 5
- Last Seen less than 30 days
- Event Type equals "video_complete"

**3. Abandoned Form Users**
- Event Type equals "form_start"
- Event Type NOT equals "form_submit"
- Last Seen less than 3 days

**4. Google Ads Converters**
- UTM Source equals "google"
- UTM Medium equals "cpc"
- Event Type equals "purchase"

**5. Mobile Users from Social**
- Device Type equals "mobile"
- UTM Medium equals "social"
- Page Views greater than 3

---

## Export & Integrations

### Current Export Options

#### 1. **CSV Export**
- Export visitor lists with all attributes
- Email, name, location, device, behavior
- Use for email marketing tools (Mailchimp, SendGrid)
- Import to CRM systems

#### 2. **JSON Export**
- Structured data export
- Developer-friendly format
- API integrations

### Ad Platform Integrations (In Platform UI)

The platform includes built-in interfaces for exporting segments to major advertising platforms:

#### 1. **Meta Custom Audiences** (Facebook & Instagram)
- Export segments as custom audiences
- Create lookalike audiences
- Retargeting campaigns
- Exclude converters from ads

#### 2. **Google Customer Match**
- Upload customer lists to Google Ads
- Target Gmail, Search, YouTube
- Exclude existing customers
- Similar audiences

#### 3. **LinkedIn Matched Audiences**
- B2B targeting
- Upload professional contacts
- Account-based marketing
- Company targeting

### Webhook Integration

**Real-time segment updates**: Get notified when users enter/exit segments

**Setup**:
1. Go to Segment Detail page → Webhooks tab
2. Add webhook URL
3. Configure triggers (user enters/exits segment)
4. Receive real-time notifications

**Use cases**:
- Trigger email sequences
- Update CRM records
- Send to marketing automation
- Custom integrations

---

## Future Roadmap

### 🚀 Planned Features

#### 1. **Native Ad Platform APIs** (High Priority)

**Meta (Facebook/Instagram) Integration:**
- Direct API connection
- One-click audience sync
- Automatic audience refresh (daily/weekly)
- Conversion tracking integration
- CAPI (Conversions API) support

**Google Ads Integration:**
- Direct Customer Match upload via API
- Automatic list updates
- Conversion import
- Enhanced conversions
- Google Analytics 4 bridge

**LinkedIn Ads Integration:**
- Matched Audiences API
- Account-based marketing lists
- Company-level targeting
- Lead Gen Forms integration

**Snapchat Ads Integration:**
- Snap Audience Match
- Custom audiences via API
- Pixel integration
- Conversion tracking

**TikTok Ads Integration:**
- Custom audience upload
- Lookalike audiences
- TikTok Pixel integration

#### 2. **Enhanced Segmentation**

- OR logic support (not just AND)
- Nested rule groups
- Predictive segments (AI-powered)
- Behavioral scoring
- Segment overlap analysis
- A/B test segment performance

#### 3. **Advanced Analytics**

- Custom dashboards
- Attribution modeling (first-touch, last-touch, multi-touch)
- Revenue analytics
- LTV (Lifetime Value) tracking
- Predictive analytics
- Anomaly detection
- Custom KPI tracking

#### 4. **Marketing Automation**

- Built-in email campaigns
- SMS marketing
- Push notifications
- Automated workflows
- Journey builder
- Drip campaigns

#### 5. **A/B Testing**

- Built-in experimentation platform
- Page variant testing
- Conversion optimization
- Statistical significance calculator
- Multi-variate testing

#### 6. **Enhanced E-commerce**

- Product recommendation engine
- Dynamic pricing analytics
- Inventory alerts based on demand
- RFM (Recency, Frequency, Monetary) analysis
- Customer lifetime value predictions
- Churn prediction

#### 7. **API & Developer Tools**

- REST API for data access
- Webhook event streaming
- Custom integrations SDK
- GraphQL API
- Data warehouse connectors (Snowflake, BigQuery)

#### 8. **Compliance & Privacy**

- GDPR compliance tools
- Cookie consent management
- Data retention policies
- Right to be forgotten automation
- Privacy-first tracking options

#### 9. **Mobile SDK**

- Native iOS tracking
- Native Android tracking
- React Native SDK
- Flutter SDK
- Mobile app analytics

#### 10. **Collaboration Features**

- Team access controls
- Role-based permissions
- Comments and annotations
- Shared dashboards
- Report scheduling
- Alerts and notifications

#### 11. **AI-Powered Insights**

- Automatic anomaly detection
- Trend predictions
- Segment recommendations
- Content performance predictions
- Churn risk scoring
- Next-best-action recommendations

---

## Technical Specifications

### Data Collection
- **Method**: First-party JavaScript pixel
- **Protocol**: HTTPS only
- **Data Storage**: PostgreSQL (Neon)
- **Real-time processing**: Sub-second latency
- **Session timeout**: 30 minutes of inactivity

### Privacy & Compliance
- **Anonymous by default**: No PII collected unless explicitly sent
- **Cookieless option**: LocalStorage-based tracking
- **IP anonymization**: Optional
- **Do Not Track**: Respected
- **GDPR ready**: Data deletion APIs available

### Performance
- **Pixel size**: ~8KB (minified)
- **Load time**: Async, non-blocking
- **Tracking latency**: <100ms
- **API response time**: <200ms average
- **Dashboard load**: <2 seconds

### Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Support & Resources

### Documentation
- This guide (PLATFORM_GUIDE.md)
- API documentation (coming soon)
- Integration guides (coming soon)

### Support Channels
- Email: support@boopin.com
- Documentation: /docs
- Community: Discord/Slack (coming soon)

### Deployment
- **Platform**: Vercel
- **Database**: Neon (PostgreSQL)
- **CDN**: Vercel Edge Network
- **Uptime**: 99.9% SLA target

---

## Quick Start Checklist

- [ ] Sign up for Boopin Data Platform account
- [ ] Get your Site ID from dashboard
- [ ] Install tracking code via GTM or direct
- [ ] Verify installation in Live Visitors page
- [ ] Wait 24 hours for data collection
- [ ] Create your first segment
- [ ] Export segment to CSV
- [ ] Set up webhook (optional)
- [ ] Connect to ad platforms (when available)

---

## Glossary

**Anonymous ID**: Unique identifier for each visitor (stored in localStorage)

**Session**: Period of activity on your site (expires after 30 min of inactivity)

**Segment**: Group of visitors matching specific criteria

**Cohort**: Group of users who share a common characteristic

**Funnel**: Multi-step process you want users to complete

**UTM Parameters**: URL tags for tracking campaign sources (utm_source, utm_medium, utm_campaign)

**Engaged Time**: Time user is actively interacting with page (mouse movement, scrolling, clicks)

**Scroll Depth**: How far down the page a user scrolled (measured as percentage)

**Bounce Rate**: Percentage of single-page sessions

**Event**: Any tracked interaction (page view, click, form submit, etc.)

---

## FAQs

**Q: Do I need different tracking codes for different forms?**
A: No! One tracking code automatically tracks ALL forms on your site.

**Q: Can I track multiple websites?**
A: Yes, the platform supports multi-site tracking. Each site gets a unique Site ID.

**Q: Is the data stored on my servers?**
A: The platform is hosted on Vercel with data in Neon PostgreSQL. You can self-host if needed.

**Q: How long is data retained?**
A: Currently indefinitely. Configurable retention policies coming soon.

**Q: Can I delete visitor data?**
A: Yes, GDPR compliance features available via API.

**Q: Does it slow down my website?**
A: No, the pixel loads asynchronously and doesn't block page rendering.

**Q: Can I track custom events?**
A: Yes! Use `window.pulseAnalytics.track('custom_event', { properties })`.

**Q: How accurate is the location data?**
A: Based on IP geolocation (city-level accuracy ~80-95%).

**Q: Can I export raw data?**
A: Yes, via CSV/JSON exports. API access coming soon.

**Q: Is it GDPR compliant?**
A: Yes, with proper configuration. No PII collected by default.

---

**Last Updated**: January 2025
**Version**: 1.0
**Platform**: Boopin Data Platform

For the latest updates and features, check the dashboard or contact support.
