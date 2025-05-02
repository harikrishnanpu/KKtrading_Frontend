import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// MUI Imports
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Grid,
  Stack,
  Button,
  TextField,
  InputLabel,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  FormLabel,
  Alert,
  Skeleton
} from '@mui/material';
import { Camera } from 'iconsax-react';

// Project Imports
import Avatar from 'components/@extended/Avatar';
import MainCard from 'components/MainCard';
import api from '../api';
import defaultImages from 'assets/images/upload/upload.svg';
import DeleteIcon from '@mui/icons-material/Delete';


// Example role logic: (replace with your real auth hook / context)
const user = {
  isEmployee: false,
  isAdmin: true,
  isSuper: false
};
const canEditAll = user.isAdmin || user.isSuper;
const canEditBasic = user.isEmployee && !canEditAll;

// Skeleton for loading state
function ProductEditSkeleton() {
  return (
    <Grid container spacing={3}>
      {/* Left Column */}
      <Grid item xs={12} sm={6}>
        <MainCard title={<Skeleton width={150} />}>
          <Skeleton variant="circular" width={76} height={76} sx={{ mb: 2 }} />
          <Skeleton width="60%" />
          <Skeleton width="40%" />
          <Divider sx={{ my: 2 }} />
          <Skeleton height={40} />
          <Skeleton height={40} />
        </MainCard>
      </Grid>

      {/* Right Column */}
      <Grid item xs={12} sm={6}>
        <MainCard title={<Skeleton width={180} />}>
          <Skeleton height={40} />
          <Skeleton width="80%" height={40} />
          <Skeleton width="50%" height={40} />
          <Divider sx={{ my: 2 }} />
          <Skeleton width="60%" height={40} />
          <Skeleton height={40} />
        </MainCard>
      </Grid>
    </Grid>
  );
}

