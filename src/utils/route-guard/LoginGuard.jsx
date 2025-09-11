// utils/route-guard/LoginGuard.tsx
import { Navigate, Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';
import useAuth from 'hooks/useAuth';

const LoginGuard = () => {
  const { user } = useAuth();
  
  if (user && user.isEmployee) {
    return <Navigate to="/dashboard/default" replace />;
  }

  if(user && !user.isEmployee){
    return <Navigate to="/employee" replace />;
}

return <Outlet />;
};

LoginGuard.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default LoginGuard;
