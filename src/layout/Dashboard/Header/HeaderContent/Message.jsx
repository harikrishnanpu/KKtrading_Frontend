import React, { useState, useEffect } from 'react';

// Material-UI
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button'; // for dynamic announcement buttons

// Project Imports
import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import SimpleBar from 'components/third-party/SimpleBar';
import MessageCard from 'components/cards/statistics/MessageCard';
import { ThemeMode } from 'config';

import { Add, NotificationStatus } from 'iconsax-react';
import api from 'pages/api';

// DayJS for time manipulations
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

/**
 * Group announcements by day (YYYY-MM-DD),
 * then sort those groups descending by date.
 */
function groupAnnouncementsByDate(announcements = []) {
  const grouped = announcements.reduce((acc, announcement) => {
    const dateKey = dayjs(announcement.time).startOf('day').format('YYYY-MM-DD');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(announcement);
    return acc;
  }, {});

  // Sort the date keys descending
  const sortedDates = Object.keys(grouped).sort((a, b) => dayjs(b).diff(dayjs(a)));
  return { grouped, sortedDates };
}

// ==============================|| NOTIFICATION DRAWER ||============================== //

export default function NotificationDrawer() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  // Fetch announcements when drawer is opened
  useEffect(() => {
    if (open) {
      fetchAnnouncements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fetchAnnouncements = async () => {
    try {
      // Replace with your actual API endpoint if needed
      const response = await api.get('/api/announcements');
      setAnnouncements(response.data || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  };

  // Determine icon background color
  const iconBackColorOpen =
    theme.palette.mode === ThemeMode.DARK ? 'background.paper' : 'secondary.200';
  const iconBackColor =
    theme.palette.mode === ThemeMode.DARK ? 'background.default' : 'secondary.100';

  // Group & sort announcements by date
  const { grouped, sortedDates } = groupAnnouncementsByDate(announcements);

  return (
    <>
      {/* Notification Icon */}
      <Box sx={{ flexShrink: 0, ml: 0.75 }}>
        <IconButton
          color="secondary"
          variant="light"
          onClick={handleToggle}
          aria-label="notification toggler"
          size="large"
          sx={{
            color: 'secondary.main',
            bgcolor: open ? iconBackColorOpen : iconBackColor,
            p: 1
          }}
        >
          <NotificationStatus variant="Bulk" />
        </IconButton>
      </Box>

      {/* Notification Drawer */}
      <Drawer
        sx={{ zIndex: 2001 }}
        anchor="right"
        onClose={handleToggle}
        open={open}
        PaperProps={{ sx: { width: { xs: 350, sm: 474 } } }}
      >
        {open && (
          <MainCard content={false} sx={{ border: 'none', borderRadius: 0, height: '100vh' }}>
            <SimpleBar
              sx={{
                '& .simplebar-content': {
                  display: 'flex',
                  flexDirection: 'column'
                }
              }}
            >
              {/* Drawer Header */}
              <Box sx={{ p: 2.5 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1.5}
                >
                  <Typography variant="h5">Announcements</Typography>
                  <IconButton color="secondary" sx={{ p: 0 }} onClick={handleToggle}>
                    {/* 'Add' rotated 45deg => visually like a 'Close' */}
                    <Add size={28} style={{ transform: 'rotate(45deg)' }} />
                  </IconButton>
                </Stack>

                {/* Announcements Grid */}
                <Grid container spacing={1.5} sx={{ mt: 2 }}>
                  {sortedDates.map((dateKey) => {
                    // Determine date label
                    const isToday = dayjs(dateKey).isSame(dayjs(), 'day');
                    const isYesterday = dayjs(dateKey).isSame(dayjs().subtract(1, 'day'), 'day');

                    let dateLabel = dateKey; // fallback
                    if (isToday) {
                      dateLabel = 'Today';
                    } else if (isYesterday) {
                      dateLabel = 'Yesterday';
                    } else {
                      dateLabel = dayjs(dateKey).format('MMM DD, YYYY'); // e.g. "Jan 05, 2025"
                    }

                    return (
                      <React.Fragment key={dateKey}>
                        {/* Date Header */}
                        <Grid item xs={12}>
                          <Typography variant="h6">{dateLabel}</Typography>
                        </Grid>

                        {/* Map each announcement */}
                        {grouped[dateKey].map((announcement) => {
                          const {
                            _id,
                            title,
                            message,
                            time,
                            status = {},
                            attachments = [],
                            buttons = []
                          } = announcement;

                          // Build time strings
                          const relative = dayjs(time).fromNow();
                          const exact = dayjs(time).format('DD MMM YYYY, hh:mm A');

                          // We combine the main text + collage + button array into a single node:
                          const combinedMessage = (
                            <Box>
                              {/* Actual message text */}
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {message}
                              </Typography>

                              {/* Collage of attachments (if any) */}
                              {attachments.length > 0 && (
  <Grid container spacing={1}>
    {attachments.map((url, idx) => (
      <Grid item xs={4} key={idx}>
        <img
          src={url}
          alt={`attachment-${idx}`}
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: 4
          }}
        />
      </Grid>
    ))}
  </Grid>
)}



                              {/* Buttons (if any) */}
                              {buttons.length > 0 && (
                                <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                                  {buttons.map((btn, idx) => (
                                    <Button
                                      key={idx}
                                      variant="outlined"
                                      color={btn.color || 'primary'}
                                      onClick={() => window.open(`/${btn.url}`, '_self')}
                                      sx={{ mb: 1 }}
                                    >
                                      {btn.text}
                                    </Button>
                                  ))}
                                </Stack>
                              )}
                            </Box>
                          );

                          return (
                            <Grid item xs={12} key={_id}>
                              <MessageCard
                                status={{
                                  label: status.label || 'Info',
                                  color: status.color || 'info'
                                }}
                                time={`${relative} • ${exact}`}
                                title={title || 'New Announcement'}
                                message={combinedMessage}
                                // Removed "src", removed "actions", per your request
                              />
                            </Grid>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </Grid>
              </Box>
            </SimpleBar>
          </MainCard>
        )}
      </Drawer>
    </>
  );
}
