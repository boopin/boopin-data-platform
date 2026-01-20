'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isActive = (path: string) => pathname === path;
  const isDropdownActive = (paths: string[]) => paths.some(path => pathname === path);

  const handleMouseEnter = useCallback((dropdown: string) => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown(dropdown);
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Add a delay before closing to allow mouse movement between button and dropdown
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 300); // 300ms delay
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard', standalone: true },
    {
      label: 'Analytics',
      dropdown: 'analytics',
      items: [
        { path: '/visitors', label: '👥 Visitors' },
        { path: '/live', label: '🔴 Live Events' },
        { path: '/reports', label: '📊 Reports' },
        { path: '/reports/advanced', label: '📈 Advanced Reports' },
        { path: '/journeys', label: '🛤️ Journeys' }
      ]
    },
    {
      label: 'Conversions',
      dropdown: 'conversions',
      items: [
        { path: '/goals', label: '🎯 Goals' },
        { path: '/funnels', label: '📈 Funnels' },
        { path: '/cohorts', label: '👥 Cohorts' },
        { path: '/segments', label: '🎯 Segments' },
        { path: '/forms', label: '📝 Forms' }
      ]
    },
    {
      label: 'Tools',
      dropdown: 'tools',
      items: [
        { path: '/events/templates', label: '📊 Event Templates' },
        { path: '/errors', label: '🐛 Errors' },
        { path: '/settings/webhooks', label: '🔔 Webhooks' },
        { path: '/settings/api-keys', label: '🔑 API Keys' },
        { path: '/sites', label: '🌐 Sites' }
      ]
    }
  ];

  return (
    <nav style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {navItems.map((item) => {
        if (item.standalone) {
          return (
            <Link
              key={item.path}
              href={item.path!}
              style={{
                color: isActive(item.path!) ? '#2563eb' : '#64748b',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: isActive(item.path!) ? 600 : 500,
                padding: '8px 16px',
                borderRadius: '8px',
                transition: 'all 0.2s',
                background: isActive(item.path!) ? '#eff6ff' : 'transparent'
              }}
            >
              {item.label}
            </Link>
          );
        }

        const dropdownPaths = item.items?.map(i => i.path) || [];
        const isDropdownHighlighted = isDropdownActive(dropdownPaths);

        return (
          <div
            key={item.dropdown}
            style={{ position: 'relative' }}
            onMouseEnter={() => handleMouseEnter(item.dropdown!)}
            onMouseLeave={handleMouseLeave}
          >
            <button
              style={{
                color: isDropdownHighlighted ? '#2563eb' : '#64748b',
                background: isDropdownHighlighted ? '#eff6ff' : 'transparent',
                border: 'none',
                fontSize: '14px',
                fontWeight: isDropdownHighlighted ? 600 : 500,
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              {item.label}
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{
                  transform: openDropdown === item.dropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {openDropdown === item.dropdown && (
              <div
                onMouseEnter={() => handleMouseEnter(item.dropdown!)}
                onMouseLeave={handleMouseLeave}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '8px',
                  minWidth: '200px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.06)',
                  zIndex: 1000
                }}
              >
                {item.items?.map((subItem) => (
                  <Link
                    key={subItem.path}
                    href={subItem.path}
                    style={{
                      display: 'block',
                      color: isActive(subItem.path) ? '#2563eb' : '#475569',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: isActive(subItem.path) ? 600 : 500,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: isActive(subItem.path) ? '#eff6ff' : 'transparent',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(subItem.path)) {
                        e.currentTarget.style.background = '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(subItem.path)) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {subItem.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
