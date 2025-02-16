import React, { useEffect, useState } from 'react';

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';

// Icons
import { CallCalling, Gps, Link1, Sms } from 'iconsax-react';

// Project Imports
import useAuth from 'hooks/useAuth';
import MainCard from 'components/MainCard';
import Avatar from 'components/@extended/Avatar';

// Assets
import defaultImages from 'assets/images/users/default.png';
import api from 'pages/api';

export default function TabProfile() {
  const { user } = useAuth();
  const matchDownMD = useMediaQuery((theme) => theme.breakpoints.down('md'));

  // Local state to hold fetched data
  const [userData, setUserData] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user & bills data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Fetch the user data from backend using user._id
        // Adjust the route to match your actual endpoint
        const userRes = await api.get(`/api/users/${user._id}`);
        const fetchedUser = userRes.data;
        setUserData(fetchedUser);

        // 2) Fetch the bills where the 'salesmanName' equals the user's name
        // Adjust the query param and route as needed
        const billsRes = await api.get(
          `/api/billing/bill/profile?salesmanName=${encodeURIComponent(fetchedUser.name)}`
        );
        setBills(billsRes.data);
      } catch (error) {
        console.error('Error fetching user/billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!userData) {
    return <Typography>No user data found.</Typography>;
  }

  // Destructure needed fields from user data:
  // Make sure these fields actually exist in your user schema
  const {
    name,
    email,
    contactNumber,
    personal_phone,
    personal_email,
    location,
    role,
    avatar,
  } = userData;

  return (
    <Grid container spacing={3}>
      {/* Left Column: Profile Card */}
      <Grid item xs={12} sm={5} md={4} xl={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <MainCard>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Stack spacing={2.5} alignItems="center" mt={2}>
                    <Avatar
                      alt={name || 'User Avatar'}
                      size="xl"
                      src={avatar || defaultImages}
                    />
                    <Stack spacing={0.5} alignItems="center">
                      <Typography variant="h5">{name}</Typography>
                      <Typography color="secondary">
                        {role || 'No Role'}
                      </Typography>
                    </Stack>
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* Contact Info */}
                <Grid item xs={12}>
                  <List
                    component="nav"
                    aria-label="main mailbox folders"
                    sx={{
                      py: 0,
                      '& .MuiListItem-root': { p: 0, py: 1 },
                    }}
                  >
                    {/* Email */}
                    <ListItem>
                      <ListItemIcon>
                        <Sms size={18} />
                      </ListItemIcon>
                      <ListItemSecondaryAction>
                        <Typography align="right">
                          {personal_email || email}
                        </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>

                    {/* Phone */}
                    <ListItem>
                      <ListItemIcon>
                        <CallCalling size={18} />
                      </ListItemIcon>
                      <ListItemSecondaryAction>
                        <Typography align="right">
                          {personal_phone || contactNumber || 'N/A'}
                        </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>

                    {/* Location */}
                    {location && (
                      <ListItem>
                        <ListItemIcon>
                          <Gps size={18} />
                        </ListItemIcon>
                        <ListItemSecondaryAction>
                          <Typography align="right">{location}</Typography>
                        </ListItemSecondaryAction>
                      </ListItem>
                    )}

                    {/* (Optional) Website or link if you have one */}
                    {/* <ListItem>
                      <ListItemIcon>
                        <Link1 size={18} />
                      </ListItemIcon>
                      <ListItemSecondaryAction>
                        <Link
                          align="right"
                          href="https://google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          My Website
                        </Link>
                      </ListItemSecondaryAction>
                    </ListItem> */}
                  </List>
                </Grid>
              </Grid>
            </MainCard>
          </Grid>
        </Grid>
      </Grid>

      {/* Right Column: Personal Details + Bills */}
      <Grid item xs={12} sm={7} md={8} xl={9}>
        <Grid container spacing={3}>
          {/* Personal Details Card */}
          <Grid item xs={12}>
            <MainCard title="Personal Details">
              <List sx={{ py: 0 }}>
                <ListItem divider={!matchDownMD}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={0.5}>
                        <Typography color="secondary">Full Name</Typography>
                        <Typography>{name}</Typography>
                      </Stack>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Stack spacing={0.5}>
                        <Typography color="secondary">Email</Typography>
                        <Typography>{email}</Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </ListItem>

                <ListItem divider={!matchDownMD}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={0.5}>
                        <Typography color="secondary">Phone</Typography>
                        <Typography>
                          {contactNumber || personal_phone || 'N/A'}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={0.5}>
                        <Typography color="secondary">Role</Typography>
                        <Typography>{role}</Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </ListItem>

                <ListItem>
                  <Stack spacing={0.5}>
                    <Typography color="secondary">Location</Typography>
                    <Typography>{location || 'N/A'}</Typography>
                  </Stack>
                </ListItem>
              </List>
            </MainCard>
          </Grid>

          {/* Show Bills Info */}
          <Grid item xs={12}>
            <MainCard title="Your Bills (As Salesman)">
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Total Bills: {bills.length}
              </Typography>
              {bills.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Invoice No.</TableCell>
                        <TableCell>Customer Name</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bills.map((bill) => (
                        <TableRow key={bill._id}>
                          <TableCell>{bill.invoiceNo}</TableCell>
                          <TableCell>{bill.customerName}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>No bills found.</Typography>
              )}
            </MainCard>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
