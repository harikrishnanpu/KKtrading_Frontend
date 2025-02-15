// layout/TabsLayout.jsx
import { Outlet, useLocation } from 'react-router-dom';
import { TabsProvider } from 'contexts/TabsContext';

export default function TabsLayout() {

  return (
    <TabsProvider>
      <Outlet />
    </TabsProvider>
  );
}
