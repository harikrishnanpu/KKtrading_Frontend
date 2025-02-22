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

const admin = {
  id: 'group-pages',
  title: <FormattedMessage id="Admin" />,
  type: 'group',
  children: [

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

export default admin;


