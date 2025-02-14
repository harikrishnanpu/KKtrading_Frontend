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

const purchase = {
  id: 'Purchase',
  title: <FormattedMessage id="Purchase" />,
  type: 'group',
      children: [
        {
          id: 'Create',
          title: <FormattedMessage id="Create Purchase" />,
          type: 'item',
          url: '/purchase/create/',
          target: false,
          breadcrumbs: false
        },
        {
          id: 'List',
          title: <FormattedMessage id="All Purchases" />,
          type: 'item',
          url: '/purchase/list/',
          target: false,
          breadcrumbs: true
        }
      ],
}

export default purchase;