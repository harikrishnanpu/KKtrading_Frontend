// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { Menu, MoneyRecive , BoxSearch, NotificationStatus, MenuBoard, Calendar, Messages2, Notification1, Profile2User} from 'iconsax-react';

// type

// icons
// icons
const icons = {
  dashboard: Menu,
  daily: MoneyRecive,
  products: BoxSearch,
  announcement: NotificationStatus,
  task: MenuBoard,
  calendar: Calendar,
  chat: Messages2,
  notify: Notification1,
  users: Profile2User
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const dashboard = {
  id: 'group-pages',
  title: <FormattedMessage id="dashboard" />,
  type: 'group',
  children: [
    {
      id: 'Dashboard',
      title: <FormattedMessage id="Dashboard" />,
      type: 'collapse',
      url: '/dashboard/default/',
      icon: icons.dashboard,
      children: [
        {
          id: 'Default',
          title: <FormattedMessage id="Default" />,
          type: 'item',
          url: '/dashboard/default/',
          target: false,
          breadcrumbs: false
        },
        // {
        //   id: 'Analytics',
        //   title: <FormattedMessage id="Analytics" />,
        //   type: 'item',
        //   url: '/dashboard/analytics/',
        //   target: false,
        //   breadcrumbs: false
        // }
      ]
    },
    {
      id: 'daily',
      title: <FormattedMessage id="Daily Transactions" />,
      type: 'item',
      url: '/daily/transactions/',
      icon: icons.daily,
      target: false,
      breadcrumbs: false
    },
    {
      id: 'allProducts',
      title: <FormattedMessage id="All Products" />,
      type: 'item',
      url: '/products/all/',
      icon: icons.products,
      target: false,
      breadcrumbs: true
    },
    {
      id: 'announcements',
      title: <FormattedMessage id="Announcements" />,
      type: 'item',
      url: '/announcements/all/',
      icon: icons.announcement,
      target: false,
      breadcrumbs: true
    },
    {
      id: 'taskboard',
      title: <FormattedMessage id="Task Board" />,
      type: 'item',
      url: '/tasks/board/',
      icon: icons.task,
      link: '/tasks/:tab',
      target: false,
      breadcrumbs: false
    },
    {
      id: 'calendar',
      title: <FormattedMessage id="Calendar" />,
      type: 'item',
      url: '/calendar',
      icon: icons.calendar,
      link: '/calendar',
      target: false,
      breadcrumbs: false
    },
    {
      id: 'chat',
      title: <FormattedMessage id="Chat" />,
      type: 'item',
      url: '/chat',
      icon: icons.chat,
      link: '/chat',
      target: false,
      breadcrumbs: false
    },

    {
      id: 'notifications',
      title: <FormattedMessage id="Notifications" />,
      type: 'item',
      url: '/notifications/all',
      icon: icons.notify,
      link: '/notifications/all',
      target: false,
      breadcrumbs: false
    },
    {
      id: 'allUsers',
      title: <FormattedMessage id="All Users" />,
      type: 'item',
      url: '/admin/allusers',
      icon: icons.users,
      link: '/admin/allusers',
      target: false,
      breadcrumbs: true
    },
    {
      id: 'allLogs',
      title: <FormattedMessage id="All Logs" />,
      type: 'item',
      url: '/admin/alllogs',
      icon: icons.users,
      link: '/admin/alllogs',
      target: false,
      breadcrumbs: true
    },
  ]
};

export default dashboard;


