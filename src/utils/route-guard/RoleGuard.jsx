import { Navigate, Outlet } from 'react-router-dom';
import useAuth from 'hooks/useAuth';

const RoleGuard = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if(!user.isEmployee){
    return <Navigate to="/employee" replace />;
  }

  
  if(allowedRoles){
    const hasAccess = user.role && allowedRoles.includes(user.role);  
    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }


  return <Outlet />;
};


export default RoleGuard;
