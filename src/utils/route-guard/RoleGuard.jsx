// utils/route-guard/RoleGuard.tsx
import { Navigate, Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';
import useAuth from 'hooks/useAuth';

const RoleGuard = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = user.role && allowedRoles.includes(user.role);

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

RoleGuard.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default RoleGuard;
