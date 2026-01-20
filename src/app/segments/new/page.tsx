'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSite } from '../../../contexts/SiteContext';
import Navigation from '../../../components/Navigation';
import { getTemplateById } from '../../../lib/segmentTemplates';

interface Rule {
  type: string;
  operator: string;
  value: string;
}

const ruleTypes = [
  { value: 'page_views', label: 'Page Views Count', operators: ['greater_than', 'less_than', 'equals', 'greater_or_equal'] },
  { value: 'total_events', label: 'Total Events Count', operators: ['greater_than', 'less_than', 'equals', 'greater_or_equal'] },
  { value: 'visited_page', label: 'Visited Page', operators: ['contains', 'not_contains'] },
  { value: 'country', label: 'Country', operators: ['equals', 'not_equals'] },
  { value: 'city', label: 'City', operators: ['equals', 'not_equals'] },
  { value: 'device', label: 'Device Type', operators: ['equals', 'not_equals'] },
  { value: 'utm_source', label: 'UTM Source', operators: ['equals', 'not_equals'] },
  { value: 'utm_medium', label: 'UTM Medium', operators: ['equals', 'not_equals'] },
  { value: 'utm_campaign', label: 'UTM Campaign', operators: ['equals', 'not_equals'] },
  { value: 'referrer', label: 'Referrer', operators: ['contains', 'not_contains'] },
  { value: 'event_type', label: 'Has Event Type', operators: ['equals', 'not_equals'] },
  { value: 'is_identified', label: 'Is Identified', operators: ['equals'] },
  { value: 'has_email', label: 'Has Email', operators: ['equals'] },
  { value: 'has_phone', label: 'Has Phone', operators: ['equals'] },
  { value: 'last_seen_days', label: 'Last Seen (Days Ago)', operators: ['less_than', 'greater_than', 'equals', 'less_or_equal', 'greater_or_equal'] },
];

const operatorLabels: Record<string, string> = {
  greater_than: 'greater than',
  less_than: 'less than',
  equals: 'equals',
  greater_or_equal: 'at least',
  less_or_equal: 'at most',
  contains: 'contains',
  not_contains: 'does not contain',
  not_equals: 'does not equal',
};

// Force dynamic rendering since we use useSearchParams()
export const dynamic = 'force-dynamic';

