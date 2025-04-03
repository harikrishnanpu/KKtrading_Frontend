import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
  Box,
  Container,
  Typography,
  Button,
  Table,
  TableContainer,
  Paper,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import useAuth from 'hooks/useAuth';

export default function AdminLogsPage() {
  const navigate = useNavigate();
  const {user} = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLogDetails, setSelectedLogDetails] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get('/api/users/alllogs/all');
        console.log(data);
        setLogs(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch logs');
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Format details using JSON parsing; fallback to raw details if parsing fails.
  const formatDetails = (details) => {
    try {
      const parsedDetails = JSON.parse(details);
      return (
        <Box>
          {parsedDetails.params && (
            <Typography variant="body2" gutterBottom>
              <strong>Parameters:</strong>{' '}
              {Object.entries(parsedDetails.params)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </Typography>
          )}
          {parsedDetails.query && (
            <Typography variant="body2" gutterBottom>
              <strong>Query:</strong>{' '}
              {Object.entries(parsedDetails.query)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </Typography>
          )}
          {parsedDetails.body && (
            <Typography variant="body2" gutterBottom>
              <strong>Body:</strong>{' '}
              {Object.entries(parsedDetails.body)
                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                .join(', ')}
            </Typography>
          )}
        </Box>
      );
    } catch (e) {
      return <Typography variant="body2">{details}</Typography>;
    }
  };

  // Map API actions to friendly messages.
  const formatAction = (action) => {
    const actionMap = [
      { pattern: /^POST \/api\/billing\/create$/, message: 'Created a new billing entry' },
      { pattern: /^POST \/api\/billing\/edit\/(.+)$/, message: 'Edited a billing entry' },
      { pattern: /^GET \/api\/billing\/$/, message: 'Fetched all billing entries' },
      { pattern: /^GET \/api\/billing\/(.+)$/, message: 'Fetched billing details' },
      { pattern: /^DELETE \/api\/billing\/(.+)$/, message: 'Deleted a billing entry' },
      { pattern: /^GET \/api\/products\/$/, message: 'Fetched products list' },
      { pattern: /^POST \/api\/products\/$/, message: 'Created a new product' },
      { pattern: /^PUT \/api\/products\/(.+)$/, message: 'Updated a product' },
      { pattern: /^DELETE \/api\/products\/(.+)$/, message: 'Deleted a product' },
      { pattern: /^POST \/api\/returns\/create$/, message: 'Created a new return' },
      { pattern: /^DELETE \/api\/returns\/delete\/(.+)$/, message: 'Deleted a return' },
      { pattern: /^POST \/api\/users\/signin$/, message: 'User signed in' },
      { pattern: /^POST \/api\/users\/register$/, message: 'User registered' },
      { pattern: /^PUT \/api\/users\/(.+)$/, message: 'Updated user profile' },
      { pattern: /^DELETE \/api\/users\/(.+)$/, message: 'Deleted a user' },
      { pattern: /^POST \/api\/users\/billing\/start-delivery/, message: 'Delivery Started' },
      { pattern: /^POST \/api\/users\/billing\/end-delivery/, message: 'Delivery Updated (Submitted)' },
    ];

    for (const entry of actionMap) {
      const match = action.match(entry.pattern);
      if (match) {
        return entry.message;
      }
    }
    return action;
  };

  const openDialog = (details) => {
    setSelectedLogDetails(details);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedLogDetails(null);
  };

  const handleDeleteLogs = async () => {
    try {
      await api.post('/api/users/alllogs/all');
      alert('All Logs Deleted');
      navigate(0);
    } catch (err) {
      alert('Failed to delete logs');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
     {user.isSuper && <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'grey.100',
          maxWidth: 'fit-content',
          p: 2,
          borderRadius: 2,
          mb: 3,
        }}
      >
        <IconButton color="error" onClick={handleDeleteLogs}>
          <DeleteIcon />
        </IconButton>
      </Box> }

      {/* Logs Section */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography variant="h6" color="error" align="center">
          {error}
        </Typography>
      ) : (
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="subtitle1" align="right" color="text.secondary" sx={{ mb: 2 }}>
            Activity Logs
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow
                    key={log._id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => openDialog(log.details)}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PersonIcon color="error" fontSize="small" />
                        <Typography variant="body2">{log?.username || 'Unknown User'}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <InfoIcon color="error" fontSize="small" />
                        <Typography variant="body2">{formatAction(log.action)}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Button variant="text" color="primary" size="small">
                        View Details
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{new Date(log.timestamp).toLocaleString()}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Dialog for displaying log details */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>Log Details</DialogTitle>
        <DialogContent dividers>
          {selectedLogDetails ? (
            formatDetails(selectedLogDetails)
          ) : (
            <Typography variant="body2">No details available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="error" variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
