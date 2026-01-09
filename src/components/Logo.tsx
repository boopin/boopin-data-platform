import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontWeight: 700,
        color: '#1a1a1a',
        letterSpacing: '-0.5px'
      }}>
        Pulse Analytics
      </div>
      <div style={{
        fontSize: '10px',
        color: '#64748b',
        fontWeight: 600,
        background: '#eff6ff',
        padding: '3px 8px',
        borderRadius: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        border: '1px solid #dbeafe'
      }}>
        by Boopin
      </div>
    </Link>
  );
}
