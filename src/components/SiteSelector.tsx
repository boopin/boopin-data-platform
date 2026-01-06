'use client';

import { useState, useRef, useEffect } from 'react';
import { useSite } from '../contexts/SiteContext';
import Link from 'next/link';

export default function SiteSelector() {
  const { selectedSite, sites, selectSite, loading } = useSite();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading || !selectedSite) {
    return (
      <div style={{
        padding: '6px 12px',
        background: '#334155',
        borderRadius: '6px',
        color: '#94a3b8',
        fontSize: '13px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '6px 12px',
          background: '#334155',
          border: '1px solid #475569',
          borderRadius: '6px',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '150px'
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{selectedSite.name}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            minWidth: '200px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '8px 0' }}>
            {sites.map((site) => (
              <button
                key={site.id}
                onClick={() => {
                  selectSite(site);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: selectedSite.id === site.id ? '#334155' : 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  display: 'block'
                }}
                onMouseEnter={(e) => {
                  if (selectedSite.id !== site.id) {
                    e.currentTarget.style.background = '#334155';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSite.id !== site.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ fontWeight: 600 }}>{site.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{site.domain}</div>
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #334155', padding: '8px' }}>
            <Link
              href="/sites"
              style={{
                display: 'block',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: '#22d3ee',
                fontSize: '13px',
                textAlign: 'center',
                cursor: 'pointer',
                textDecoration: 'none',
                fontWeight: 600
              }}
              onClick={() => setIsOpen(false)}
            >
              + Manage Sites
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
