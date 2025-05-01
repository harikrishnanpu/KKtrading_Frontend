// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { Receipt21, Receipt1, Sun1 } from 'iconsax-react';

// type

// icons
// icons
const icons = {
    sales: Receipt21,
    purchase: Receipt1,
    daily: Sun1
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const reports = {
  id: 'Reports',
  title: <FormattedMessage id="Reports" />,
  type: 'group',
  children: [
    {
      id: 'Sales',
      title: <FormattedMessage id="Sales Report" />,
      type: 'item',
      url: '/invoice/report',
      icon: icons.sales,
      breadcrumbs: false
    },
    {
        id: 'Purchase',
        title: <FormattedMessage id="Purchase Report" />,
        type: 'item',
        url: '/purchase/report',
        icon: icons.purchase,
        breadcrumbs: false
      },
      {
        id: 'Daily',
        title: <FormattedMessage id="Daily Report" />,
        type: 'item',
        url: '/daily/report',
        icon: icons.daily,
        breadcrumbs: false
      },
    
  ]
};

export default reports;


