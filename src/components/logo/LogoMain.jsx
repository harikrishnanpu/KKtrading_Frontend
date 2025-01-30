// material-ui
import { useTheme } from '@mui/material/styles';

 import logoDark from 'assets/images/logo-main.png';
import logo from 'assets/images/logo-main.png';


// ==============================|| LOGO SVG ||============================== //

export default function LogoMain() {
  const theme = useTheme();
  const ThemeMode = {Dark: 'dark', LIGHT: 'light'};

  return (
 <img src={theme.palette.mode === ThemeMode.DARK ? logoDark : logo} alt="icon logo" width="200" />


  );
}
