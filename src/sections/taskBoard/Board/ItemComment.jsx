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

// third-party
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// icons
import { Trash } from 'iconsax-react';

// API
import { deleteItemComment } from 'api/taskboard';
import { openSnackbar } from 'api/snackbar';

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

export default function ItemComment({ comment, profile, itemId }) {
  const theme = useTheme();


  if(!comment?.content) return null;

  // Safely handle missing timestamps
  const timestamp = comment?.time ? dayjs(comment.time) : dayjs();
  // Relative time (e.g. "now", "a minute ago", "2 hours ago")
  const relativeTimeString = timestamp.fromNow();
  // Local time (e.g., "Jan 28, 2025 4:36 PM")
  const localTimeString = timestamp.tz(dayjs.tz.guess()).format('MMM D, YYYY h:mm A');

  // Delete comment handler
  const handleDeleteComment = async () => {
    try {
      await deleteItemComment(itemId, comment.id);
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
        bgcolor:
          theme.palette.mode === 'dark'
            ? 'secondary.100'
            : 'secondary.lighter',
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
                alt="User Avatar"
                src={profile?.avatar || ''}
              />
            </Grid>
            <Grid item xs zeroMinWidth>
              <Typography variant="subtitle1">
                {profile?.name || 'Unknown User'}
              </Typography>
            </Grid>
            <Grid item>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Dot color="grey" /> {/* or green/yellow/red if you prefer */}
                <Typography variant="caption">{relativeTimeString}</Typography>
                {/* Delete Button */}
                <IconButton color="error" size="small" onClick={handleDeleteComment}>
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
          <Typography variant="caption" color="textSecondary">
            {localTimeString}
          </Typography>
        </Grid>
      </Grid>
    </MainCard>
  );
}

ItemComment.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.string,
    content: PropTypes.string,
    time: PropTypes.string, // your backend must store this if you want to show time
  }),
  profile: PropTypes.shape({
    name: PropTypes.string,
    avatar: PropTypes.string
  }),
  itemId: PropTypes.string
};
