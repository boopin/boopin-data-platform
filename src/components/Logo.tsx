import Link from 'next/link';
import Image from 'next/image';

export default function Logo() {
  return (
    <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontWeight: 700,
        color: '#1a1a1a',
        letterSpacing: '-0.5px'
      }}>
        boopin
      </div>
      <div style={{
        fontSize: '11px',
        color: '#64748b',
        fontWeight: 500,
        background: '#f1f5f9',
        padding: '4px 8px',
        borderRadius: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Analytics
      </div>
    </Link>
  );
}
