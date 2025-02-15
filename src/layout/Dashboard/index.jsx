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
import KeepAlive from 'react-activation';

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
    const firstSegment = segments[0].charAt(0).toUpperCase() + segments[0].slice(1).toLowerCase();
    const rest = segments.slice(1).join(' ').toLowerCase();
    return rest ? `${firstSegment} ${rest}` : firstSegment;
  }
  
  


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

  return (
    <AuthGuard>
      <Box sx={{ display: 'flex', width: '93%' }}>
        <Header />
        {!isHorizontal ? <Drawer /> : <HorizontalBar />}

        <Box component="main" sx={{ width: `calc(100% - ${DRAWER_WIDTH}px)`, flexGrow: 1, p: { xs: 2, md: 3 } }}>
          <Toolbar sx={{ mt: isHorizontal ? 8 : 'inherit', mb: isHorizontal ? 2 : 'inherit' }} />
          <TabBar/>
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
            <KeepAlive id={location.pathname + location.search}>
            <Outlet key={location.pathname + location.search} />
            </KeepAlive>
            <Footer />
          </Container>
        </Box>
      </Box>
    </AuthGuard>
  );
}
