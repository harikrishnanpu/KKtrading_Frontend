// This is example of menu item without group for horizontal layout. There will be no children.

// third-party
import { Truck } from 'iconsax-react';
import { FormattedMessage } from 'react-intl';

// assets

// type

// icons
const icons = {
  delivery: Truck
};

// ==============================|| MENU ITEMS - SAMPLE PAGE ||============================== //

const driver = {
  id: 'Driver',
  title: <FormattedMessage id="Driver" />,
  type: 'group',
  children: [
    {
      id: 'Delivery',
      title: <FormattedMessage id="Delivery" />,
      type: 'item',
      url: '/driver/delivery',
      icon: icons.delivery,
    }
  ]
};

export default driver;
