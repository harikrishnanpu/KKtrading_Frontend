import { Link, useNavigate } from 'react-router-dom';
// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
// project-imports
import Logo from 'components/logo';
import AuthWrapper from 'sections/auth/AuthWrapper';
import AuthLogin from 'sections/auth/auth-forms/AuthLogin';
// assets
import { Divider } from '@mui/material';

export default function Login() {

  return (
    <AuthWrapper>
      <Grid container spacing={3}>
        <Grid item xs={12} sx={{ textAlign: 'center' }}>
          <Logo />
        </Grid>
        <Divider />
        <Grid item xs={12}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
            <Typography variant="h3">Login</Typography>
            <Typography
              component={Link}
              to={'/register'}
              variant="body1"
              sx={{ textDecoration: 'none' }}
              color="primary"
            >
              Don&apos;t have an account?
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={12}>
          <AuthLogin forgot="/auth/forgot-password" />
        </Grid>
      </Grid>

    </AuthWrapper>
  );
}
