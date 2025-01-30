import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';

// third-party
import ReactApexChart from 'react-apexcharts';

// project-imports
import { ThemeMode } from 'config';

// ==============================|| CHART - ECOMMERCE DATA CHART ||============================== //

export default function EcommerceDataChart({ color, height }) {
  const theme = useTheme();
  const mode = theme.palette.mode;

  const months = ['January', 'February', 'March', 'April', 'May', 'June'];

  // chart options
  const areaChartOptions = {
    chart: {
      id: 'new-stack-chart',
      type: 'bar',
      sparkline: {
        enabled: true,
      },
      toolbar: {
        show: false,
      },
      offsetX: -2,
    },
    dataLabels: {
      enabled: false,
    },
    plotOptions: {
      bar: {
        borderRadius: 2,
        columnWidth: '80%',
      },
    },
    xaxis: {
      categories: months, // Assign the months as categories for x-axis
      crosshairs: {
        width: 1,
      },
    },
    tooltip: {
      y: {
        formatter: (val, opts) => {
          const month = months[opts.dataPointIndex]; // Get the month name based on the index
          return `${month}: ${val}`;
        },
      },
    },
  };

  const { primary, secondary } = theme.palette.text;
  const line = theme.palette.divider;

  const [options, setOptions] = useState(areaChartOptions);

  useEffect(() => {
    setOptions((prevState) => ({
      ...prevState,
      colors: [color],
      theme: {
        mode: mode === ThemeMode.DARK ? 'dark' : 'light',
      },
    }));
  }, [color, mode, primary, secondary, line, theme]);

  const [series] = useState([
    {
      name: 'Users',
      data: [10, 15, 25, 20, 22, 25], // Monthly user data
    },
  ]);

  return <ReactApexChart options={options} series={series} type="bar" height={height || 50} />;
}

EcommerceDataChart.propTypes = {
  color: PropTypes.string,
  height: PropTypes.number,
};
