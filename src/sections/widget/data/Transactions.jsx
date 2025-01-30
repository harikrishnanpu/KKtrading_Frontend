import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from 'pages/api';
import {
  Box,
  List,
  Menu,
  Stack,
  Button,
  ListItem,
  Typography,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  Tab,
  Tabs
} from '@mui/material';

// project-imports
import MainCard from 'components/MainCard';
import Avatar from 'components/@extended/Avatar';
import IconButton from 'components/@extended/IconButton';
import MoreIcon from 'components/@extended/MoreIcon';

// assets
import { ArrowDown, ArrowSwapHorizontal, ArrowUp } from 'iconsax-react';

// ==============================|| TAB PANEL ||============================== //

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  };
}

// ==============================|| DATA WIDGET - TRANSACTIONS ||============================== //

export default function LowStockPreview() {
  const navigate = useNavigate();
  const [value, setValue] = useState(0);

  // State for Menu
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // State for Data
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for Search
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Tab Change
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  // Handle Menu Click
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle Menu Close
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lowStockResponse, deliveriesResponse] = await Promise.all([
          api.get('/api/products/items/low-stock-limited'),
          api.get('/api/billing/deliveries/expected-delivery')
        ]);

        setLowStockProducts(lowStockResponse.data);
        setUpcomingDeliveries(deliveriesResponse.data);
        setLoading(false);

        // Optionally, store in localStorage
        localStorage.setItem('lowStockProducts', JSON.stringify(lowStockResponse.data));
        localStorage.setItem('upcomingDeliveries', JSON.stringify(deliveriesResponse.data));
      } catch (err) {
        setError('Error fetching data. Please try again.');
        setLoading(false);
      }
    };

    // Check localStorage first
    const storedLowStock = localStorage.getItem('lowStockProducts');
    const storedDeliveries = localStorage.getItem('upcomingDeliveries');

    if (storedLowStock && storedDeliveries) {
      setLowStockProducts(JSON.parse(storedLowStock));
      setUpcomingDeliveries(JSON.parse(storedDeliveries));
      setLoading(false);
    } else {
      fetchData();
    }
  }, []);

  // Utility Function to Check if Date is Today
  const isToday = (dateString) => {
    const today = new Date();
    const targetDate = new Date(dateString);
    return (
      today.getFullYear() === targetDate.getFullYear() &&
      today.getMonth() === targetDate.getMonth() &&
      today.getDate() === targetDate.getDate()
    );
  };

  // Filtered Low Stock Products based on Search Query
  const filteredProducts = lowStockProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) return <div className="text-center text-red-500">{error}</div>;

  if (loading && lowStockProducts.length === 0 && upcomingDeliveries.length === 0) {
    return (
      <MainCard content={false}>
        <Box sx={{ p: 3, pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="h5">Transactions</Typography>
            <IconButton
              color="secondary"
              id="wallet-button"
              aria-controls={open ? 'wallet-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleClick}
            >
              <MoreIcon />
            </IconButton>
            <Menu
              id="wallet-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{ 'aria-labelledby': 'wallet-button', sx: { p: 1.25, minWidth: 150 } }}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <ListItemButton onClick={handleClose}>Today</ListItemButton>
              <ListItemButton onClick={handleClose}>Weekly</ListItemButton>
              <ListItemButton onClick={handleClose}>Monthly</ListItemButton>
            </Menu>
          </Stack>
        </Box>
        <Box sx={{ p: 4, shadow: 1, borderRadius: 2, backgroundColor: 'white', maxWidth: 'lg', margin: 'auto' }}>
          <p className="text-xs font-bold mb-4 text-gray-400 text-center">Loading Updates...</p>
          <div className="grid gap-4">
            {[1, 2].map((_, index) => (
              <div key={index} className="animate-pulse flex gap-4 items-center p-2 border-b border-gray-200">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </Box>
      </MainCard>
    );
  }

  return (
    <MainCard content={false}>
      <Box sx={{ p: 3, pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="h5">Transactions</Typography>
          <IconButton
            color="secondary"
            id="wallet-button"
            aria-controls={open ? 'wallet-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleClick}
          >
            <MoreIcon />
          </IconButton>
          <Menu
            id="wallet-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{ 'aria-labelledby': 'wallet-button', sx: { p: 1.25, minWidth: 150 } }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <ListItemButton onClick={handleClose}>Today</ListItemButton>
            <ListItemButton onClick={handleClose}>Weekly</ListItemButton>
            <ListItemButton onClick={handleClose}>Monthly</ListItemButton>
          </Menu>
        </Stack>
      </Box>
      <Box sx={{ width: '100%' }}>
        {/* Tabs for Different Sections */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="transaction tabs" sx={{ px: 3 }}>
            <Tab label="Upcoming Deliveries" {...a11yProps(0)} />
            <Tab label="Low Stock Products" {...a11yProps(1)} />
          </Tabs>
        </Box>

        {/* Upcoming Deliveries Tab */}
        <TabPanel value={value} index={0}>
          <List disablePadding sx={{ '& .MuiListItem-root': { px: 3, py: 1.5 } }}>
            {upcomingDeliveries.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center">
                No Upcoming Deliveries
              </Typography>
            ) : (
              upcomingDeliveries.map((delivery) => (
                <ListItem
                  key={delivery.invoiceNo}
                  divider
                  secondaryAction={
                    <Stack spacing={0.25} alignItems="flex-end">
                      <Typography variant="subtitle1">
                        {isToday(delivery.expectedDeliveryDate) ? 'Today' : new Date(delivery.expectedDeliveryDate).toLocaleDateString()}
                      </Typography>
                      <Typography
                        color={isToday(delivery.expectedDeliveryDate) ? 'error' : 'warning.main'}
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        {isToday(delivery.expectedDeliveryDate) ? (
                          <>
                            <ArrowDown style={{ transform: 'rotate(45deg)' }} size={14} /> Due Today
                          </>
                        ) : (
                          <>
                            <ArrowSwapHorizontal size={14} /> Upcoming
                          </>
                        )}
                      </Typography>
                    </Stack>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      color="success"
                      sx={{ fontWeight: 600 }}
                    >
                      <i className="fa fa-truck"></i>
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="subtitle1">Invoice No. {delivery.invoiceNo}</Typography>}
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        Location: {delivery.customerAddress}
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
          <Button
            variant="text"
            fullWidth
            color="primary"
            onClick={() => navigate('/upcoming-deliveries')}
            sx={{ mt: 2 }}
          >
            View More Deliveries
          </Button>
        </TabPanel>

        {/* Low Stock Products Tab */}
        <TabPanel value={value} index={1}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Button variant="outlined" fullWidth color="secondary" onClick={() => setSearchQuery('')}>
              Reset
            </Button>
            <Button variant="outlined" fullWidth>
              Create New Transaction
            </Button>
          </Stack>
          <List disablePadding sx={{ '& .MuiListItem-root': { px: 3, py: 1.5 } }}>
            {filteredProducts.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center">
                No Low Stock Products Found
              </Typography>
            ) : (
              filteredProducts.map((product) => (
                <ListItem
                  key={product.item_id}
                  divider
                  secondaryAction={
                    <Stack spacing={0.25} alignItems="flex-end">
                      <Typography variant="subtitle1">${product.price}</Typography>
                      <Typography color="error" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ArrowDown style={{ transform: 'rotate(45deg)' }} size={14} /> {product.stockPercentage}%
                      </Typography>
                    </Stack>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      type="outlined"
                      color="secondary"
                      sx={{ color: 'secondary.darker', borderColor: 'secondary.light', fontWeight: 600 }}
                    >
                      {product.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="subtitle1">{product.name}</Typography>}
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        Item ID: {product.item_id}
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
          <Button
            variant="text"
            fullWidth
            color="primary"
            onClick={() => navigate('/low-stock')}
            sx={{ mt: 2 }}
          >
            View More Products
          </Button>
        </TabPanel>

        {/* Action Buttons */}
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ p: 3 }}>
          <Button variant="outlined" fullWidth color="secondary" onClick={() => navigate('/transaction-history')}>
            Transaction History
          </Button>
          <Button variant="outlined" fullWidth onClick={() => navigate('/create-transaction')}>
            Create New Transaction
          </Button>
        </Stack>
      </Box>
    </MainCard>
  );
}
