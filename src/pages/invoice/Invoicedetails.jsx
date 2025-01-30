import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useParams } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Grid,
  Chip,
  Stack,
  Table,
  Divider,
  Skeleton,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  Typography,
  FormControl,
  TableContainer,
  Button
} from '@mui/material';

// third-party
import { useReactToPrint } from 'react-to-print';
import { PDFDownloadLink } from '@react-pdf/renderer';

// project imports (adjust paths to match your project)
import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import LoadingButton from 'components/@extended/LoadingButton';
import LogoSection from 'components/logo'; // Example: if you have a custom Logo component
import ExportPDFView from 'sections/apps/invoice/export-pdf'; // or adapt to your own PDF component

// config, icons, etc.
import { APP_DEFAULT_PATH, ThemeMode } from 'config';
import { DocumentDownload, Edit, Printer, Share } from 'iconsax-react';
import api from 'pages/api';

// Example: if you're using your own api helper, import it:
// import api from '../api'; // Or wherever you define your API instance

// =============== PDF Icon Button =============== //
function PDFIconButton({ billing }) {
  const theme = useTheme();
  return (
    <PDFDownloadLink
      document={<ExportPDFView billing={billing} />} // <-- pass the billing object to your PDF component
      fileName={`${billing?.invoiceNo}-${billing?.customerName}.pdf`}
    >
      <IconButton>
        <DocumentDownload
          color={
            theme.palette.mode === ThemeMode.DARK
              ? theme.palette.background.paper
              : theme.palette.text.secondary
          }
        />
      </IconButton>
    </PDFDownloadLink>
  );
}

PDFIconButton.propTypes = {
  billing: PropTypes.object
};

