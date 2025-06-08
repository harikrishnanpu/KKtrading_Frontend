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
  sub: SecurityUser,
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const estimate = {
  id: 'Estimate',
  title: <FormattedMessage id="Estimate" />,
  type: 'group',
      children: [
        {
          id: 'Create',
          title: <FormattedMessage id="Create Estimate" />,
          type: 'item',
          url: '/invoice/create/',
          target: false,
          breadcrumbs: false
        },
        {
          id: 'List',
          title: <FormattedMessage id="All Estimates" />,
          type: 'item',
          url: '/invoice/list/',
          target: false,
          breadcrumbs: false
        },
        {
          id: 'Need To Purchase',
          title: <FormattedMessage id="Need To Purchase" />,
          type: 'item',
          url: '/invoice/need-to-purchase/',
          target: false,
          breadcrumbs: false
        }

    ],
}

export default estimate;