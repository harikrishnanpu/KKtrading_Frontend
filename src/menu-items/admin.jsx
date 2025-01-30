// third-party
import { FormattedMessage } from 'react-intl';

// assets
import {  ShoppingCart, Receipt, RotateLeft, Danger, Home, SecurityUser} from 'iconsax-react';

// type

// icons
// icons
const icons = {
  invoice:  ShoppingCart,
  purchase: Receipt,
  return: RotateLeft,
  damage: Danger,
  sub: SecurityUser
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const admin = {
  id: 'Admin',
  title: <FormattedMessage id="Admin" />,
  type: 'group',
  children: [
    {
      id: 'Dashboard',
      title: <FormattedMessage id="Dashboard" />,
      type: 'collapse',
      url: '/admin/invoice',
      icon: icons.invoice,
      children: [
        {
          id: 'All',
          title: <FormattedMessage id="All Estimates" />,
          type: 'item',
          url: '/admin/invoice/',
          target: false,
          breadcrumbs: false
        },
        {
          id: 'Profit / Loss',
          title: <FormattedMessage id="Profit /Loss" />,
          type: 'item',
          url: '/admin/invoice/p&f',
          target: false,
          breadcrumbs: false
        },
      ]
    }
  ]
};

export default admin;


