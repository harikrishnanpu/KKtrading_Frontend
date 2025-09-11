// hooks/useDrawerState.js
import { createContext, useContext, useState } from 'react';

const DrawerContext = createContext();

export function DrawerProvider({ children }) {
  const [isDashboardDrawerOpened, setDashboardDrawerOpened] = useState(false);
  const [isComponentDrawerOpened, setComponentDrawerOpened] = useState(true);

  return (
    <DrawerContext.Provider
      value={{
        isDashboardDrawerOpened,
        setDashboardDrawerOpened,
        isComponentDrawerOpened,
        setComponentDrawerOpened
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  return useContext(DrawerContext);
}
