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

  const clearAllCaches = () => {
    console.log('Clearing all caches...');

    // 1️⃣ Clear KeepAlive cache
    dropScope();
    
    // 2️⃣ Clear browser cache
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }

    // 3️⃣ Clear localStorage & sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // 4️⃣ Clear service worker cache if applicable
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }
  };

  // 1️⃣ Detect full page reload & clear all caches
  useEffect(() => {
    const wasReloaded = sessionStorage.getItem('appReloaded');

    if (!wasReloaded) {
      sessionStorage.setItem('appReloaded', 'true'); // Mark app as loaded
      clearAllCaches();
      
      // 5️⃣ Hard reload the page to ensure a fresh start
      setTimeout(() => {
        window.location.reload(true);
      }, 100); // Ensures cache is cleared first
    }
  }, []);
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
