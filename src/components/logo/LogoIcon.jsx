// material-ui
import { useTheme } from '@mui/material/styles';

import logoIconDark from 'assets/images/logo-sub.png';
import logoIcon from 'assets/images/logo-sub.png';


// ==============================|| LOGO ICON SVG ||============================== //

export default function LogoIcon() {
  const theme = useTheme();

  const ThemeMode = {Dark: 'dark', LIGHT: 'light'};

  return (
<img src={theme.palette.mode === ThemeMode.DARK ? logoIconDark : logoIcon} alt="icon logo" width="70" />

  );
}