export default function NewSegmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedSite, loading: siteLoading } = useSite();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState<Rule[]>([{ type: 'page_views', operator: 'greater_than', value: '1' }]);
  const [saving, setSaving] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [templateName, setTemplateName] = useState<string | null>(null);

  // Load template if specified in query params
  useEffect(() => {
    const templateId = searchParams.get('template');
    if (templateId) {
      const template = getTemplateById(templateId);
      if (template) {
        setName(template.name);
        setDescription(template.description);
        setRules(template.rules.map(r => ({
          type: r.type,
          operator: r.operator,
          value: String(r.value)
        })));
        setTemplateName(template.name);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchEventTypes = async () => {
      if (!selectedSite) return;

      try {
        const response = await fetch(`/api/events/types?site_id=${selectedSite.id}`);
        const types = await response.json();
        setEventTypes(types || []);
      } catch (error) {
        console.error('Error fetching event types:', error);
      }
    };

    fetchEventTypes();
  }, [selectedSite]);

  const addRule = () => {
    setRules([...rules, { type: 'page_views', operator: 'greater_than', value: '1' }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof Rule, value: string) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    
    // Reset operator if type changes
    if (field === 'type') {
      const ruleType = ruleTypes.find(r => r.value === value);
      newRules[index].operator = ruleType?.operators[0] || 'equals';
      newRules[index].value = '';
    }
    
    setRules(newRules);
    setPreviewCount(null);
  };

  const handlePreview = async () => {
    if (!selectedSite) {
      alert('Please select a site first');
      return;
    }

    setPreviewing(true);
    try {
      const res = await fetch('/api/segments/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules, site_id: selectedSite.id }),
      });
      const data = await res.json();
      setPreviewCount(data.count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a segment name');
      return;
    }

    if (!selectedSite) {
      alert('Please select a site first');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, rules, site_id: selectedSite.id }),
      });

      if (res.ok) {
        router.push('/segments');
      } else {
        const error = await res.json();
        alert(`Failed to create segment: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create segment');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '6px', padding: '10px 12px', fontSize: '14px', width: '100%' };
  const selectStyle = { ...inputStyle, cursor: 'pointer' };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #334155', background: 'rgba(15,23,42,0.95)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 700 }}>Boopin Data Platform</h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Create Segment</p>
              </div>
            </Link>
          </div>
          <Navigation />
        </div>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
        <Link href="/segments" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
          ← Back to Segments
        </Link>

        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '20px', color: '#fff', fontWeight: 700 }}>🎯 Create New Segment</h2>

          {/* Template Banner */}
          {templateName && (
            <div style={{
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              border: '1px solid #0891b2'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '20px' }}>✨</span>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                  Using Template: {templateName}
                </p>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#e0f2fe', lineHeight: '1.5' }}>
                This segment is pre-configured with best practices. Feel free to customize the name, description, and rules to fit your needs.
              </p>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Segment Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High-Intent Visitors"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this segment represents..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>Rules (All must match)</label>
              <button onClick={addRule} style={{ background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>
                + Add Rule
              </button>
            </div>

            {rules.map((rule, index) => {
              const ruleType = ruleTypes.find(r => r.value === rule.type);
              return (
                <div key={index} style={{ background: '#0f172a', borderRadius: '8px', padding: '16px', marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={rule.type}
                    onChange={(e) => updateRule(index, 'type', e.target.value)}
                    style={{ ...selectStyle, width: 'auto', minWidth: '180px' }}
                  >
                    {ruleTypes.map(rt => (
                      <option key={rt.value} value={rt.value}>{rt.label}</option>
                    ))}
                  </select>

                  <select
                    value={rule.operator}
                    onChange={(e) => updateRule(index, 'operator', e.target.value)}
                    style={{ ...selectStyle, width: 'auto', minWidth: '140px' }}
                  >
                    {ruleType?.operators.map(op => (
                      <option key={op} value={op}>{operatorLabels[op]}</option>
                    ))}
                  </select>

                  {(rule.type === 'is_identified' || rule.type === 'has_email' || rule.type === 'has_phone') ? (
                    <select
                      value={rule.value}
                      onChange={(e) => updateRule(index, 'value', e.target.value)}
                      style={{ ...selectStyle, width: 'auto', minWidth: '100px' }}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : rule.type === 'device' ? (
                    <select
                      value={rule.value}
                      onChange={(e) => updateRule(index, 'value', e.target.value)}
                      style={{ ...selectStyle, width: 'auto', minWidth: '120px' }}
                    >
                      <option value="">Select...</option>
                      <option value="desktop">Desktop</option>
                      <option value="mobile">Mobile</option>
                      <option value="tablet">Tablet</option>
                    </select>
                  ) : rule.type === 'event_type' ? (
                    <select
                      value={rule.value}
                      onChange={(e) => updateRule(index, 'value', e.target.value)}
                      style={{ ...selectStyle, width: 'auto', minWidth: '180px' }}
                    >
                      <option value="">Select event...</option>
                      {eventTypes.length > 0 ? (
                        <optgroup label="📊 Tracked Events">
                          {eventTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </optgroup>
                      ) : (
                        <option value="" disabled>No events tracked yet</option>
                      )}
                    </select>
                  ) : (
                    <input
                      type={['page_views', 'total_events', 'last_seen_days'].includes(rule.type) ? 'number' : 'text'}
                      value={rule.value}
                      onChange={(e) => updateRule(index, 'value', e.target.value)}
                      placeholder={
                        rule.type === 'visited_page' ? '/pricing' :
                        rule.type === 'country' ? 'United Arab Emirates' :
                        rule.type === 'city' ? 'Dubai' :
                        rule.type === 'utm_source' ? 'google' :
                        rule.type === 'utm_medium' ? 'cpc' :
                        rule.type === 'utm_campaign' ? 'summer_sale' :
                        rule.type === 'referrer' ? 'google.com' :
                        'Value'
                      }
                      style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}
                    />
                  )}

                  {rules.length > 1 && (
                    <button onClick={() => removeRule(index)} style={{ background: '#ef444420', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }}>
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Preview */}
          <div style={{ background: '#0f172a', borderRadius: '8px', padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>Matching Users</p>
              <p style={{ color: '#fff', margin: '4px 0 0', fontSize: '24px', fontWeight: 700 }}>
                {previewCount !== null ? previewCount : '—'}
              </p>
            </div>
            <button onClick={handlePreview} disabled={previewing} style={{ background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' }}>
              {previewing ? 'Calculating...' : '🔄 Preview'}
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Link href="/segments" style={{ background: '#334155', color: '#e2e8f0', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}>
              Cancel
            </Link>
            <button onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              {saving ? 'Saving...' : '💾 Save Segment'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
