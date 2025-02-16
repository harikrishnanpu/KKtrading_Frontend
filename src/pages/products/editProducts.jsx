import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  TextField,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
} from '@mui/material';

import LoadingBox from 'components/Loader';
import MessageBox from 'components/MessageBox';
import api from '../api';

// Example user roles. Replace this with your actual auth context or Redux store.
const user = {
  isEmployee: false,
  isAdmin: true,
  isSuper: false,
};

export default function ProductEditScreen() {
  const navigate = useNavigate();
  const { id: productId } = useParams();

  // Local state for product fields
  const [name, setName] = useState('');
  const [itemId, setItemId] = useState('');
  const [seller, setSeller] = useState('');
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
  const [sellerAddress, setSellerAddress] = useState('');
  const [type, setType] = useState('');
  const [countInStock, setCountInStock] = useState('');
  const [rating, setRating] = useState('');
  const [numReviews, setNumReviews] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [gstPercent, setGstPercent] = useState('');
  const [imageError, setImageError] = useState(false);

  // State for fetching product details
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for updating product
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [errorUpdate, setErrorUpdate] = useState(null);
  const [successUpdate, setSuccessUpdate] = useState(false);

  // Image upload states
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [errorUpload, setErrorUpload] = useState('');

  // Role-based editing:
  const canEditAll = user.isAdmin || user.isSuper;
  // In this example: an employee can only edit name, brand, category, image.
  const canEditBasic = user.isEmployee && !canEditAll;

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/api/products/${productId}`);
        const product = data;

        setName(product.name || '');
        setItemId(product.item_id || '');
        setSeller(product.seller || '');
        setImage(product.image || '');
        setBrand(product.brand || '');
        setCategory(product.category || '');
        setDescription(product.description || '');
        setPUnit(product.pUnit || '');
        setSUnit(product.sUnit || '');
        setPsRatio(product.psRatio || '');
        setLength(product.length || '');
        setBreadth(product.breadth || '');
        setActLength(product.actLength || '');
        setActBreadth(product.actBreadth || '');
        setSize(product.size || '');
        setUnit(product.unit || '');
        setPrice(product.price || '');
        setBillPartPrice(product.billPartPrice || '');
        setCashPartPrice(product.cashPartPrice || '');
        setSellerAddress(product.sellerAddress || '');
        setType(product.type || '');
        setCountInStock(product.countInStock || '');
        setRating(product.rating || '');
        setNumReviews(product.numReviews || '');
        setHsnCode(product.hsnCode || '');
        setGstPercent(product.gstPercent || '');
      } catch (err) {
        setError(
          err.response && err.response.data.message
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

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoadingUpdate(true);
    setErrorUpdate(null);
    try {
      // Convert certain fields to numbers if needed
      const updatedProduct = {
        name,
        item_id: itemId,
        seller,
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
        sellerAddress,
        type,
        countInStock: countInStock ? Number(countInStock) : 0,
        rating: rating ? Number(rating) : 0,
        numReviews: numReviews ? Number(numReviews) : 0,
        gstPercent: gstPercent ? Number(gstPercent) : 0,
        hsnCode,
      };

      await api.put(`/api/products/${productId}`, updatedProduct);

      setSuccessUpdate(true);
    } catch (err) {
      setErrorUpdate(
        err.response && err.response.data.message
          ? err.response.data.message
          : err.message
      );
    }
    setLoadingUpdate(false);
  };

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default');
    setLoadingUpload(true);
    setErrorUpload('');
    try {
      const response = await api.post(
        'https://api.cloudinary.com/v1_1/dqniuczkg/image/upload',
        formData
      );
      setImage(response.data.secure_url);
      setLoadingUpload(false);
      setImageError(false);
    } catch (error) {
      setErrorUpload(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
      setLoadingUpload(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h6" component="h1" gutterBottom>
        Edit Product
      </Typography>

      {loadingUpdate && <LoadingBox />}
      {errorUpdate && <MessageBox variant="danger">{errorUpdate}</MessageBox>}
      {loading ? (
        <LoadingBox />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <form onSubmit={submitHandler}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              {/* Image Preview & Upload */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: '#f0f0f0',
                    borderRadius: 2,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1,
                  }}
                >
                  {loadingUpload ? (
                    <CircularProgress size={24} />
                  ) : image && !imageError ? (
                    <CardMedia
                      component="img"
                      src={image}
                      alt="product"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No image
                    </Typography>
                  )}
                </Box>

                {/* Only employees or admins/supers can edit the image */}
                <Button
                  variant="outlined"
                  component="label"
                  disabled={!canEditAll && !canEditBasic} // Only these roles can edit
                >
                  Upload
                  <input
                    type="file"
                    hidden
                    onChange={uploadFileHandler}
                  />
                </Button>

                {errorUpload && (
                  <MessageBox variant="danger">{errorUpload}</MessageBox>
                )}
              </Box>

              <Grid container spacing={2}>
                {/* NAME (editable by employees, admin, super) */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Name"
                    variant="outlined"
                    size="small"
                    fullWidth
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!canEditAll && !canEditBasic} 
                  />
                </Grid>

                {/* ITEM ID (editable only by admin/super if that’s your rule) */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Item ID"
                    variant="outlined"
                    size="small"
                    fullWidth
                    required
                    value={itemId}
                    onChange={(e) => setItemId(e.target.value)}
                    disabled={!canEditAll} 
                  />
                </Grid>

                {/* BRAND (editable by employees, admin, super) */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Brand"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    disabled={!canEditAll && !canEditBasic}
                  />
                </Grid>

                {/* CATEGORY (editable by employees, admin, super) */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Category"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={!canEditAll && !canEditBasic}
                  />
                </Grid>

                {/* SELLER (editable only by admin/super in this example) */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Seller"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={seller}
                    onChange={(e) => setSeller(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* SELLER ADDRESS (editable only by admin/super) */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Seller Address"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={sellerAddress}
                    onChange={(e) => setSellerAddress(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* DESCRIPTION */}
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    variant="outlined"
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* PRICE */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Price"
                    variant="outlined"
                    size="small"
                    fullWidth
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* BILL PART PRICE */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Bill Part Price"
                    variant="outlined"
                    size="small"
                    fullWidth
                    type="number"
                    value={billPartPrice}
                    onChange={(e) => setBillPartPrice(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* CASH PART PRICE */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Cash Part Price"
                    variant="outlined"
                    size="small"
                    fullWidth
                    type="number"
                    value={cashPartPrice}
                    onChange={(e) => setCashPartPrice(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* COUNT IN STOCK */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Count In Stock"
                    variant="outlined"
                    size="small"
                    fullWidth
                    type="number"
                    value={countInStock}
                    onChange={(e) => setCountInStock(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* RATING */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Rating"
                    variant="outlined"
                    size="small"
                    fullWidth
                    type="number"
                    inputProps={{ step: 0.1, min: 0, max: 5 }}
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* NUM REVIEWS */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Number of Reviews"
                    variant="outlined"
                    size="small"
                    fullWidth
                    type="number"
                    value={numReviews}
                    onChange={(e) => setNumReviews(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* GST PERCENT */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="GST Percent"
                    variant="outlined"
                    size="small"
                    fullWidth
                    type="number"
                    value={gstPercent}
                    onChange={(e) => setGstPercent(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* HSN CODE */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="HSN Code"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* pUnit */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="P Unit"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={pUnit}
                    onChange={(e) => setPUnit(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* sUnit */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="S Unit"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={sUnit}
                    onChange={(e) => setSUnit(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* psRatio */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="P S Ratio"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={psRatio}
                    onChange={(e) => setPsRatio(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* Length */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Length"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* Breadth */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Breadth"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={breadth}
                    onChange={(e) => setBreadth(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* Actual Length */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Actual Length"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={actLength}
                    onChange={(e) => setActLength(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* Actual Breadth */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Actual Breadth"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={actBreadth}
                    onChange={(e) => setActBreadth(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* Size */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Size"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* Unit */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Unit"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>

                {/* Type */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Type"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    disabled={!canEditAll}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* SUBMIT / UPDATE BUTTON */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
            }}
          >
            <Button variant="outlined" color="primary" type="submit">
              Update
            </Button>
          </Box>
        </form>
      )}
    </Container>
  );
}
