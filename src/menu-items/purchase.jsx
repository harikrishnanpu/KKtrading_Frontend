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
          breadcrumbs: false
        },
        {
          id: 'Purchase Request',
          title: <FormattedMessage id="Purchase Request" />,
          type: 'item',
          url: '/purchase/list-purchase-request',
          target: false,
          breadcrumbs: false
        }
      ],
}

export default purchase;