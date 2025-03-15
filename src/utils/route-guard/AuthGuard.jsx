import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAliveController } from 'react-activation'; // Import for cache clearing

// project-imports
import useAuth from 'hooks/useAuth';
import { setAuthHeaders } from 'pages/api';

// ==============================|| AUTH GUARD ||============================== //

export default function AuthGuard({ children }) {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: userData } = useAuth();
  const { dropScope } = useAliveController(); // Used to clear all cached pages

  // 1️⃣ Check if the app was reloaded
  useEffect(() => {
    const wasReloaded = sessionStorage.getItem('appReloaded');

    if (!wasReloaded) {
      sessionStorage.setItem('appReloaded', 'true'); // Mark that the app was loaded
      dropScope(); // Clears all cached components/pages
      console.log('Cache cleared after reload');
    }
  }, []);

  // 2️⃣ Set auth headers when user data changes
  useEffect(() => {
    setAuthHeaders(userData);
  }, [userData]);

  // 3️⃣ Handle authentication & role-based redirects
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', {
        state: { from: location.pathname },
        replace: true
      });
    } else if (isLoggedIn && user && !user.isEmployee) {
      navigate('/employee', { state: { from: ' ' }, replace: true });
    } 
    // If user tries to access "/users/all" but isn't an Admin & Super
    else if (location.pathname === '/admin/allusers/' && (!user?.isAdmin || !user?.isSuper)) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, navigate, location]);

  return children;
}

AuthGuard.propTypes = { children: PropTypes.any };
