import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// project-imports
import useAuth from 'hooks/useAuth';

// ==============================|| AUTH GUARD ||============================== //

export default function AuthGuard({ children }) {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', {
        state: {
          from: location.pathname
        },
        replace: true
      });
    }else if(isLoggedIn && user && !user.isEmployee){
  navigate('/employee', {
    state: {
      from: ' '
    },
    replace: true
  });
}
        // If the user tries to access "/users/all" but isn't an Admin & Super
  else if (location.pathname === '/admin/allusers/' && (!user?.isAdmin || !user?.isSuper)) {
          navigate('/', { replace: true }); // Redirect to home or another safe route
      }
  }, [isLoggedIn, navigate, location]);

  return children;
}

AuthGuard.propTypes = { children: PropTypes.any };
