import React, { useEffect, useState } from 'react';

// Material UI Components
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Stack,
  Chip,
  Checkbox,
  FormControlLabel
} from '@mui/material';

import { Add, Edit, Delete } from '@mui/icons-material';

// If you have a custom Axios instance at 'pages/api' that sets baseURL & headers:
import api from 'pages/api';
import useAuth from 'hooks/useAuth';

export default function AllNotificationsPage() {
  const [fetchedNotifications,setFetchedNotifications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]); // store all users for checkboxes
  const {user} = useAuth();

  // --- Fetch notifications ---
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      setFetchedNotifications(res.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // --- Fetch users (for assigning notifications) ---
  const fetchUsers = async () => {
    try {
      // Example: GET /api/users => [{ _id: '...', name: 'Alice' }, ...]
      const res = await api.get('/api/users/notify/all');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  useEffect(()=>{
let filteredNotifications = fetchedNotifications.filter((not) => {
  if (user.isSuper) return true; // show all notifications to super user
  return not.assignTo?.includes(user._id); // only show if assigned to user
});
setNotifications(filteredNotifications)
  },[fetchedNotifications])

  // --------------------------------------------------------------------------
  // STATES FOR ADD, EDIT, AND DELETE DIALOGS
  // --------------------------------------------------------------------------

  // Add Notification Dialog
  const [openAdd, setOpenAdd] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: '',
    extraInfo: '',
    assignTo: [] // array of user IDs
  });

  // Edit Notification Dialog
  const [openEdit, setOpenEdit] = useState(false);
  const [currentNotification, setCurrentNotification] = useState({
    _id: '',
    title: '',
    message: '',
    type: '',
    extraInfo: '',
    assignTo: [] // array of user IDs
  });

  // Delete Notification Dialog
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteNotification, setDeleteNotification] = useState({
    _id: '',
    title: ''
  });

  // --------------------------------------------------------------------------
  // HANDLERS: OPEN/CLOSE DIALOGS
  // --------------------------------------------------------------------------

  // ADD
  const handleOpenAdd = () => {
    setOpenAdd(true);
  };

  const handleCloseAdd = () => {
    setOpenAdd(false);
    // reset form
    setNewNotification({
      title: '',
      message: '',
      type: '',
      extraInfo: '',
      assignTo: []
    });
  };

  // EDIT
  const handleOpenEdit = (notification) => {
    setCurrentNotification({
      _id: notification._id,
      title: notification.title || '',
      message: notification.message || '',
      type: notification.type || '',
      extraInfo: notification.extraInfo || '',
      assignTo: notification.assignTo || []
    });
    setOpenEdit(true);
  };

  const handleCloseEdit = () => {
    setOpenEdit(false);
  };

  // DELETE
  const handleOpenDelete = (notification) => {
    setDeleteNotification({
      _id: notification._id,
      title: notification.title
    });
    setOpenDelete(true);
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
  };

  // --------------------------------------------------------------------------
  // CHECKBOX HANDLERS FOR "ASSIGN TO"
  // --------------------------------------------------------------------------

  // For the Add Notification
  const handleAddCheckboxChange = (userId) => {
    setNewNotification((prev) => {
      const { assignTo } = prev;
      if (assignTo.includes(userId)) {
        // If user already selected, remove it
        return { ...prev, assignTo: assignTo.filter((id) => id !== userId) };
      } else {
        // Otherwise, add it
        return { ...prev, assignTo: [...assignTo, userId] };
      }
    });
  };

  // For the Edit Notification
  const handleEditCheckboxChange = (userId) => {
    setCurrentNotification((prev) => {
      const { assignTo } = prev;
      if (assignTo.includes(userId)) {
        // Remove it
        return { ...prev, assignTo: assignTo.filter((id) => id !== userId) };
      } else {
        // Add it
        return { ...prev, assignTo: [...assignTo, userId] };
      }
    });
  };

  // --------------------------------------------------------------------------
  // CRUD OPERATIONS
  // --------------------------------------------------------------------------

  // CREATE
  const handleAddNotification = async () => {
    try {
      const payload = {
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        extraInfo: newNotification.extraInfo,
        assignTo: newNotification.assignTo,
        assignedBy: user._id
      };

      await api.post('/api/notifications', payload);

      // Refresh data
      fetchNotifications();
      // Close modal & reset form
      handleCloseAdd();
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  // UPDATE
  const handleEditNotification = async () => {
    try {
      const payload = {
        title: currentNotification.title,
        message: currentNotification.message,
        type: currentNotification.type,
        extraInfo: currentNotification.extraInfo,
        assignTo: currentNotification.assignTo
      };

      await api.put(`/api/notifications/${currentNotification._id}`, payload);

      fetchNotifications();
      handleCloseEdit();
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  // DELETE
  const handleDeleteNotification = async () => {
    try {
      await api.delete(`/api/notifications/${deleteNotification._id}`);

      fetchNotifications();
      handleCloseDelete();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // --------------------------------------------------------------------------
  // HELPER: Get Display Name for a user ID
  // --------------------------------------------------------------------------
  const getUserName = (userId) => {
    const user = users.find((u) => u._id === userId);
    return user ? user.name : userId; // fallback to the ID if user not found
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        All Notifications
      </Typography>
      {user.isSuper && <Button
        variant="outlined"
        startIcon={<Add />}
        onClick={handleOpenAdd}
        sx={{ mb: 2 }}
      >
        Add Notification
      </Button>}

      {/* Notifications Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Extra Info</TableCell>
              <TableCell>Assign To</TableCell>
              {user.isSuper && <TableCell>Actions</TableCell> }
            </TableRow>
          </TableHead>
          <TableBody>
            {notifications.map((notification) => (
              <TableRow key={notification._id}>
                <TableCell>{notification.title}</TableCell>
                <TableCell>{notification.message}</TableCell>
                <TableCell>{notification.type}</TableCell>
                <TableCell>{notification.extraInfo}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {notification.assignTo && notification.assignTo.length > 0
                      ? notification.assignTo.map((userId) => (
                          <Chip
                            key={userId}
                            label={getUserName(userId)}
                            size="small"
                          />
                        ))
                      : '—'}
                  </Stack>
                </TableCell>
                 {user.isSuper && <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenEdit(notification)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleOpenDelete(notification)}
                    >
                      <Delete />
                    </IconButton>
                  </Stack>
                </TableCell> }
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ----------------------------------------------------------------
          ADD NOTIFICATION DIALOG
      ---------------------------------------------------------------- */}
      <Dialog open={openAdd} onClose={handleCloseAdd} fullWidth maxWidth="sm">
        <DialogTitle>Add Notification</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Title"
              value={newNotification.title}
              onChange={(e) =>
                setNewNotification((prev) => ({ ...prev, title: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Message"
              value={newNotification.message}
              onChange={(e) =>
                setNewNotification((prev) => ({ ...prev, message: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Type"
              value={newNotification.type}
              onChange={(e) =>
                setNewNotification((prev) => ({ ...prev, type: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Extra Info"
              value={newNotification.extraInfo}
              onChange={(e) =>
                setNewNotification((prev) => ({
                  ...prev,
                  extraInfo: e.target.value
                }))
              }
              fullWidth
            />

            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              Assign To:
            </Typography>
            {users.map((user) => (
              <FormControlLabel
                key={user._id}
                control={
                  <Checkbox
                    checked={newNotification.assignTo.includes(user._id)}
                    onChange={() => handleAddCheckboxChange(user._id)}
                  />
                }
                label={user.name}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdd}>Cancel</Button>
          <Button variant="outlined" onClick={handleAddNotification}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* ----------------------------------------------------------------
          EDIT NOTIFICATION DIALOG
      ---------------------------------------------------------------- */}
      <Dialog open={openEdit} onClose={handleCloseEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit Notification</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Title"
              value={currentNotification.title}
              onChange={(e) =>
                setCurrentNotification((prev) => ({
                  ...prev,
                  title: e.target.value
                }))
              }
              fullWidth
            />
            <TextField
              label="Message"
              value={currentNotification.message}
              onChange={(e) =>
                setCurrentNotification((prev) => ({
                  ...prev,
                  message: e.target.value
                }))
              }
              fullWidth
            />
            <TextField
              label="Type"
              value={currentNotification.type}
              onChange={(e) =>
                setCurrentNotification((prev) => ({
                  ...prev,
                  type: e.target.value
                }))
              }
              fullWidth
            />
            <TextField
              label="Extra Info"
              value={currentNotification.extraInfo}
              onChange={(e) =>
                setCurrentNotification((prev) => ({
                  ...prev,
                  extraInfo: e.target.value
                }))
              }
              fullWidth
            />

            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              Assign To:
            </Typography>
            {users.map((user) => (
              <FormControlLabel
                key={user._id}
                control={
                  <Checkbox
                    checked={currentNotification.assignTo.includes(user._id)}
                    onChange={() => handleEditCheckboxChange(user._id)}
                  />
                }
                label={user.name}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancel</Button>
          <Button variant="outlined" onClick={handleEditNotification}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ----------------------------------------------------------------
          DELETE NOTIFICATION DIALOG
      ---------------------------------------------------------------- */}
      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle>Delete Notification</DialogTitle>
        <DialogContent dividers>
          Are you sure you want to delete the notification "
          <strong>{deleteNotification.title}</strong>"?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete}>Cancel</Button>
          <Button variant="outlined" color="error" onClick={handleDeleteNotification}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
