// DashboardDefault.jsx

import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { keyframes } from '@mui/system';
import { Link as RouterLink } from 'react-router-dom';


// project-imports
import WelcomeBanner from 'sections/dashboard/default/WelcomeBanner';
import LowStockPreview from 'components/dashboard/lowstockPreview';   // Ensure this path is correct
import MainCard from 'components/MainCard';
import { ThemeMode } from 'config';

// Asset imports
import WelcomeImage from 'assets/images/analytics/welcome-banner.png';
import cardBack from 'assets/images/widget/img-dropbox-bg.svg';



// API instance
import api from 'pages/api'; // Adjust to your actual API import if needed
import { Avatar, Button, Stack } from '@mui/material';
import useAuth from 'hooks/useAuth';

// Define a simple fade-in animation for the skeleton cards
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

export default function DashboardDefault() {
  const theme = useTheme();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await api.get('/api/chart/dashboard/dashboard-stats');
        if (data.success) {
          setDashboardData(data.stats);
        } else {
          setError('Failed to load dashboard stats');
        }
      } catch (err) {
        setError('Error fetching dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);



  const downloadExcel = async () => {
  try {
    const response = await api.get('/api/print/export', {
      responseType: 'blob', // important for file downloads
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    // Create a blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'all_data.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error('Download failed:', error);
  }
};

  const handleSeedProducts = async () => {
    if(!window.confirm('are you sure want to import products')) return;
    try {
      const token = localStorage.getItem('token'); // adjust based on your auth
      const res = await api.get('/api/products/seed', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      alert('Products seeded successfully!');
      console.log(res.data);
      // Optional: reload or navigate
      // navigate('/products'); 
    } catch (err) {
      console.log(err);
      alert(err.message);
    }
  };

  // Skeletal Loading State
  if (loading) {
    return (
      <Grid container rowSpacing={4.5} columnSpacing={2.75} sx={{ p: 3 }}>
        {/* Skeleton for Welcome Banner */}
        <Grid item xs={12}>
        <MainCard
        border={false}
        sx={{
          color: 'common.white',
          bgcolor:
            theme.palette.mode === ThemeMode.DARK
              ? 'primary.400'
              : 'primary.darker',
          position: 'relative',
          overflow: 'hidden',
          '&:after': {
            content: '""',
            background: `url("${cardBack}") 100% 100% / cover no-repeat`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            opacity: 0.5,
          },
        }}
      >
        <Grid container>
          {/* Left Section Skeleton */}
          <Grid item md={6} sm={6} xs={12}>
            <Stack spacing={2} sx={{ padding: 3 }}>
              <Skeleton variant="text" animation="wave" width="80%" height={40} />
              <Skeleton variant="text" animation="wave" width="90%" height={20} />
              {/* <Skeleton variant="text" animation="wave" width="40%" height={20} /> */}
              {/* <Skeleton variant="rectangular" animation="wave" width="100%" height={100} sx={{ borderRadius: 2 }} /> */}
              <Skeleton variant="text" animation="wave" width="30%" height={20} />
              <Typography
              variant="h6"
              color={theme.palette.background.paper}
              sx={{ mt: 2 }}
            >
              KK Trading 1.0.4
            </Typography>
            </Stack>
          </Grid>
          {/* Right Section Skeleton */}
          {/* <Grid item md={6} sm={6} xs={12} sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Stack
              sx={{ position: 'relative', pr: { sm: 3, md: 8 } }}
              justifyContent="center"
              alignItems="flex-end"
            >
              <Skeleton variant="rectangular" animation="wave" width="200px" height="200px" sx={{ borderRadius: 2 }} />
            </Stack>
          </Grid> */}

          <Grid item md={6} sm={6} xs={12} sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Stack
            sx={{ position: 'relative', pr: { sm: 3, md: 8 }, zIndex: 2, height: '100%' }}
            justifyContent="center"
            alignItems="flex-end"
          >
            <img src={WelcomeImage} alt="Welcome" width="200px" />
          </Stack>
        </Grid>

        </Grid>
      </MainCard>
        </Grid>


        {/* Skeletons for the Dashboard Cards */}
        {Array.from(new Array(8)).map((_, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Box 
              sx={{ 
                p: 2, 
                borderRadius: '12px', 
                backgroundColor: theme.palette.background.paper, 
                boxShadow: 2,
                animation: `${fadeIn} 0.5s ease-in-out`
              }}
            >
              {/* Title Skeleton */}
              <Skeleton 
                variant="text" 
                animation="wave" 
                width="70%" 
                height={30} 
                sx={{ borderRadius: '8px', mb: 1 }} 
              />
              {/* Count Skeleton */}
              {/* <Skeleton 
                variant="text" 
                animation="wave" 
                width="50%" 
                height={25} 
                sx={{ borderRadius: '8px', mb: 1 }} 
              /> */}
              {/* Sparkline/Chart Skeleton */}
              <Skeleton 
                variant="rectangular" 
                animation="wave" 
                height={50} 
                sx={{ borderRadius: '8px', mb: 1 }} 
              />
              {/* Percentage/Detail Skeleton */}
              <Skeleton 
                variant="text" 
                animation="wave" 
                width="30%" 
                height={20} 
                sx={{ borderRadius: '8px' }} 
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  }

  // Error state
  if (error) {
    return (
      <Grid container justifyContent="center" sx={{ p: 3 }}>
        <Typography variant="subtitle1" color="error">
          {error}
        </Typography>
      </Grid>
    );
  }

  // No data case
  if (!dashboardData) return null;

  /**
   * Prepare an array of cards to loop through.
   * Each card's config object:
   * - key (unique identifier)
   * - title
   * - count (the total, default 0 if missing)
   * - monthly data array (12 numbers, default to array of 12 zeros)
   * - iconPrimary
   * - color
   * - optional percentage or arrow icon
   */


  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* Welcome Banner */}
      <Grid item xs={12}>
        <WelcomeBanner />
      </Grid>

      <Grid item xs={12}>
        <MainCard>
          <Grid
            container
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Grid item>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar>{user?.name?.[0] || 'U'}</Avatar>
                <div>
                  <Typography variant="subtitle2">
                    {user?.name || 'User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.role || ''}
                  </Typography>
                </div>
              </Stack>
            </Grid>

            <Grid item>
              <Stack direction="row" spacing={1}>
                <Button
                  component={RouterLink}
                  to="/invoice/create"
                  variant="contained"
                  color="primary"
                  size="small"
                >
                  Create Estimate
                </Button>
                <Button
                  component={RouterLink}
                  to="/stock/update"
                  variant="outlined"
                  color="primary"
                  size="small"
                >
                  Stock Update
                </Button>

                {user.isSuper  && <Button
                  component={RouterLink}
                  onClick={downloadExcel}
                  variant="outlined"
                  color="primary"
                  size="small"
                >
                  Export
                </Button> }

                  {user.isSuper  && <Button
                  component={RouterLink}
                  variant="outlined"
                  color="primary"
                  size="small"
                   onClick={handleSeedProducts}

                >
                  Import Products
                </Button> }

              </Stack>
            </Grid>
          </Grid>
        </MainCard>
      </Grid>

      {/* Low Stock Preview Section */}
      <Grid item xs={12} md={12}>
        <LowStockPreview />
      </Grid>
      
    </Grid>
  );
}
