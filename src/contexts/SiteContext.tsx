'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Site {
  id: string;
  name: string;
  domain: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface SiteContextType {
  selectedSite: Site | null;
  sites: Site[];
  loading: boolean;
  selectSite: (site: Site) => void;
  refreshSites: () => Promise<void>;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites');
      const data = await response.json();
      setSites(data);

      // Load selected site from localStorage or use first site
      const savedSiteId = localStorage.getItem('selectedSiteId');
      if (savedSiteId) {
        const savedSite = data.find((s: Site) => s.id === savedSiteId);
        if (savedSite) {
          setSelectedSite(savedSite);
        } else if (data.length > 0) {
          setSelectedSite(data[0]);
          localStorage.setItem('selectedSiteId', data[0].id);
        }
      } else if (data.length > 0) {
        setSelectedSite(data[0]);
        localStorage.setItem('selectedSiteId', data[0].id);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const selectSite = (site: Site) => {
    setSelectedSite(site);
    localStorage.setItem('selectedSiteId', site.id);
  };

  const refreshSites = async () => {
    await fetchSites();
  };

  return (
    <SiteContext.Provider
      value={{
        selectedSite,
        sites,
        loading,
        selectSite,
        refreshSites
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
}
