// DashboardDefault.jsx

import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

// project-imports
import WelcomeBanner from 'sections/dashboard/default/WelcomeBanner';
import PreviewDataCard from 'components/dashboard/previewDataCard';  // Ensure this path is correct
import PreviewDataChart from 'components/dashboard/previewDataChart'; // Ensure this path is correct
import LowStockPreview from 'components/dashboard/lowstockPreview';   // Ensure this path is correct
import TotalIncome from 'sections/widget/chart/TotalIncome';          // Ensure this path is correct

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

  // Loading state
  if (loading) {
    return (
      <Grid container justifyContent="center" sx={{ p: 3 }}>
        <Typography variant="subtitle1">Loading Dashboard Data...</Typography>
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
      // Default to 0 if not provided
      count: dashboardData.totalBills ?? 0,
      // Default to an array of 12 zeros if missing
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
        <ArrowSwapHorizontal
          size={24}
          color={theme.palette.secondary.main}
        />
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
