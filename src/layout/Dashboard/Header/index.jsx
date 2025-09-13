import { useMemo } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Toolbar from '@mui/material/Toolbar';
import AppBarStyled from './AppBarStyled';
import HeaderContent from './HeaderContent';
import IconButton from 'components/@extended/IconButton';
import { HambergerMenu } from 'iconsax-react';
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH, MenuOrientation, ThemeMode } from 'config';
import useConfig from 'hooks/useConfig';
import { useDrawer } from 'hooks/useDrawerState';

export default function Header() {
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));
  const { mode, menuOrientation } = useConfig();
  const { isDashboardDrawerOpened, setDashboardDrawerOpened } = useDrawer();

  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;

  const headerContent = useMemo(() => <HeaderContent />, []);

  const iconBackColorOpen = mode === ThemeMode.DARK ? 'background.paper' : 'secondary.200';
  const iconBackColor = mode === ThemeMode.DARK ? 'background.default' : 'secondary.100';

  const handleToggleDrawer = () => {
    setDashboardDrawerOpened(!isDashboardDrawerOpened);
  };

  const mainHeader = (
    <Toolbar sx={{ px: { xs: 2, sm: 4.5, lg: 8 } }}>
      {!isHorizontal && (
        <IconButton
          aria-label="open drawer"
          onClick={handleToggleDrawer}
          edge="start"
          color="secondary"
          variant="light"
          size="large"
          sx={{
            color: 'secondary.main',
            bgcolor: isDashboardDrawerOpened ? iconBackColorOpen : iconBackColor,
            ml: { xs: 0, lg: -2 },
            p: 1
          }}
        >
          <HambergerMenu />
        </IconButton>
      )}
      {headerContent}
    </Toolbar>
  );

  const appBar = {
    position: 'fixed',
    elevation: 0,
    sx: {
      bgcolor: alpha(theme.palette.background.default, 0.8),
      backdropFilter: 'blur(8px)',
      zIndex: 1200,
      width: isHorizontal
        ? '100%'
        : {
            xs: '100%',
            lg: isDashboardDrawerOpened
              ? `calc(100% - ${DRAWER_WIDTH}px)`
              : `calc(100% - ${MINI_DRAWER_WIDTH}px)`
          }
    }
  };

  return (
    <AppBarStyled open={true} {...appBar}>
      {mainHeader}
    </AppBarStyled>
  );
}
