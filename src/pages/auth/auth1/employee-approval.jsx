import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Grow, 
  Button, 
  Fade, 
  IconButton 
} from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardIcon from '@mui/icons-material/Dashboard';
import useAuth from 'hooks/useAuth';
import { useNavigate } from 'react-router';

export default function EmployeeApprovalScreen() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { state: { from: '' } });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // If user data is not yet loaded, show a spinner.
  if (!user) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const isEmployee = user.isEmployee;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
        p: 2,
      }}
    >
      <Grow in timeout={1000}>
        <Paper
          elevation={6}
          sx={{
            p: 4,
            position: 'relative',
            textAlign: 'center',
            maxWidth: 450,
            borderRadius: 3,
            backgroundColor: 'background.paper',
          }}
        >
          {/* Refresh Button at Top Right */}
          <IconButton
            onClick={handleRefresh}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'text.secondary',
            }}
          >
            <RefreshIcon />
          </IconButton>

          {/* Display current user details */}
          <Box sx={{ textAlign: 'center', mb: 3, px: 2 }}>
            <Typography variant="subtitle1">
              <strong>Name:</strong> {user?.name || 'N/A'}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Role:</strong> {user?.role || 'N/A'}
            </Typography>
          </Box>

          {isEmployee ? (
            <>
              <Typography variant="h5" gutterBottom>
                Account Approved
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Your account has been approved. You can now proceed to your dashboard.
              </Typography>
              <Fade in timeout={1500}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<DashboardIcon />}
                  onClick={() => navigate('/')}
                >
                  Go to Dashboard
                </Button>
              </Fade>
            </>
          ) : (
            <>
              <CircularProgress sx={{ mb: 3 }} />
              <Typography variant="h5" gutterBottom>
                Awaiting Approval
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Your account is currently awaiting approval by an administrator.
                Please check back later.
              </Typography>
              <Fade in timeout={1500}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<ExitToAppIcon />}
                  onClick={handleLogout}
                >
                  Sign Out
                </Button>
              </Fade>
            </>
          )}
        </Paper>
      </Grow>
    </Box>
  );
}
