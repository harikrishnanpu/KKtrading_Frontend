// project-imports
import { ThemeMode } from 'config';

// ==============================|| PRESET THEME - DEFAULT (RED THEME) ||============================== //

export default function Default(mode) {
  const contrastText = '#fff';

  // Define primary (red) color palette
  let primaryColors = ['#fde8e8', '#f9bebe', '#f58e8e', '#f26b6b', '#f05252', '#e24444', '#d63939', '#c92e2e', '#b72424', '#a11818'];
  let secondaryColors = ['#f8f9fa', '#eaeaea', '#dbdbdb', '#cccccc', '#bbbbbb', '#999999', '#777777', '#555555', '#333333', '#111111'];
  let errorColors = ['#fde8e8', '#f9bebe', '#f58e8e', '#f26b6b', '#f05252'];
  let warningColors = ['#fff4e5', '#ffe5b8', '#ffd488', '#ffc155', '#ffab26'];
  let infoColors = ['#e0f7fa', '#b3ebf2', '#81d4fa', '#4fc3f7', '#29b6f6'];
  let successColors = ['#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a'];

  if (mode === ThemeMode.DARK) {
    primaryColors = ['#a11818', '#b72424', '#c92e2e', '#d63939', '#e24444', '#f05252', '#f26b6b', '#f58e8e', '#f9bebe', '#fde8e8'];
    secondaryColors = ['#111111', '#333333', '#555555', '#777777', '#999999', '#bbbbbb', '#cccccc', '#dbdbdb', '#eaeaea', '#f8f9fa'];
    errorColors = ['#a11818', '#b72424', '#c92e2e', '#d63939', '#e24444'];
    warningColors = ['#ffab26', '#ffc155', '#ffd488', '#ffe5b8', '#fff4e5'];
    infoColors = ['#29b6f6', '#4fc3f7', '#81d4fa', '#b3ebf2', '#e0f7fa'];
    successColors = ['#66bb6a', '#81c784', '#a5d6a7', '#c8e6c9', '#e8f5e9'];
  }

  return {
    primary: {
      lighter: primaryColors[0],
      100: primaryColors[1],
      200: primaryColors[2],
      light: primaryColors[3],
      400: primaryColors[4],
      main: primaryColors[5],
      dark: primaryColors[6],
      700: primaryColors[7],
      darker: primaryColors[8],
      900: primaryColors[9],
      contrastText
    },
    secondary: {
      lighter: secondaryColors[0],
      100: secondaryColors[1],
      200: secondaryColors[2],
      light: secondaryColors[3],
      400: secondaryColors[4],
      500: secondaryColors[5],
      main: secondaryColors[6],
      dark: secondaryColors[7],
      800: secondaryColors[8],
      darker: secondaryColors[9],
      contrastText
    },
    error: {
      lighter: errorColors[0],
      light: errorColors[1],
      main: errorColors[2],
      dark: errorColors[3],
      darker: errorColors[4],
      contrastText
    },
    warning: {
      lighter: warningColors[0],
      light: warningColors[1],
      main: warningColors[2],
      dark: warningColors[3],
      darker: warningColors[4],
      contrastText
    },
    info: {
      lighter: infoColors[0],
      light: infoColors[1],
      main: infoColors[2],
      dark: infoColors[3],
      darker: infoColors[4],
      contrastText
    },
    success: {
      lighter: successColors[0],
      light: successColors[1],
      main: successColors[2],
      dark: successColors[3],
      darker: successColors[4],
      contrastText
    }
  };
}
