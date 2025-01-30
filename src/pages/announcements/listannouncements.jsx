import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton
} from '@mui/material';
import { Trash as DeleteIcon, Edit2 as EditIcon } from 'iconsax-react';
import useAuth from 'hooks/useAuth';
import api from 'pages/api'; // Ensure this path is correct based on your project structure

// -------------- HELPER: Upload to Cloudinary (optional) -------------- //
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  // Replace with your own upload preset
  formData.append('upload_preset', 'ml_default');
  // Replace with your own Cloud name
  const url = 'https://api.cloudinary.com/v1_1/dqniuczkg/image/upload';

  const res = await fetch(url, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Failed to upload file to Cloudinary');
  const data = await res.json();
  return data.secure_url;
}

// -------------- COMPONENT -------------- //
export default function AnnouncementsPage() {
  // =========================================================================
  // 1. STATE
  // =========================================================================
  const [announcements, setAnnouncements] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [statusLabel, setStatusLabel] = useState('Info');
  const [time, setTime] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [buttons, setButtons] = useState([]);
  const [newButton, setNewButton] = useState({ text: '', color: 'primary', url: '' });

  // Auth user
  const { user } = useAuth();

  // =========================================================================
  // 2. EFFECTS
  // =========================================================================
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // =========================================================================
  // 3. FETCH ANNOUNCEMENTS
  // =========================================================================
  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/api/announcements');
      setAnnouncements(response.data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  // =========================================================================
  // 4. DIALOG HANDLERS
  // =========================================================================
  const handleOpenAdd = () => {
    clearForm();
    setEditId(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (announcement) => {
    setEditId(announcement._id);
    setTitle(announcement.title);
    setMessage(announcement.message);

    // Convert time to local datetime string for <input type="datetime-local" />
    const localTime = announcement.time
      ? new Date(
          new Date(announcement.time).getTime() - new Date().getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16)
      : '';
    setTime(localTime);

    setStatusLabel(announcement.status?.label || 'Info');
    setAttachments(announcement.attachments || []);
    setButtons(announcement.buttons || []);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    clearForm();
  };

  // =========================================================================
  // 5. CRUD HANDLERS
  // =========================================================================

  // CREATE or UPDATE announcement
  const handleSave = async () => {
    try {
      // Basic validation
      if (!title.trim() || !message.trim()) {
        alert('Title and Message are required.');
        return;
      }

      const payload = {
        title,
        message,
        time: time ? new Date(time).toISOString() : null,
        status: {
          label: statusLabel,
          color: mapStatusToColor(statusLabel)
        },
        submitted: user?.name || 'Anonymous',
        attachments, // array of image URLs
        buttons
      };

      if (editId) {
        // Update existing announcement
        await api.put(`/api/announcements/${editId}`, payload);
      } else {
        // Create new announcement
        await api.post('/api/announcements', payload);
      }

      // Refresh list & close dialog
      fetchAnnouncements();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Failed to save announcement. Please try again.');
    }
  };

  // DELETE announcement
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await api.delete(`/api/announcements/${id}`);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement. Please try again.');
    }
  };

  // =========================================================================
  // 6. ATTACHMENTS HANDLERS
  // =========================================================================

  // Upload multiple images to Cloudinary
  const handleAttachmentUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadedAttachments = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const url = await uploadToCloudinary(file);
        uploadedAttachments.push(url);
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert('Failed to upload some images. Please try again.');
      }
    }

    // Append new images to the existing array
    setAttachments((prev) => [...prev, ...uploadedAttachments]);
  };

  // Remove a single attachment by index
  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // =========================================================================
  // 7. BUTTONS HANDLERS
  // =========================================================================

  // Add a new button to the buttons array
  const handleAddButton = () => {
    if (!newButton.text.trim() || !newButton.url.trim()) {
      alert('Button text and URL are required.');
      return;
    }
    setButtons((prev) => [...prev, newButton]);
    setNewButton({ text: '', color: 'primary', url: '' });
  };

  // Remove a specific button by index
  const handleRemoveButton = (index) => {
    setButtons((prev) => prev.filter((_, i) => i !== index));
  };

  // Update an existing button's field
  const handleChangeButton = (index, field, value) => {
    setButtons((prev) =>
      prev.map((btn, i) => (i === index ? { ...btn, [field]: value } : btn))
    );
  };

  // =========================================================================
  // 8. UTILITY FUNCTIONS
  // =========================================================================

  const clearForm = () => {
    setEditId(null);
    setTitle('');
    setMessage('');
    setTime('');
    setStatusLabel('Info');
    setAttachments([]);
    setButtons([]);
    setNewButton({ text: '', color: 'primary', url: '' });
  };

  const mapStatusToColor = (label) => {
    switch (label) {
      case 'New Feature':
        return 'success';
      case 'Meeting':
        return 'warning';
      case 'Improvement':
        return 'primary';
      default:
        return 'info';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Announcements
      </Typography>

      <Button variant="outlined" onClick={handleOpenAdd} sx={{ mb: 2 }}>
        Add Announcement
      </Button>

      {/* TABLE */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Attachments</TableCell>
            <TableCell>Buttons</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {announcements.map((ann) => (
            <TableRow key={ann._id}>
              <TableCell>{ann.title}</TableCell>
              <TableCell>{ann.message}</TableCell>
              <TableCell>
                {ann.time
                  ? new Date(ann.time).toLocaleString()
                  : 'No specific time'}
              </TableCell>
              <TableCell>
                {/* Show each attachment as an image */}
                {ann.attachments && ann.attachments.length > 0 ? (
                  ann.attachments.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="attachment"
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: 'cover',
                        marginRight: 4,
                        borderRadius: 4
                      }}
                    />
                  ))
                ) : (
                  <Typography variant="body2">No attachments</Typography>
                )}
              </TableCell>
              <TableCell>
                {/* Render each button */}
                {ann.buttons && ann.buttons.length > 0 ? (
                  ann.buttons.map((btn, idx) => (
                    <Button
                      key={idx}
                      variant="outlined"
                      color={btn.color}
                      onClick={() => window.open(btn.url, '_blank')}
                      sx={{ mr: 1, mb: 1 }}
                    >
                      {btn.text}
                    </Button>
                  ))
                ) : (
                  <Typography variant="body2">No buttons</Typography>
                )}
              </TableCell>
              <TableCell>
                <Button
                  startIcon={<EditIcon size="20" color="currentColor" />}
                  onClick={() => handleOpenEdit(ann)}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button
                  color="error"
                  startIcon={<DeleteIcon size="20" color="currentColor" />}
                  onClick={() => handleDelete(ann._id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {announcements.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No announcements found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* DIALOG */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editId ? 'Edit Announcement' : 'Add Announcement'}</DialogTitle>

        <DialogContent>
          {/* Title */}
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* Message */}
          <TextField
            label="Message"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />

          {/* Time */}
          <TextField
            label="Time"
            type="datetime-local"
            fullWidth
            margin="normal"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            InputLabelProps={{
              shrink: true
            }}
          />

          {/* Status */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={statusLabel}
              onChange={(e) => setStatusLabel(e.target.value)}
            >
              <MenuItem value="Info">Info</MenuItem>
              <MenuItem value="New Feature">New Feature</MenuItem>
              <MenuItem value="Meeting">Meeting</MenuItem>
              <MenuItem value="Improvement">Improvement</MenuItem>
            </Select>
          </FormControl>

          {/* Attachments */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Attachments (Images)
            </Typography>
            <Button variant="outlined" component="label">
              Select Files
              <input
                hidden
                accept="image/*"
                type="file"
                multiple
                onChange={handleAttachmentUpload}
              />
            </Button>

            {/* Show attachments in a grid for previews/removal */}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {attachments.map((url, idx) => (
                <Grid item key={idx}>
                  <Box sx={{ position: 'relative' }}>
                    <img
                      src={url}
                      alt="attachment-preview"
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: 'cover',
                        borderRadius: 4
                      }}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveAttachment(idx)}
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        backgroundColor: 'white',
                        '&:hover': {
                          backgroundColor: 'white'
                        }
                      }}
                    >
                      <DeleteIcon size="16" />
                    </IconButton>
                  </Box>
                </Grid>
              ))}

              {attachments.length === 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  No attachments added.
                </Typography>
              )}
            </Grid>
          </Box>

          {/* Buttons Section */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Buttons
            </Typography>

            {/* Existing Buttons */}
            {buttons.map((btn, idx) => (
              <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }} key={idx}>
                <Grid item xs={4}>
                  <TextField
                    label="Text"
                    value={btn.text}
                    onChange={(e) => handleChangeButton(idx, 'text', e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={3}>
                  <FormControl fullWidth>
                    <InputLabel>Color</InputLabel>
                    <Select
                      label="Color"
                      value={btn.color}
                      onChange={(e) => handleChangeButton(idx, 'color', e.target.value)}
                    >
                      <MenuItem value="primary">Primary</MenuItem>
                      <MenuItem value="secondary">Secondary</MenuItem>
                      <MenuItem value="success">Success</MenuItem>
                      <MenuItem value="error">Error</MenuItem>
                      <MenuItem value="info">Info</MenuItem>
                      <MenuItem value="warning">Warning</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="URL"
                    value={btn.url}
                    onChange={(e) => handleChangeButton(idx, 'url', e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={1}>
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveButton(idx)}
                    aria-label="remove button"
                  >
                    <DeleteIcon size="16" />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            {/* New Button Form */}
            <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Grid item xs={4}>
                <TextField
                  label="Text"
                  value={newButton.text}
                  onChange={(e) => setNewButton({ ...newButton, text: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={3}>
                <FormControl fullWidth>
                  <InputLabel>Color</InputLabel>
                  <Select
                    label="Color"
                    value={newButton.color}
                    onChange={(e) => setNewButton({ ...newButton, color: e.target.value })}
                  >
                    <MenuItem value="primary">Primary</MenuItem>
                    <MenuItem value="secondary">Secondary</MenuItem>
                    <MenuItem value="success">Success</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="URL"
                  value={newButton.url}
                  onChange={(e) => setNewButton({ ...newButton, url: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={1}>
                <IconButton color="primary" onClick={handleAddButton} aria-label="add button">
                  <EditIcon size="16" />
                </IconButton>
              </Grid>
            </Grid>

            {buttons.length === 0 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                No buttons added.
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="outlined" onClick={handleSave}>
            {editId ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
