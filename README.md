# Pulse Analytics CDP

A powerful, privacy-first Customer Data Platform (CDP) built for collecting, unifying, and activating first-party customer data.

## 🚀 Features

### 📊 Real-Time Analytics Dashboard
- Live visitor tracking with real-time updates
- Event stream with detailed breakdowns
- Geographic insights (countries, cities)
- Device, browser, and OS analytics
- Traffic source attribution
- Top pages and user journeys

### 👤 Visitor Profiles & Identity Resolution
- Anonymous visitor tracking with automatic ID generation
- Identity resolution when users provide email/phone
- Complete visitor timeline with all events
- Session tracking and visit counts
- Profile enrichment with custom properties

### 🎯 Audience Segmentation Engine
- Visual rule builder with multiple conditions
- Real-time segment preview
- Rule types include:
  - Page views count
  - Total events
  - Visited specific pages
  - Country/City location
  - Device type
  - UTM source
  - Event types
  - Identified status
  - Has email/phone
  - Last seen (days ago)

### 📤 Export & Integrations
- **CSV Export** - Excel/Sheets compatible
- **JSON Export** - Developer-friendly format
- **Webhook Integrations:**
  - Generic (Zapier, Make, custom APIs)
  - Slack (rich notifications)
  - Meta Ads (Custom Audiences format)
  - Google Ads (Customer Match format)

### 🔒 Privacy-First
- First-party data collection only
- No third-party cookies
- GDPR-friendly architecture
- Data stays in your own database

## 🛠 Tech Stack

