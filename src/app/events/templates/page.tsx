'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSite } from '../../../contexts/SiteContext';
import Navigation from '../../../components/Navigation';
import Logo from '../../../components/Logo';
import SiteSelector from '../../../components/SiteSelector';
import { EVENT_TEMPLATES, EVENT_TEMPLATE_CATEGORIES, getEventTemplatesByCategory, type EventTemplate } from '../../../lib/eventTemplates';

export default function EventTemplatesPage() {
  const { selectedSite, loading: siteLoading } = useSite();
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleCopySnippet = (eventId: string, snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(eventId);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const filteredTemplates = selectedCategory === 'all'
    ? EVENT_TEMPLATES
    : getEventTemplatesByCategory(selectedCategory);

  if (siteLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '16px', fontWeight: 500 }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo />
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Navigation />
            <div style={{ height: '24px', width: '1px', background: '#e2e8f0' }} />
            <SiteSelector />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b', fontWeight: 700 }}>📊 Event Tracking Templates</h2>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '15px' }}>
            Pre-configured event schemas with code snippets for common tracking patterns
          </p>
        </div>

        {/* Info Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          border: '1px solid #93c5fd',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
            <span style={{ fontSize: '32px' }}>💡</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#1e40af' }}>
                How to Use Event Templates
              </h3>
              <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#1e40af', lineHeight: '1.6' }}>
                Each template includes a ready-to-use code snippet, property definitions, and best practices.
                Simply copy the code, customize the values, and add it to your website where the event occurs.
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#1e40af', fontWeight: 600 }}>✓</span>
                  <span style={{ fontSize: '13px', color: '#1e40af' }}>Consistent naming</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#1e40af', fontWeight: 600 }}>✓</span>
                  <span style={{ fontSize: '13px', color: '#1e40af' }}>Industry best practices</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#1e40af', fontWeight: 600 }}>✓</span>
                  <span style={{ fontSize: '13px', color: '#1e40af' }}>Copy-paste ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                background: selectedCategory === 'all' ? '#2563eb' : '#ffffff',
                color: selectedCategory === 'all' ? '#ffffff' : '#64748b',
                border: '1px solid #e2e8f0',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              All Templates ({EVENT_TEMPLATES.length})
            </button>
            {EVENT_TEMPLATE_CATEGORIES.map(category => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                style={{
                  background: selectedCategory === category.key ? '#2563eb' : '#ffffff',
                  color: selectedCategory === category.key ? '#ffffff' : '#64748b',
                  border: '1px solid #e2e8f0',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{category.icon}</span>
                {category.label} ({getEventTemplatesByCategory(category.key).length})
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: '24px' }}>
          {filteredTemplates.map((template) => (
            <div key={template.id} style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              {/* Header */}
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '36px' }}>{template.icon}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>
                      {template.name}
                    </h3>
                    <code style={{
                      background: '#f1f5f9',
                      color: '#2563eb',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 500
                    }}>
                      {template.eventType}
                    </code>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                  {template.description}
                </p>
              </div>

              {/* Properties */}
              <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <h4 style={{
                  margin: '0 0 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Properties
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {template.properties.map((prop, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'start',
                      gap: '8px',
                      fontSize: '13px'
                    }}>
                      <span style={{
                        background: prop.required ? '#dcfce7' : '#f1f5f9',
                        color: prop.required ? '#166534' : '#64748b',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        minWidth: '70px',
                        textAlign: 'center'
                      }}>
                        {prop.required ? 'REQUIRED' : 'OPTIONAL'}
                      </span>
                      <code style={{ color: '#2563eb', fontWeight: 500 }}>{prop.name}</code>
                      <span style={{ color: '#94a3b8' }}>({prop.type})</span>
                      <span style={{ color: '#64748b', flex: 1 }}>- {prop.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Snippet */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Code Snippet
                  </h4>
                  <button
                    onClick={() => handleCopySnippet(template.id, template.codeSnippet)}
                    style={{
                      background: copiedSnippet === template.id ? '#10b981' : '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {copiedSnippet === template.id ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <pre style={{
                  background: '#0f172a',
                  color: '#e2e8f0',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  overflow: 'auto',
                  margin: 0
                }}>
                  {template.codeSnippet}
                </pre>
              </div>

              {/* Use Case */}
              <div style={{ padding: '20px 24px', background: '#fefce8', borderBottom: '1px solid #fde047' }}>
                <h4 style={{
                  margin: '0 0 8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#854d0e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  💡 Use Case
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#854d0e', lineHeight: '1.6' }}>
                  {template.useCase}
                </p>
              </div>

              {/* Best Practices */}
              <div style={{ padding: '20px 24px' }}>
                <h4 style={{
                  margin: '0 0 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  ✓ Best Practices
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {template.bestPractices.map((practice, i) => (
                    <li key={i} style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                      {practice}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '48px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#64748b', fontSize: '16px' }}>No templates found in this category.</p>
          </div>
        )}
      </main>
    </div>
  );
}
