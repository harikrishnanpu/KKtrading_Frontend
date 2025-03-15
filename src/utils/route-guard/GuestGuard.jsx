import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAliveController } from 'react-activation'; // Import for cache clearing

// project imports
import { APP_DEFAULT_PATH } from 'config';
import useAuth from 'hooks/useAuth';
import { setAuthHeaders } from 'pages/api';

// ==============================|| GUEST GUARD ||============================== //

export default function GuestGuard({ children }) {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { dropScope } = useAliveController(); // Clears react-activation cache

  // 1️⃣ Set auth headers when user data changes
  useEffect(() => {
    setAuthHeaders(user);
  }, [user]);

  // 2️⃣ Clear cache on a full page reload
  useEffect(() => {
    const wasReloaded = sessionStorage.getItem('appReloaded');

    if (!wasReloaded) {
      sessionStorage.setItem('appReloaded', 'true'); // Mark app as loaded
      dropScope(); // Clears all cached pages
      console.log('Cache cleared after reload');
    }
  }, []);

  // 3️⃣ Redirect logged-in users away from guest-only pages
  useEffect(() => {
    if (isLoggedIn) {
      if (user?.isEmployee) {
        navigate(location?.state?.from || APP_DEFAULT_PATH, {
          state: { from: '' },
          replace: true
        });
      } else {
        navigate('/employee', { state: { from: '' }, replace: true });
      }
    }
  }, [isLoggedIn, user, navigate, location]);

  return children;
}

GuestGuard.propTypes = { children: PropTypes.any };
