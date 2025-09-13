import { Navigate, Outlet } from 'react-router-dom';
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

export default LoginGuard;
