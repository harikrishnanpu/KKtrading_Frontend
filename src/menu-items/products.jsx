// This is example of menu item without group for horizontal layout. There will be no children.
import { FormattedMessage } from 'react-intl';

// third-party
import { Warehouse } from '@mui/icons-material';

// assets

// type

// icons
const icons = {
  product: Warehouse
};

// ==============================|| MENU ITEMS - SAMPLE PAGE ||============================== //

const products = {
  id: 'Product',
  title: <FormattedMessage id="products" />,
  type: 'group',
  children: [
    {
      id: 'All Products',
      title: <FormattedMessage id="All Products" />,
      type: 'item',
      url: '/products/all',
      icon: icons.product,
    },
    {
        id: 'Low Stock Products',
        title: <FormattedMessage id="Low Stock Products" />,
        type: 'item',
        url: '/products/upcomming/lowstock',
        icon: icons.product,
      },
  ]
};

export default products;
