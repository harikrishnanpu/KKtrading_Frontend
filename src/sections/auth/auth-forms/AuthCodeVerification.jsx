import { useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import OtpInput from 'react18-input-otp';

// project-imports
import AnimateButton from 'components/@extended/AnimateButton';
import { ThemeMode } from 'config';

// ============================|| STATIC - CODE VERIFICATION ||============================ //

export default function AuthCodeVerification() {
  const theme = useTheme();
  const [otp, setOtp] = useState();

  const borderColor = theme.palette.mode === ThemeMode.DARK ? theme.palette.secondary[200] : theme.palette.secondary.light;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <OtpInput
          value={otp}
          onChange={(otp) => setOtp(otp)}
          numInputs={4}
          containerStyle={{ justifyContent: 'space-between' }}
          inputStyle={{
            width: '100%',
            margin: '8px',
            padding: '10px',
            border: '1px solid',
            borderColor: { borderColor },
            borderRadius: 4,
            ':hover': { borderColor: theme.palette.primary.main }
          }}
          focusStyle={{
            outline: 'none',
            boxShadow: theme.customShadows.primary,
            border: '1px solid',
            borderColor: theme.palette.primary.main
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <AnimateButton>
          <Button disableElevation fullWidth size="large" type="submit" variant="outlined">
            Continue
          </Button>
        </AnimateButton>
      </Grid>
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography>Not received Code?</Typography>
          <Typography variant="body1" sx={{ minWidth: 85, ml: 2, textDecoration: 'none', cursor: 'pointer' }} color="primary">
            Resend code
          </Typography>
        </Stack>
      </Grid>
    </Grid>
  );
}
