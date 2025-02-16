// project import
import dashboard from './dashboard';
import support from './support';
import pages from './pages';
import apps from './apps';
import accounts from './accounts';
import payments from './payments';
import reports from './reports';
import driver from './driver';
import stocks from './stocks';
import estimate from './estimate';
import purchase from './purchase';

// ==============================|| MENU ITEMS ||============================== //

const menuItems = {
  items: [dashboard,estimate,purchase, apps, driver, payments, stocks, reports, accounts]
};

export default menuItems;
