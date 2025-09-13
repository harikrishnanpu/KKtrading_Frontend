import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from 'hooks/useAuth';
import { setAuthHeaders } from 'pages/api';
import { useAliveController } from 'react-activation'; 


export default function AuthGuard({ children }) {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { dropScope } = useAliveController(); 

    useEffect(() => {
    if (!sessionStorage.getItem('appReloaded')) {
      sessionStorage.setItem('appReloaded', 'true');
      dropScope();
      console.log('Cache cleared after full reload');
    }
  }, [dropScope]);

  useEffect(() => {
    if (user) {
      setAuthHeaders(user);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
    }else if (user && !user.isEmployee){
      navigate('/employee', { replace: true });
    }
  }, [isLoggedIn, user, location, navigate]);

  return children;
}

AuthGuard.propTypes = { children: PropTypes.any };
