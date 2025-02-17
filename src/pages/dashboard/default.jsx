// DashboardDefault.jsx

import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { keyframes } from '@mui/system';

// project-imports
import WelcomeBanner from 'sections/dashboard/default/WelcomeBanner';
import PreviewDataCard from 'components/dashboard/previewDataCard';  // Ensure this path is correct
import PreviewDataChart from 'components/dashboard/previewDataChart'; // Ensure this path is correct
import LowStockPreview from 'components/dashboard/lowstockPreview';   // Ensure this path is correct
import TotalIncome from 'sections/widget/chart/TotalIncome';          // Ensure this path is correct
import MainCard from 'components/MainCard';
import { ThemeMode } from 'config';

// Asset imports
import WelcomeImage from 'assets/images/analytics/welcome-banner.png';
import cardBack from 'assets/images/widget/img-dropbox-bg.svg';

// icons
import {
  ArrowUp,
  ArrowDown,
  Wallet3,
  Book,
  CloudChange,
  Calendar,
  ArrowSwapHorizontal,
  ShoppingCart,
  Receipt,
  RotateLeft,
  Danger
} from 'iconsax-react';

// API instance
import api from 'pages/api'; // Adjust to your actual API import if needed
import { Stack } from '@mui/material';

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
              KK Trading 1.0.0
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
  const cardsConfig = [
    {
      key: 'bills',
      title: 'Total Bills',
      count: dashboardData.totalBills ?? 0,
      monthly: dashboardData.monthlyBills ?? Array(12).fill(0),
      iconPrimary: <ShoppingCart size={24} color={theme.palette.success.main} />,
      color: theme.palette.success.main,
      percentage: (
        <Typography
          color="success"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <ArrowUp size={16} style={{ transform: 'rotate(45deg)' }} /> 0%
        </Typography>
      )
    },
    {
      key: 'purchases',
      title: 'Total Purchases',
      count: dashboardData.totalPurchases ?? 0,
      monthly: dashboardData.monthlyPurchases ?? Array(12).fill(0),
      iconPrimary: <Receipt size={24} color={theme.palette.info.main} />,
      color: theme.palette.info.main,
      percentage: (
        <Typography
          color="info.main"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <ArrowUp size={16} style={{ transform: 'rotate(45deg)' }} /> 0%
        </Typography>
      )
    },
    {
      key: 'returns',
      title: 'Total Returns',
      count: dashboardData.totalReturns ?? 0,
      monthly: dashboardData.monthlyReturns ?? Array(12).fill(0),
      iconPrimary: <RotateLeft size={24} color={theme.palette.primary.main} />,
      color: theme.palette.primary.main,
      percentage: (
        <Typography
          color="primary.main"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <ArrowUp size={16} style={{ transform: 'rotate(45deg)' }} /> 0%
        </Typography>
      )
    },
    {
      key: 'damages',
      title: 'Total Damages',
      count: dashboardData.totalDamages ?? 0,
      monthly: dashboardData.monthlyDamages ?? Array(12).fill(0),
      iconPrimary: <Danger size={24} color={theme.palette.error.main} />,
      color: theme.palette.error.main,
      percentage: (
        <Typography
          color="error.main"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <ArrowDown size={16} style={{ transform: 'rotate(-45deg)' }} /> 0%
        </Typography>
      )
    },
    {
      key: 'lowStock',
      title: 'Low Stock Items',
      count: dashboardData.totalLowStock ?? 0,
      monthly: dashboardData.monthlyLowStock ?? Array(12).fill(0),
      iconPrimary: <ArrowDown size={24} color={theme.palette.warning.main} />,
      color: theme.palette.warning.main,
      percentage: (
        <Typography
          color="warning.main"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <ArrowDown size={16} style={{ transform: 'rotate(-45deg)' }} /> 0%
        </Typography>
      )
    },
    {
      key: 'deliveries',
      title: 'Total Deliveries',
      count: dashboardData.totalDeliveries ?? 0,
      monthly: dashboardData.monthlyDeliveries ?? Array(12).fill(0),
      iconPrimary: (
        <ArrowSwapHorizontal size={24} color={theme.palette.secondary.main} />
      ),
      color: theme.palette.secondary.main,
      percentage: (
        <Typography
          color="secondary.main"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <ArrowUp size={16} style={{ transform: 'rotate(45deg)' }} /> 0%
        </Typography>
      )
    }
  ];

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* Welcome Banner */}
      <Grid item xs={12}>
        <WelcomeBanner />
      </Grid>

      {/* Low Stock Preview Section */}
      <Grid item xs={12} md={12}>
        <LowStockPreview />
      </Grid>

      {/* Loop Over Our 6 Cards */}
      {cardsConfig.map((card) => (
        <Grid item xs={12} sm={6} lg={3} key={card.key}>
          <PreviewDataCard
            title={card.title}
            count={card.count}
            iconPrimary={card.iconPrimary}
            percentage={card.percentage}
          >
            {/* Insert the monthly sparkline-style bar chart */}
            <PreviewDataChart
              color={card.color}
              data={card.monthly}
              height={50} // Sparkline-like height
            />
          </PreviewDataCard>
        </Grid>
      ))}

      {/* Additional Rows */}
      {/* <Grid item xs={12} md={6}>
        <TotalIncome />
      </Grid> */}
    </Grid>
  );
}
