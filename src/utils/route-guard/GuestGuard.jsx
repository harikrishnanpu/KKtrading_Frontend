import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { APP_DEFAULT_PATH } from 'config';
import useAuth from 'hooks/useAuth';
import { setAuthHeaders } from 'pages/api';


export default function GuestGuard({ children }) {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

    useEffect(() => {
      if (user) {
        setAuthHeaders(user);
      }
    }, [user]);


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
