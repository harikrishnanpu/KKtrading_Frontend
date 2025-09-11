// DashboardDefault.jsx
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { keyframes } from '@mui/system';
import { Link as RouterLink } from 'react-router-dom';
import { Avatar, Button, Stack } from '@mui/material';
import { motion } from 'framer-motion';

// project-imports
import WelcomeBanner from 'sections/dashboard/default/WelcomeBanner';
import LowStockPreview from 'components/dashboard/lowstockPreview';
import MainCard from 'components/MainCard';
import { ThemeMode } from 'config';

// Asset imports
import WelcomeImage from 'assets/images/analytics/welcome-banner.png';
import cardBack from 'assets/images/widget/img-dropbox-bg.svg';

// API + auth
import api from 'pages/api';
import useAuth from 'hooks/useAuth';

// fade-in keyframes for skeletons
const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

export default function DashboardDefault() {
  const theme = useTheme();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [bills, setBills] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // fetch dashboard stats
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
      }
    };
    fetchDashboardData();
  }, []);

  // fetch user-related data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?._id) {
          setLoading(false);
          return;
        }
        // 1) User data
        const userRes = await api.get(`/api/users/${user._id}`);
        const fetchedUser = userRes.data;
        setUserData(fetchedUser);

        // 2) Bills (salesman)
        const billsRes = await api.get(
          `/api/billing/bill/profile?salesmanName=${encodeURIComponent(
            fetchedUser.name
          )}`
        );
        setBills(billsRes.data);

        // 3) Leaves
        const leavesRes = await api.get(`/api/leaves?userId=${user._id}`);
        setLeaves(leavesRes.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // download excel
  const downloadExcel = async () => {
    if (
      !window.confirm(
        `Are you sure you want to export the current data as an Excel file from the database? This action will include all data up to ${new Date().toLocaleString()}.`
      )
    )
      return;
    try {
      const response = await api.get('/api/print/export', {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
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

  // seed products
  const handleSeedProducts = async () => {
    const importPass = window.prompt(
      'Please be aware that importing products will automatically recalculate and update all existing stock in the database. This process cannot be reversed. To continue, enter the password below.'
    );
    if (importPass !== 'kk@1234') return;
    try {
      const token = localStorage.getItem('token');
      await api.get('/api/products/seed', {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Products seeded successfully!');
    } catch (err) {
      console.log(err);
      alert(err.message);
    }
  };

  // loading skeleton
  if (loading && !userData) {
    return (
      <Grid container rowSpacing={4.5} columnSpacing={2.75} sx={{ p: 3 }}>
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
              <Grid item md={6} sm={6} xs={12}>
                <Stack spacing={2} sx={{ padding: 3 }}>
                  <Skeleton variant="text" width="80%" height={40} />
                  <Skeleton variant="text" width="90%" height={20} />
                  <Skeleton variant="text" width="40%" height={20} />
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={100}
                    sx={{ borderRadius: 2 }}
                  />
                </Stack>
              </Grid>
              <Grid
                item
                md={6}
                sm={6}
                xs={12}
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                <Stack
                  sx={{
                    position: 'relative',
                    pr: { sm: 3, md: 8 },
                    zIndex: 2,
                    height: '100%',
                  }}
                  justifyContent="center"
                  alignItems="flex-end"
                >
                  <img src={WelcomeImage} alt="Welcome" width="200px" />
                </Stack>
              </Grid>
            </Grid>
          </MainCard>
        </Grid>
        {Array.from(new Array(6)).map((_, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Box
              sx={{
                p: 2,
                borderRadius: '12px',
                backgroundColor: theme.palette.background.paper,
                boxShadow: 2,
                animation: `${fadeIn} 0.5s ease-in-out`,
              }}
            >
              <Skeleton variant="text" width="70%" height={30} />
              <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="30%" height={20} />
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  }

  // error state
  if (error) {
    return (
      <Grid container justifyContent="center" sx={{ p: 3 }}>
        <Typography variant="subtitle1" color="error">
          {error}
        </Typography>
      </Grid>
    );
  }

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* Welcome Banner */}
      <Grid item xs={12}>
        <WelcomeBanner />
      </Grid>

      {/* User Details */}
      <Grid item xs={12}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <MainCard sx={{ p: 3 }}>
            <Grid
              container
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Grid item>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{ bgcolor: 'primary.main', fontWeight: 'bold' }}
                  >
                    {user?.name?.[0] || 'U'}
                  </Avatar>
                  <div>
                    <Typography variant="h6" fontWeight="bold">
                      {user?.name || 'User'}
                    </Typography>
                    <div className='flex gap-4'>
                    <Typography variant="body2">
                      Total Bills: <strong>{bills?.length || 0}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Total Leaves: <strong>{leaves?.length || 0}</strong>
                    </Typography>
                    </div>
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
                  {user.isSuper && (
                    <>
                      <Button
                        onClick={downloadExcel}
                        variant="outlined"
                        color="primary"
                        size="small"
                      >
                        Export
                      </Button>
                      <Button
                        onClick={handleSeedProducts}
                        variant="outlined"
                        color="primary"
                        size="small"
                      >
                        Import Products
                      </Button>
                    </>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </MainCard>
        </motion.div>
      </Grid>

      {/* Low Stock Preview */}
      <Grid item xs={12}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <LowStockPreview />
        </motion.div>
      </Grid>
    </Grid>
  );
}
