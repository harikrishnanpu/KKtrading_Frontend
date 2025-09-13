import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Link } from 'react-router-dom';

// material-ui
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

// project import
import Avatar from 'components/@extended/Avatar';
import useAuth from 'hooks/useAuth';

// assets
import { ArrowRight2 } from 'iconsax-react';

import api from 'pages/api';
import { useDrawer } from 'hooks/useDrawerState';

const ExpandMore = styled(IconButton, { shouldForwardProp: (prop) => prop !== 'theme' && prop !== 'expand' && prop !== 'drawerOpen' })(
  ({ theme, expand, drawerOpen }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(-90deg)',
    marginLeft: 'auto',
    color: theme.palette.secondary.dark,
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest
    }),
    ...(!drawerOpen && {
      opacity: 0,
      width: 50,
      height: 50
    })
  })
);

// ==============================|| LIST - USER ||============================== //

export default function UserList() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState();
  
  const { isDashboardDrawerOpened, setDashboardDrawerOpened } = useDrawer();
  
  const { logout, user } = useAuth();

useEffect(() => {
  let isMounted = true;

  const fetchUser = async () => {
    if (user) {
      try {
        const { data } = await api.get(`/api/users/${user._id}`);
        if (!data.error && isMounted) {
          setAvatar(data.avatar);
        } else if (data.error) {
          console.error(data.error);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  fetchUser();

  return () => {
    isMounted = false;
  };
}, [user]);

  
  const handleLogout = async () => {
    try {
      await logout();
      navigate(`/login`, {
        state: {
          from: ''
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ p: 1.25, px: !isDashboardDrawerOpened ? 1.25 : 3, borderTop: '2px solid ', borderTopColor: 'divider' }}>
      <List disablePadding>
        <ListItem
          disablePadding
          secondaryAction={
            <ExpandMore
              theme={theme}
              expand={open}
              drawerOpen={isDashboardDrawerOpened}
              id="basic-button"
              aria-controls={open ? 'basic-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleClick}
              aria-label="show more"
            >
              <ArrowRight2 style={{ fontSize: '0.625rem' }} />
            </ExpandMore>
          }
          sx={{
            ...(!isDashboardDrawerOpened && { display: 'flex', justifyContent: 'flex-end' }),
            '& .MuiListItemSecondaryAction-root': { right: !isDashboardDrawerOpened ? 16 : -16 }
          }}
        >
          <ListItemAvatar>
            <Avatar alt="Avatar" src={avatar} sx={{ ...(isDashboardDrawerOpened && { width: 46, height: 46 }) }} />
          </ListItemAvatar>
          <ListItemText primary={user?.name} sx={{ ...(!isDashboardDrawerOpened && { display: 'none' }) }} secondary={user.role} />
        </ListItem>
      </List>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ 'aria-labelledby': 'basic-button' }}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
        <MenuItem component={Link} to="/apps/profiles/account/basic" onClick={handleClose}>
          Profile
        </MenuItem>
        <MenuItem component={Link} to="/apps/profiles/account/basic" onClick={handleClose}>
          My account
        </MenuItem>
      </Menu>
    </Box>
  );
}