// ============ MAIN BILLING DETAILS COMPONENT ============ //
export default function Details() {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();

  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);

  const componentRef = useRef(null);

  const iconColor =
    theme.palette.mode === ThemeMode.DARK
      ? theme.palette.background.paper
      : theme.palette.text.secondary;

  // ------------------ Fetch Billing ------------------ //
  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const response = await api.get(`/api/billing/${id}`);
        setBilling(response.data);
      } catch (error) {
        console.error('Error fetching billing:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBilling();
    }
  }, [id]);

  // ------------------ Print Handler ------------------ //
  const handlePrint = useReactToPrint({
    content: () => componentRef.current
  });

  // ------------------ Derived Values ------------------ //
  // Example: You can parse or format dates here
  const formattedInvoiceDate = billing?.invoiceDate
    ? new Date(billing.invoiceDate).toLocaleDateString('en-GB')
    : '';

  const formattedExpectedDeliveryDate = billing?.expectedDeliveryDate
    ? new Date(billing.expectedDeliveryDate).toLocaleDateString('en-GB')
    : '';

  // If you want to show a products table, you might want to compute total price, etc.
  // However, your model tracks "grandTotal", "billingAmount", "discount", etc. directly.

  // -------------- Example Breadcrumbs -------------- //
  const breadcrumbLinks = [
    { title: 'Home', to: APP_DEFAULT_PATH },
    { title: 'Billing', to: '/invoice/dashboard' },
    { title: 'Details' }
  ];

  // ------------------ Render ------------------ //
  return (
    <>
      <Breadcrumbs custom heading="Billing Summary" links={breadcrumbLinks} />

      <MainCard content={false}>
        <Stack spacing={2.5}>
          {/* Top Action Bar */}
          <Box sx={{ p: 2.5, pb: 0 }}>
            <MainCard content={false} border={false} sx={{ p: 1.25, bgcolor: 'secondary.lighter' }}>
              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                {/* Edit Button (if needed) */}
                <IconButton onClick={() => navigate(`/apps/invoice/edit/${id}`)}>
                  <Edit color={iconColor} />
                </IconButton>

                {/* Download PDF */}
                {loading ? (
                  <LoadingButton loading>X</LoadingButton>
                ) : (
                  <PDFIconButton billing={billing} />
                )}

                {/* Print */}
                <IconButton onClick={handlePrint}>
                  <Printer color={iconColor} />
                </IconButton>

                {/* Share or other actions */}
                <IconButton>
                  <Share color={iconColor} />
                </IconButton>
              </Stack>
            </MainCard>
          </Box>

          {/* Main Billing Content */}
          <Box sx={{ p: 2.5 }} id="print" ref={componentRef}>
            <Grid container spacing={2.5}>
              {/* Header / Branding */}
              <Grid item xs={12}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between">
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={2}>
                      <LogoSection />
                      {/* Show paid or partial, etc. If needed, you can conditionally show a Chip: */}
                      {billing?.paymentStatus === 'Paid' && (
                        <Chip label="Paid" variant="light" color="success" size="small" />
                      )}
                      {billing?.paymentStatus === 'Partial' && (
                        <Chip label="Partial" variant="light" color="warning" size="small" />
                      )}
                      {billing?.paymentStatus === 'Unpaid' && (
                        <Chip label="Unpaid" variant="light" color="error" size="small" />
                      )}
                    </Stack>

                    {/* Invoice Number */}
                    <Typography color="secondary">
                      {loading ? <Skeleton width={80} /> : `#${billing?.invoiceNo}`}
                    </Typography>
                  </Stack>

                  {/* Dates */}
                  <Box>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Typography variant="subtitle1">Date</Typography>
                      <Typography color="secondary">
                        {loading ? <Skeleton width={60} /> : formattedInvoiceDate}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Typography variant="subtitle1">Expected Delivery</Typography>
                      <Typography color="secondary">
                        {loading ? <Skeleton width={60} /> : formattedExpectedDeliveryDate}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Grid>

              {/* From & To Sections */}
              <Grid item xs={12} sm={6}>
                <MainCard>
                  <Stack spacing={1}>
                    <Typography variant="h5">From (Showroom):</Typography>
                    {loading ? (
                      <Skeleton />
                    ) : (
                      <FormControl sx={{ width: '100%' }}>
                        <Typography color="secondary">{billing?.showroom}</Typography>
                        {/* If you have additional "from" details or addresses, add them here */}
                      </FormControl>
                    )}
                  </Stack>
                </MainCard>
              </Grid>

              <Grid item xs={12} sm={6}>
                <MainCard>
                  <Stack spacing={1}>
                    <Typography variant="h5">To (Customer):</Typography>
                    {loading ? (
                      <Skeleton />
                    ) : (
                      <FormControl sx={{ width: '100%' }}>
                        <Typography color="secondary">{billing?.customerName}</Typography>
                        <Typography color="secondary">{billing?.customerAddress}</Typography>
                        {billing?.customerContactNumber && (
                          <Typography color="secondary">{billing.customerContactNumber}</Typography>
                        )}
                      </FormControl>
                    )}
                  </Stack>
                </MainCard>
              </Grid>

              {/* Products Table */}
              <Grid item xs={12}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Item Name</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit Price</TableCell>
                        <TableCell>GST Rate</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        [1, 2, 3].map((row) => (
                          <TableRow key={row}>
                            <TableCell>
                              <Skeleton />
                            </TableCell>
                            <TableCell>
                              <Skeleton />
                            </TableCell>
                            <TableCell>
                              <Skeleton />
                            </TableCell>
                            <TableCell>
                              <Skeleton />
                            </TableCell>
                            <TableCell>
                              <Skeleton />
                            </TableCell>
                            <TableCell>
                              <Skeleton />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        (billing?.products || []).map((product, index) => {
                          const amount =
                            (product.sellingPrice || 0) * (product.quantity || 0);

                          return (
                            <TableRow key={product._id || index}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{product.name}</TableCell>
                              <TableCell>{product.quantity}</TableCell>
                              <TableCell>{product.sellingPrice}</TableCell>
                              <TableCell>{product.gstRate}%</TableCell>
                              <TableCell align="right">{amount.toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Totals & Summary */}
              <Grid item xs={12}>
                <Divider sx={{ borderWidth: 1 }} />
              </Grid>

              <Grid item xs={12} sm={6} md={8}></Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color={theme.palette.secondary.main}>Billing Amount:</Typography>
                    <Typography>
                      {loading ? <Skeleton width={80} /> : billing?.billingAmount?.toFixed(2)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color={theme.palette.secondary.main}>Discount:</Typography>
                    <Typography variant="h6" color={theme.palette.success.main}>
                      {loading ? <Skeleton width={50} /> : billing?.discount?.toFixed(2)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color={theme.palette.secondary.main}>Grand Total:</Typography>
                    <Typography>
                      {loading ? <Skeleton width={60} /> : billing?.grandTotal?.toFixed(2)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle1">Received:</Typography>
                    <Typography variant="subtitle1">
                      {loading ? (
                        <Skeleton width={100} />
                      ) : (
                        billing?.billingAmountReceived?.toFixed(2)
                      )}
                    </Typography>
                  </Stack>
                  {/* Payment Status */}
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color={theme.palette.secondary.main}>Payment Status:</Typography>
                    <Typography>{billing?.paymentStatus}</Typography>
                  </Stack>
                </Stack>
              </Grid>

              {/* Additional Fields / Remarks */}
              <Grid item xs={12}>
                <Stack direction="row" spacing={1}>
                  <Typography color="secondary">Remarks: </Typography>
                  <Typography>
                    {loading ? <Skeleton width="50%" /> : billing?.remark || 'No remarks.'}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          {/* Footer Actions */}
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={2}
            sx={{ p: 2.5, a: { textDecoration: 'none', color: 'inherit' } }}
          >
            <PDFDownloadLink
              document={<ExportPDFView billing={billing} />}
              fileName={`${billing?.invoiceNo}-${billing?.customerName}.pdf`}
            >
              <LoadingButton
                loading={loading}
                color="primary"
                variant="outlined"
                loadingPosition="center"
                sx={{ color: 'secondary.lighter' }}
              >
                Download PDF
              </LoadingButton>
            </PDFDownloadLink>
          </Stack>
        </Stack>
      </MainCard>
    </>
  );
}
