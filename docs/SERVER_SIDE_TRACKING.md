# Server-Side Tracking & Advanced Features

This document explains how to use Pulse Analytics' advanced tracking features for the cookieless world.

## 🚀 Features

1. **Server-Side Event Tracking** - Track events from your backend
2. **Device Fingerprinting** - Fallback when localStorage is blocked
3. **Session Stitching** - Connect anonymous → identified users

---

## 1. Server-Side Event Tracking

Track conversions, purchases, and backend events that happen server-side.

### Why Server-Side?

- ✅ Bypass ad blockers completely
- ✅ 100% accurate conversion tracking
- ✅ Track events that don't happen in browser (subscriptions, refunds, etc.)
- ✅ More secure (API keys stay on server)

### Setup

1. **Get your API Key** from Settings → API Keys
2. **Send events from your backend:**

```javascript
// Node.js example
const response = await fetch('https://your-domain.vercel.app/api/track-server', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key-here'
  },
  body: JSON.stringify({
    eventType: 'purchase',
    anonymousId: 'visitor_anonymous_id', // From client-side tracking
    userId: 'user_123', // Your user ID
    email: 'customer@example.com',
    properties: {
      order_id: 'ORD-12345',
      total: 99.99,
      currency: 'USD',
      items: [
        { id: 'PROD-1', name: 'Widget', price: 99.99, quantity: 1 }
      ]
    },
    timestamp: new Date().toISOString(), // Optional
    ip: req.ip, // Optional - for geolocation
    userAgent: req.headers['user-agent'] // Optional
  })
});
```

### PHP Example

```php
<?php
$ch = curl_init('https://your-domain.vercel.app/api/track-server');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-API-Key: your-api-key-here'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'eventType' => 'purchase',
    'email' => 'customer@example.com',
    'properties' => [
        'order_id' => 'ORD-12345',
        'total' => 99.99
    ]
]));
curl_exec($ch);
curl_close($ch);
?>
```

### Python Example

```python
import requests

response = requests.post(
    'https://your-domain.vercel.app/api/track-server',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'your-api-key-here'
    },
    json={
        'eventType': 'subscription_created',
        'userId': 'user_123',
        'email': 'customer@example.com',
        'properties': {
            'plan': 'premium',
            'mrr': 29.99
        }
    }
)
```

### Required Fields

- `eventType` - Event name (e.g., 'purchase', 'subscription_created')
- At least ONE of: `anonymousId`, `userId`, or `email`

### Optional Fields

- `properties` - Event metadata (object)
- `timestamp` - Event time (ISO 8601 string)
- `ip` - User IP for geolocation
- `userAgent` - For device/browser detection

---

## 2. Device Fingerprinting

Automatically enabled! When localStorage is blocked (Safari private mode, etc.), we generate a device fingerprint as fallback.

### How It Works

The pixel generates a unique hash from:
- User agent
- Screen resolution
- Color depth
- Timezone
- Language
- Canvas fingerprint
- Hardware specs

### Privacy

- Fingerprints are **deterministic** (same device = same fingerprint)
- NOT as reliable as localStorage (changes with browser updates)
- Used ONLY when localStorage is blocked
- No personal data collected

---

## 3. Session Stitching

Automatically connects anonymous visitors to identified users when they log in/sign up.

### How It Works

**Before Login:**
```
Visitor A (anonymous_id: "abc123")
  - Viewed product
  - Added to cart
  - Started checkout
```

**User Logs In:**
```javascript
window.pulseAnalytics.identify('user_456', {
  email: 'customer@example.com',
  name: 'John Doe'
});
```

**After Login (Automatically Stitched):**
```
Visitor B (user_id: "user_456", email: "xxx@hash")
  - ✅ ALL past events from Visitor A now belong to Visitor B
  - Viewed product (retroactive)
  - Added to cart (retroactive)
  - Started checkout (retroactive)
  - ✅ Completed purchase (new event)
```

### Benefits

- 📊 **Complete journey tracking** - See full customer journey from first visit to conversion
- 🎯 **Accurate attribution** - Know which campaigns led to conversions
- 👤 **Unified customer view** - All activity in one profile
- 🔄 **Works retroactively** - Past anonymous events get attributed

### Client-Side Usage

```javascript
// When user signs up
window.pulseAnalytics.signUp('email', {
  email: 'user@example.com',
  name: 'John Doe'
});

// When user logs in
window.pulseAnalytics.login('email');

// Or use identify directly
window.pulseAnalytics.identify('user_123', {
  email: 'user@example.com',
  name: 'John Doe',
  plan: 'premium'
});
```

### Server-Side Stitching

You can also trigger stitching from the server:

```javascript
await fetch('https://your-domain.vercel.app/api/track-server', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({
    eventType: 'identify',
    anonymousId: 'abc123', // From cookie/client
    userId: 'user_456',
    email: 'customer@example.com'
  })
});
```

---

## 🔒 Privacy & Compliance

All features are privacy-first:

- ✅ **LocalStorage (not cookies)** - No cookie banners needed in many jurisdictions
- ✅ **Hashed PII** - Emails, phones, IPs are SHA-256 hashed
- ✅ **First-party data** - All data stays on your infrastructure
- ✅ **GDPR/CCPA friendly** - Track behavior, not personal identity
- ✅ **No third-party sharing** - Data never leaves your control

---

## 🎯 Best Practices

### 1. Hybrid Tracking

Combine client-side + server-side for best results:

```javascript
// Client-side: Track user interactions
window.pulseAnalytics.track('add_to_cart', {
  product_id: '123',
  price: 49.99
});

// Server-side: Track conversion
// (in your payment webhook)
await trackServerSideEvent({
  eventType: 'purchase',
  userId: order.user_id,
  properties: {
    order_id: order.id,
    total: order.total
  }
});
```

### 2. Pass Anonymous ID to Backend

```javascript
// Store anonymous ID for server-side tracking
const anonymousId = window.pulseAnalytics.getAnonymousId();

// Send with checkout request
fetch('/api/checkout', {
  body: JSON.stringify({
    ...checkoutData,
    _analytics_id: anonymousId
  })
});
```

### 3. Identify Early

Call identify as soon as user is known:

```javascript
// Right after login success
authService.login(email, password).then(user => {
  window.pulseAnalytics.identify(user.id, {
    email: user.email,
    name: user.name
  });
});
```

---

## 📊 Database Schema

If you need to run migrations manually:

```sql
-- Run this migration
-- File: migrations/002_add_server_side_tracking.sql

ALTER TABLE events ADD COLUMN IF NOT EXISTS server_side BOOLEAN DEFAULT false;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS merged_into UUID REFERENCES visitors(id);
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

CREATE INDEX IF NOT EXISTS idx_events_server_side ON events(server_side);
CREATE INDEX IF NOT EXISTS idx_visitors_merged_into ON visitors(merged_into);
CREATE INDEX IF NOT EXISTS idx_visitors_fingerprint ON visitors(device_fingerprint);
```

---

## 🚀 Quick Start Checklist

- [ ] Run migration `002_add_server_side_tracking.sql`
- [ ] Create API key in Settings → API Keys
- [ ] Implement server-side tracking for critical conversions
- [ ] Add `identify()` calls on login/signup
- [ ] Test session stitching works
- [ ] Monitor server-side events in dashboard

---

## Need Help?

Check the main README or create an issue on GitHub.
