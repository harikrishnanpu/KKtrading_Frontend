// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { Menu, MoneyRecive , BoxSearch, NotificationStatus, MenuBoard, Calendar, Messages2, Notification1, Profile2User} from 'iconsax-react';
import { ContactsOutlined } from '@mui/icons-material';

// type

// icons
// icons
const icons = {
  contacts: ContactsOutlined,
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

const contacts = {
  id: 'group-pages',
  title: <FormattedMessage id="Contacts" />,
  type: 'group',
  children: [
    {
      id: 'Contacts',
      title: <FormattedMessage id="All Contacts" />,
      type: 'item',
      url: '/contacts/all',
      icon: icons.contacts,
      target: false,
      breadcrumbs: false
    },
    {
      id: 'Create Contact',
      title: <FormattedMessage id="Create Contact" />,
      type: 'item',
      url: '/contacts/create',
      icon: icons.users,
      target: false,
      breadcrumbs: true
    },
]
};

export default contacts;