export default function ProductEditScreen() {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  // ------------------- State for product fields -------------------
  const [name, setName] = useState('');
  const [itemId, setItemId] = useState('');
  const [seller, setSeller] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [image, setImage] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [pUnit, setPUnit] = useState('');
  const [sUnit, setSUnit] = useState('');
  const [psRatio, setPsRatio] = useState('');
  const [length, setLength] = useState('');
  const [breadth, setBreadth] = useState('');
  const [actLength, setActLength] = useState('');
  const [actBreadth, setActBreadth] = useState('');
  const [size, setSize] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [billPartPrice, setBillPartPrice] = useState('');
  const [cashPartPrice, setCashPartPrice] = useState('');
  const [type, setType] = useState('');
  const [countInStock, setCountInStock] = useState('');
  const [rating, setRating] = useState('');
  const [numReviews, setNumReviews] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [gstPercent, setGstPercent] = useState('');
  const [imageError, setImageError] = useState(false);

  // ------------------- Loading / Error States -------------------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // For updating product
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [errorUpdate, setErrorUpdate] = useState(null);
  const [successUpdate, setSuccessUpdate] = useState(false);

  // Image upload
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [errorUpload, setErrorUpload] = useState('');

  // ------------------- Fetch product on mount -------------------
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/api/products/${productId}`);
        setName(data.name || '');
        setItemId(data.item_id || '');
        setSeller(data.seller || '');
        setSellerAddress(data.sellerAddress || '');
        setImage(data.image || '');
        setBrand(data.brand || '');
        setCategory(data.category || '');
        setDescription(data.description || '');
        setPUnit(data.pUnit || '');
        setSUnit(data.sUnit || '');
        setPsRatio(data.psRatio || '');
        setLength(data.length || '');
        setBreadth(data.breadth || '');
        setActLength(data.actLength || '');
        setActBreadth(data.actBreadth || '');
        setSize(data.size || '');
        setUnit(data.unit || '');
        setPrice(data.price || '');
        setBillPartPrice(data.billPartPrice || '');
        setCashPartPrice(data.cashPartPrice || '');
        setType(data.type || '');
        setCountInStock(data.countInStock || '');
        setRating(data.rating || '');
        setNumReviews(data.numReviews || '');
        setHsnCode(data.hsnCode || '');
        setGstPercent(data.gstPercent || '');
      } catch (err) {
        setError(
          err.response?.data?.message
            ? err.response.data.message
            : err.message
        );
      }
      setLoading(false);
    };

    if (successUpdate) {
      navigate('/products/all');
    } else {
      fetchProduct();
    }
  }, [productId, successUpdate, navigate]);


    const deleteHandler = async () => {
      if (!productId) return;
      if (window.confirm('Are you sure you want to delete this product?')) {
        try {
          await api.delete(`/api/products/${productId}`);
          navigate('/products/all');
        } catch (err) {
          console.error('Delete error:', err);
          alert('Error deleting product.');
        }
      }
    };

  // ------------------- Form Submit Handler -------------------
  const submitHandler = async (e) => {
    e.preventDefault();
    setLoadingUpdate(true);
    setErrorUpdate(null);
    try {
      // Build updated product object
      const updatedProduct = {
        name,
        item_id: itemId,
        seller,
        sellerAddress,
        image,
        brand,
        category,
        description,
        pUnit,
        sUnit,
        psRatio,
        length,
        breadth,
        actLength,
        actBreadth,
        size,
        unit,
        price,
        billPartPrice: billPartPrice ? Number(billPartPrice) : 0,
        cashPartPrice: cashPartPrice ? Number(cashPartPrice) : 0,
        type,
        countInStock: countInStock ? Number(countInStock) : 0,
        rating: rating ? Number(rating) : 0,
        numReviews: numReviews ? Number(numReviews) : 0,
        gstPercent: gstPercent ? Number(gstPercent) : 0,
        hsnCode
      };

      await api.put(`/api/products/${productId}`, updatedProduct);
      setSuccessUpdate(true);
    } catch (err) {
      setErrorUpdate(
        err.response?.data?.message
          ? err.response.data.message
          : err.message
      );
    }
    setLoadingUpdate(false);
  };

  // ------------------- Image Upload Handler -------------------
  const uploadFileHandler = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingUpload(true);
    setErrorUpload('');
    try {
      // Example of uploading to Cloudinary:
      // Adjust your "upload_preset" or endpoint as needed
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');

      const response = await api.post(
        'https://api.cloudinary.com/v1_1/dnde4xq0y/image/upload',
        formData
      );

      setImage(response.data.secure_url);
      setImageError(false);
    } catch (error) {
      setErrorUpload(
        error.response?.data?.message
          ? error.response.data.message
          : error.message
      );
    }
    setLoadingUpload(false);
  };

  // ------------------- Handle "Enter" Key to go Next Input -------------------
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Attempt to focus next input-like element
      const form = e.target.form;
      if (!form) return;

      const elements = Array.from(form.elements).filter((el) => {
        return (
          el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT'
        );
      });
      const index = elements.indexOf(e.target);
      if (index >= 0 && index < elements.length - 1) {
        elements[index + 1].focus();
      }
    }
  };

  // ------------------- Render -------------------
  if (loading) {
    return <ProductEditSkeleton />;
  }

  return (
    <form
      onSubmit={submitHandler}
      onKeyDown={handleKeyDown}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {errorUpdate && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorUpdate}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ========== Left Column: Basic Info / Image ========== */}
        <Grid item xs={12} sm={6}>
          <MainCard title="Product Basic Info">
            <Grid container spacing={3}>
              {/* Image Upload Section */}
              <Grid item xs={12} display="flex" justifyContent="center">
                <Stack spacing={2.5} alignItems="center">
                  <FormLabel
                    htmlFor="change-image"
                    sx={{
                      position: 'relative',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      cursor: (canEditAll || canEditBasic) ? 'pointer' : 'default',
                      width: 100,
                      height: 100,
                      border: `2px solid ${theme.palette.primary.main}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover .overlay': {
                        opacity: (canEditAll || canEditBasic) ? 1 : 0
                      }
                    }}
                  >
                    <Avatar
                      alt="Product Image"
                      src={!imageError && image ? image : defaultImages}
                      sx={{ width: 98, height: 98 }}
                      onError={() => setImageError(true)}
                    />
                    {/* Hover overlay for upload */}
                    {(canEditAll || canEditBasic) && (
                      <Box
                        className="overlay"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.75)'
                              : 'rgba(0, 0, 0, 0.65)',
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'opacity 0.3s'
                        }}
                      >
                        {loadingUpload ? (
                          <CircularProgress size={24} />
                        ) : (
                          <Stack spacing={0.5} alignItems="center">
                            <Camera style={{ fontSize: '1.5rem', color: '#fff' }} />
                            <Typography
                              variant="caption"
                              sx={{ color: '#fff' }}
                            >
                              Upload
                            </Typography>
                          </Stack>
                        )}
                      </Box>
                    )}
                  </FormLabel>

                  {/* Hidden file input */}
                  <TextField
                    type="file"
                    id="change-image"
                    variant="outlined"
                    sx={{ display: 'none' }}
                    onChange={uploadFileHandler}
                    disabled={!(canEditAll || canEditBasic)}
                  />
                  {errorUpload && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {errorUpload}
                    </Alert>
                  )}
                </Stack>
              </Grid>

              {/* Product Name */}
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="product-name">Product Name</InputLabel>
                  <TextField
                    fullWidth
                    id="product-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!(canEditAll || canEditBasic)}
                  />
                </Stack>
              </Grid>

              {/* Item ID (Admins only) */}
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="item-id">Item ID</InputLabel>
                  <TextField
                    fullWidth
                    id="item-id"
                    value={itemId}
                    onChange={(e) => setItemId(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* Brand */}
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="brand">Brand</InputLabel>
                  <TextField
                    fullWidth
                    id="brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    disabled={!(canEditAll || canEditBasic)}
                  />
                </Stack>
              </Grid>

              {/* Category */}
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="category">Category</InputLabel>
                  <TextField
                    fullWidth
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={!(canEditAll || canEditBasic)}
                  />
                </Stack>
              </Grid>

              {/* Seller (Admins only) */}
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="seller">Seller</InputLabel>
                  <TextField
                    fullWidth
                    id="seller"
                    value={seller}
                    onChange={(e) => setSeller(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* Seller Address (Admins only) */}
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="sellerAddress">Seller Address</InputLabel>
                  <TextField
                    fullWidth
                    id="sellerAddress"
                    value={sellerAddress}
                    onChange={(e) => setSellerAddress(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>
            </Grid>
          </MainCard>
        </Grid>

        {/* ========== Right Column: Additional Info ========== */}
        <Grid item xs={12} sm={6}>
          <MainCard title="Additional & Stock Info">
            <Grid container spacing={3}>
              {/* Description (Admins only) */}
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="description">Description</InputLabel>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* Price (Admins only) */}
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="price">Price</InputLabel>
                  <TextField
                    fullWidth
                    type="number"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* Bill Part Price (Admins only) */}
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="billPartPrice">Bill Part Price</InputLabel>
                  <TextField
                    fullWidth
                    type="number"
                    id="billPartPrice"
                    value={billPartPrice}
                    onChange={(e) => setBillPartPrice(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* Cash Part Price (Admins only) */}
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="cashPartPrice">Cash Part Price</InputLabel>
                  <TextField
                    fullWidth
                    type="number"
                    id="cashPartPrice"
                    value={cashPartPrice}
                    onChange={(e) => setCashPartPrice(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* Count In Stock (Admins only) */}
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="countInStock">Count In Stock</InputLabel>
                  <TextField
                    fullWidth
                    type="number"
                    id="countInStock"
                    value={countInStock}
                    onChange={(e) => setCountInStock(e.target.value)}
                    disabled={!user?.isSuper}
                  />
                </Stack>
              </Grid>

              {/* Rating (Admins only) */}
              <Grid item xs={12} sm={4}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="rating">Rating</InputLabel>
                  <TextField
                    fullWidth
                    type="number"
                    id="rating"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* Number of Reviews (Admins only) */}
              <Grid item xs={12} sm={4}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="numReviews">Num Reviews</InputLabel>
                  <TextField
                    fullWidth
                    type="number"
                    id="numReviews"
                    value={numReviews}
                    onChange={(e) => setNumReviews(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* GST Percent (Admins only) */}
              <Grid item xs={12} sm={4}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="gstPercent">GST Percent</InputLabel>
                  <TextField
                    fullWidth
                    type="number"
                    id="gstPercent"
                    value={gstPercent}
                    onChange={(e) => setGstPercent(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* HSN Code (Admins only) */}
              <Grid item xs={12} sm={4}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="hsnCode">HSN Code</InputLabel>
                  <TextField
                    fullWidth
                    id="hsnCode"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* pUnit (Admins only) */}
              <Grid item xs={12} sm={4}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="pUnit">P Unit</InputLabel>
                  <TextField
                    fullWidth
                    id="pUnit"
                    value={pUnit}
                    onChange={(e) => setPUnit(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* sUnit (Admins only) */}
              <Grid item xs={12} sm={4}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="sUnit">S Unit</InputLabel>
                  <TextField
                    fullWidth
                    id="sUnit"
                    value={sUnit}
                    onChange={(e) => setSUnit(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* psRatio (Admins only) */}
              <Grid item xs={12} sm={4}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="psRatio">P S Ratio</InputLabel>
                  <TextField
                    fullWidth
                    id="psRatio"
                    value={psRatio}
                    onChange={(e) => setPsRatio(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* Length (Admins only) */}
              <Grid item xs={12} sm={4}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="length">Length</InputLabel>
                  <TextField
                    fullWidth
                    id="length"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* Breadth (Admins only) */}
              <Grid item xs={12} sm={4}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="breadth">Breadth</InputLabel>
                  <TextField
                    fullWidth
                    id="breadth"
                    value={breadth}
                    onChange={(e) => setBreadth(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* Actual Length (Admins only) */}
              <Grid item xs={12} sm={4}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="actLength">Actual Length</InputLabel>
                  <TextField
                    fullWidth
                    id="actLength"
                    value={actLength}
                    onChange={(e) => setActLength(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* Actual Breadth (Admins only) */}
              <Grid item xs={12} sm={4}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="actBreadth">Actual Breadth</InputLabel>
                  <TextField
                    fullWidth
                    id="actBreadth"
                    value={actBreadth}
                    onChange={(e) => setActBreadth(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* Size (Admins only) */}
              <Grid item xs={12} sm={4}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="size">Size</InputLabel>
                  <TextField
                    fullWidth
                    id="size"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* Unit (Admins only) */}
              <Grid item xs={12} sm={4}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="unit">Unit</InputLabel>
                  <TextField
                    fullWidth
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>

              {/* Type (Admins only) */}
              <Grid item xs={12} sm={4}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="type">Type</InputLabel>
                  <TextField
                    fullWidth
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Stack>
              </Grid>
            </Grid>
          </MainCard>
        </Grid>

        {/* ========== Action Buttons ========== */}
        <Grid item xs={12}>
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/products/all')}
            >
              Cancel
            </Button>
              <Button
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={deleteHandler}
                            >
                              Delete
              </Button>
            <Button
              type="submit"
              variant="outlined"
              color="primary"
              disabled={loadingUpdate}
            >
              {loadingUpdate ? <CircularProgress size={24} /> : 'Update'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </form>
  );
}
