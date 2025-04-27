import React, { useEffect, useState } from 'react';

// Router & Hooks
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from 'hooks/useAuth';
import api from '../api';

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Alert,
  Box,
  Button,
  CardMedia,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography
} from '@mui/material';

// MUI Icons (or iconsax-react if you prefer)
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Extended Components (as per your structure)
import MainCard from 'components/MainCard';
import Avatar from 'components/@extended/Avatar';

// Assets (if you need a default product image)
import defaultImages from 'assets/images/users/default.png';

function ProductScreenSkeleton() {
  // A simple skeleton layout to mimic the final structure.
  return (
    <Grid container spacing={3}>
      {/* Left column skeleton */}
      <Grid item xs={12} sm={5} md={4} xl={3}>
        <MainCard>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
          <Divider sx={{ my: 2 }} />
          <Skeleton variant="text" height={35} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </MainCard>
      </Grid>

      {/* Right column skeleton */}
      <Grid item xs={12} sm={7} md={8} xl={9}>
        <Grid container spacing={3}>
          {/* Skeleton card #1 */}
          <Grid item xs={12}>
            <MainCard>
              <Skeleton variant="text" height={35} width="30%" />
              <Skeleton variant="text" height={25} />
              <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
            </MainCard>
          </Grid>
          {/* Skeleton card #2 */}
          <Grid item xs={12}>
            <MainCard>
              <Skeleton variant="text" height={35} width="40%" />
              <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
            </MainCard>
          </Grid>
          {/* Skeleton card #3 */}
          <Grid item xs={12}>
            <MainCard>
              <Skeleton variant="text" height={35} width="30%" />
              <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
            </MainCard>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default function ProductScreen() {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { user: userInfo } = useAuth();
  const matchDownMD = useMediaQuery((theme) => theme.breakpoints.down('md'));

  // ----------------- State -----------------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [soldOut, setSoldOut] = useState(null);

  // Image load states
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);

  // Unit & Calculations
  const [selectedUnit, setSelectedUnit] = useState('NOS');
  const [inStockForUnit, setInStockForUnit] = useState(0);
  const [displaySellingPrice, setDisplaySellingPrice] = useState('0.00');

  // ----------------- Fetch Data -----------------
  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setError(null);

      try {
        // 1) sold-out info
        const soldRes = await api.get(`/api/billing/product/get-sold-out/${productId}`);
        setSoldOut(soldRes.data);

        // 2) product details
        const prodRes = await api.get(`/api/products/${productId}`);
        setProduct(prodRes.data);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Product Not Found');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  // ----------------- Recalculate stock & price on changes -----------------
  useEffect(() => {
    if (!product) return;

    // 1) In-Stock for the selected unit
    let computedStock = product.countInStock || 0;
    if (selectedUnit === 'SQFT') {
      const length = parseFloat(product.length) || 0;
      const breadth = parseFloat(product.breadth) || 0;
      const areaPerPiece = length * breadth;
      if (areaPerPiece > 0) {
        computedStock = parseFloat(product.countInStock * areaPerPiece).toFixed(2);
      }
    } else if (selectedUnit === 'BOX') {
      const psRatio = parseFloat(product.psRatio) || 1;
      computedStock = parseFloat(product.countInStock / psRatio).toFixed(2);
    } else if (selectedUnit === 'TNOS') {
      // TILES NOS ?
      computedStock = parseFloat(product.countInStock).toFixed(2);
    } else {
      computedStock = parseFloat(product.countInStock).toFixed(2);
    }
    setInStockForUnit(computedStock);

    // 2) Display Selling Price
    let newPrice = 0.0;
    const basePrice = parseFloat(product.price) || 0;
    const actLength = parseFloat(product.actLength) || 0;
    const actBreadth = parseFloat(product.actBreadth) || 0;
    const area = actLength * actBreadth;
    const psRatio = parseFloat(product.psRatio) || 1;

    if (product.category === 'TILES') {
      // Example calculation
      const tileBase = basePrice / 0.78; // Sample multiplier
      if (selectedUnit === 'SQFT' && area > 0) {
        newPrice = (tileBase / area).toFixed(2);
      } else if (selectedUnit === 'BOX') {
        newPrice = (tileBase * psRatio).toFixed(2);
      } else {
        newPrice = tileBase.toFixed(2);
      }
    } else if (product.category === 'GRANITE') {
      newPrice = (basePrice / 0.75).toFixed(2);
    } else {
      newPrice = (basePrice / 0.60).toFixed(2);
    }
    setDisplaySellingPrice(newPrice.toString());
  }, [selectedUnit, product]);

  // ----------------- Delete Handler -----------------
  const deleteHandler = async () => {
    if (!product) return;
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/api/products/${product._id}`);
        navigate('/products/all');
      } catch (err) {
        console.error('Delete error:', err);
        alert('Error deleting product.');
      }
    }
  };

  // ----------------- Loading & Error States -----------------
  if (loading) {
    return <ProductScreenSkeleton />;
  }

  if (error || !product) {
    return (
      <MainCard>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Product not found'}
        </Alert>
        <Button variant="outlined" color="error" onClick={() => navigate('/products/all')}>
          See All Products
        </Button>
      </MainCard>
    );
  }

  // ----------------- Determine Stock Chip -----------------
  let stockChipColor = 'warning';
  let stockChipLabel = 'Low Stock';
  if (product.countInStock > 10) {
    stockChipColor = 'success';
    stockChipLabel = 'In Stock';
  } else if (product.countInStock === 0) {
    stockChipColor = 'error';
    stockChipLabel = 'Out Of Stock';
  }

  // ----------------- Main Render -----------------
  return (
    <Grid container spacing={3}>
      {/* ================= Left Column ================= */}
      <Grid item xs={12} sm={5} md={4} xl={3}>
        <MainCard>
          {/* Product Image / Avatar area */}
          <Box sx={{ position: 'relative' }}>
            <Chip
              label={stockChipLabel}
              color={stockChipColor}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 2
              }}
            />
            <CardMedia
              component="img"
              image={product.image || defaultImages}
              alt={product.name}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => {
                setIsImageError(true);
                setIsImageLoaded(false);
              }}
              sx={{
                borderRadius: 1,
                objectFit: 'cover',
                width: '100%',
                height: 250,
                boxShadow: 1,
                filter: isImageLoaded ? 'none' : 'blur(4px)',
                transition: 'filter 0.3s ease-in-out'
              }}
            />
            {/* If image fails */}
            {isImageError && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: 250,
                  bgcolor: '#ffffffcc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  No image available
                </Typography>
              </Box>
            )}
          </Box>

          {/* Basic Info (Name, ID, Brand, Category) */}
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1} sx={{ textAlign: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Product ID: {product.item_id}
            </Typography>
            <Typography variant="h5">{product.name}</Typography>
            <Typography color="secondary">{product.brand}</Typography>
            <Typography color="secondary">{product.category}</Typography>
          </Stack>
        </MainCard>
      </Grid>

      {/* ================= Right Column ================= */}
      <Grid item xs={12} sm={7} md={8} xl={9}>
        <Grid container spacing={3}>
          {/* ----------- Basic Attributes Card ----------- */}
          <Grid item xs={12}>
            <MainCard title="Product Details">
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <strong>P Unit</strong>
                      </TableCell>
                      <TableCell>{product.pUnit}</TableCell>
                      <TableCell>
                        <strong>S Unit</strong>
                      </TableCell>
                      <TableCell>{product.sUnit}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>P-S Ratio</strong>
                      </TableCell>
                      <TableCell>{product.psRatio}</TableCell>
                      <TableCell>
                        <strong>Size</strong>
                      </TableCell>
                      <TableCell>{product.size}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Length</strong>
                      </TableCell>
                      <TableCell>{product.length}</TableCell>
                      <TableCell>
                        <strong>Breadth</strong>
                      </TableCell>
                      <TableCell>{product.breadth}</TableCell>
                    </TableRow>
                   {userInfo.isAdmin && <TableRow>
                      <TableCell>
                        <strong>Act Length</strong>
                      </TableCell>
                      <TableCell>{product.actLength}</TableCell>
                      <TableCell>
                        <strong>Act Breadth</strong>
                      </TableCell>
                      <TableCell>{product.actBreadth}</TableCell>
                    </TableRow> }
                    <TableRow>
                      <TableCell>
                        <strong>Type</strong>
                      </TableCell>
                      <TableCell>{product.type}</TableCell>
                      <TableCell>
                        <strong>GST %</strong>
                      </TableCell>
                      <TableCell>{product.gstPercent || '18%'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </MainCard>
          </Grid>

          {/* ----------- Description Card ----------- */}
          {product.description && (
            <Grid item xs={12}>
              <MainCard title="Description">
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {product.description}
                </Typography>
              </MainCard>
            </Grid>
          )}

          {/* ----------- Stock & Price Card ----------- */}
          <Grid item xs={12}>
            <MainCard title="Stock & Price">
              <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="unit-select-label">Unit</InputLabel>
                  <Select
                    labelId="unit-select-label"
                    value={selectedUnit}
                    label="Unit"
                    onChange={(e) => setSelectedUnit(e.target.value)}
                  >
                    <MenuItem value="NOS">NOS</MenuItem>
                    <MenuItem value="SQFT">SQFT</MenuItem>
                    <MenuItem value="BOX">BOX</MenuItem>
                    <MenuItem value="TNOS">TNOS</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {/* "Usually sells at" Highlight */}
              <Paper
                variant="outlined"
                sx={{
                  mb: 2,
                  p: 2,
                  textAlign: 'center',
                  borderColor: 'grey.300',
                  borderRadius: 1
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Usually sells at ({selectedUnit}):
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                  ₹{displaySellingPrice}
                </Typography>
              </Paper>

              {/* Stock Info */}
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color:
                        product.countInStock > 10
                          ? 'green'
                          : product.countInStock === 0
                          ? 'red'
                          : 'orange'
                    }}
                  >
                    In Stock (pieces): {product.countInStock}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Stock Cleared: {soldOut ? soldOut.totalQuantity : 0}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  In Stock ({selectedUnit}): {inStockForUnit}
                </Typography>
              </Stack>
            </MainCard>
          </Grid>

          {/* ----------- Actions Card ----------- */}
          <Grid item xs={12}>
            <MainCard title="Actions">
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    if (userInfo?.isAdmin) {
                      navigate(`/products/edit/${product._id}`);
                    } else {
                      alert('You must be an admin to edit this product.');
                    }
                  }}
                >
                  Edit Product
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={deleteHandler}
                >
                  Delete
                </Button>
              </Stack>
            </MainCard>
          </Grid>

          {/* ----------- Link to All Products ----------- */}
          <Grid item xs={12}>
            <MainCard>
              <Typography variant="body2" align="center">
                <Link
                  component="button"
                  onClick={() => navigate('/products/all')}
                  underline="hover"
                  color="error"
                  sx={{ cursor: 'pointer' }}
                >
                  Search Another Product? Click here
                </Link>
              </Typography>
            </MainCard>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
