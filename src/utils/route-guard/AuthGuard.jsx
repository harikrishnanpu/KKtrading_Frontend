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
  const { dropScope } = useAliveController(); // Clears cached pages/components

  // 1️⃣ Clear cache if the app was fully reloaded
  useEffect(() => {
    if (!sessionStorage.getItem('appReloaded')) {
      sessionStorage.setItem('appReloaded', 'true'); // Mark that the app was reloaded
      dropScope(); // Clears all react-activation caches
      console.log('🔄 Cache cleared after full reload');
    }
  }, [dropScope]);

  // 2️⃣ Set authentication headers whenever the user changes
  useEffect(() => {
    if (user) {
      setAuthHeaders(user);
    }
  }, [user]);

  // 3️⃣ Handle authentication & role-based redirects
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
    } else if (user && !user.isEmployee) {
      navigate('/employee', { replace: true });
    } else if (location.pathname === '/admin/allusers/' && (!user?.isAdmin && !user?.isSuper)) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, user, location.pathname, navigate]);

  return children;
}

AuthGuard.propTypes = { children: PropTypes.any };
