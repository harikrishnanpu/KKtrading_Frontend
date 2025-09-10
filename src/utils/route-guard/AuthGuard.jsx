import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// project-imports
import useAuth from 'hooks/useAuth';
import { setAuthHeaders } from 'pages/api';


export default function AuthGuard({ children }) {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      setAuthHeaders(user);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
    } else if (user && !user.isEmployee) {
      navigate('/employee', { replace: true });
    } else if (location.pathname == '/admin/allusers' && !user?.isSuper) {
      navigate('/', { replace: true });
    }

  }, [isLoggedIn, user, location, navigate]);

  return children;
}

AuthGuard.propTypes = { children: PropTypes.any };
