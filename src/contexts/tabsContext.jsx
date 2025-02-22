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
  // Only take the first two segments
  const relevant = segments.slice(0, 2);
  // Capitalize each segment
  const formatted = relevant.map(seg => seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase());
  return formatted.join(' ').slice(0,18);
}


/**
 * Removes just the `_ts` parameter from a URL string so we can compare
 * the "base path" ignoring `_ts`.
 *
 * Examples:
 *   "/users?_ts=12345" => "/users"
 *   "/users?foo=bar&_ts=555" => "/users?foo=bar"
 */
function stripTimestamp(url = '') {
  const [base, queryString] = url.split('?');
  if (!queryString) return base;

  const params = new URLSearchParams(queryString);
  params.delete('_ts'); // remove the _ts param if it exists

  const remaining = params.toString();
  return remaining ? `${base}?${remaining}` : base;
}

export const TabsProvider = ({ children }) => {
  const navigate = useNavigate();

  // Each tab = { path, label }
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);

  // 1) OPEN or ACTIVATE a tab
  const openTab = (path, label) => {

    if (['list', 'all', 'account','need-to-purchase','delivery', 'payment','registry', 'update','report'].some(substr => path.includes(substr)) || path === '/products/upcomming/lowstock' ) {
      navigate(path);
      return;
    }


    const basePath = stripTimestamp(path);

    // Check if a tab with the same base path (ignoring _ts) already exists
    const existingTab = tabs.find((t) => stripTimestamp(t.path) === basePath);
    if (existingTab) {
      // If it exists, just activate & navigate to that tab
      setActiveTab(existingTab.path);
      navigate(existingTab.path);
      return;
    }

    // Otherwise, create a new timestamped path
    const hasQuery = path.includes('?');
    const newPath = hasQuery
      ? `${path}&_ts=${Date.now()}`
      : `${path}?_ts=${Date.now()}`;

    // Add it to the list
    setTabs((prevTabs) => [
      ...prevTabs,
      { path: newPath, label: label || deriveLabelFromPath(path) }
    ]);
    setActiveTab(newPath);
    navigate(newPath);
  };

  // 2) SWITCH to an existing tab by exact path
  const switchTab = (path) => {
    setActiveTab(path);
    navigate(path);
  };

  // 3) CLOSE a tab
  const closeTab = (path) => {
    setTabs((prevTabs) => {
      const newTabs = prevTabs.filter((t) => t.path !== path);
      // If no tabs remain, navigate home
      if (newTabs.length === 0) {
        navigate('/');
        setActiveTab(null);
        return [];
      }
      // If the closed tab was active, switch to the first in the new list
      if (path === activeTab) {
        navigate(newTabs[0].path);
        setActiveTab(newTabs[0].path);
      }
      return newTabs;
    });
  };

  // 4) RENAME a tab (update label only)
  const renameTab = (path, newLabel) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.path === path ? { ...tab, label: newLabel } : tab
      )
    );
  };

  // 5) REFRESH a tab
  const refreshTab = (path) => {
    const [basePath] = path.split('?');
    const newPath = `${basePath}?_ts=${Date.now()}`;

    setTabs((prevTabs) =>
      prevTabs.map((tab) => (tab.path === path ? { ...tab, path: newPath } : tab))
    );
    setActiveTab(newPath);
    navigate(newPath, { replace: true });
  };

  // 6) DUPLICATE a tab
  //    To avoid "ignoring _ts" conflict, add an extra "dup=..." param
  //    so it's truly recognized as a different base path.
  const duplicateTab = (path) => {
    // Remove _ts from the original path, keep other params
    const baseIgnoringTs = stripTimestamp(path);

    // Make sure the new path differs ignoring `_ts`, by adding a `dup` param
    const dupId = Date.now();
    const newPath = baseIgnoringTs.includes('?')
      ? `${baseIgnoringTs}&dup=${dupId}&_ts=${Date.now()}`
      : `${baseIgnoringTs}?dup=${dupId}&_ts=${Date.now()}`;

    // " (copy)" is optional, but clarifies which tab is duplicated
    openTab(newPath, deriveLabelFromPath(baseIgnoringTs) + ' (copy)');
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
