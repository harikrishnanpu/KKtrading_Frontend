// layout/TabsLayout.jsx
import { Outlet } from 'react-router-dom';
import { TabsProvider } from 'contexts/TabsContext';

export default function TabsLayout() {

  return (
    <TabsProvider>
      <Outlet />
    </TabsProvider>
  );
}
