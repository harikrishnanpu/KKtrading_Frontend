import PropTypes from 'prop-types';
import { matchPath, useLocation, Link } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

// project-imports
import Dot from 'components/@extended/Dot';
import IconButton from 'components/@extended/IconButton';

import useConfig from 'hooks/useConfig';
import { MenuOrientation, ThemeMode, NavActionType } from 'config';
import { useDrawer } from 'hooks/useDrawerState';

// ==============================|| NAVIGATION - ITEM ||============================== //

export default function NavItem({ item, level, isParents = false }) {
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));


  const { isDashboardDrawerOpened, setDashboardDrawerOpened } = useDrawer();
  const { mode, menuOrientation } = useConfig();

  let itemTarget = '_self';
  if (item.target) {
    itemTarget = '_blank';
  }

  const Icon = item.icon;
  const itemIcon = item.icon ? (
    <Icon
      variant="Bulk"
      size={isDashboardDrawerOpened ? 20 : 22}
      style={{ ...(menuOrientation === MenuOrientation.HORIZONTAL && isParents && { fontSize: 20, stroke: '1.5' }) }}
    />
  ) : (
    false
  );

  const { pathname } = useLocation();
  const isSelected = !!matchPath({ path: item?.link ? item.link : item.url, end: false }, pathname);

  const textColor = mode === ThemeMode.DARK ? 'secondary.400' : 'secondary.main';
  const iconSelectedColor = 'primary.main';

  return (
    <>
      {menuOrientation === MenuOrientation.VERTICAL || downLG ? (
        <Box sx={{ position: 'relative' }}>
          <ListItemButton
            component={Link}
            to={item.url}
            target={itemTarget}
            disabled={item.disabled}
            selected={isSelected}
            sx={{
              zIndex: 1201,
              pl: isDashboardDrawerOpened ? `${level * 20}px` : 1.5,
              py: !isDashboardDrawerOpened && level === 1 ? 1.25 : 1,
              ...(isDashboardDrawerOpened && {
                '&:hover': { bgcolor: 'transparent' },
                '&.Mui-selected': { '&:hover': { bgcolor: 'transparent' }, bgcolor: 'transparent' }
              }),
              ...(isDashboardDrawerOpened &&
                level === 1 && {
                  mx: 1.25,
                  my: 0.5,
                  borderRadius: 1,
                  '&:hover': { bgcolor: mode === ThemeMode.DARK ? 'divider' : 'secondary.200' },
                  '&.Mui-selected': { color: iconSelectedColor, '&:hover': { color: iconSelectedColor } }
                }),
              ...(!isDashboardDrawerOpened && {
                px: 2.75,
                justifyContent: 'center',
                '&:hover': { bgcolor: 'transparent' },
                '&.Mui-selected': { '&:hover': { bgcolor: 'transparent' }, bgcolor: 'transparent' }
              })
            }}
            {...(downLG && { onClick: () => setDashboardDrawerOpened(false) })}
          >
            {itemIcon && (
              <ListItemIcon
                sx={{
                  minWidth: 38,
                  color: isSelected ? iconSelectedColor : textColor,
                  ...(!isDashboardDrawerOpened &&
                    level === 1 && {
                      borderRadius: 1,
                      width: 46,
                      height: 46,
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': { bgcolor: mode === ThemeMode.DARK ? 'secondary.light' : 'secondary.200' }
                    }),
                  ...(!isDashboardDrawerOpened &&
                    isSelected && {
                      bgcolor: mode === ThemeMode.DARK ? 'secondary.100' : 'primary.lighter',
                      '&:hover': {
                        bgcolor: mode === ThemeMode.DARK ? 'secondary.200' : 'primary.lighter'
                      }
                    })
                }}
              >
                {itemIcon}
              </ListItemIcon>
            )}

            {!itemIcon && isDashboardDrawerOpened && (
              <ListItemIcon
                sx={{
                  minWidth: 30
                }}
              >
                <Dot size={isSelected ? 6 : 5} color={isSelected ? 'primary' : 'secondary'} />
              </ListItemIcon>
            )}

            {(isDashboardDrawerOpened || (!isDashboardDrawerOpened && level !== 1)) && (
              <ListItemText
                primary={
                  <Typography variant="h6" sx={{ color: isSelected ? iconSelectedColor : textColor, fontWeight: isSelected ? 500 : 400 }}>
                    {item.title}
                  </Typography>
                }
              />
            )}
            {(isDashboardDrawerOpened || (!isDashboardDrawerOpened && level !== 1)) && item.chip && (
              <Chip
                color={item.chip.color}
                variant={item.chip.variant}
                size={item.chip.size}
                label={item.chip.label}
                avatar={item.chip.avatar && <Avatar>{item.chip.avatar}</Avatar>}
              />
            )}
          </ListItemButton>
          {(isDashboardDrawerOpened || (!isDashboardDrawerOpened && level !== 1)) &&
            item?.actions &&
            item?.actions.map((action, index) => {
              const ActionIcon = action?.icon;
              const callAction = action?.function;
              return (
                <IconButton
                  key={index}
                  {...(action.type === NavActionType.FUNCTION && {
                    onClick: (event) => {
                      event.stopPropagation();
                      callAction();
                    }
                  })}
                  {...(action.type === NavActionType.LINK && {
                    component: Link,
                    to: action.url,
                    target: action.target ? '_blank' : '_self'
                  })}
                  color="secondary"
                  variant="outlined"
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 20,
                    zIndex: 1202,
                    width: 20,
                    height: 20,
                    p: 0.25,
                    color: 'secondary.dark',
                    borderColor: isSelected ? 'primary.light' : 'secondary.light',
                    '&:hover': { borderColor: isSelected ? 'primary.main' : 'secondary.main' }
                  }}
                >
                  <ActionIcon
                    size={12}
                    color={mode === ThemeMode.DARK ? theme.palette.secondary[400] : theme.palette.secondary.main}
                    style={{ marginLeft: 1 }}
                  />
                </IconButton>
              );
            })}
        </Box>
      ) : (
        <ListItemButton
          component={Link}
          to={item.url}
          target={itemTarget}
          disabled={item.disabled}
          selected={isSelected}
          sx={{
            zIndex: 1201,
            '&:hover': { bgcolor: 'transparent' },
            ...(isParents && { color: textColor, p: 1, mr: 1 }),
            '&.Mui-selected': {
              bgcolor: 'transparent',
              color: iconSelectedColor,
              '&:hover': { color: iconSelectedColor, bgcolor: 'transparent' }
            }
          }}
        >
          {itemIcon && (
            <ListItemIcon
              sx={{
                minWidth: 36,
                ...(!isDashboardDrawerOpened && {
                  borderRadius: 1,
                  width: 36,
                  height: 26,
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  '&:hover': { bgcolor: 'transparent' }
                }),
                ...(!isDashboardDrawerOpened && isSelected && { bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } })
              }}
            >
              {itemIcon}
            </ListItemIcon>
          )}

          <ListItemText
            primary={
              <Typography variant="h6" sx={{ color: isSelected ? iconSelectedColor : textColor, fontWeight: isSelected ? 500 : 400 }}>
                {item.title}
              </Typography>
            }
          />
          {(isDashboardDrawerOpened || (!isDashboardDrawerOpened && level !== 1)) && item.chip && (
            <Chip
              color={item.chip.color}
              variant={item.chip.variant}
              size={item.chip.size}
              label={item.chip.label}
              avatar={item.chip.avatar && <Avatar>{item.chip.avatar}</Avatar>}
              sx={{ ml: 1 }}
            />
          )}
        </ListItemButton>
      )}
    </>
  );
}

NavItem.propTypes = { item: PropTypes.any, level: PropTypes.number, isParents: PropTypes.bool };
