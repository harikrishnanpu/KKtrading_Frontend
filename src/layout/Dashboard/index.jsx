import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';

// project-imports
import Drawer from './Drawer';
import Header from './Header';
import Footer from './Footer';
import HorizontalBar from './Drawer/HorizontalBar';
import Loader from 'components/Loader';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import AuthGuard from 'utils/route-guard/AuthGuard';

import { DRAWER_WIDTH, MenuOrientation } from 'config';
import useConfig from 'hooks/useConfig';
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
import { useTabs } from 'contexts/TabsContext';
import TabBar from './tabBar';
import KeepAlive, { AliveScope, useAliveController } from 'react-activation';
import { isMobile } from 'react-device-detect';

// ==============================|| MAIN LAYOUT ||============================== //

export default function MainLayout() {
  const theme = useTheme();

  const { menuMasterLoading } = useGetMenuMaster();
  const downXL = useMediaQuery(theme.breakpoints.down('xl'));
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));

  const { container, miniDrawer, menuOrientation } = useConfig();

  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;

  const location = useLocation();
  const { openTab } = useTabs();

 
  function deriveLabelFromPath(path) {
    if (!path || path === '/') return 'Home';
    const segments = path.split('/').filter(Boolean);
    // Only take the first two segments
    const relevant = segments.slice(0, 2);
    // Capitalize each segment
    const formatted = relevant.map(seg => seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase());
    return formatted.join(' ').slice(0,18);
  }
  
  const { drop } = useAliveController();

  
  useEffect(() => {
    return () => drop(location.pathname + location.search);
  }, [location.pathname, location.search]);


  useEffect(() => {
    // Derive label from the BASE path if you like:
    const label = deriveLabelFromPath(location.pathname);

    // Always include location.search so we don't drop the query string:
    openTab(location.pathname + location.search, label);
  }, [location.pathname, location.search]);

  
  // set media wise responsive drawer
  useEffect(() => {
    if (!miniDrawer) {
      handlerDrawerOpen(!downXL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downXL]);

  if (menuMasterLoading) return <Loader />;

  const forceReloadRoutes = [
    '/list', '/all', '/account', '/need-to-purchase',
    '/delivery', '/registry', '/update', '/report', '/payment',
    '/products/upcomming/lowstock'
  ];
  
  const shouldForceReload = forceReloadRoutes.some(route => location.pathname.includes(route));

  return (
    <AuthGuard>
      <Box sx={{ display: 'flex', width: isMobile ? '100%' : '97%' }}>
        <Header />
        {!isHorizontal ? <Drawer /> : <HorizontalBar />}

        <Box component="main" sx={{ width: `calc(100% - ${DRAWER_WIDTH}px)`, flexGrow: 1 }}>
          <Toolbar sx={{ mt: isHorizontal ? 8 : 'inherit', mb: isHorizontal ? 2 : 'inherit' }} />
          {!isMobile && <TabBar/> }
          <Container
            maxWidth={container ? 'xl' : false}
            sx={{
              xs: 0,
              ...(container && { px: { xs: 0, md: 2 } }),
              position: 'relative',
              minHeight: 'calc(100vh - 110px)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Breadcrumbs />
            <AliveScope max={3}>  {/* Limit cached components */}
  <KeepAlive id={location.pathname + location.search} when={!shouldForceReload}>
  <Outlet key={shouldForceReload ? Date.now() : location.pathname + location.search} />
</KeepAlive>
</AliveScope>



            <Footer />
          </Container>
        </Box>
      </Box>
    </AuthGuard>
  );
}
