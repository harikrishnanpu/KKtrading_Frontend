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

function deriveLabelFromPath(path) {
  if (!path || path === '/') return 'Home';
  const segments = path.split('/').filter(Boolean);
  const first = segments[0].charAt(0).toUpperCase() + segments[0].slice(1).toLowerCase();
  const rest = segments.slice(1).join(' ').toLowerCase();
  return rest ? `${first} ${rest}` : first;
}

export const TabsProvider = ({ children }) => {
  const navigate = useNavigate();
  
  // Each tab = { path, label }
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);

  // 1) OPEN or ACTIVATE a tab
  const openTab = (path, label) => {
    // If no "?" in path, append ?_ts=...
    let newPath = path;
    if (!path.includes('?')) {
      newPath = `${path}?_ts=${Date.now()}`;
    }

    setTabs((prev) => {
      // If not already in tabs, add it
      const exists = prev.find((t) => t.path === newPath);
      if (!exists) {
        return [...prev, { path: newPath, label: label || deriveLabelFromPath(path) }];
      }
      return prev;
    });
    setActiveTab(newPath);
    navigate(newPath);
  };

  // 2) SWITCH to an existing tab
  //    Must use the EXACT stored path string (including ?_ts= or ?instance=).
  const switchTab = (path) => {
    console.log("switchTab called with:", path);
    setActiveTab(path);
    navigate(path);
  };
  

  // 3) CLOSE a tab
  //    If the closed tab was active, switch to another (or home if none remain).
  const closeTab = (path) => {
    setTabs((prev) => prev.filter((t) => t.path !== path));
    setTimeout(() => {
      setTabs((current) => {
        if (current.length === 0) {
          navigate('/');
          setActiveTab(null);
          return current;
        }
        if (path === activeTab) {
          navigate(current[0].path);
          setActiveTab(current[0].path);
        }
        return current;
      });
    }, 0);
  };

  // 4) RENAME a tab (updates label only)
  const renameTab = (path, newLabel) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => (tab.path === path ? { ...tab, label: newLabel } : tab))
    );
  };

  // 5) REFRESH a tab
  //    - Overwrite the tab's path in the array so the next click uses the new ?_ts
  //    - Navigate to that new ?_ts path
  const refreshTab = (path) => {
    const basePath = path.split('?')[0];
    const newPath = `${basePath}?_ts=${Date.now()}`;

    // Update stored path
    setTabs((prev) =>
      prev.map((tab) => (tab.path === path ? { ...tab, path: newPath } : tab))
    );

    setActiveTab(newPath);
    navigate(newPath, { replace: true });
  };

  // 6) DUPLICATE a tab
  //    Creates a distinct URL with ?instance=...
  const duplicateTab = (path) => {
    const basePath = path.split('?')[0];
    const newPath = `${basePath}?_ts=${Date.now()}`;
    // Also optional: add " (copy)" to label
    openTab(newPath, deriveLabelFromPath(basePath) + ' (copy)');
  };

  const value = {
    tabs,
    activeTab,
    openTab,
    switchTab,
    closeTab,
    renameTab,
    refreshTab,
    duplicateTab
  };

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
};
