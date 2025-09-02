import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Stack,
  Divider,
  styled
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Animated card with a subtle scale-up and elevated shadow on hover
const AnimatedCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  position: 'relative',
  '&:hover': {
    transform: 'scale(1.03)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
  }
}));

// Gradient header for an eye-catching top section
const GradientHeader = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #FF8A00, #E52E71)',
  color: '#fff',
  padding: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

// Styled chip with bolder typography
const VibrantChip = styled(Chip)(({ theme }) => ({
  fontWeight: 600,
  borderRadius: '8px'
}));

// Action button with a lift effect on hover
const ActionButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  borderRadius: '8px',
  padding: theme.spacing(0.5, 1),
  transition: 'background 0.3s ease, transform 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)'
  }
}));

const BillingCard = ({
  billing,
  userInfo,
  profit,
  handleView,
  handleRemove,
  handleApprove,
  generatePDF
}) => {
  const navigate = useNavigate();

  return (
    <AnimatedCard>
      <GradientHeader>
        <Typography
          variant="h6"
          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
          onClick={() => navigate(`/invoice/details/${billing._id}`)}
        >
          {billing.invoiceNo}
          {billing.isApproved && (
            <Box
              component="img"
              src="/images/tick.svg"
              alt="Approved"
              sx={{ height: 20, width: 20, ml: 1 }}
            />
          )}
        </Typography>
        <VibrantChip
          label={billing.isApproved ? 'Approved' : 'Pending'}
          size="small"
          sx={{
            backgroundColor: billing.isApproved ? '#4caf50' : '#ff9800',
            color: '#fff'
          }}
        />
      </GradientHeader>
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="body1" color="text.secondary">
            <strong>Customer:</strong> {billing.customerName}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            <strong>Showroom:</strong> {billing.showroom}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            <strong>Expected Delivery:</strong>{' '}
            {new Date(billing.expectedDeliveryDate).toLocaleString()}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            <strong>Payment:</strong> {billing.paymentStatus}
          </Typography>
          {userInfo.isSuper && profit && (
            <Typography variant="body1" color="text.secondary">
              <strong>P/L:</strong>{' '}
              <Box
                component="span"
                sx={{ color: profit.profitPercentage >= 0 ? 'green' : 'red' }}
              >
                {profit.profitPercentage.toFixed(2)}%
              </Box>
            </Typography>
          )}

          <Divider sx={{ my: 1 }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" fontWeight="bold">
              Total Products: {billing.products.length}
            </Typography>
            <Typography variant="caption" fontStyle="italic" color="text.disabled">
              Last Edited: {new Date(billing.updatedAt || billing.createdAt).toLocaleDateString()}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2} flexWrap="wrap" mt={2}>
            <ActionButton
              style={{margin:'2px'}}
              variant="outlined"
              color="error"
              onClick={() => navigate(`/invoice/edit/${billing._id}`)}
              disabled={!userInfo.isAdmin && billing.isApproved}
            >
              <i className="fa fa-pen" style={{ marginRight: 4 }}></i>
              Edit
            </ActionButton>
            {userInfo.isAdmin && (
              <ActionButton style={{margin:'2px'}} variant="outlined" color="error" onClick={() => generatePDF(billing)}>
                <i className="fa fa-truck" style={{ marginRight: 4 }}></i>
                PDF
              </ActionButton>
            )}
            <ActionButton style={{margin:'2px'}} variant="outlined" color="error" onClick={() => handleView(billing)}>
              <i className="fa fa-eye" style={{ marginRight: 4 }}></i>
              View
            </ActionButton>
            {userInfo.isAdmin && (
              <ActionButton style={{margin:'2px'}} variant="outlined" color="error" onClick={() => handleRemove(billing._id,billing.invoiceNo)}>
                <i className="fa fa-trash" style={{ marginRight: 4 }}></i>
                Delete
              </ActionButton>
            )}
            {userInfo.isAdmin && !billing.isApproved && (
              <ActionButton style={{margin:'2px'}} variant="outlined" color="success" onClick={() => handleApprove(billing)}>
                Approve
              </ActionButton>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </AnimatedCard>
  );
};

export default BillingCard;
