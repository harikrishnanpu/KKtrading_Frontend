// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { SecurityUser, UserOctagon, Buildings } from 'iconsax-react';
import { FaTruck } from 'react-icons/fa';

// type

// icons
// icons
const icons = {
  customer:  UserOctagon,
  supplier: Buildings,
  return: UserOctagon,
  damage: UserOctagon,
  transport: FaTruck,
  sub: SecurityUser
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const payments = {
  id: 'Payments',
  title: <FormattedMessage id="Payments" />,
  type: 'group',
  children: [
    {
      id: 'Supplier',
      title: <FormattedMessage id="Supplier" />,
      type: 'item',
      url: '/supplier/payment',
      icon: icons.supplier
    },
    {
        id: 'Transportation',
        title: <FormattedMessage id="Transportation" />,
        type: 'item',
        url: '/transport/payment',
        icon: icons.transport
      },
      {
        id: 'Bill Payments',
        title: <FormattedMessage id="Bill Payments" />,
        type: 'item',
        url: '/invoice/payment',
        icon: icons.customer
      },
    
  ]
};

export default payments;


