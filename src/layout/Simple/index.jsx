import PropTypes from 'prop-types';
import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

// project import
import Loader from 'components/Loader';
import { SimpleLayoutType } from 'config';


// ==============================|| LAYOUT - SIMPLE / LANDING ||============================== //

export default function SimpleLayout({ layout = SimpleLayoutType.SIMPLE }) {
  return (
    <Suspense fallback={<Loader />}>
      <Outlet />
    </Suspense>
  );
}

SimpleLayout.propTypes = { layout: PropTypes.any };
