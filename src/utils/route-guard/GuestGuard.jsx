import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAliveController } from 'react-activation'; // Clears KeepAlive cache

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

  // Function to clear ALL caches, local storage, session storage
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

  // 2️⃣ Set auth headers when user data changes
  useEffect(() => {
    setAuthHeaders(user);
  }, [user]);

  // 3️⃣ Redirect logged-in users
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
