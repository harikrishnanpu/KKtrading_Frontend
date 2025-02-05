import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import useAuth from 'hooks/useAuth';
import api from '../api';

// --- MUI Imports ---
import {
  Alert,
  Box,
  Button,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { styled } from '@mui/system';

// --- MUI Icons ---
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';

// ================ Styled Components ================
/** 
 * A simple, classic background using light grey. 
 * Feel free to customize the color to suit your design taste.
 */
const MinimalBackground = styled('div')(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(6),
  [theme.breakpoints.down('sm')]: {
    paddingTop: theme.spacing(2),
  },
}));

/**
 * A basic Paper container with mild rounding and shadow.
 * This is our main content wrapper for the product details.
 */
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2],
  padding: theme.spacing(3),
}));

/**
 * A "classic highlight" box for "Usually sells at" price info.
 * Light grey background, subtle border, centered text.
 */
const ClassicHighlightBox = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.grey[300]}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  textAlign: 'center',
}));

// ============== Product Screen Component ==============
export default function ProductScreen() {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { user: userInfo } = useAuth();

  // ------------- States -------------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [soldOut, setSoldOut] = useState(null);

  // Image load states
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);

  // Unit & Calculations
  const [selectedUnit, setSelectedUnit] = useState('NOS'); // default
  const [inStockForUnit, setInStockForUnit] = useState(0);
  const [displaySellingPrice, setDisplaySellingPrice] = useState('0.00');

  // ============== Effects ==============
  // Fetch product data on mount
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

  // Recalculate “in stock” and “Usually sells at” whenever unit or product changes
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
      const tileBase = basePrice / 0.8;
      if (selectedUnit === 'SQFT' && area > 0) {
        newPrice = (tileBase / area).toFixed(2);
      } else if (selectedUnit === 'BOX') {
        newPrice = (tileBase * psRatio).toFixed(2);
      } else {
        newPrice = tileBase.toFixed(2);
      }
    } else if (product.category === 'GRANITE') {
      newPrice = (basePrice / 0.65).toFixed(2);
    } else {
      newPrice = (basePrice / 0.6).toFixed(2);
    }
    setDisplaySellingPrice(newPrice.toString());
  }, [selectedUnit, product]);

  // ============== Handlers ==============
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

  // ============== Loading / Error States ==============
  if (loading) {
    return (
      <MinimalBackground>
        <Container
          maxWidth="lg"
          sx={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Container>
      </MinimalBackground>
    );
  }

  if (error || !product) {
    return (
      <MinimalBackground>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Product not found'}
          </Alert>
          <Button variant="contained" color="error" onClick={() => navigate('/products/all')}>
            See All Products
          </Button>
        </Container>
      </MinimalBackground>
    );
  }

  // ============== Determine Stock Chip State ==============
  let stockChipColor = 'warning';
  let stockChipLabel = 'Low Stock';
  if (product.countInStock > 10) {
    stockChipColor = 'success';
    stockChipLabel = 'In Stock';
  } else if (product.countInStock === 0) {
    stockChipColor = 'error';
    stockChipLabel = 'Out Of Stock';
  }

  // ============== Main Render ==============
  return (
    <MinimalBackground>
      <Container maxWidth="lg">
        <StyledPaper>
          <Grid container spacing={4}>
            {/* ================= Image Section ================= */}
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'relative' }}>
                <Chip
                  label={stockChipLabel}
                  color={stockChipColor}
                  sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}
                />
                <CardMedia
                  component="img"
                  image={product.image}
                  alt={product.name}
                  onLoad={() => setIsImageLoaded(true)}
                  onError={() => {
                    setIsImageError(true);
                    setIsImageLoaded(false);
                  }}
                  sx={{
                    height: { xs: 300, md: 400 },
                    borderRadius: 2,
                    objectFit: 'cover',
                    width: '100%',
                    boxShadow: 2,
                    filter: isImageLoaded ? 'none' : 'blur(8px)',
                    transition: 'filter 0.3s ease-in-out',
                  }}
                />
                {isImageError && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      bgcolor: '#ffffffcc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      No image available
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* ================= Details Section ================= */}
            <Grid item xs={12} md={6}>
              {/* Title / ID */}
              <Typography variant="subtitle2" color="text.secondary">
                Product ID: {product.item_id}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                {product.name}
              </Typography>
              <Stack direction="row" spacing={3} sx={{ mb: 2, flexWrap: 'wrap' }}>
                <Typography variant="body1">
                  <strong>Brand:</strong> {product.brand}
                </Typography>
                <Typography variant="body1">
                  <strong>Category:</strong> {product.category}
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />

              {/* ========= Table of Attributes (Classic style) ========= */}
              <TableContainer component={Box} sx={{ mb: 2 }}>
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
                    <TableRow>
                      <TableCell>
                        <strong>Act Length</strong>
                      </TableCell>
                      <TableCell>{product.actLength}</TableCell>
                      <TableCell>
                        <strong>Act Breadth</strong>
                      </TableCell>
                      <TableCell>{product.actBreadth}</TableCell>
                    </TableRow>
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

              {/* Description (if present) */}
              {product.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {product.description}
                  </Typography>
                </Box>
              )}

              {/* Unit Selector & Price */}
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

              {/* Classic-Style Highlight for "Usually sells at" */}
              <ClassicHighlightBox sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Usually sells at ({selectedUnit}):
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                  ₹{displaySellingPrice}
                </Typography>
              </ClassicHighlightBox>

              {/* Stock Info */}
              <Box sx={{ mb: 2 }}>
                <Grid container justifyContent="space-between" alignItems="center">
                  <Grid item>
                    <Typography
                      variant="h6"
                      sx={{
                        color:
                          product.countInStock > 10
                            ? 'green'
                            : product.countInStock === 0
                            ? 'red'
                            : 'orange',
                      }}
                    >
                      In Stock (pieces): {product.countInStock}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">
                      Stock Cleared: {soldOut ? soldOut.totalQuantity : 0}
                    </Typography>
                  </Grid>
                </Grid>
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  In Stock ({selectedUnit}): {inStockForUnit}
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* ============== Action Buttons ============== */}
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<VisibilityIcon />}
                  onClick={() => navigate(`/products/${product._id}/preview`)}
                >
                  Preview
                </Button>
                <Button
                  variant="contained"
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
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={deleteHandler}
                >
                  Delete
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </StyledPaper>

        {/* ============== Link to All Products ============== */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Link component={RouterLink} to="/products/all" underline="hover" color="error">
            Search Another Product? Click here
          </Link>
        </Box>
      </Container>
    </MinimalBackground>
  );
}