- **Frontend:** Next.js 15, React 18, TypeScript
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Neon)
- **Deployment:** Vercel
- **Styling:** Inline CSS with modern design

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database (we recommend [Neon](https://neon.tech))
- Vercel account (for deployment)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/pulse-analytics-cdp.git
cd pulse-analytics-cdp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

### 4. Set Up the Database

Run the following SQL in your PostgreSQL database:

```sql
-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visitors table
CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  anonymous_id TEXT NOT NULL,
  email TEXT,
  name TEXT,
  phone TEXT,
  properties JSONB DEFAULT '{}',
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  visit_count INTEGER DEFAULT 1,
  is_identified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, anonymous_id)
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  visitor_id UUID REFERENCES visitors(id),
  event_type TEXT NOT NULL,
  page_path TEXT,
  page_title TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  city TEXT,
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Segments table
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '{}',
  visitor_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Segment webhooks table
CREATE TABLE segment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES segments(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  webhook_type VARCHAR(50) DEFAULT 'generic',
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(segment_id, webhook_type)
);

-- Create indexes for performance
CREATE INDEX idx_events_visitor_id ON events(visitor_id);
CREATE INDEX idx_events_client_id ON events(client_id);
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_visitors_client_id ON visitors(client_id);
CREATE INDEX idx_visitors_email ON visitors(email);
CREATE INDEX idx_segments_client_id ON segments(client_id);
CREATE INDEX idx_segment_webhooks_segment_id ON segment_webhooks(segment_id);

-- Insert a default client
INSERT INTO clients (name, api_key) 
VALUES ('Default', 'your-api-key-here')
RETURNING id;
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Deploy to Vercel

```bash
vercel --prod
```

## 📡 Tracking Pixel Installation

Add this script to your website's `<head>`:

```html
<script>
(function(w,d,s,u,k){
  w._bp=w._bp||[];w._bp.push(['init',k]);
  var f=d.getElementsByTagName(s)[0],j=d.createElement(s);
  j.async=true;j.src=u;f.parentNode.insertBefore(j,f);
})(window,document,'script',
'https://your-domain.vercel.app/pixel.js','YOUR_API_KEY');
</script>
```

### Tracking Methods

```javascript
// Track page views (automatic)
// Tracked automatically on page load

// Track custom events
_bp.push(['track', 'button_click', { button_id: 'signup' }]);

// Identify users
_bp.push(['identify', {
  email: 'user@example.com',
  name: 'John Doe',
  phone: '+1234567890'
}]);
```

## 📁 Project Structure

```
pulse-analytics-cdp/
├── public/
│   └── pixel.js              # Tracking pixel script
├── src/
│   ├── app/
│   │   ├── page.tsx          # Dashboard
│   │   ├── visitors/
│   │   │   └── page.tsx      # Visitors list
│   │   ├── segments/
│   │   │   ├── page.tsx      # Segments list
│   │   │   ├── new/
│   │   │   │   └── page.tsx  # Segment builder
│   │   │   └── [id]/
│   │   │       └── page.tsx  # Segment detail (users, export, webhooks)
│   │   └── api/
│   │       ├── collect/
│   │       │   └── route.ts  # Event collection endpoint
│   │       ├── dashboard/
│   │       │   └── route.ts  # Dashboard data
│   │       ├── visitors/
│   │       │   └── route.ts  # Visitors API
│   │       ├── segments/
│   │       │   ├── route.ts  # Segments CRUD
│   │       │   ├── preview/
│   │       │   │   └── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── export/
│   │       │       │   └── route.ts
│   │       │       └── webhook/
│   │       │           ├── route.ts
│   │       │           └── trigger/
│   │       │               └── route.ts
│   │       └── export/
│   │           └── route.ts
│   └── lib/
│       └── db.ts             # Database connection
├── .env.local                # Environment variables
├── package.json
└── README.md
```

## 🔌 API Reference

### Event Collection
```
POST /api/collect
Content-Type: application/json

{
  "event_type": "page_view",
  "page_path": "/pricing",
  "visitor_id": "anonymous-id",
  "properties": {}
}
```

### Segments
```
GET    /api/segments           # List all segments
POST   /api/segments           # Create segment
GET    /api/segments/:id       # Get segment with users
PUT    /api/segments/:id       # Update segment
DELETE /api/segments/:id       # Delete segment
```

### Webhooks
```
GET    /api/segments/:id/webhook          # List webhooks
POST   /api/segments/:id/webhook          # Create webhook
DELETE /api/segments/:id/webhook?type=x   # Delete webhook
POST   /api/segments/:id/webhook/trigger  # Trigger webhook
```

### Export
```
GET /api/segments/:id/export?format=csv   # Export as CSV
GET /api/segments/:id/export?format=json  # Export as JSON
```

## 🎣 Webhook Payload Formats

### Generic / Zapier / Make
```json
{
  "event": "segment_sync",
  "segment": { "id": "...", "name": "..." },
  "triggered_at": "2025-01-01T00:00:00.000Z",
  "total_users": 100,
  "users": [
    {
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "first_seen": "...",
      "last_seen": "...",
      "visits": 10
    }
  ]
}
```

### Meta Ads (Custom Audiences)
```json
{
  "schema": ["EMAIL", "PHONE", "FN"],
  "data": [
    ["user@example.com", "1234567890", "John Doe"]
  ]
}
```

### Google Ads (Customer Match)
```json
{
  "customerMatchUserListMetadata": {
    "userList": "Segment Name"
  },
  "operations": [
    {
      "create": {
        "userIdentifiers": [
          { "hashedEmail": "user@example.com" },
          { "hashedPhoneNumber": "1234567890" }
        ]
      }
    }
  ]
}
```

### Slack
```json
{
  "text": "🎯 Segment Update: Segment Name",
  "blocks": [
    { "type": "header", "text": { "type": "plain_text", "text": "🎯 Segment Update" } },
    { "type": "section", "text": { "type": "mrkdwn", "text": "*Segment Name*\n📊 100 users" } }
  ]
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |

### Segment Rule Types

| Rule Type | Operators | Value Type |
|-----------|-----------|------------|
| `page_views` | greater_than, less_than, equals | Number |
| `total_events` | greater_than, less_than, equals | Number |
| `visited_page` | contains, not_contains | String |
| `country` | equals, not_equals | String |
| `city` | equals, not_equals | String |
| `device` | equals, not_equals | desktop/mobile/tablet |
| `utm_source` | equals, not_equals | String |
| `event_type` | equals, not_equals | String |
| `is_identified` | equals | true/false |
| `has_email` | equals | true/false |
| `has_phone` | equals | true/false |
| `last_seen_days` | greater_than, less_than | Number |

## 📈 Roadmap

- [ ] Scheduled webhook syncs (daily/weekly)
- [ ] Real-time segment triggers
- [ ] Segment growth analytics
- [ ] Direct email provider integrations
- [ ] A/B testing support
- [ ] Funnel analysis
- [ ] Cohort analysis
- [ ] Data retention policies
- [ ] Multi-tenant support
- [ ] Role-based access control

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this for your own projects.

## 🙏 Acknowledgments

Built with ❤️ by Boopin Media LLC

---

**Questions?** Open an issue or reach out to the team.
