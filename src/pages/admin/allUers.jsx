import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DataGrid, 
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridActionsCellItem 
} from '@mui/x-data-grid';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Delete,
  Edit,
  Refresh,
  PersonAdd,
  ViewList,
  GridView,
  FilterList,
  ImportExport,
  Search
} from '@mui/icons-material';
import api from 'pages/api';
import { styled } from '@mui/material/styles';

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: theme.palette.grey[100],
    borderRadius: 1
  },
  '& .MuiDataGrid-cell': {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  '& .MuiDataGrid-row:hover': {
    backgroundColor: theme.palette.action.hover
  },
}));

const UserStatusBadge = ({ status }) => (
  <Chip 
    label={status} 
    color={status === 'Active' ? 'success' : 'error'} 
    size="small" 
    variant="outlined"
  />
);

export default function UserListScreen() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [searchText, setSearchText] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all'
  });

  const columns = [
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
          onClick={() => navigate(`/admin/edituser/${params._id}`)}
        />,
        <GridActionsCellItem
          icon={<Delete />}
          label="Delete"
          onClick={() => handleOpenDeleteDialog([params.id])}
        />
      ]
    }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/users');
      setUsers(data.map(user => ({
        ...user,
        status: user.isActive ? 'Active' : 'Inactive',
        role: user.isAdmin ? 'Admin' : 'User'
      })));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUsers = async (ids) => {
    try {
      await Promise.all(ids.map(id => api.delete(`/api/users/${id}`)));
      setUsers(users.filter(user => !ids.includes(user._id)));
      setSelectedUsers([]);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleOpenDeleteDialog = (ids) => {
    setSelectedUsers(ids);
    setDeleteDialogOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchText.toLowerCase());
    const matchesRole = filters.role === 'all' || user.role === filters.role;
    const matchesStatus = filters.status === 'all' || user.status === filters.status;
    return matchesSearch && matchesRole && matchesStatus;
  });

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

  return (
    <Box sx={{ p: 3 }}>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={2}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" component="h1">User Management</Typography>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
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

      {viewMode === 'table' ? (
        <Box sx={{ height: 600, width: '100%' }}>
          <StyledDataGrid
            rows={filteredUsers}
            columns={columns}
            loading={loading}
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
            <Grid item xs={12} sm={6} md={4} key={user._id}>
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
                    <IconButton onClick={() => navigate(`/admin/edituser/${user._id}`)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDeleteDialog([user._id])}>
                      <Delete />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedUsers.length} 
            {selectedUsers.length > 1 ? ' users' : ' user'}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
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
    </Box>
  );
}