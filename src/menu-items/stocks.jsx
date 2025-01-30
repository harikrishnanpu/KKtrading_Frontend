// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { Edit, TableDocument } from 'iconsax-react';

// type

// icons
// icons
const icons = {
    update: Edit,
    registry: TableDocument,
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const stocks = {
  id: 'Stocks',
  title: <FormattedMessage id="Stocks" />,
  type: 'group',
  children: [
    {
      id: 'Stock Update',
      title: <FormattedMessage id="Stock Update" />,
      type: 'item',
      url: '/stock/update',
      icon: icons.update
    },
    {
        id: 'Stock Registry',
        title: <FormattedMessage id="Stock Registry" />,
        type: 'item',
        url: '/stock/registry',
        icon: icons.registry
      }
    
  ]
};

export default stocks;


