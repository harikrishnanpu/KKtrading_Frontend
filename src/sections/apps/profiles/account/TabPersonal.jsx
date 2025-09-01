import { useState, useEffect } from 'react';
import axios from 'axios';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import FormLabel from '@mui/material/FormLabel';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

// third-party

// project-imports
import Avatar from 'components/@extended/Avatar';
import MainCard from 'components/MainCard';
import { ThemeMode, facebookColor, linkedInColor } from 'config';
import { Apple, Camera, Facebook, Google } from 'iconsax-react';
import useAuth from 'hooks/useAuth';
import api from 'pages/api';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

export default function TabPersonal() {
  const theme = useTheme();
  const { user } = useAuth(); // assumes user object contains _id

  // State for loading, image upload, and form submission
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Controlled form state; these fields match your User model.
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '', // password field remains empty unless updating
    role: '',
    contactNumber: '',
    personal_email: '',
    personal_phone: '',
    work_email: '',
    work_phone: '',
    location: '',
    status: '',
    birthdayText: '',
    avatar: '',
    online_status: 'offline',
  });

  // Fetch current user details on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user._id) return;
      setLoading(true);
      try {
        // Adjust this endpoint if needed.
        const { data } = await api.get(`/api/users/${user._id}`);
        setFormValues({
          name: data.name || '',
          email: data.email || '',
          password: '', // do not preload password
          role: data.role || '',
          contactNumber: data.contactNumber || '',
          personal_email: data.personal_email || '',
          personal_phone: data.personal_phone || '',
          work_email: data.work_email || '',
          work_phone: data.work_phone || '',
          location: data.location || '',
          status: data.status || '',
          birthdayText: data.birthdayText || '',
          avatar: data.avatar || '',
          online_status: data.online_status || 'offline',
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Handle changes for controlled inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Upload image to Cloudinary and return its URL
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/uploads/profile',formData);
    return response.data.url;
  };

  // Handle avatar image change and upload to Cloudinary
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(file);
      setFormValues((prev) => ({ ...prev, avatar: imageUrl }));
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  // Submit the updated profile to the backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      // Sends the formValues to your update endpoint.
      // Note: The password field will only update if provided.
      const { data } = await api.put(`/api/users/user/edit/${user._id}`, formValues);
      console.log('Profile updated:', data);
      // Optionally, display a success notification here.
    } catch (error) {
      console.error('Error updating profile:', error);
      // Optionally, display an error notification here.
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        {/* Personal Information Card */}
        <Grid item xs={12} sm={6}>
          <MainCard title="Personal Information">
            <Grid container spacing={3}>
              <Grid item xs={12} display="flex" justifyContent="center">
                <Stack spacing={2.5} alignItems="center">
                  <FormLabel
                    htmlFor="change-avatar"
                    sx={{
                      position: 'relative',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      '&:hover .overlay': { opacity: 1 },
                    }}
                  >
                    <Avatar
                      alt="Avatar"
                      src={formValues.avatar}
                      sx={{ width: 76, height: 76 }}
                    />
                    <Box
                      className="overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        backgroundColor:
                          theme.palette.mode === ThemeMode.DARK
                            ? 'rgba(255, 255, 255, .75)'
                            : 'rgba(0,0,0,.65)',
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'opacity 0.3s',
                      }}
                    >
                      {uploading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Stack spacing={0.5} alignItems="center">
                          <Camera
                            style={{
                              color: theme.palette.secondary.lighter,
                              fontSize: '1.5rem',
                            }}
                          />
                          <Typography
                            sx={{ color: 'secondary.lighter' }}
                            variant="caption"
                          >
                            Upload
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  </FormLabel>
                  <TextField
                    type="file"
                    id="change-avatar"
                    variant="outlined"
                    sx={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="name">Full Name</InputLabel>
                  <TextField
                    fullWidth
                    id="name"
                    name="name"
                    value={formValues.name}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                  />
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="email">Email Address</InputLabel>
                  <TextField
                    fullWidth
                    type="email"
                    id="email"
                    name="email"
                    value={formValues.email}
                    onChange={handleInputChange}
                    placeholder="Email Address"
                  />
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="password">Password</InputLabel>
                  <TextField
                    fullWidth
                    type="password"
                    id="password"
                    name="password"
                    value={formValues.password}
                    onChange={handleInputChange}
                    placeholder="Enter new password (leave blank to keep current)"
                  />
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="role">Role</InputLabel>
                  <TextField
                    fullWidth
                    id="role"
                    name="role"
                    value={formValues.role}
                    onChange={handleInputChange}
                    placeholder="Role"
                  />
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="birthdayText">Birthday</InputLabel>
                  <TextField
                    fullWidth
                    id="birthdayText"
                    name="birthdayText"
                    value={formValues.birthdayText}
                    onChange={handleInputChange}
                    placeholder="YYYY-MM-DD"
                  />
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="status">Status</InputLabel>
                  <TextField
                    fullWidth
                    id="status"
                    name="status"
                    value={formValues.status}
                    onChange={handleInputChange}
                    placeholder="Status"
                  />
                </Stack>
              </Grid>
            </Grid>
          </MainCard>
        </Grid>

        {/* Contact Information Card */}
        <Grid item xs={12} sm={6}>
          <MainCard title="Contact Information">
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="contactNumber">Contact Number</InputLabel>
                  <TextField
                    fullWidth
                    id="contactNumber"
                    name="contactNumber"
                    value={formValues.contactNumber}
                    onChange={handleInputChange}
                    placeholder="Contact Number"
                  />
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="personal_email">Personal Email</InputLabel>
                  <TextField
                    fullWidth
                    id="personal_email"
                    name="personal_email"
                    value={formValues.personal_email}
                    onChange={handleInputChange}
                    placeholder="Personal Email"
                  />
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="work_email">Work Email</InputLabel>
                  <TextField
                    fullWidth
                    id="work_email"
                    name="work_email"
                    value={formValues.work_email}
                    onChange={handleInputChange}
                    placeholder="Work Email"
                  />
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="personal_phone">Personal Phone</InputLabel>
                  <TextField
                    fullWidth
                    id="personal_phone"
                    name="personal_phone"
                    value={formValues.personal_phone}
                    onChange={handleInputChange}
                    placeholder="Personal Phone"
                  />
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="work_phone">Work Phone</InputLabel>
                  <TextField
                    fullWidth
                    id="work_phone"
                    name="work_phone"
                    value={formValues.work_phone}
                    onChange={handleInputChange}
                    placeholder="Work Phone"
                  />
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="location">Location</InputLabel>
                  <TextField
                    fullWidth
                    id="location"
                    name="location"
                    value={formValues.location}
                    onChange={handleInputChange}
                    placeholder="Location"
                  />
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="online_status">Online Status</InputLabel>
                  <TextField
                    fullWidth
                    id="online_status"
                    name="online_status"
                    value={formValues.online_status}
                    disabled
                  />
                </Stack>
              </Grid>
            </Grid>
          </MainCard>
        </Grid>

        {/* Submit/Cancel Buttons */}
        <Grid item xs={12}>
          <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
            <Button variant="outlined" color="secondary">
              Cancel
            </Button>
            <Button type="submit" variant="outlined" disabled={updateLoading}>
              {updateLoading ? <CircularProgress size={24} /> : 'Update Profile'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </form>
  );
}
