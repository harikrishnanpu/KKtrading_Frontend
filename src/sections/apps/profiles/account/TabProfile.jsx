import React, { useState, useEffect, forwardRef } from 'react';

// MUI Imports
import {
  Tabs,
  Tab,
  Box,
  Typography,
  Grid,
  Divider,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Snackbar,
  Alert,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  IconButton
} from '@mui/material';

import useMediaQuery from '@mui/material/useMediaQuery';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';

// Icons
import { CallCalling, Gps, Sms } from 'iconsax-react';
import CloseIcon from '@mui/icons-material/Close';

// Project Imports
import useAuth from 'hooks/useAuth';
import MainCard from 'components/MainCard';
import Avatar from 'components/@extended/Avatar';

// Assets
import api from 'pages/api';

// -------------------------- Helper for Accessibility --------------------------
function a11yProps(index) {
  return {
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`
  };
}

// -------------------------- TabPanel Component --------------------------
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

// -------------------------- Slide Transition for Dialog --------------------------
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// ==============================|| PROFILE TABS PAGE ||============================== //
export default function ProfileTabsPage() {
  const { user } = useAuth();

  // Tab state
  const [value, setValue] = useState(0);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  // Layout responsiveness
  const matchDownMD = useMediaQuery((theme) => theme.breakpoints.down('md'));

  // ----------------- Data States -----------------
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [bills, setBills] = useState([]);
  const [leaves, setLeaves] = useState([]);

  // ----------------- Leave Dialog States -----------------
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [editLeaveId, setEditLeaveId] = useState(null);
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');

  // ----------------- Fetch Data (User, Bills, Leaves) -----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?._id) {
          setLoading(false);
          return;
        }
        // 1) Fetch user data by ID
        const userRes = await api.get(`/api/users/${user._id}`);
        const fetchedUser = userRes.data;
        setUserData(fetchedUser);

        // 2) Fetch bills (where 'salesmanName' = user's name)
        const billsRes = await api.get(
          `/api/billing/bill/profile?salesmanName=${encodeURIComponent(fetchedUser.name)}`
        );
        setBills(billsRes.data);

        // 3) Fetch leaves belonging to this user
        const leavesRes = await api.get(`/api/leaves?userId=${user._id}`);
        setLeaves(leavesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // ----------------- Leave Action Handlers -----------------
  const approveLeave = async (id) => {
    try {
      await api.put(`/api/leaves/${id}/approve`);
      const leavesRes = await api.get(`/api/leaves?userId=${user._id}`);
      setLeaves(leavesRes.data);
    } catch (err) {
      setErrorMessage('Failed to approve leave.');
    }
  };

  const rejectLeave = async (id) => {
    try {
      await api.put(`/api/leaves/${id}/reject`);
      const leavesRes = await api.get(`/api/leaves?userId=${user._id}`);
      setLeaves(leavesRes.data);
    } catch (err) {
      setErrorMessage('Failed to reject leave.');
    }
  };

  const deleteLeave = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave application?')) return;
    try {
      const { data } = await api.delete(`/api/leaves/${id}`);
      setDeleteMessage(data.message || 'Leave deleted successfully.');
      const leavesRes = await api.get(`/api/leaves?userId=${user._id}`);
      setLeaves(leavesRes.data);
      setTimeout(() => setDeleteMessage(''), 3000);
    } catch (err) {
      setErrorMessage('Failed to delete leave application.');
    }
  };

  const generatePDF = async (leave) => {
    try {
      const formData = {
        userName: leave.userName,
        userId: leave.userId,
        reason: leave.reason,
        startDate: leave.startDate,
        endDate: leave.endDate,
        status: leave.status,
        _id: leave._id
      };
      const response = await api.post('/api/print/generate-leave-application-pdf', formData, {
        responseType: 'text'
      });
      const htmlContent = response.data;
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        alert('Popup blocked! Please allow popups for this website.');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // ----------------- Dialog Handlers -----------------
  const openAddDialog = () => {
    setDialogMode('add');
    setEditLeaveId(null);
    setReason('');
    setStartDate('');
    setEndDate('');
    setErrorMessage('');
    setOpenDialog(true);
  };

  const openEditDialog = (leave) => {
    setDialogMode('edit');
    setEditLeaveId(leave._id);
    setReason(leave.reason);
    setStartDate(leave.startDate.split('T')[0]);
    setEndDate(leave.endDate.split('T')[0]);
    setErrorMessage('');
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmitLeave = async () => {
    if (!reason || !startDate || !endDate) {
      setErrorMessage('Please fill all fields.');
      return;
    }
    setErrorMessage('');
    try {
      if (dialogMode === 'add') {
        await api.post('/api/leaves', {
          userId: user._id,
          userName: userData?.name,
          reason,
          startDate,
          endDate
        });
        setSuccessMessage('Leave application submitted successfully!');
      } else {
        await api.put(`/api/leaves/${editLeaveId}`, {
          reason,
          startDate,
          endDate
        });
        setSuccessMessage('Leave application updated successfully!');
      }
      closeDialog();
      const leavesRes = await api.get(`/api/leaves?userId=${user._id}`);
      setLeaves(leavesRes.data);
    } catch (err) {
      setErrorMessage(
        dialogMode === 'add'
          ? 'Failed to submit leave application.'
          : 'Failed to update leave application.'
      );
    }
  };

  if (loading) {
    return <Typography sx={{ p: 2 }}>Loading...</Typography>;
  }
  if (!userData) {
    return <Typography sx={{ p: 2 }}>No user data found.</Typography>;
  }

  // Destructure fields from user data
  const { name, email, contactNumber, personal_phone, personal_email, location, role, avatar } = userData;

  return (
    <div>
      {/* TOP: Profile Summary Card */}
      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={5} md={4} xl={3}>
          <MainCard>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Stack spacing={2.5} alignItems="center" mt={2}>
                  <Avatar alt={name || 'User Avatar'} size="xl" src={avatar} />
                  <Stack spacing={0.5} alignItems="center">
                    <Typography variant="h5">{name}</Typography>
                    <Typography color="secondary">{role || 'No Role'}</Typography>
                  </Stack>
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              {/* Contact Info */}
              <Grid item xs={12}>
                <List
                  component="nav"
                  aria-label="contact info"
                  sx={{ py: 0, '& .MuiListItem-root': { p: 0, py: 1 } }}
                >
                  <ListItem>
                    <ListItemIcon>
                      <Sms size={18} />
                    </ListItemIcon>
                    <ListItemSecondaryAction>
                      <Typography align="right">{personal_email || email}</Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CallCalling size={18} />
                    </ListItemIcon>
                    <ListItemSecondaryAction>
                      <Typography align="right">
                        {personal_phone || contactNumber || 'N/A'}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {location && (
                    <ListItem>
                      <ListItemIcon>
                        <Gps size={18} />
                      </ListItemIcon>
                      <ListItemSecondaryAction>
                        <Typography align="right">{location}</Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                  )}
                </List>
              </Grid>
            </Grid>
          </MainCard>
        </Grid>

        {/* Bills Info */}
        <Grid item xs={12} sm={7} md={8} xl={9}>
          <MainCard title="Created Estimates (As Salesman)">
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Total Bills: {bills.length}
            </Typography>
            {bills.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice No.</TableCell>
                      <TableCell>Customer Name</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bills.map((bill) => (
                      <TableRow key={bill._id}>
                        <TableCell>{bill.invoiceNo}</TableCell>
                        <TableCell>{bill.customerName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>No bills found.</Typography>
            )}
          </MainCard>
        </Grid>
      </Grid>

      {/* TABS */}
      <MainCard>
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Personal Info" {...a11yProps(0)} />
          <Tab label="Payment" {...a11yProps(1)} />
          <Tab label="Password" {...a11yProps(2)} />
          <Tab label="Settings" {...a11yProps(3)} />
          <Tab label="Leaves" {...a11yProps(4)} />
        </Tabs>

        {/* PERSONAL INFO TAB */}
        <TabPanel value={value} index={0}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Personal Details
          </Typography>
          <List sx={{ py: 0 }}>
            <ListItem divider={!matchDownMD}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={0.5}>
                    <Typography color="secondary">Full Name</Typography>
                    <Typography>{name}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={0.5}>
                    <Typography color="secondary">Email</Typography>
                    <Typography>{email}</Typography>
                  </Stack>
                </Grid>
              </Grid>
            </ListItem>
            <ListItem divider={!matchDownMD}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={0.5}>
                    <Typography color="secondary">Phone</Typography>
                    <Typography>{contactNumber || personal_phone || 'N/A'}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={0.5}>
                    <Typography color="secondary">Role</Typography>
                    <Typography>{role}</Typography>
                  </Stack>
                </Grid>
              </Grid>
            </ListItem>
            <ListItem>
              <Stack spacing={0.5}>
                <Typography color="secondary">Location</Typography>
                <Typography>{location || 'N/A'}</Typography>
              </Stack>
            </ListItem>
          </List>
        </TabPanel>

        {/* PAYMENT TAB (Placeholder) */}
        <TabPanel value={value} index={1}>
          <Typography variant="h5">Payment Info</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Payment-related content goes here.
          </Typography>
        </TabPanel>

        {/* PASSWORD TAB (Placeholder) */}
        <TabPanel value={value} index={2}>
          <Typography variant="h5">Change Password</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Password change form goes here.
          </Typography>
        </TabPanel>

        {/* SETTINGS TAB (Placeholder) */}
        <TabPanel value={value} index={3}>
          <Typography variant="h5">Settings</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            User-specific settings go here.
          </Typography>
        </TabPanel>

        {/* LEAVES TAB */}
        <TabPanel value={value} index={4}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h5">Your Leaves</Typography>
            <Button variant="outlined" color="error" onClick={openAddDialog}>
              Add Leave
            </Button>
          </Stack>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Total Leaves: {leaves.length}
          </Typography>
          {leaves.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow style={{ backgroundColor: '#ffe5e5' }}>
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
                      <TableCell>{leave.reason}</TableCell>
                      <TableCell>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {leave.status === 'Pending' && <span style={{ color: '#ff8f00' }}>Pending</span>}
                        {leave.status === 'Approved' && <span style={{ color: '#d32f2f' }}>Approved</span>}
                        {leave.status === 'Rejected' && <span style={{ color: '#d32f2f' }}>Rejected</span>}
                      </TableCell>
                      <TableCell style={{ textAlign: 'center' }}>
                        {user?.isAdmin && leave.status === 'Pending' && (
                          <>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => approveLeave(leave._id)}
                              sx={{ mr: 1 }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => rejectLeave(leave._id)}
                              sx={{ mr: 1 }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => openEditDialog(leave)}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => deleteLeave(leave._id)}
                          sx={{ mr: 1 }}
                        >
                          Delete
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => generatePDF(leave)}
                        >
                          Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No leaves found.</Typography>
          )}
        </TabPanel>
      </MainCard>

      {/* ----------------- Add/Edit Leave Dialog ----------------- */}
      <Dialog
        open={openDialog}
        onClose={closeDialog}
        TransitionComponent={Transition}
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
              color: (theme) => theme.palette.grey[500]
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {errorMessage}
            </Alert>
          )}
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
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            variant="outlined"
            fullWidth
            margin="normal"
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            variant="outlined"
            fullWidth
            margin="normal"
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} color="inherit">
            Cancel
          </Button>
          <Button variant="outlined" color="error" onClick={handleSubmitLeave}>
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

      {/* Delete/Error Snackbar (optional) */}
      {deleteMessage && (
        <Snackbar
          open={!!deleteMessage}
          autoHideDuration={3000}
          onClose={() => setDeleteMessage('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setDeleteMessage('')} severity="warning" sx={{ width: '100%' }}>
            {deleteMessage}
          </Alert>
        </Snackbar>
      )}
    </div>
  );
}
