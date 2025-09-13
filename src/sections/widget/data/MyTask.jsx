import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

// project-imports
import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import MoreIcon from 'components/@extended/MoreIcon';

import { Folder, Send2, TickCircle } from 'iconsax-react';

// ===========================|| DATA WIDGET - MY TASK ||=========================== //

export default function MyTask({ leaveRes, userTasks }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  console.log(leaveRes, userTasks);

  // Combine feed (leave + tasks)
  const feedItems = [
    ...(leaveRes?.pendingLeaves || []).map((lv) => ({
      id: lv._id,
      title: `Leave Request: ${lv.reason}`,
      subText: `${new Date(lv.startDate).toDateString()} → ${new Date(lv.endDate).toDateString()}`,
      type: 'leave-pending',
      status: lv.status
    })),
    ...(leaveRes?.approvedLeaves || []).map((lv) => ({
      id: lv._id,
      title: `Upcoming Leave: ${lv.reason}`,
      subText: `${new Date(lv.startDate).toDateString()} → ${new Date(lv.endDate).toDateString()}`,
      type: 'leave-approved',
      status: lv.status
    })),
    ...(userTasks || []).map((task) => ({
      id: task.id,
      title: task.title,
      subText: `Due Date: ${task.dueDate ? new Date(task.dueDate).toDateString() : 'No due date'}`,
      type: 'task',
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status
    }))
  ];

  return (
    <MainCard content={false}>
      <Box sx={{ p: 3, pb: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="h5">My Feed</Typography>
          <IconButton
            color="secondary"
            id="wallet-button"
            aria-controls={open ? 'wallet-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleClick}
          >
            <MoreIcon />
          </IconButton>
          <Menu
            id="wallet-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{ 'aria-labelledby': 'wallet-button', sx: { p: 1.25, minWidth: 150 } }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <ListItemButton onClick={handleClose}>Today</ListItemButton>
            <ListItemButton onClick={handleClose}>Weekly</ListItemButton>
            <ListItemButton onClick={handleClose}>Monthly</ListItemButton>
          </Menu>
        </Stack>
      </Box>

      <List sx={{ '& .MuiListItem-root': { pl: 3 } }}>
        {feedItems.length === 0 ? (
          <Typography sx={{ px: 3, py: 2, color: 'text.secondary' }}>No feeds available</Typography>
        ) : (
          feedItems.map((item,idx) => (
            <ListItem
              key={item.id}
              divider={feedItems.length > 1 && idx < feedItems.length - 1}
              secondaryAction={
                <IconButton aria-label="mark-done" color={item.type == 'task' || item.type == 'leave-pending' ? 'secondary' : 'success'}>
                  <TickCircle />
                </IconButton>
              }
            >
              <Stack>
                <ListItemText
                  primary={<Typography variant="subtitle1">{item.title}</Typography>}
                  secondary={<Typography variant="body2" color="text.secondary">{item.subText}</Typography>}
                />
                <Stack spacing={0.5} direction="row" alignItems="center">
                  {item.type == 'task' || item.type == 'leave-pending' ? (
                    <Send2 size={12} />
                  ) : (
                    <Folder size={12} />
                  )}
                  <Typography>{item.status}</Typography>
                  <Chip
                    label={item.type == 'task' ? item.priority : item.status}
                    color={item.type == 'task' || item.type == 'leave-pending' ? 'error' : 'success'}
                    variant="filled"
                    size="small"
                  />
                </Stack>
              </Stack>
            </ListItem>
          ))
        )}
      </List>
    </MainCard>
  );
}
