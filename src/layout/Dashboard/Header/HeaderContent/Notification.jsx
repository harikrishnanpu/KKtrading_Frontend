import { useEffect, useRef, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project imports
import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import Transitions from 'components/@extended/Transitions';
import { ThemeMode } from 'config';
import { Gift, MessageText1, Notification, Setting2 } from 'iconsax-react';
import Avatar from 'components/@extended/Avatar';
import api from 'pages/api';

const actionSX = {
  mt: '6px',
  ml: 1,
  top: 'auto',
  right: 'auto',
  alignSelf: 'flex-start',
  transform: 'none'
};

export default function NotificationPage() {
  const theme = useTheme();
  const matchesXs = useMediaQuery(theme.breakpoints.down('md'));

  // anchor ref for popper
  const anchorRef = useRef(null);

  // local state
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  // fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      // Adjust the URL according to your backend route
      const response = await api.get('/api/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // number of unread notifications
  const unreadCount = notifications.filter((item) => !item.read).length;

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const iconBackColorOpen = theme.palette.mode === ThemeMode.DARK ? 'background.paper' : 'secondary.200';
  const iconBackColor = theme.palette.mode === ThemeMode.DARK ? 'background.default' : 'secondary.100';

  return (
    <Box sx={{ flexShrink: 0, ml: 0.5 }}>
      <IconButton
        color="secondary"
        variant="light"
        aria-label="open notifications"
        ref={anchorRef}
        aria-controls={open ? 'notifications-pop' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
        size="large"
        sx={{ color: 'secondary.main', bgcolor: open ? iconBackColorOpen : iconBackColor, p: 1 }}
      >
        <Badge badgeContent={unreadCount} color="primary" sx={{ '& .MuiBadge-badge': { top: 2, right: 4 } }}>
          <Notification variant="Bold" />
        </Badge>
      </IconButton>

      <Popper
        placement={matchesXs ? 'bottom' : 'bottom-end'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [matchesXs ? -5 : 0, 9]
              }
            }
          ]
        }}
      >
        {({ TransitionProps }) => (
          <Transitions
            type="grow"
            position={matchesXs ? 'top' : 'top-right'}
            sx={{ overflow: 'hidden' }}
            in={open}
            {...TransitionProps}
          >
            <Paper
              sx={{
                boxShadow: theme.customShadows.z1,
                borderRadius: 1.5,
                width: '100%',
                minWidth: 285,
                maxWidth: 420,
                [theme.breakpoints.down('md')]: { maxWidth: 285 }
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard elevation={0} border={false}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h5">Notifications</Typography>
                    <Link
                      href="#"
                      variant="h6"
                      color="primary"
                      onClick={(e) => {
                        e.preventDefault();
                        // You can add logic here to mark all as read in backend
                        // For example: axios.put(...) then refresh notifications
                      }}
                    >
                      Mark all read
                    </Link>
                  </Stack>

                  <List
                    component="nav"
                    sx={{
                      '& .MuiListItemButton-root': {
                        p: 1.5,
                        my: 1.5,
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': { bgcolor: 'primary.lighter', borderColor: theme.palette.primary.light },
                        '& .MuiListItemSecondaryAction-root': { ...actionSX, position: 'relative' }
                      }
                    }}
                  >
                    {notifications.map((notification, index) => {
                      return (
                        <ListItemButton
                          key={notification._id || index}
                          onClick={() => {
                            // e.g., mark individual notification as read
                            // axios.put(`http://localhost:5000/api/notifications/${notification._id}`, { read: true })
                            //   .then(() => fetchNotifications());
                          }}
                        >
                          <ListItemAvatar>
                            {/* You can switch icons/avatars based on notification type */}
                            {notification.type === 'gift' && (
                              <Avatar type="filled">
                                <Gift size={20} variant="Bold" />
                              </Avatar>
                            )}
                            {notification.type === 'message' && (
                              <Avatar type="outlined">
                                <MessageText1 size={20} variant="Bold" />
                              </Avatar>
                            )}
                            {notification.type === 'setting' && (
                              <Avatar>
                                <Setting2 size={20} variant="Bold" />
                              </Avatar>
                            )}
                            {/* Fallback avatar */}
                            {!notification.type && (
                              <Avatar type="combined">
                                {notification.title?.charAt(0).toUpperCase() || 'N'}
                              </Avatar>
                            )}
                          </ListItemAvatar>

                          <ListItemText
                            primary={
                              <Typography variant="h6">
                                {notification.title}{' '}
                                {notification.extraInfo && (
                                  <Typography component="span" variant="subtitle1">
                                    {notification.extraInfo}
                                  </Typography>
                                )}
                              </Typography>
                            }
                            secondary={notification.message}
                          />

                          <ListItemSecondaryAction>
                            <Typography variant="caption" noWrap>
                              {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </ListItemSecondaryAction>
                        </ListItemButton>
                      );
                    })}
                  </List>

                  <Stack direction="row" justifyContent="center">
                    <Link href="#" variant="h6" color="primary">
                      View all
                    </Link>
                  </Stack>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}
