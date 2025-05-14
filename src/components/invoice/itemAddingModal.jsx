// src/components/OutOfStockModal.js
import React, { useEffect, useState, forwardRef } from 'react';
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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { CloseCircle } from 'iconsax-react'; // iconsax-react

/* ---------- slide-up transition ---------- */
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function OutOfStockModal({
  product,
  onClose,
  onUpdate,
  stockRef,
}) {
  /* -------- guards -------- */
  if (!product) return null; // defensive – avoids render crash while prop is null

  /* -------- local state -------- */
  const [newQuantity, setNewQuantity]     = useState('');
  const [needToPurchase, setNeedToPurchase] = useState(true);   // <-- new checkbox
  const [ invoiceNo, setInvoiceNo ] = useState(null);
  const { user: userInfo } = useAuth();

  /* reset fields when a new product comes in or modal re-opens */
  useEffect(() => {
    setNewQuantity('');
    setNeedToPurchase(true);
  }, [product]);

  /* -------- handlers -------- */
const handleUpdate = () => {
   const qty = parseFloat(newQuantity);
   if (Number.isNaN(qty) || qty <= 0) {
      alert('Please enter a valid positive number');
      return;
   }
   onUpdate(qty, product, needToPurchase);   
   onClose();
  };

  /* -------- render -------- */
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
          p: 2,
          position: 'fixed',
          bottom: 0,
          m: 0,
          height: 'auto',
        },
      }}
    >
      {/* -------- header -------- */}
      <DialogTitle sx={{ m: 0, p: 2 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h6" component="div">
              Need To Purchase and Update Stock
            </Typography>
          </Grid>
          <Grid item>
            <IconButton aria-label="close" onClick={onClose}>
              <CloseCircle size="24" color="#9e9e9e" variant="Outline" />
            </IconButton>
          </Grid>
        </Grid>
      </DialogTitle>

      {/* -------- body -------- */}
      <DialogContent dividers sx={{ overflowY: 'auto' }}>
        {product.countInStock === 0 && (
          <Typography
            variant="body2"
            sx={{ fontStyle: 'italic', mb: 2, textAlign: 'center', color: 'text.secondary' }}
          >
            The item you entered is currently out of stock. 
          </Typography>
        )}

        <Box mb={2}>
          <Typography variant="body2">
            <strong>Product:</strong> {product.name}
          </Typography>
          <Grid container justifyContent="space-between">
            <Grid item xs={6}>
              <Typography variant="body2">
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
        </Box>

        {/* ---- quantity ---- */}
        <Box mb={3}>
          <TextField
            label="New Quantity"
            type="number"
            inputRef={stockRef}
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
            fullWidth
            variant="outlined"
            size="small"
            InputProps={{ inputProps: { min: 1, step: 1 } }}
          />
        </Box>

        {/* ---- need-to-purchase checkbox ---- */}
        <FormControlLabel
          control={
            <Checkbox
              checked={needToPurchase}
              onChange={() => setNeedToPurchase((c) => !c)}
              color="primary"
            />
          }
          label="Need to purchase (without reducing the stock)"
          sx={{ mb: 2 }}
        />
      </DialogContent>

      {/* -------- footer -------- */}
      <DialogActions sx={{ p: 2 }}>
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={handleUpdate}
        >
          Update Product
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ---------- prop types ---------- */
OutOfStockModal.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    item_id: PropTypes.string.isRequired,
    countInStock: PropTypes.number.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  stockRef: PropTypes.object.isRequired,
};
