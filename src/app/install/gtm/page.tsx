'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSite } from '../../../contexts/SiteContext';
import Navigation from '../../../components/Navigation';
import Logo from '../../../components/Logo';
import SiteSelector from '../../../components/SiteSelector';

export default function GTMInstallPage() {
  const { selectedSite, loading: siteLoading } = useSite();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (section: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  const siteId = selectedSite?.id || 'YOUR_SITE_ID';

  // Complete tracking script - handles everything in one tag
  const completeTrackingScript = `<script>
  (function() {
    // Boopin Analytics Configuration
    window.boopinConfig = {
      apiUrl: '${baseUrl}/api/track',
      siteId: '${siteId}'
    };

    // Generate anonymous ID
    function generateId() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    // Get or create anonymous ID
    function getAnonymousId() {
      var id = localStorage.getItem('boopin_anonymous_id');
      if (!id) {
        id = generateId();
        localStorage.setItem('boopin_anonymous_id', id);
      }
      return id;
    }

    // Get or create session ID
    function getSessionId() {
      var sessionId = sessionStorage.getItem('boopin_session_id');
      if (!sessionId) {
        sessionId = generateId();
        sessionStorage.setItem('boopin_session_id', sessionId);
      }
      return sessionId;
    }

    // Parse UTM parameters
    function getUtmParams() {
      var params = new URLSearchParams(window.location.search);
      return {
        utmSource: params.get('utm_source'),
        utmMedium: params.get('utm_medium'),
        utmCampaign: params.get('utm_campaign'),
        utmTerm: params.get('utm_term'),
        utmContent: params.get('utm_content')
      };
    }

    // Main tracking function
    window.boopin = {
      track: function(eventType, properties) {
        properties = properties || {};
        var utmParams = getUtmParams();

        var payload = {
          siteId: window.boopinConfig.siteId,
          anonymousId: getAnonymousId(),
          sessionId: getSessionId(),
          eventType: eventType,
          properties: properties,
          pageUrl: window.location.href,
          pagePath: window.location.pathname,
          pageTitle: document.title,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          utmSource: utmParams.utmSource,
          utmMedium: utmParams.utmMedium,
          utmCampaign: utmParams.utmCampaign,
          utmTerm: utmParams.utmTerm,
          utmContent: utmParams.utmContent
        };

        fetch(window.boopinConfig.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(function(err) {
          console.error('Boopin tracking error:', err);
        });
      },

      // Helper for identifying users
      identify: function(userData) {
        this.track('identify', userData);
      }
    };

    // Auto-track pageview
    window.boopin.track('pageview');

    // ===== FORM TRACKING =====
    // Track form submissions
    document.addEventListener('submit', function(e) {
      var form = e.target;
      var formId = form.id || form.name || 'unnamed-form';
      var formName = form.getAttribute('data-form-name') || formId;
      var fieldCount = form.querySelectorAll('input, textarea, select').length;

      window.boopin.track('form_submit', {
        form_id: formId,
        form_name: formName,
        fields_filled: fieldCount,
        page_url: window.location.href
      });
    }, true);

    // Track form starts (when user focuses on first field)
    var formStartTracked = {};
    document.addEventListener('focus', function(e) {
      if (e.target.matches('input, textarea, select')) {
        var form = e.target.closest('form');
        if (form && !formStartTracked[form]) {
          formStartTracked[form] = true;
          var formId = form.id || form.name || 'unnamed-form';
          var formName = form.getAttribute('data-form-name') || formId;

          window.boopin.track('form_start', {
            form_id: formId,
            form_name: formName,
            page_url: window.location.href
          });
        }
      }
    }, true);
  })();
</script>`;

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

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b', fontWeight: 700 }}>
            📊 Google Tag Manager Installation
          </h2>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '15px', fontWeight: 600 }}>
            ⚡ ONE tracking code for everything - pageviews, forms, and custom events
          </p>
        </div>

        {/* Site ID Warning */}
        {!selectedSite && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fde047',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: '#854d0e' }}>
              ⚠️ No Site Selected
            </h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#854d0e', lineHeight: '1.6' }}>
              Please select a site from the dropdown above, or{' '}
              <Link href="/sites" style={{ color: '#2563eb', fontWeight: 600 }}>
                create a new site
              </Link>
              {' '}first. The code snippets below will automatically use your selected site's ID.
            </p>
          </div>
        )}

        {/* Quick Start */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: '1px solid #059669',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
            ⚡ Boopin USP: ONE Code for Everything
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#d1fae5', lineHeight: '1.6' }}>
            Unlike other analytics tools that require multiple scripts, Boopin uses a single tracking code that handles pageviews, forms, and custom events automatically.
          </p>
          <h4 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>
            🚀 Setup in 3 minutes:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <span style={{
                background: '#ffffff',
                color: '#059669',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                flexShrink: 0
              }}>1</span>
              <p style={{ margin: 0, fontSize: '14px', color: '#ffffff', lineHeight: '1.6' }}>
                Create <strong>ONE Custom HTML tag</strong> in Google Tag Manager
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <span style={{
                background: '#ffffff',
                color: '#059669',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                flexShrink: 0
              }}>2</span>
              <p style={{ margin: 0, fontSize: '14px', color: '#ffffff', lineHeight: '1.6' }}>
                Copy the complete tracking code below and paste it
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <span style={{
                background: '#ffffff',
                color: '#059669',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                flexShrink: 0
              }}>3</span>
              <p style={{ margin: 0, fontSize: '14px', color: '#ffffff', lineHeight: '1.6' }}>
                Set trigger to <strong>"All Pages"</strong> → Test → Publish
              </p>
            </div>
          </div>
        </div>

        {/* Complete Tracking Code */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '2px solid #10b981',
          overflow: 'hidden',
          marginBottom: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)'
        }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'inline-block', background: '#10b981', color: '#ffffff', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
                  ⚡ COMPLETE TRACKING CODE
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '22px', color: '#065f46', fontWeight: 700 }}>
                  ONE Code - Tracks Everything
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#047857', lineHeight: '1.6' }}>
                  This single code automatically tracks: <strong>Pageviews</strong>, <strong>Form Starts</strong>, <strong>Form Submits</strong>, and allows custom event tracking
                </p>
              </div>
              <button
                onClick={() => handleCopy('complete', completeTrackingScript)}
                style={{
                  background: copiedSection === 'complete' ? '#10b981' : '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              >
                {copiedSection === 'complete' ? '✓ Copied!' : '📋 Copy Complete Code'}
              </button>
            </div>
          </div>

          <div style={{ padding: '20px 24px', background: '#f8fafc' }}>
            <h4 style={{
              margin: '0 0 12px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              📝 GTM Setup Instructions
            </h4>
            <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                Go to your GTM container → <strong>Tags</strong> → <strong>New</strong>
              </li>
              <li style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                Choose <strong>Custom HTML</strong> as the tag type
              </li>
              <li style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                Click "Copy Complete Code" above and paste it into the HTML field
              </li>
              <li style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                Set triggering to <strong>All Pages</strong>
              </li>
              <li style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                Name it "Boopin Analytics" and <strong>Save</strong>
              </li>
            </ol>
          </div>

          <div style={{ padding: '20px 24px' }}>
            <pre style={{
              background: '#0f172a',
              color: '#e2e8f0',
              padding: '20px',
              borderRadius: '8px',
              fontSize: '12px',
              lineHeight: '1.6',
              overflow: 'auto',
              margin: 0,
              maxHeight: '500px'
            }}>
              {completeTrackingScript}
            </pre>
          </div>
        </div>

        {/* Testing Section */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '20px', color: '#1e293b', fontWeight: 700 }}>
            ✅ Testing Your Installation
          </h3>
          <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
              In GTM, click <strong>Preview</strong> mode and enter your website URL
            </li>
            <li style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
              Verify the "Boopin Analytics" tag fires on page load (check the GTM debugger)
            </li>
            <li style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
              Open your browser's Developer Console (F12) and check for any errors
            </li>
            <li style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
              Visit a few pages on your site - you should see pageview events in{' '}
              <Link href="/live" style={{ color: '#2563eb', fontWeight: 600 }}>
                Live Events
              </Link>
            </li>
            <li style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
              Try filling out and submitting a form - check for form_start and form_submit events
            </li>
            <li style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
              Once verified, <strong>Submit</strong> and <strong>Publish</strong> your GTM container
            </li>
          </ol>
        </div>

        {/* Advanced Tracking */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '20px', color: '#1e293b', fontWeight: 700 }}>
            🔧 Advanced: Custom Event Tracking
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
            After installing the base script, you can track custom events anywhere in your code:
          </p>
          <pre style={{
            background: '#0f172a',
            color: '#e2e8f0',
            padding: '20px',
            borderRadius: '8px',
            fontSize: '12px',
            lineHeight: '1.6',
            overflow: 'auto',
            margin: '0 0 16px'
          }}>
{`// Track a button click
window.boopin.track('button_click', {
  button_id: 'cta-signup',
  button_text: 'Start Free Trial'
});

// Track a purchase
window.boopin.track('purchase', {
  transaction_id: 'ORD-2024-001',
  revenue: 99.99,
  currency: 'USD',
  product_name: 'Pro Plan'
});

// Identify a user after login/signup
window.boopin.identify({
  email: 'user@example.com',
  name: 'John Doe',
  user_id: 'user_123'
});`}
          </pre>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
            Browse{' '}
            <Link href="/events/templates" style={{ color: '#2563eb', fontWeight: 600 }}>
              Event Templates
            </Link>
            {' '}for more pre-built tracking patterns with code examples.
          </p>
        </div>

        {/* Support Section */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
            Need Help?
          </h4>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
            Check the{' '}
            <Link href="/live" style={{ color: '#2563eb', fontWeight: 600 }}>
              Live Events
            </Link>
            {' '}page to verify events are being tracked, or review the{' '}
            <Link href="/events/templates" style={{ color: '#2563eb', fontWeight: 600 }}>
              Event Templates
            </Link>
            {' '}for additional tracking patterns.
          </p>
        </div>
      </main>
    </div>
  );
}
