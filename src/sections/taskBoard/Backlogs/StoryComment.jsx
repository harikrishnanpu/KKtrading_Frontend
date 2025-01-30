import PropTypes from 'prop-types';
// material-ui
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project-imports
import MainCard from 'components/MainCard';
import Dot from 'components/@extended/Dot';
import Avatar from 'components/@extended/Avatar';
import IconButton from 'components/@extended/IconButton';

import { ThemeMode } from 'config';
import { ImagePath, getImageUrl } from 'utils/getImageUrl';

// dayjs imports & config
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// icons
import { Trash } from 'iconsax-react';

// API
import { deleteStoryComment } from 'api/taskboard';
import { openSnackbar } from 'api/snackbar';

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

export default function StoryComment({ comment, profile, storyId }) {
  const theme = useTheme();

  // Safely handle missing or invalid timestamps
  const timestamp = comment?.time ? dayjs(comment.time) : dayjs();

  // "a minute ago", "2 hours ago", etc.
  const relativeTimeString = timestamp.fromNow();

  // "Jan 28, 2025 4:36 PM" in user’s local time zone
  const localTimeString = timestamp
    .tz(dayjs.tz.guess())
    .format('MMM D, YYYY h:mm A');

  // Calculate how many whole days have passed
  const diffInDays = dayjs().diff(timestamp, 'day');

  // Decide Dot color based on days elapsed
  let dotColor = 'success'; // Green
  if (diffInDays >= 1 && diffInDays < 2) {
    dotColor = 'warning'; // Yellow
  } else if (diffInDays >= 2) {
    dotColor = 'error'; // Red
  }

  // Handle delete comment
  const handleDelete = async () => {
    try {
      await deleteStoryComment(storyId, comment.id);
      openSnackbar({
        open: true,
        message: 'Comment deleted successfully',
        variant: 'alert',
        alert: { color: 'success' }
      });
    } catch (error) {
      console.error('Failed to delete comment:', error);
      openSnackbar({
        open: true,
        message: 'Failed to delete comment',
        variant: 'alert',
        alert: { color: 'error' }
      });
    }
  };

  return (
    <MainCard
      content={false}
      sx={{
        bgcolor: theme.palette.mode === ThemeMode.DARK ? 'secondary.100' : 'secondary.lighter',
        p: 1.5,
        mt: 1.25
      }}
    >
      <Grid container spacing={1}>
        {/* Header: Avatar, Name, Relative Time, Delete Button */}
        <Grid item xs={12}>
          <Grid container wrap="nowrap" alignItems="center" spacing={1}>
            <Grid item>
              <Avatar
                sx={{ width: 24, height: 24 }}
                size="sm"
                alt="User Avatar"
                src={
                  profile?.avatar &&
                  getImageUrl(`${profile.avatar}`, ImagePath.USERS)
                }
              />
            </Grid>
            <Grid item xs zeroMinWidth>
              <Typography variant="subtitle1">
                {profile?.name || 'Unknown User'}
              </Typography>
            </Grid>
            <Grid item>
              <Stack direction="row" spacing={1} alignItems="center">
                {/* Dot color changes based on comment age */}
                <Dot color={dotColor} />
                <Typography variant="caption">{relativeTimeString}</Typography>

                {/* Delete Comment Button */}
                <IconButton color="error" size="small" onClick={handleDelete}>
                  <Trash />
                </IconButton>
              </Stack>
            </Grid>
          </Grid>
        </Grid>

        {/* Comment Text */}
        <Grid item xs={12} sx={{ pt: 1 }}>
          <Typography variant="body2">{comment?.content}</Typography>
        </Grid>

        {/* Footer: Exact Local Date/Time */}
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary">
            {localTimeString}
          </Typography>
        </Grid>
      </Grid>
    </MainCard>
  );
}

StoryComment.propTypes = {
  storyId: PropTypes.string.isRequired,
  comment: PropTypes.shape({
    id: PropTypes.string,
    content: PropTypes.string,
    time: PropTypes.string
  }).isRequired,
  profile: PropTypes.shape({
    name: PropTypes.string,
    avatar: PropTypes.string
  })
};
