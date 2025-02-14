import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TabsContext = createContext(null);

export const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within a <TabsProvider>');
  }
  return context;
};

// A simple helper to derive a label if not explicitly provided.
function deriveLabelFromPath(path) {
  if (!path || path === '/') return 'Home';
  const segments = path.split('/').filter(Boolean);
  const firstSegment = segments[0].charAt(0).toUpperCase() + segments[0].slice(1).toLowerCase();
  const rest = segments.slice(1).join(' ').toLowerCase();
  return rest ? `${firstSegment} ${rest}` : firstSegment;
}



export const TabsProvider = ({ children }) => {
  const navigate = useNavigate();

  // Each tab has { path, label }.
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);

  // Add or "activate" a tab
  const openTab = (path, label) => {
    setTabs((prev) => {
      // If tab exists, just set it active
      const existing = prev.find((t) => t.path === path);
      if (existing) {
        setActiveTab(path);
        return prev;
      }
      // Create a new tab
      const newTab = {
        path,
        label: label || deriveLabelFromPath(path),
      };
      return [...prev, newTab];
    });
    setActiveTab(path);
    navigate(path);
  };

  // Switch/activate an existing tab
  const switchTab = (path) => {
    setActiveTab(path);
    navigate(path);
  };

  // Close a tab
  const closeTab = (path) => {
    setTabs((prev) => prev.filter((t) => t.path !== path));
    setTimeout(() => {
      setTabs((currentTabs) => {
        // If no tabs remain, go home (or anywhere you want)
        if (currentTabs.length === 0) {
          navigate('/');
          setActiveTab(null);
          return currentTabs;
        }
        // If closing the active tab, switch to the first open tab
        if (path === activeTab) {
          navigate(currentTabs[0].path);
          setActiveTab(currentTabs[0].path);
        }
        return currentTabs;
      });
    }, 0);
  };


  const renameTab = (path, newLabel) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.path === path ? { ...tab, label: newLabel } : tab
      )
    );
  };

  // "Refresh" a tab by re-navigating, forcing remount
  const refreshTab = (path) => {
    // If you navigate to the exact same path,
    // React Router might not remount. So we
    // add a query param or random key to force remount:
    const refreshUrl = `${path}?_ts=${Date.now()}`;
    navigate(refreshUrl, { replace: true });
    setActiveTab(path);
  };

  const value = {
    tabs,
    activeTab,
    openTab,
    switchTab,
    closeTab,
    refreshTab,
    renameTab
  };

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
};
