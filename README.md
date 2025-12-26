# Boopin Data Platform

1st Party Data Collection & Analytics Platform for Boopin Media.

## Tech Stack

- **Framework:** Next.js 14
- **Database:** Neon (PostgreSQL)
- **Hosting:** Vercel
- **Styling:** Tailwind CSS

## Setup

### 1. Clone & Install

```bash
npm install
```

### 2. Environment Variables

Create `.env.local` with:

```
DATABASE_URL=your_neon_connection_string
```

### 3. Run Locally

```bash
npm run dev
```

Visit http://localhost:3000

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/dashboard` - Dashboard stats
- `POST /api/track` - Receive tracking events

## Tracking Pixel

Add to your website:

```html
<script>
(function(w,d,s,u,k){
  w._bp=w._bp||[];w._bp.push(['init',k]);
  var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s);
  j.async=true;j.src=u;
  f.parentNode.insertBefore(j,f);
})(window,document,'script','https://your-domain.vercel.app/pixel.js','YOUR_API_KEY');
</script>
```

## License

Proprietary - Boopin Media LLC
