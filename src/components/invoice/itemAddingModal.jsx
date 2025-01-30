// src/components/OutOfStockModal.js
import React, { useEffect, useRef, useState, forwardRef } from 'react';
import PropTypes from 'prop-types';
import api from '../../pages/api';
import useAuth from 'hooks/useAuth';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  TextField,
  Button,
  Grid,
  Slide,
  Box,
} from '@mui/material';
import { CloseCircle } from 'iconsax-react'; // Importing CloseCircle from iconsax-react

// Transition component for Slide animation from bottom
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function OutOfStockModal({
  product,
  onClose,
  onStockChange,
  onUpdate,
  stockRef,
}) {
  const [newQuantity, setNewQuantity] = useState('');
  const [sqqty, setSqty] = useState(0);

  const { user: userInfo } = useAuth(); // Get the logged-in user info

  const mainRef = useRef(); // Reference to the dialog for animations (optional with MUI)

  useEffect(() => {
    if (newQuantity === 0 || newQuantity === undefined || newQuantity === '') {
      setSqty(0);
      return;
    } else if (newQuantity && product.length && product.breadth) {
      let adjqty =
        parseFloat(newQuantity) /
        (parseFloat(product.length) * parseFloat(product.breadth));
      setSqty(adjqty.toFixed(2));
    }
  }, [newQuantity, product.length, product.breadth]);

  const handleUpdate = async () => {
    // Check if newQuantity is a valid number before making the API request
    if (isNaN(newQuantity) || newQuantity === '') {
      alert('Please enter a valid number');
      return;
    }

    try {
      // Convert newQuantity to a number to ensure it's passed as the correct type
      const quantityToUpdate = parseFloat(newQuantity);

      const response = await api.put(`/api/products/update-stock/${product._id}`, {
        countInStock: quantityToUpdate,
        userName: userInfo.name,
      });

      if (response.status === 200) {
        // Call onUpdate with the new quantity and the product
        onUpdate(quantityToUpdate, product);

        // Reset the input and close the modal
        setNewQuantity('');
        onClose();
      }
    } catch (error) {
      alert(`Error updating stock: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      TransitionComponent={Transition}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          padding: 2,
          position: 'fixed',
          bottom: 0,
          margin: 0,
          height: 'auto',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h6" component="div" color="textPrimary">
              Update Product Quantity
            </Typography>
          </Grid>
          <Grid item>
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseCircle size="24" color="#9e9e9e" variant="Outline" />
            </IconButton>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent dividers sx={{ overflowY: 'auto' }}>
        {product.countInStock === 0 && (
          <Typography
            variant="body2"
            sx={{ fontStyle: 'italic', mb: 2, textAlign: 'center', color: 'text.secondary' }}
          >
            The item you entered is currently out of stock. Update the stock to add the product to the bill.
          </Typography>
        )}

        <Box mb={2}>
          <Typography variant="body2" sx={{ truncate: 'ellipsis', color: 'text.primary' }}>
            <strong>Product:</strong> {product.name}
          </Typography>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ truncate: 'ellipsis', color: 'text.primary' }}>
                <strong>Product ID:</strong> {product.item_id}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography
                variant="body2"
                sx={{
                  color:
                    product.countInStock > 10
                      ? 'green'
                      : product.countInStock > 0
                      ? 'orange'
                      : 'red',
                  mt: 1,
                }}
              >
                <strong>In Stock:</strong> {product.countInStock} NOS
              </Typography>
            </Grid>
          </Grid>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            <strong>Current Updating In Sqft:</strong> {sqqty}
          </Typography>
        </Box>

        <Box mb={2}>
          <TextField
            label="New Quantity"
            type="number"
            inputRef={stockRef}
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdate();
            }}
            fullWidth
            variant="outlined"
            size="small"
            InputProps={{
              inputProps: { min: 1, step: 1 },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: 2 }}>
        <Grid container justifyContent="flex-end" spacing={2}>
          <Grid item>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleUpdate}
            >
              Update Product
            </Button>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
}

// PropTypes for type checking
OutOfStockModal.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    item_id: PropTypes.string.isRequired,
    countInStock: PropTypes.number.isRequired,
    length: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    breadth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onStockChange: PropTypes.func,
  onUpdate: PropTypes.func.isRequired,
  stockRef: PropTypes.object.isRequired,
};
