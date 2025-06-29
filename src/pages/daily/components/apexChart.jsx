import { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import ReactApexChart from 'react-apexcharts';
import { ThemeMode } from 'config';

export default function ApexPieChart({ series = [], labels = [] }) {
  const theme = useTheme();
  const mode  = theme.palette.mode;

  /* palette helpers */
  const { primary } = theme.palette.text;
  const line       = theme.palette.divider;
  const backColor  = theme.palette.background.paper;
  const secondary  = theme.palette.primary[700];
  const primaryMain= theme.palette.primary.main;
  const successDark= theme.palette.success.main;
  const error      = theme.palette.error.main;
  const orangeDark = theme.palette.warning.main;

  /* build options (labels + colours are dynamic) */
  const [options, setOptions] = useState({
    chart : { type: 'pie', width: 450, height: 450 },
    labels,
    legend: {
      show: true,
      fontFamily: 'Inter var',
      offsetX: 10,
      offsetY: 10,
      markers: { width: 12, height: 12, radius: 5 },
      itemMargin: { horizontal: 25, vertical: 4 }
    },
    responsive: [
      {
        breakpoint: 450,
        chart: { width: 280, height: 280 },
        options: { legend: { show: false, position: 'bottom' } }
      }
    ]
  });

  useEffect(() => {
    const palette = [
      secondary,
      primaryMain,
      successDark,
      error,
      orangeDark
    ];
    setOptions((o) => ({
      ...o,
      labels,
      colors: palette.slice(0, labels.length),        // enough colours for every slice
      stroke: { colors: [backColor] },
      grid  : { borderColor: line },
      theme : { mode: mode === ThemeMode.DARK ? 'dark' : 'light' }
    }));
  }, [
    labels,
    mode,
    secondary,
    primaryMain,
    successDark,
    error,
    orangeDark,
    line,
    backColor
  ]);

  return <ReactApexChart options={options} series={series} type="pie" />;
}
