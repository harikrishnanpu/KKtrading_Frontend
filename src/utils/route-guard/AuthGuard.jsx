import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from 'hooks/useAuth';
import { setAuthHeaders } from 'pages/api';

export default function AuthGuard({ children }) {
  const { isLoggedIn, user, logout } = useAuth(); 
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      try {
        setAuthHeaders(user);
      } catch (err) {
        console.error('Failed to set auth headers:', err);
        logout();
        navigate('/login', { replace: true });
      }
    }
  }, [user, logout, navigate]);

  useEffect(() => {
    if (!isLoggedIn || !user) {
      logout();
      navigate('/login', { state: { from: location.pathname }, replace: true });
    } else if (user && !user.isEmployee) {
      navigate('/employee', { replace: true });
    }
  }, [isLoggedIn, user, location, navigate, logout]);

  return children;
}

AuthGuard.propTypes = {
  children: PropTypes.node.isRequired
};
