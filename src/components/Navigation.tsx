'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const isActive = (path: string) => pathname === path;
  const isDropdownActive = (paths: string[]) => paths.some(path => pathname === path);

  const handleMouseEnter = (dropdown: string) => {
    setOpenDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    setOpenDropdown(null);
  };

  const navItems = [
    { path: '/', label: 'Dashboard', standalone: true },
    {
      label: 'Analytics',
      dropdown: 'analytics',
      items: [
        { path: '/visitors', label: '👥 Visitors' },
        { path: '/live', label: '🔴 Live Events' },
        { path: '/reports', label: '📊 Reports' },
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
        { path: '/errors', label: '🐛 Errors' },
        { path: '/settings/webhooks', label: '🔔 Webhooks' },
        { path: '/settings/api-keys', label: '🔑 API Keys' },
        { path: '/sites', label: '🌐 Sites' }
      ]
    }
  ];

  return (
    <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {navItems.map((item) => {
        if (item.standalone) {
          return (
            <Link
              key={item.path}
              href={item.path!}
              style={{
                color: isActive(item.path!) ? '#22d3ee' : '#94a3b8',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: isActive(item.path!) ? 600 : 400,
                padding: '8px 12px',
                borderRadius: '6px',
                transition: 'all 0.2s'
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
                color: isDropdownHighlighted ? '#22d3ee' : '#94a3b8',
                background: 'transparent',
                border: 'none',
                fontSize: '14px',
                fontWeight: isDropdownHighlighted ? 600 : 400,
                padding: '8px 12px',
                borderRadius: '6px',
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
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '8px',
                  minWidth: '180px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                  zIndex: 1000
                }}
              >
                {item.items?.map((subItem) => (
                  <Link
                    key={subItem.path}
                    href={subItem.path}
                    style={{
                      display: 'block',
                      color: isActive(subItem.path) ? '#22d3ee' : '#e2e8f0',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: isActive(subItem.path) ? 600 : 400,
                      padding: '10px 12px',
                      borderRadius: '6px',
                      background: isActive(subItem.path) ? '#334155' : 'transparent',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(subItem.path)) {
                        e.currentTarget.style.background = '#334155';
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
