// src/components/NeededToPurchaseDialog.jsx
import React, { useState, useEffect, forwardRef } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Typography,
  Slide,
} from '@mui/material';
import api from 'pages/api';

// Animated transition for the dialog
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const NeededToPurchaseDialog = ({ open, onClose, billingId, onSubmitSuccess }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [billing, setBilling] = useState(null);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [purchases, setPurchases] = useState([]); // For Purchase ID options
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [error, setError] = useState('');

  // Fetch billing details on open
  useEffect(() => {
    if (open) {
      const fetchBilling = async () => {
        setLoadingBilling(true);
        setError('');
        setPurchaseItems([]);
        try {
          const res = await api.get(`/api/billing/${billingId}`);
          setBilling(res.data);
          // Merge each product with any existing neededToPurchase info
          const items = res.data.products.map(product => {
            const needed = res.data.neededToPurchase
              ? res.data.neededToPurchase.find(n => n.item_id === product.item_id)
              : null;
            return {
              item_id: product.item_id,
              name: product.name,
              quantityOrdered: product.quantity,
              quantityNeeded: needed ? needed.quantityNeeded : 0,
              selected: needed ? true : false,
              purchased: needed ? needed.purchased : false,
              verified: needed ? needed.verified : false,
              purchaseId: needed ? needed.purchaseId || '' : '',
            };
          });
          setPurchaseItems(items);
        } catch (err) {
          setError('Error fetching billing details');
        } finally {
          setLoadingBilling(false);
        }
      };
      fetchBilling();
    }
  }, [billingId, open]);

  // Fetch purchase options for the Purchase ID select
  useEffect(() => {
    if (open) {
      setPurchases([]);
      const fetchPurchases = async () => {
        setLoadingPurchases(true);
        try {
          const res = await api.get('/api/purchases/bill/get/allpurchases');
          setPurchases(res.data);
        } catch (err) {
          setError('Error fetching purchase options');
        } finally {
          setLoadingPurchases(false);
        }
      };
      fetchPurchases();
    }
  }, [open]);

  // Handlers for table fields with immutable updates
  const handleCheckboxChange = (index, checked) => {
    setPurchaseItems(prevItems =>
      prevItems.map((item, i) => i === index ? { ...item, selected: checked } : item)
    );
  };

  const handlePurchasedChange = (index, checked) => {
    setPurchaseItems(prevItems =>
      prevItems.map((item, i) => i === index ? { ...item, purchased: checked } : item)
    );
  };

  const handleVerifiedChange = (index, checked) => {
    setPurchaseItems(prevItems =>
      prevItems.map((item, i) => i === index ? { ...item, verified: checked } : item)
    );
  };

  const handleQuantityChange = (index, value) => {
    setPurchaseItems(prevItems =>
      prevItems.map((item, i) =>
        i === index ? { ...item, quantityNeeded: parseFloat(value) || 0 } : item
      )
    );
  };

  const handlePurchaseIdChange = (index, value) => {
    setPurchaseItems(prevItems =>
      prevItems.map((item, i) => i === index ? { ...item, purchaseId: value } : item)
    );
  };

  // Submit the updated neededToPurchase array
  const handleSubmit = async () => {
    const neededToPurchase = purchaseItems
      .filter(item => item.selected)
      .map(item => ({
        item_id: item.item_id,
        name: item.name,
        quantityOrdered: item.quantityOrdered,
        quantityNeeded: item.quantityNeeded,
        purchased: item.purchased,
        verified: item.verified,
        purchaseId: item.purchaseId,
      }));
    try {
      await api.put(`/api/billing/update-needed-purchase/${billingId}`, { neededToPurchase });
      if (onSubmitSuccess) onSubmitSuccess();
      setPurchaseItems([]);
      setPurchases([]);
      onClose();
    } catch (err) {
      setError('Error updating needed to purchase');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      fullScreen={fullScreen}
      TransitionComponent={Transition}
      PaperProps={{
        sx: { 
          height: '75vh', 
          position: 'fixed', 
          bottom: 0, 
          borderTopLeftRadius: 8, 
          borderTopRightRadius: 8 
        },
      }}
    >
      <DialogTitle>
        {billing ? (
          <Box>
            <Typography variant="h6">Invoice: {billing.invoiceNo}</Typography>
            <Typography variant="subtitle1">Customer: {billing.customerName}</Typography>
            <Typography variant="subtitle1">Salesman: {billing.salesmanName}</Typography>
          </Box>
        ) : (
          'Loading Billing Details...'
        )}
      </DialogTitle>
      <DialogContent dividers sx={{ overflowY: 'auto' }}>
        {loadingBilling ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Box>
            <Table sx={{ minWidth: 650 }} size="small">
              <TableHead sx={{ bgcolor: 'primary.main' }}>
                <TableRow>
                  <TableCell align="center" sx={{ color: 'white', fontSize: 13 }}>Need Purchase</TableCell>
                  <TableCell sx={{ color: 'white', fontSize: 13 }}>Item ID</TableCell>
                  <TableCell sx={{ color: 'white', fontSize: 13 }}>Name</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontSize: 13 }}>Qty Ordered</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontSize: 13 }}>Qty Needed</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontSize: 13 }}>Purchased</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontSize: 13 }}>Verified</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontSize: 13 }}>Purchase ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchaseItems.map((item, index) => (
                  <TableRow key={item.item_id} sx={{ bgcolor: index % 2 === 0 ? 'grey.100' : 'white' }}>
                    <TableCell align="center">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(e) => handleCheckboxChange(index, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{item.item_id}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{item.name}</TableCell>
                    <TableCell align="center" sx={{ fontSize: 13 }}>{item.quantityOrdered}</TableCell>
                    <TableCell align="center">
                      <TextField
                        variant="standard"
                        type="number"
                        value={item.quantityNeeded}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        inputProps={{ style: { textAlign: 'center', fontSize: 13 } }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <input
                        type="checkbox"
                        checked={item.purchased}
                        onChange={(e) => handlePurchasedChange(index, e.target.checked)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <input
                        type="checkbox"
                        checked={item.verified}
                        onChange={(e) => handleVerifiedChange(index, e.target.checked)}
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <FormControl variant="standard" fullWidth>
                        <InputLabel id={`purchase-select-label-${index}`} sx={{ fontSize: 13 }}>
                          Select
                        </InputLabel>
                        <Select
                          labelId={`purchase-select-label-${index}`}
                          value={item.purchaseId}
                          onChange={(e) => handlePurchaseIdChange(index, e.target.value)}
                          label="Purchase ID"
                          sx={{ fontSize: 13 }}
                        >
                          {loadingPurchases ? (
                            <MenuItem value="">
                              <em>Loading...</em>
                            </MenuItem>
                          ) : (
                            purchases.map((purchase) => (
                              <MenuItem key={purchase._id} value={purchase.purchaseId} sx={{ fontSize: 13 }}>
                                {purchase.purchaseId}
                              </MenuItem>
                            ))
                          )}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Box display="flex" justifyContent="flex-end" width="100%">
          <Button variant="outlined" color="error" onClick={onClose} sx={{ mr: 2 }}>
            Cancel
          </Button>
          <Button variant="outlined" color="primary" onClick={handleSubmit}>
            Submit Needed To Purchase
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

NeededToPurchaseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  billingId: PropTypes.string.isRequired,
  onSubmitSuccess: PropTypes.func,
};

export default NeededToPurchaseDialog;
