// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { SecurityUser, UserOctagon, Buildings } from 'iconsax-react';

// type

// icons
// icons
const icons = {
  customer:  UserOctagon,
  supplier: Buildings,
  return: UserOctagon,
  damage: UserOctagon,
  sub: SecurityUser
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const accounts = {
  id: 'Accounts',
  title: <FormattedMessage id="Accounts" />,
  type: 'group',
  children: [
    {
      id: 'Accounts',
      title: <FormattedMessage id="Accounts" />,
      type: 'collapse',
      url: '/accounts/list',
      icon: icons.customer,
      children: [
        {
          id: 'Accounts',
          title: <FormattedMessage id="Accounts" />,
          type: 'item',
          url: '/accounts/list/',
          target: false,
          breadcrumbs: false
        },
        {
          id: 'Create',
          title: <FormattedMessage id="Create Account" />,
          type: 'item',
          url: '/accounts/create/',
          target: false,
          breadcrumbs: false
        }
      ]
    },
    {
      id: 'Customer',
      title: <FormattedMessage id="Customer" />,
      type: 'collapse',
      icon: icons.customer,
      children: [
        {
          id: 'Accounts',
          title: <FormattedMessage id="Accounts" />,
          type: 'item',
          url: '/customer/account/',
          target: false,
          breadcrumbs: false
        },
        {
          id: 'Create',
          title: <FormattedMessage id="Create Account" />,
          type: 'item',
          url: '/customer/create/',
          target: false,
          breadcrumbs: false
        },
        {
          id: 'Edit',
          title: <FormattedMessage id="Edit Account" />,
          type: 'item',
          url: '/customer/edit/',
          target: false,
          breadcrumbs: false
        }
      ]
    },
    {
      id: 'Supplier',
      title: <FormattedMessage id="Supplier" />,
      type: 'collapse',
      icon: icons.supplier,
      children: [
        {
          id: 'List',
          title: <FormattedMessage id="Accounts" />,
          type: 'item',
          url: '/supplier/account/',
          target: false,
          breadcrumbs: false
        },
        {
          id: 'Create',
          title: <FormattedMessage id="Create Account" />,
          type: 'item',
          url: '/supplier/create/',
          target: false,
          breadcrumbs: false
        },
        {
          id: 'Edit',
          title: <FormattedMessage id="Edit Account" />,
          type: 'item',
          url: '/supplier/edit/',
          target: false,
          breadcrumbs: false
        }
      ]
    },
    {
      id: 'Transport',
      title: <FormattedMessage id="Transport" />,
      type: 'collapse',
      icon: icons.supplier,
      children: [
        {
          id: 'List',
          title: <FormattedMessage id="Accounts" />,
          type: 'item',
          url: '/transport/account/',
          target: false,
          breadcrumbs: false
        },
        {
          id: 'Create',
          title: <FormattedMessage id="Create Account" />,
          type: 'item',
          url: '/transport/create/',
          target: false,
          breadcrumbs: false
        },
        {
          id: 'Edit',
          title: <FormattedMessage id="Edit Account" />,
          type: 'item',
          url: '/transport/edit/',
          target: false,
          breadcrumbs: false
        }
      ]
    }
  ]
};

export default accounts;


