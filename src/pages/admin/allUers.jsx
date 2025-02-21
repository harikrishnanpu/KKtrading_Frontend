import React, { useState, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stack,
  Typography,
  Button,
  TextField,
  MenuItem,
  Select,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Slide,
  LinearProgress
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridActionsCellItem
} from '@mui/x-data-grid';
import {
  Delete,
  Edit,
  Refresh,
  PersonAdd,
  ViewList,
  GridView,
  Search,
  Print,
  Cancel
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Your custom API instance
import api from 'pages/api';
import useAuth from 'hooks/useAuth';
import { TickCircle } from 'iconsax-react';

// Styled DataGrid
const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: theme.palette.grey[100],
    borderRadius: 1
  },
  '& .MuiDataGrid-cell': {
    borderBottom: `1px solid ${theme.palette.divider}`
  },
  '& .MuiDataGrid-row:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

// Simple badge for user status in DataGrid
const UserStatusBadge = ({ status }) => (
  <Chip
    label={status}
    color={status === 'Active' ? 'success' : 'error'}
    size="small"
    variant="outlined"
  />
);

// Slide Transition for the "Add/Edit Leave" dialog
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function UserListScreen() {
  const navigate = useNavigate();

  // -------------------- Tabs --------------------
  const [activeTab, setActiveTab] = useState('users');
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const {user} = useAuth();

  // =====================================
  // =========== USERS TAB STATE =========
  // =====================================
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');

  const [viewMode, setViewMode] = useState('table');
  const [searchText, setSearchText] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all'
  });

  // ============ USERS COLUMNS =============
  const userColumns = [
    {
      field: 'name',
      headerName: 'User',
      flex: 1,
      renderCell: (params) => (
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar src={params.row.avatar} />
          <Typography variant="body2">{params.value}</Typography>
        </Stack>
      )
    },
    { field: 'email', headerName: 'Email', flex: 1.5 },
    {
      field: 'role',
      headerName: 'Role',
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'Admin' ? 'primary' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      renderCell: (params) => <UserStatusBadge status={params.value} />
    },
    {
      field: 'actions',
      type: 'actions',
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Edit />}
          label="Edit"
          onClick={() => navigate(`/admin/edituser/${params.id}`)}
        />,
        <GridActionsCellItem
          icon={<Delete />}
          label="Delete"
          onClick={() => handleOpenDeleteDialog([params.id])}
        />
      ]
    }
  ];

  // ================== FETCH USERS ==================
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data } = await api.get('/api/users');
      // Transform data for the DataGrid
      setUsers(
        data.map((u) => ({
          ...u,
          id: u._id,
          status: u.isActive ? 'Active' : 'Inactive',
          role: u.isAdmin ? 'Admin' : 'User'
        }))
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  // ================== USER ACTIONS ==================
  const handleDeleteUsers = async (ids) => {
    try {
      await Promise.all(ids.map((id) => api.delete(`/api/users/${id}`)));
      setUsers((prev) => prev.filter((user) => !ids.includes(user.id)));
      setSelectedUsers([]);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleOpenDeleteDialog = (ids) => {
    setSelectedUsers(ids);
    setDeleteDialogOpen(true);
  };

  // Filtered user list
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase());
    const matchesRole = filters.role === 'all' || user.role === filters.role;
    const matchesStatus = filters.status === 'all' || user.status === filters.status;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Toolbar for user DataGrid
  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarFilterButton />
      <GridToolbarExport />
      <Button
        startIcon={<Delete />}
        onClick={() => handleOpenDeleteDialog(selectedUsers)}
        disabled={!selectedUsers.length}
      >
        Delete Selected
      </Button>
    </GridToolbarContainer>
  );

  // =====================================
  // ========== LEAVES TAB STATE =========
  // =====================================
  const [leaves, setLeaves] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [leaveErrorMessage, setLeaveErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');

  // ============ LEAVES COLUMNS =============
  const leavesColumns = [
    { field: 'userName', headerName: 'Name', flex: 1 },
    { field: 'reason', headerName: 'Reason', flex: 2 },
    {
      field: 'startDate',
      headerName: 'Start Date',
      flex: 1,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      flex: 1,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      renderCell: (params) => {
        const s = params.value;
        if (s === 'Pending') {
          return <Chip label="Pending" color="warning" variant="outlined" size="small" />;
        } else if (s === 'Approved') {
          return <Chip label="Approved" color="success" variant="outlined" size="small" />;
        } else {
          return <Chip label="Rejected" color="error" variant="outlined" size="small" />;
        }
      }
    },
    {
      field: 'actions',
      type: 'actions',
      flex: 1.5,
      disableColumnMenu: true, // 🔥 Prevent menu hiding actions
      getActions: (params) => {
        const actions = [];
    
        // Only show Approve/Reject if status is "Pending"
        if (params.row.status === 'Pending') {
          actions.push(
            <GridActionsCellItem
              icon={<TickCircle />}
              label="Approve"
              onClick={() => approveLeave(params.row.id)}
              showInMenu={false} // Forces it to be visible
            />,
            <GridActionsCellItem
              icon={<Cancel />}
              label="Reject"
              onClick={() => rejectLeave(params.row.id)}
              showInMenu={false} // Forces it to be visible
            />
          );
        }
    
        // Edit action
        actions.push(
          <GridActionsCellItem
            icon={<Edit />}
            label="Edit"
            onClick={() => openEditDialog(params.row)}
            showInMenu={false} // Forces it to be visible
          />
        );
    
        // Delete action
        actions.push(
          <GridActionsCellItem
            icon={<Delete />}
            label="Delete"
            onClick={() => handleDeleteLeave(params.row.id)}
            showInMenu={false} // Forces it to be visible
          />
        );
    
        // Print action
        actions.push(
          <GridActionsCellItem
            icon={<Print />}
            label="Print"
            onClick={() => generatePDF(params.row)}
            showInMenu={false} // Forces it to be visible
          />
        );
    
        return actions;
      }
    }
    
    
  ];

  // ================== FETCH LEAVES ==================
  const fetchLeaves = async () => {
    try {
      setLoadingLeaves(true);
      const { data } = await api.get('/api/leaves');
      // Add 'id' for DataGrid
      const transformed = data.map((leave) => ({
        ...leave,
        id: leave._id
      }));
      setLeaves(transformed);
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
      setLeaveErrorMessage('Failed to fetch leaves.');
    } finally {
      setLoadingLeaves(false);
    }
  };

  // ================== LEAVE ACTIONS ==================
  const approveLeave = async (id) => {
    try {
      await api.put(`/api/leaves/${id}/approve`);
      fetchLeaves();
    } catch (err) {
      setLeaveErrorMessage('Failed to approve leave.');
    }
  };

  const rejectLeave = async (id) => {
    try {
      await api.put(`/api/leaves/${id}/reject`);
      fetchLeaves();
    } catch (err) {
      setLeaveErrorMessage('Failed to reject leave.');
    }
  };

  const handleDeleteLeave = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave application?')) return;
    try {
      const { data } = await api.delete(`/api/leaves/${id}`);
      setDeleteMessage(data.message || 'Leave deleted successfully.');
      fetchLeaves();
      setTimeout(() => setDeleteMessage(''), 3000);
    } catch (err) {
      setLeaveErrorMessage('Failed to delete leave.');
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

  // ============ ADD/EDIT LEAVE DIALOG ==============
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [editLeaveId, setEditLeaveId] = useState(null);

  // NEW: keep track of which user we assign the leave to
  const [selectedUserId, setSelectedUserId] = useState('');

  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Show "Add Leave" dialog
  const openAddDialog = () => {
    setDialogMode('add');
    setEditLeaveId(null);
    setSelectedUserId(''); // reset
    setReason('');
    setStartDate('');
    setEndDate('');
    setLeaveErrorMessage('');
    setOpenDialog(true);
  };

  // Show "Edit Leave" dialog
  const openEditDialog = (leave) => {
    setDialogMode('edit');
    setEditLeaveId(leave.id);
    setSelectedUserId(leave.userId || ''); // from the row
    setReason(leave.reason);
    setStartDate(leave.startDate.split('T')[0]);
    setEndDate(leave.endDate.split('T')[0]);
    setLeaveErrorMessage('');
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
  };

  // Add or Edit leave
  const handleSubmitLeave = async () => {
    if (!selectedUserId || !reason || !startDate || !endDate) {
      setLeaveErrorMessage('Please fill all fields (including User).');
      return;
    }
    setLeaveErrorMessage('');

    try {
      if (dialogMode === 'add') {
        const userObj = users.find((u) => u.id === selectedUserId);
        await api.post('/api/leaves', {
          userId: selectedUserId,
          userName: userObj?.name || 'Unknown User',
          reason,
          startDate,
          endDate
        });
        setSuccessMessage('Leave added successfully!');
      } else {
        await api.put(`/api/leaves/${editLeaveId}`, {
          // If changing user in edit mode:
          userId: selectedUserId,
          userName: users.find((u) => u.id === selectedUserId)?.name || 'Unknown User',
          reason,
          startDate,
          endDate
        });
        setSuccessMessage('Leave updated successfully!');
      }
      closeDialog();
      fetchLeaves();
    } catch (err) {
      setLeaveErrorMessage(
        dialogMode === 'add'
          ? 'Failed to submit leave application.'
          : 'Failed to update leave application.'
      );
    }
  };

  // ================== EFFECT: Fetch Both Users & Leaves on Mount ==================
  useEffect(() => {
    fetchUsers();
    fetchLeaves();
    // eslint-disable-next-line
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* TABS: Users & All Leaves */}
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Users" value="users" />
        <Tab label="All Leaves" value="leaves" />
      </Tabs>

      {/* ----------------- USERS TAB ----------------- */}
      {activeTab === 'users' && (
        <>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <Typography variant="h4" component="h1">
              User Management
            </Typography>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<PersonAdd />}
                onClick={() => navigate('/user/create')}
              >
                New User
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchUsers}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <TextField
              variant="outlined"
              placeholder="Search users..."
              InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
              fullWidth
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            <Select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="User">User</MenuItem>
            </Select>

            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>

            <ToggleButtonGroup
              exclusive
              value={viewMode}
              onChange={(e, newMode) => setViewMode(newMode)}
            >
              <ToggleButton value="table" aria-label="Table view">
                <ViewList />
              </ToggleButton>
              <ToggleButton value="grid" aria-label="Grid view">
                <GridView />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}

          {/* USERS: Table or Grid View */}
          {viewMode === 'table' ? (
            <Box sx={{ height: 600, width: '100%' }}>
              <StyledDataGrid
                rows={filteredUsers}
                columns={userColumns}
                loading={loadingUsers}
                checkboxSelection
                disableSelectionOnClick
                components={{
                  Toolbar: CustomToolbar,
                  LoadingOverlay: LinearProgress
                }}
                onSelectionModelChange={(newSelection) => {
                  setSelectedUsers(newSelection);
                }}
                selectionModel={selectedUsers}
              />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredUsers.map((user) => (
                <Grid item xs={12} sm={6} md={4} key={user.id}>
                  <Card sx={{ p: 2 }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar src={user.avatar} sx={{ width: 56, height: 56 }} />
                        <Box>
                          <Typography variant="h6">{user.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <UserStatusBadge status={user.status} />
                        <Chip label={user.role} size="small" variant="outlined" />
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <IconButton onClick={() => navigate(`/admin/edituser/${user.id}`)}>
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleOpenDeleteDialog([user.id])}>
                          <Delete />
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Delete Confirm Dialog for users */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
          >
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete {selectedUsers.length}{' '}
                {selectedUsers.length > 1 ? ' users' : ' user'}?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  handleDeleteUsers(selectedUsers);
                  setDeleteDialogOpen(false);
                }}
              >
                Confirm Delete
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* ----------------- ALL LEAVES TAB ----------------- */}
      {activeTab === 'leaves' && (
        <>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h4">All Leaves</Typography>
            <Button variant="outlined" color="primary" onClick={openAddDialog}>
              Add Leave
            </Button>
          </Stack>

          {/* Error messages for leaves (if any) */}
          {leaveErrorMessage && (
            <Typography color="error" sx={{ mb: 2 }}>
              {leaveErrorMessage}
            </Typography>
          )}
          {deleteMessage && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {deleteMessage}
            </Alert>
          )}

          <Box sx={{ height: 600, width: '100%' }}>
            <StyledDataGrid
              rows={leaves}
              columns={leavesColumns}
              loading={loadingLeaves}
              components={{
                LoadingOverlay: LinearProgress
              }}
            />
          </Box>
        </>
      )}

      {/* ----------------- ADD/EDIT LEAVE DIALOG ----------------- */}
      <Dialog
        open={openDialog}
        TransitionComponent={Transition}
        onClose={closeDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{dialogMode === 'add' ? 'Add Leave' : 'Edit Leave'}</DialogTitle>
        <DialogContent dividers>
          {leaveErrorMessage && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {leaveErrorMessage}
            </Alert>
          )}

          {/* SELECT USER from the existing 'users' list */}
          <TextField
            select
            label="Select User"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            variant="outlined"
            fullWidth
            margin="normal"
            size="small"
          >
            <MenuItem value="">-- Select a user --</MenuItem>
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.name}
              </MenuItem>
            ))}
          </TextField>

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
        <DialogActions>
          <Button onClick={closeDialog} color="inherit">
            Cancel
          </Button>
          <Button variant="outlined" color="error" onClick={handleSubmitLeave}>
            {dialogMode === 'add' ? 'Submit' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SUCCESS SNACKBAR */}
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
    </Box>
  );
}
