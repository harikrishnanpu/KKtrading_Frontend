// ==============================|| PREVIEW DATA CHART (SPARKLINE STYLE) ||============================== //

import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';

// third-party
import ReactApexChart from 'react-apexcharts';

// project-imports
import { ThemeMode } from 'config'; // Ensure this path is correct

export default function PreviewDataChart({ color, height, data, months }) {
  const theme = useTheme();
  const mode = theme.palette.mode;

  // 1. Define default months (12)
  const defaultMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  // If parent didn't supply a valid 12-length months array, use default
  const chartMonths = Array.isArray(months) && months.length === 12 ? months : defaultMonths;

  /**
   * 2. Always create a 12-element array for the chart data.
   *    - If the parent has fewer than 12 data points, fill the rest with 0.
   *    - If the parent provides more than 12, slice to 12.
   */
  let chartData = Array(12).fill(0);
  if (Array.isArray(data) && data.length > 0) {
    // Copy or slice up to 12 items into our fixed 12-length array
    const lengthToCopy = Math.min(data.length, 12);
    for (let i = 0; i < lengthToCopy; i++) {
      chartData[i] = data[i];
    }
  }

  // Determine a max value for y-axis to ensure at least some height even if all are 0
  const maxDataValue = Math.max(...chartData, 1);

  // Base chart options for a sparkline-style bar chart
  const baseOptions = {
    chart: {
      id: 'preview-data-chart',
      type: 'bar',
      sparkline: {
        enabled: true // Minimal sparkline style (hides axes)
      },
      toolbar: { show: false },
      offsetX: -2,
      animations: {
        enabled: false // Turn off animations if you prefer
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 2,
        columnWidth: '80%'
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: chartMonths,
      crosshairs: { width: 1 },
      labels: { show: false }, // Hide X-axis labels to keep sparkline style
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      show: false,
      min: 0,
      max: maxDataValue // At least 1, so 0-value bars have space
    },
    tooltip: {
      enabled: true,
      followCursor: true,
      intersect: true,
      shared: false,
      x: { show: false },
      y: {
        formatter: (val, opts) => {
          const monthIndex = opts.dataPointIndex;
          const monthName = chartMonths[monthIndex];
          return `${monthName}: ${val}`;
        }
      }
    },
    theme: {
      mode: mode === ThemeMode.DARK ? 'dark' : 'light'
    },
    colors: [color || theme.palette.primary.main]
  };

  // Store chart options in state so they can update if color/mode changes
  const [options, setOptions] = useState(baseOptions);

  useEffect(() => {
    setOptions((prevOptions) => ({
      ...prevOptions,
      colors: [color || theme.palette.primary.main],
      theme: {
        mode: mode === ThemeMode.DARK ? 'dark' : 'light'
      },
      tooltip: {
        ...prevOptions.tooltip,
        y: {
          ...prevOptions.tooltip.y,
          formatter: (val, opts) => {
            const monthIndex = opts.dataPointIndex;
            const monthName = chartMonths[monthIndex];
            return `${monthName}: ${val}`;
          }
        }
      }
    }));
  }, [color, mode, theme, chartMonths]);

  // Series with the validated 12 bars
  const [series] = useState([
    {
      name: 'Data',
      data: chartData
    }
  ]);

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="bar"
      height={height || 50}
    />
  );
}

PreviewDataChart.propTypes = {
  color: PropTypes.string,
  height: PropTypes.number,
  data: PropTypes.arrayOf(PropTypes.number).isRequired, // Array from parent
  months: PropTypes.arrayOf(PropTypes.string)           // Optional 12 months
};

PreviewDataChart.defaultProps = {
  color: '',
  height: 50,
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
};
