import { useState, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

// third-party
import ReactApexChart from 'react-apexcharts';
import api from 'pages/api';

// project-imports
import MainCard from 'components/MainCard';
import Dot from 'components/@extended/Dot';
import MoreIcon from 'components/@extended/MoreIcon';
import { ThemeMode } from 'config';

// chart options
const defaultChartOptions = {
  chart: {
    width: 350,
    type: 'donut',
    stacked: false,
    zoom: {
      enabled: false,
    },
  },
  plotOptions: {
    donut: {
      size: '15%',
    },
  },
  stroke: {
    width: 0,
  },
  dataLabels: {
    enabled: false,
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: {
          width: 200,
        },
      },
    },
  ],
  legend: {
    show: false,
  },
};

// ==============================|| INVOICE - PIE CHART ||============================== //

export default function InvoicePieChart({loading, series}) {
  const theme = useTheme();
  const mode = theme.palette.mode;

  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const { primary, secondary } = theme.palette.text;
  const line = theme.palette.divider;

  const [options, setOptions] = useState(defaultChartOptions);


  useEffect(() => {
    setOptions((prevState) => ({
      ...prevState,
      labels: ['Pending', 'Paid', 'Overdue', 'Draft'],
      colors: [
        theme.palette.warning.main,
        theme.palette.success.main,
        theme.palette.error.main,
        theme.palette.primary.lighter,
      ],
      tooltip: {
        custom: function ({ series, seriesIndex, w }) {
          return `<div class="pie_box">
              <span class="PieDot" style='background-color:${w.globals.colors[seriesIndex]}'></span>
              <span class="fontsize">${w.globals.labels[seriesIndex]}: 
                <span class="fontsizeValue">${series[seriesIndex]}%</span>
              </span>
            </div>`;
        },
      },
      theme: {
        mode: mode === ThemeMode.DARK ? 'dark' : 'light',
      },
    }));
  }, [mode, theme]);

  //sx style
  const DotSize = { display: 'flex', alignItems: 'center', gap: 1 };
  const ExpenseSize = { fontSize: '0.875rem', lineHeight: '1.5rem', fontWeight: 500 };

  if (loading) {
    return (
      <MainCard title="Total Expenses" loading>
        {/* You can add a loader here */}
      </MainCard>
    );
  }

  return (
    <MainCard
      title="Total Expenses"
      secondary={
        <IconButton edge="end" aria-label="more" color="secondary" sx={{ transform: 'rotate(90deg)' }}>
          <MoreIcon />
        </IconButton>
      }
      sx={{
        '.pie_box': { padding: 2, display: 'flex', gap: 1, alignItems: 'center', width: '100%' },
        '.PieDot': { width: 12, height: 12, borderRadius: '50%' },
        '.fontsize': { fontWeight: 500, fontSize: '0.875rem', lineHeight: '1.375rem', color: 'secondary.main' },
        '.fontsizeValue': { color: 'secondary.dark' },
      }}
    >
      <Grid container alignItems="center" spacing={1}>
        <Grid item xs={12} sx={{ '& .apexcharts-canvas': { margin: '0 auto' } }}>
          <ReactApexChart options={options} series={series} type="donut" height={downMD ? '100%' : 265} />
        </Grid>
        {['Pending', 'Paid', 'Overdue', 'Draft'].map((status, index) => (
          <Grid item xs={12} key={status}>
            <Grid container alignItems="center">
              <Grid item xs={6} sm={7} md={8} lg={9} xl={10} sx={DotSize}>
                <Dot color={getDotColor(status, theme)} size={12} />
                <Typography variant="subtitle1" color="text.secondary">
                  {status}
                </Typography>
              </Grid>
              <Grid item sx={ExpenseSize}>
                {/* Displaying count, adjust if you want to show amounts */}
                {series[index]}%
              </Grid>
            </Grid>
          </Grid>
        ))}
      </Grid>
    </MainCard>
  );
}

// Helper function to map status to dot colors
const getDotColor = (status, theme) => {
  switch (status) {
    case 'Pending':
      return 'warning';
    case 'Paid':
      return 'success';
    case 'Overdue':
      return 'error';
    case 'Draft':
      return 'primary.lighter';
    default:
      return 'grey';
  }
};
