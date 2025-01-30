// InvoiceUserList.jsx

import { useState, useEffect } from 'react';
import api from '../../../pages/api';

// material-ui
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';

// project-imports
import MainCard from 'components/MainCard';
import Avatar from 'components/@extended/Avatar';
import MoreIcon from 'components/@extended/MoreIcon';

// assets
import Avatar1 from 'assets/images/users/avatar-5.png';
import Avatar2 from 'assets/images/users/avatar-6.png';
import Avatar3 from 'assets/images/users/avatar-7.png';
import Avatar4 from 'assets/images/users/avatar-8.png';
import Avatar5 from 'assets/images/users/avatar-9.png';

// ==============================|| INVOICE - DASHBOARD USER ||============================== //

export default function InvoiceUserList({ invoices, error, loading }) {


  // Map salesman names to avatars
  const avatarMap = {
    "ff" : Avatar1
  };

  // Function to calculate relative time (e.g., '5 min ago')
  const getRelativeTime = (date) => {
    const now = new Date();
    const invoiceDate = new Date(date);
    const diffInSeconds = Math.floor((now - invoiceDate) / 1000);

    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(diffInSeconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  };

  return (
    <MainCard
      title="Recent Invoices"
      secondary={
        <IconButton edge="end" aria-label="more" color="secondary" sx={{ transform: 'rotate(90deg)' }}>
          <MoreIcon />
        </IconButton>
      }
    >
      <Grid container spacing={2.5} alignItems="center">
        {loading ? (
          <Grid item xs={12} textAlign="center">
            <CircularProgress />
          </Grid>
        ) : error ? (
          <Grid item xs={12}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Grid>
        ) : invoices.length === 0 ? (
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              No recent bills available.
            </Typography>
          </Grid>
        ) : (
          invoices.map((invoice, index) => (
            <Grid item xs={12} key={index}>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <Avatar
                    alt={invoice.customerName}
                    src={avatarMap[invoice.customerName] || Avatar1} // default avatar
                  />
                </Grid>
                <Grid item xs zeroMinWidth>
                  <Typography sx={{display: 'flex'}} variant="subtitle1">
                    {invoice.customerName}
                    <Typography color="secondary" component="span">
                      #{invoice.invoiceNo}
                    </Typography>
                    {/* Optional: Overdue Indicator */}
                    {invoice.paymentStatus !== 'Paid' && (
                      <Chip label="Pending" color="error" size="small" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  <Typography                     color={
                      invoice.paymentStatus === 'Paid'
                        ? 'success.main'
                        : invoice.paymentStatus === 'Partial'
                        ? 'warning.main'
                        : 'error.main'
                    }>
                    Rs. {Number(invoice.grandTotal).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography
                    variant="caption"
                    color="gray"
                  >
                    {getRelativeTime(invoice.invoiceDate)}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          ))
        )}
        {!loading && (
          <Grid item xs={12}>
            <Button fullWidth variant="outlined" color="secondary">
              View All
            </Button>
          </Grid>
        )}
      </Grid>
    </MainCard>
  );
}
