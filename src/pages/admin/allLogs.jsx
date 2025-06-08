// src/pages/AdminLogsPage.js
import React, { useEffect, useState, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
  Box, Container, Typography, Button, Table, TableContainer, Paper,
  TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, IconButton,
  Slide, TextField, Grid, Stack, useMediaQuery, useTheme, TableSortLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import useAuth from 'hooks/useAuth';

const UpTransition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props}/>);

export default function AdminLogsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Logs data
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // Filters & sorting
  const [dateFrom, setDateFrom]       = useState(() => {
    const d = new Date(); return d.toISOString().slice(0,10);
  });
  const [dateTo, setDateTo]           = useState(() => {
    const d = new Date(); return d.toISOString().slice(0,10);
  });
  const [usernameFilter, setUsernameFilter] = useState('');
  const [actionFilter, setActionFilter]     = useState('');
  const [sortField, setSortField]     = useState('createdAt');
  const [sortOrder, setSortOrder]     = useState('desc');

  // Dialog
  const [dialogOpen, setDialogOpen]       = useState(false);
  const [selectedLogDetails, setSelectedLogDetails] = useState(null);

  // Fetch logs when filters or sort change
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          dateFrom,
          dateTo,
          username: usernameFilter,
          action:   actionFilter,
          sortField,
          sortOrder
        };
        const { data } = await api.get('/api/users/alllogs/all', { params });
        if (!mounted) return;
        setLogs(data);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError('Failed to fetch logs');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [dateFrom, dateTo, usernameFilter, actionFilter, sortField, sortOrder]);

  // Format details JSON
  const formatDetails = (details) => {
    try {
      const parsed = JSON.parse(details);
      return (
        <Box>
          {parsed.params && (
            <Typography variant="body2" gutterBottom>
              <strong>Params:</strong>{' '}
              {Object.entries(parsed.params).map(([k,v])=>`${k}: ${v}`).join(', ')}
            </Typography>
          )}
          {parsed.query && (
            <Typography variant="body2" gutterBottom>
              <strong>Query:</strong>{' '}
              {Object.entries(parsed.query).map(([k,v])=>`${k}: ${v}`).join(', ')}
            </Typography>
          )}
          {parsed.body && (
            <Typography variant="body2" gutterBottom>
              <strong>Body:</strong>{' '}
              {Object.entries(parsed.body).map(([k,v])=>`${k}: ${JSON.stringify(v)}`).join(', ')}
            </Typography>
          )}
        </Box>
      );
    } catch {
      return <Typography variant="body2">{details}</Typography>;
    }
  };

  // Map actions to friendly text
  const formatAction = (action) => {
    const map = [
      { pat: /^POST \/api\/billing\/create$/,                         msg: 'Created billing' },
      { pat: /^POST \/api\/billing\/edit\/.+$/,                       msg: 'Edited billing' },
      { pat: /^GET \/api\/billing\/\s*$/,                             msg: 'Fetched all billings' },
      { pat: /^DELETE \/api\/billing\/.+$/,                           msg: 'Deleted billing' },
      { pat: /^POST \/api\/products\/$/,                              msg: 'Created product' },
      { pat: /^PUT \/api\/products\/.+$/,                             msg: 'Updated product' },
      { pat: /^DELETE \/api\/products\/.+$/,                          msg: 'Deleted product' },
      { pat: /^POST \/api\/returns\/create$/,                         msg: 'Created return' },
      { pat: /^DELETE \/api\/returns\/delete\/.+$/,                   msg: 'Deleted return' },
      { pat: /^POST \/api\/users\/signin$/,                           msg: 'Signed in' },
      { pat: /^POST \/api\/users\/register$/,                         msg: 'Registered user' },
      { pat: /^PUT \/api\/users\/.+$/,                                 msg: 'Updated user' },
      { pat: /^DELETE \/api\/users\/.+$/,                              msg: 'Deleted user' },
      { pat: /^POST \/api\/users\/billing\/start-delivery/,           msg: 'Delivery started' },
      { pat: /^POST \/api\/users\/billing\/end-delivery/,             msg: 'Delivery ended' }
    ];
    for (const e of map) if (action.match(e.pat)) return e.msg;
    return action;
  };

  const openDialog = (details) => {
    setSelectedLogDetails(details);
    setDialogOpen(true);
  };
  const closeDialog = () => setDialogOpen(false);

  const handleDeleteLogs = async () => {
    if (!window.confirm('Delete ALL logs?')) return;
    try {
      await api.post('/api/users/alllogs/all'); // your delete-all endpoint
      navigate(0);
    } catch {
      alert('Failed to delete logs');
    }
  };

  // Sorting handler
  const onSort = (field) => {
    if (sortField === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt:4, mb:4 }}>
      {/* Delete all */}
      {user.isSuper && (
        <Box mb={2} display="flex" justifyContent="flex-end">
          <IconButton color="error" onClick={handleDeleteLogs}>
            <DeleteIcon />
          </IconButton>
        </Box>
      )}

      {/* Filters */}
      <Paper sx={{ p:2, mb:3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Date From" type="date" fullWidth size="small"
              value={dateFrom}
              onChange={e=>setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Date To" type="date" fullWidth size="small"
              value={dateTo}
              onChange={e=>setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Username" fullWidth size="small"
              value={usernameFilter}
              onChange={e=>setUsernameFilter(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Action" fullWidth size="small"
              value={actionFilter}
              onChange={e=>setActionFilter(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Logs Table */}
      {loading ? (
        <Box textAlign="center" my={4}><CircularProgress/></Box>
      ) : error ? (
        <Typography color="error" align="center">{error}</Typography>
      ) : (
        <Paper elevation={3}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[
                    { id:'username', label:'User' },
                    { id:'action',   label:'Action' },
                    { id:'timestamp',label:'Time' }
                  ].map(col => (
                    <TableCell key={col.id}>
                      <TableSortLabel
                        active={sortField===col.id}
                        direction={sortField===col.id ? sortOrder : 'asc'}
                        onClick={()=>onSort(col.id)}
                      >
                        {col.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map(log => (
                  <TableRow
                    key={log._id}
                    hover
                    sx={{ cursor:'pointer' }}
                    onClick={()=>openDialog(log.details)}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PersonIcon fontSize="small"/>
                        <Typography variant="body2">{log.username}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <InfoIcon fontSize="small"/>
                        <Typography variant="body2">{formatAction(log.action)}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button size="small">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} TransitionComponent={UpTransition} maxWidth="sm" fullWidth>
        <DialogTitle>Log Details</DialogTitle>
        <DialogContent dividers>
          {selectedLogDetails
            ? formatDetails(selectedLogDetails)
            : <Typography>No details.</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} variant="outlined" color="error">Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
