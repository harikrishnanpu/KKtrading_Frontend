import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// project-imports
import { APP_DEFAULT_PATH } from 'config';
import useAuth from 'hooks/useAuth';

// ==============================|| GUEST GUARD ||============================== //

export default function GuestGuard({ children }) {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoggedIn) {
      // If the user is an employee, redirect to the default path.
      // Otherwise (e.g. if not an employee), redirect to /employee.
      if (user && user.isEmployee) {
        navigate(
          location?.state?.from ? location.state.from : APP_DEFAULT_PATH,
          { state: { from: '' }, replace: true }
        );
      } else {
        navigate('/employee', { state: { from: '' }, replace: true });
      }
    }
  }, [isLoggedIn, user, navigate, location]);

  return children;
}

GuestGuard.propTypes = { children: PropTypes.any };
