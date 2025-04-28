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
  Button,
  Card,
  CardContent,
  Collapse,
  List,
  ListItem,
  ListItemText
} from '@mui/material';

// third-party
import { useReactToPrint } from 'react-to-print';
import { PDFDownloadLink } from '@react-pdf/renderer';

// project imports
import MainCard from 'components/MainCard';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import LoadingButton from 'components/@extended/LoadingButton';
import LogoSection from 'components/logo'; // Adjust to your project
import ExportPDFView from './components/exportPdf'; // <-- We'll create/modify this component below

// config, icons, etc.
import { APP_DEFAULT_PATH, ThemeMode } from 'config';
import { DocumentDownload, Edit, Printer, Share } from 'iconsax-react';
import api from 'pages/api';

// ==============================|| PDF ICON BUTTON ||============================== //
function PDFIconButton({ billing }) {
  const theme = useTheme();
  return (
    <PDFDownloadLink
      document={<ExportPDFView billing={billing} />} 
      fileName={`${billing?.invoiceNo}-${billing?.customerName}.pdf`}
      style={{ textDecoration: 'none' }}
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

// ==============================|| MAIN DETAILS COMPONENT ||============================== //
export default function Details() {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const componentRef = useRef(null);

  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDeliveryInfo, setOpenDeliveryInfo] = useState(false);
  const [openPaymentInfo, setOpenPaymentInfo] = useState(false);
  const [openBillingExpenses, setOpenBillingExpenses] = useState(false);

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

  // ------------------ Derived or Formatted Values ------------------ //
  const formattedInvoiceDate = billing?.invoiceDate
    ? new Date(billing.invoiceDate).toLocaleDateString('en-GB')
    : '';
  const formattedExpectedDeliveryDate = billing?.expectedDeliveryDate
    ? new Date(billing.expectedDeliveryDate).toLocaleDateString('en-GB')
    : '';

  // Example: Payment status Chip color:
  const getPaymentStatusChip = (status) => {
    switch (status) {
      case 'Paid':
        return <Chip label="Paid" variant="light" color="success" size="small" />;
      case 'Partial':
        return <Chip label="Partial" variant="light" color="warning" size="small" />;
      case 'Unpaid':
        return <Chip label="Unpaid" variant="light" color="error" size="small" />;
      default:
        return <Chip label={status} variant="light" size="small" />;
    }
  };

  // -------------- Breadcrumbs -------------- //
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
                {/* Edit Button */}
                <IconButton onClick={() => navigate(`/invoice/edit/${id}`)}>
                  <Edit color={iconColor} />
                </IconButton>

                {/* Download PDF */}
                {loading ? (
                  <LoadingButton loading />
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

          {/* Main Billing Content (Ref for printing) */}
          <Box sx={{ p: 2.5 }} ref={componentRef} id="print">
            <Grid container spacing={2.5}>
              {/* Header / Branding */}
              <Grid item xs={12}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between">
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <LogoSection />
                      {billing && getPaymentStatusChip(billing.paymentStatus)}
                    </Stack>
                    {/* Invoice Number */}
                    <Typography color="secondary" variant="h6">
                      {loading ? <Skeleton width={80} /> : `#${billing?.invoiceNo}`}
                    </Typography>
                  </Stack>

                  {/* Dates */}
                  <Box textAlign={{ xs: 'left', sm: 'right' }} mt={{ xs: 2, sm: 0 }}>
                    <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                      <Typography variant="subtitle1">Date:</Typography>
                      <Typography color="secondary">
                        {loading ? <Skeleton width={60} /> : formattedInvoiceDate}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                      <Typography variant="subtitle1">Expected Delivery:</Typography>
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
                        <Typography variant="caption" color="text.secondary">
                          Salesman: {billing?.salesmanName}{' '}
                          {billing?.salesmanPhoneNumber ? `(${billing?.salesmanPhoneNumber})` : ''}
                        </Typography>
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
                        <Typography color="secondary" fontWeight="bold">
                          {billing?.customerName}
                        </Typography>
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
                <MainCard title="Product Details">
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
                              {[...Array(6).keys()].map((col) => (
                                <TableCell key={col}>
                                  <Skeleton />
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          (billing?.products || []).map((product, index) => {
                            const amount =
                              (product.sellingPrice || 0) * (product.quantity || 0);
                            return (
                              <TableRow key={product._id || index}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                  {product.name}
                                  <Typography variant="caption" display="block">
                                    {product.psRatio ? `PS Ratio: ${product.psRatio}` : ''}
                                  </Typography>
                                  {product.itemRemark && (
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Remark: {product.itemRemark}
                                    </Typography>
                                  )}
                                </TableCell>
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
                </MainCard>
              </Grid>

              {/* Totals & Summary */}
              <Grid item xs={12}>
                <Divider sx={{ borderWidth: 1 }} />
              </Grid>
              <Grid item xs={12} sm={6} md={8} />
              <Grid item xs={12} sm={6} md={4}>
                <MainCard>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color={theme.palette.secondary.main}>Billing Amount:</Typography>
                      <Typography>
                        {loading ? <Skeleton width={80} /> : billing?.billingAmount?.toFixed(2)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color={theme.palette.secondary.main}>Discount:</Typography>
                      <Typography sx={{ color: theme.palette.success.main }}>
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
                        {loading ? <Skeleton width={100} /> : billing?.billingAmountReceived?.toFixed(2)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color={theme.palette.secondary.main}>Payment Status:</Typography>
                      <Typography>{billing?.paymentStatus}</Typography>
                    </Stack>
                  </Stack>
                </MainCard>
              </Grid>

              {/* Additional Fields */}
              <Grid item xs={12}>
                <Stack direction="row" spacing={1}>
                  <Typography color="secondary" variant="subtitle2">
                    Remarks:
                  </Typography>
                  <Typography>
                    {loading ? <Skeleton width="50%" /> : billing?.remark || 'No remarks.'}
                  </Typography>
                </Stack>
              </Grid>

              {/* Delivery Section */}
              <Grid item xs={12}>
                <MainCard
                  title="Delivery Information"
                  secondary={
                    <Button
                      variant="text"
                      onClick={() => setOpenDeliveryInfo((prev) => !prev)}
                      size="small"
                    >
                      {openDeliveryInfo ? 'Hide' : 'Show'}
                    </Button>
                  }
                >
                  <Collapse in={openDeliveryInfo}>
                    {loading ? (
                      <Skeleton height={50} />
                    ) : (
                      (billing?.deliveries || []).length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No Delivery Records
                        </Typography>
                      ) : (
                        (billing.deliveries || []).map((delivery, idx) => (
                          <Card key={delivery.deliveryId || idx} sx={{ mb: 1 }}>
                            <CardContent>
                              <Typography variant="subtitle1" fontWeight="bold">
                                Delivery #{idx + 1}: {delivery.deliveryStatus || 'Pending'}
                              </Typography>
                              <Stack spacing={0.5} sx={{ mt: 1 }}>
                                <Typography variant="body2">Driver Name: {delivery.driverName || 'N/A'}</Typography>
                                <Typography variant="body2">Vehicle: {delivery.vehicleNumber || 'N/A'}</Typography>
                                <Typography variant="body2">KM Travelled: {delivery.kmTravelled || 0}</Typography>
                                <Typography variant="body2">Fuel Charge: {delivery.fuelCharge || 0}</Typography>
                                <Typography variant="body2">Bata: {delivery.bata || 0}</Typography>
                                <Typography variant="body2">Method: {delivery.method || 'N/A'}</Typography>
                              </Stack>

                              {/* Delivered Products */}
                              <Box mt={1}>
                                <Typography variant="body2" fontWeight="bold">
                                  Products Delivered:
                                </Typography>
                                {(delivery.productsDelivered || []).length === 0 ? (
                                  <Typography variant="caption">None</Typography>
                                ) : (
                                  <List dense>
                                    {delivery.productsDelivered.map((prod, pIdx) => (
                                      <ListItem key={pIdx} disablePadding>
                                        <ListItemText
                                          primary={`${prod.item_id} - Delivered Qty: ${prod.deliveredQuantity}`}
                                          secondary={prod.psRatio ? `PS Ratio: ${prod.psRatio}` : ''}
                                        />
                                      </ListItem>
                                    ))}
                                  </List>
                                )}
                              </Box>

                              {/* Other Expenses for this delivery */}
                              {delivery.otherExpenses && delivery.otherExpenses.length > 0 && (
                                <Box mt={1}>
                                  <Typography variant="body2" fontWeight="bold">
                                    Other Expenses:
                                  </Typography>
                                  <List dense>
                                    {delivery.otherExpenses.map((exp, eIdx) => (
                                      <ListItem key={exp._id || eIdx} disablePadding>
                                        <ListItemText
                                          primary={`Amount: ${exp.amount || 0}`}
                                          secondary={exp.remark ? `Remark: ${exp.remark}` : ''}
                                        />
                                      </ListItem>
                                    ))}
                                  </List>
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )
                    )}
                  </Collapse>
                </MainCard>
              </Grid>


              {/* Billing-Level Other Expenses */}
<Grid item xs={12}>
  <MainCard
    title="Additional Expenses"
    secondary={
      <Button
        variant="text"
        onClick={() => setOpenBillingExpenses((prev) => !prev)}
        size="small"
      >
        {openBillingExpenses ? 'Hide' : 'Show'}
      </Button>
    }
  >
    <Collapse in={openBillingExpenses}>
      {loading ? (
        <Skeleton height={50} />
      ) : (
        billing?.otherExpenses?.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No Billing-Level Expenses
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Remark</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {billing?.otherExpenses?.map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell>
                      {new Date(expense.date).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell>{expense.amount?.toFixed(2)}</TableCell>
                    <TableCell>{expense.method || 'N/A'}</TableCell>
                    <TableCell>{expense.remark || '--'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}
    </Collapse>
  </MainCard>
</Grid>

              {/* Payments Section */}
              <Grid item xs={12}>
                <MainCard
                  title="Payment Details"
                  secondary={
                    <Button
                      variant="text"
                      onClick={() => setOpenPaymentInfo((prev) => !prev)}
                      size="small"
                    >
                      {openPaymentInfo ? 'Hide' : 'Show'}
                    </Button>
                  }
                >
                  <Collapse in={openPaymentInfo}>
                    {loading ? (
                      <Skeleton height={50} />
                    ) : (
                      (billing?.payments || []).length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No Payment Records
                        </Typography>
                      ) : (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Method</TableCell>
                                <TableCell>Reference ID</TableCell>
                                <TableCell>Remark</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {billing?.payments.map((payment, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>
                                    {new Date(payment.date).toLocaleDateString('en-GB')}
                                  </TableCell>
                                  <TableCell>{payment.amount}</TableCell>
                                  <TableCell>{payment.method}</TableCell>
                                  <TableCell>{payment.referenceId}</TableCell>
                                  <TableCell>{payment.remark || '--'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )
                    )}
                  </Collapse>
                </MainCard>
              </Grid>

              {/* Additional Info (Approvals, Marketing, etc.) */}
              <Grid item xs={12}>
                <MainCard title="Additional Info">
                  {loading ? (
                    <Skeleton height={50} />
                  ) : (
                    <Stack spacing={1}>
                      <Typography variant="body2">Approved: {billing?.isApproved ? 'Yes' : 'No'}</Typography>
                      <Typography variant="body2">Approved By: {billing?.approvedBy || 'N/A'}</Typography>
                      <Typography variant="body2">Marketed By: {billing?.marketedBy || 'N/A'}</Typography>
                      <Typography variant="body2">Needed to Purchase: {billing?.isneededToPurchase ? 'Yes' : 'No'}</Typography>
                      <Typography variant="body2">Delivery Status: {billing?.deliveryStatus}</Typography>
                    </Stack>
                  )}
                </MainCard>
              </Grid>

              {/* Financial Summary Section */}
<Grid item xs={12}>
  <MainCard title="Financial Summary">
    <Stack spacing={1}>
      {/* Billing-Level Other Expenses */}
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="subtitle1">Billing-Level Expenses:</Typography>
        {loading ? (
          <Skeleton width={80} />
        ) : (
          <Typography>
            {billing?.otherExpenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0).toFixed(2)}
          </Typography>
        )}
      </Stack>

      {/* Delivery Expenses (Fuel + Bata + Delivery Other Expenses) */}
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="subtitle1">Total Delivery Expenses:</Typography>
        {loading ? (
          <Skeleton width={80} />
        ) : (
          <Typography>
            {billing?.deliveries?.reduce((total, delivery) => {
              const fuel = delivery.fuelCharge || 0;
              const bata = delivery.bata || 0;
              const other = delivery.otherExpenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
              return total + fuel + bata + other;
            }, 0).toFixed(2)}
          </Typography>
        )}
      </Stack>

      {/* Total Payments Received */}
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="subtitle1">Total Payments Received:</Typography>
        {loading ? (
          <Skeleton width={80} />
        ) : (
          <Typography sx={{ color: theme.palette.success.main }}>
            {billing?.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0).toFixed(2)}
          </Typography>
        )}
      </Stack>

      {/* Optional: Net Balance */}
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="subtitle1">Outstanding Balance:</Typography>
        {loading ? (
          <Skeleton width={80} />
        ) : (
          <Typography sx={{ color: theme.palette.error.main }}>
            {(billing?.grandTotal - 
              billing?.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0)
            ).toFixed(2)}
          </Typography>
        )}
      </Stack>
    </Stack>
  </MainCard>
</Grid>
            </Grid>
          </Box>

          {/* Footer Actions */}
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={2}
            sx={{ p: 2.5 }}
          >
            <PDFDownloadLink
              document={<ExportPDFView billing={billing} />}
              fileName={`${billing?.invoiceNo}-${billing?.customerName}.pdf`}
              style={{ textDecoration: 'none' }}
            >
              <LoadingButton
                loading={loading}
                color="primary"
                variant="outlined"
                loadingPosition="center"
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
