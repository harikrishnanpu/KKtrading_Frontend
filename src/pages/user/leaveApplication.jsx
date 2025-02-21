import React, { useState, useEffect, forwardRef } from 'react';
import api from 'pages/api';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  Typography,
  Snackbar,
  Alert,
  Slide,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import useAuth from 'hooks/useAuth';

// Slide transition for Dialog (coming from bottom)
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CombinedLeavesPage = () => {

    const {user: userInfo } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');

  // State for the "Add/Edit" dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [editLeaveId, setEditLeaveId] = useState(null);

  // Form fields
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Snackbar for success notifications
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch leaves on component mount
  useEffect(() => {
    fetchLeaves();
  }, []);

  // ------------------ API Calls ------------------
  const fetchLeaves = async () => {
    try {
      const { data } = await api.get('/api/leaves');
      setLeaves(data);
    } catch (err) {
      setError('Failed to fetch leaves.');
    }
  };

  const approveLeave = async (id) => {
    try {
      await api.put(`/api/leaves/${id}/approve`);
      fetchLeaves();
    } catch (err) {
      setError('Failed to approve leave.');
    }
  };

  const rejectLeave = async (id) => {
    try {
      await api.put(`/api/leaves/${id}/reject`);
      fetchLeaves();
    } catch (err) {
      setError('Failed to reject leave.');
    }
  };

  const deleteLeave = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave application?')) return;
    try {
      const { data } = await api.delete(`/api/leaves/${id}`);
      setDeleteMessage(data.message || 'Leave deleted successfully.');
      fetchLeaves();
      setTimeout(() => setDeleteMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete leave application.');
    }
  };

  const generatePDF = async (leave) => {
    try {
      // Prepare formData for backend
      const formData = {
        userName: leave.userName,
        userId: leave.userId,
        reason: leave.reason,
        startDate: leave.startDate,
        endDate: leave.endDate,
        status: leave.status,
        _id: leave._id,
      };

      // Make a request to the backend PDF generation endpoint
      const response = await api.post('/api/print/generate-leave-application-pdf', formData, {
        responseType: 'text', // Expect HTML response
      });

      const htmlContent = response.data; // HTML content returned from backend

      // Open the HTML content in a new popup window
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        alert('Popup blocked! Please allow popups for this website.');
      }
    } catch (error) {
      console.error('Error generating leave application PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // ------------------ Dialog Handlers ------------------
  const openAddDialog = () => {
    setDialogMode('add');
    setEditLeaveId(null);
    setReason('');
    setStartDate('');
    setEndDate('');
    setError('');
    setOpenDialog(true);
  };

  const openEditDialog = (leave) => {
    setDialogMode('edit');
    setEditLeaveId(leave._id);
    setReason(leave.reason);
    setStartDate(leave.startDate.split('T')[0]);
    setEndDate(leave.endDate.split('T')[0]);
    setError('');
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
  };

  // ------------------ Submit Handlers ------------------
  const handleSubmit = async () => {
    // Validate fields
    if (!reason || !startDate || !endDate) {
      setError('Please fill all fields.');
      return;
    }
    setError('');

    if (dialogMode === 'add') {
      // Add (POST)
      try {
        await api.post('/api/leaves', {
          userId: userInfo?._id,
          userName: userInfo?.name,
          reason,
          startDate,
          endDate,
        });
        setSuccessMessage('Leave application submitted successfully!');
        closeDialog();
        fetchLeaves();
      } catch (err) {
        setError('Failed to submit leave application.');
      }
    } else {
      // Edit (PUT)
      try {
        await api.put(`/api/leaves/${editLeaveId}`, {
          reason,
          startDate,
          endDate,
        });
        setSuccessMessage('Leave application updated successfully!');
        closeDialog();
        fetchLeaves();
      } catch (err) {
        setError('Failed to update leave application.');
      }
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      {/* Header */}

      {/* Error and Delete Message */}
      {error && (
        <Alert severity="error" style={{ marginBottom: 8 }}>
          {error}
        </Alert>
      )}
      {deleteMessage && (
        <Alert severity="warning" style={{ marginBottom: 8 }}>
          {deleteMessage}
        </Alert>
      )}

      {/* Add New Leave Button */}
      <Button variant="outlined" color="error" onClick={openAddDialog} style={{ marginBottom: 16 }}>
        Add New Leave
      </Button>

      {/* Leaves Table */}
      <TableContainer component={Paper}>
        <Table size="small" aria-label="leaves table">
          <TableHead>
            <TableRow style={{ backgroundColor: '#ffe5e5' }}>
              <TableCell style={{ fontWeight: 'bold', color: '#d32f2f' }}>Name</TableCell>
              <TableCell style={{ fontWeight: 'bold', color: '#d32f2f' }}>Reason</TableCell>
              <TableCell style={{ fontWeight: 'bold', color: '#d32f2f' }}>Start Date</TableCell>
              <TableCell style={{ fontWeight: 'bold', color: '#d32f2f' }}>End Date</TableCell>
              <TableCell style={{ fontWeight: 'bold', color: '#d32f2f' }}>Status</TableCell>
              <TableCell style={{ fontWeight: 'bold', color: '#d32f2f', textAlign: 'center' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaves.map((leave) => (
              <TableRow key={leave._id} hover>
                <TableCell>{leave.userName}</TableCell>
                <TableCell style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {leave.reason}
                </TableCell>
                <TableCell>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>
                  {leave.status === 'Pending' && (
                    <span style={{ color: '#ff8f00' }}>Pending</span>
                  )}
                  {leave.status === 'Approved' && (
                    <span style={{ color: '#d32f2f' }}>Approved</span>
                  )}
                  {leave.status === 'Rejected' && (
                    <span style={{ color: '#d32f2f' }}>Rejected</span>
                  )}
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  {/* Approve / Reject only if admin and status is pending */}
                  {userInfo?.isAdmin && leave.status === 'Pending' && (
                    <>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        style={{ marginRight: 4 }}
                        onClick={() => approveLeave(leave._id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        style={{ marginRight: 4 }}
                        onClick={() => rejectLeave(leave._id)}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    style={{ marginRight: 4 }}
                    onClick={() => openEditDialog(leave)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    style={{ marginRight: 4 }}
                    onClick={() => deleteLeave(leave._id)}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => generatePDF(leave)}
                  >
                    <i className="fa fa-file" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog (Slides from bottom) */}
      <Dialog
        open={openDialog}
        TransitionComponent={Transition}
        onClose={closeDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {dialogMode === 'add' ? 'Add Leave Application' : 'Edit Leave Application'}
          <IconButton
            aria-label="close"
            onClick={closeDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Reason"
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            variant="outlined"
            fullWidth
            margin="normal"
            size="small"
          />
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            variant="outlined"
            fullWidth
            margin="normal"
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            variant="outlined"
            fullWidth
            margin="normal"
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="inherit">
            Cancel
          </Button>
          <Button variant="outlined" color="error" onClick={handleSubmit}>
            {dialogMode === 'add' ? 'Submit' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CombinedLeavesPage;
