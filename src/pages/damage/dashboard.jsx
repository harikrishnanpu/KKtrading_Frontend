import React, { useState, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

// project imports (adjust paths as needed)
import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import InvoiceWidgetCard from 'sections/apps/invoice/InvoiceWidgetCard';
import InvoiceIncomeAreaChart from 'sections/apps/invoice/InvoiceIncomeAreaChart';
import InvoiceUserList from 'sections/apps/invoice/InvoiceUserList';
import InvoiceNotificationList from 'sections/apps/invoice/InvoiceNotificationList';
import InvoicePieChart from 'sections/apps/invoice/InvoicePieChart';
import InvoiceCard from 'sections/apps/invoice/InvoiceCard';
import api from 'pages/api';

export default function Dashboard() {
  const theme = useTheme();

  // Select "monthly" or "weekly"
  const [reportPeriod, setReportPeriod] = useState('monthly');

  // States for the data fetched from backend
  const [widgetData, setWidgetData] = useState([]);
  const [chartSeries, setChartSeries] = useState([]);
  const [xCategories, setXCategories] = useState([]);

  // If you want to highlight a clicked widget, like before:
  const [activeChartIndex, setActiveChartIndex] = useState(null);

  // ============ FETCH DATA =============
  const fetchDashboardData = async (period) => {
    try {
      const response = await api.get(
        `/api/chart/invoice/dashboard/summary?period=${period}`
      );
      const data = await response.data;

      if (data.widgetData) {
        setWidgetData(data.widgetData);
      }
      if (data.chartData) {
        setChartSeries(data.chartData);
      }
      if (data.sortedMonthKeys) {
        setXCategories(data.sortedMonthKeys);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  // Fetch data on mount and whenever `reportPeriod` changes
  useEffect(() => {
    fetchDashboardData(reportPeriod);
  }, [reportPeriod]);

  // ============ HANDLERS =============
  // If you still want to handle a user click on a widget to "change" the chart:
  const handleWidgetClick = (index) => {
    setActiveChartIndex(index);
    // Or if you want to do something specific with chartSeries, do it here
  };

  // ============ BREADCRUMB LINKS =============
  const breadcrumbLinks = [
    { title: 'Home', to: "/" },
    { title: 'Invoice Summary' }
  ];

  // ============ RENDER =============
  return (
    <>
      <Breadcrumbs custom heading="My Dashboard" links={breadcrumbLinks} />

      {/* Top bar with Monthly/Weekly selector */}
      <Box sx={{ mb: 2 }}>
        <FormControl size="small">
          <InputLabel id="report-period-label">Period</InputLabel>
          <Select
            labelId="report-period-label"
            id="report-period"
            value={reportPeriod}
            label="Period"
            onChange={(e) => setReportPeriod(e.target.value)}
          >
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2.5}>
        {/* Left side: main content */}
        <Grid item xs={12} lg={9}>
          <MainCard>
            <Grid container spacing={2}>
              {/* Widget cards */}
              {widgetData.map((data, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Box
                    onClick={() => handleWidgetClick(index)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <InvoiceWidgetCard
                      title={data.title}
                      // If the backend sends numeric amounts, format them if desired
                      count={`₹${(data.count || 0).toLocaleString()}`}
                      percentage={data.percentage}
                      isLoss={data.isLoss}
                      invoice={data.invoice}
                      color={data.color}
                      isActive={index === activeChartIndex}
                    />
                  </Box>
                </Grid>
              ))}

              {/* The main chart: show `chartSeries` and use xCategories as the labels */}
              <Grid item xs={12}>
                <InvoiceIncomeAreaChart
                  series={chartSeries}
                  categories={xCategories} 
                  // Make sure your InvoiceIncomeAreaChart can accept a `categories` prop
                />
              </Grid>
            </Grid>
          </MainCard>
        </Grid>

        {/* Right side: some extra cards/sections */}
        <Grid item xs={12} lg={3}>
          <InvoiceCard />
        </Grid>

        <Grid item sm={6} md={4} xs={12}>
          <InvoiceUserList />
        </Grid>
        <Grid item sm={6} md={4} xs={12}>
          <InvoicePieChart />
        </Grid>
        <Grid item sm={12} md={4} xs={12}>
          <InvoiceNotificationList />
        </Grid>
      </Grid>
    </>
  );
}
