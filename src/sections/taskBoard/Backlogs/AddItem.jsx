import PropTypes from 'prop-types';
import { useState } from 'react';

// Material-UI Imports
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

// Date Pickers
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';

// Third-party Libraries
import * as yup from 'yup';
import { Chance } from 'chance';
import { useFormik } from 'formik';

// Project Imports
import IconButton from 'components/@extended/IconButton';
import SimpleBar from 'components/third-party/SimpleBar';
import AnimateButton from 'components/@extended/AnimateButton';
import UploadMultiFile from 'components/third-party/dropzone/MultiFile';

// Config
import { DropzopType } from 'config';

// API Imports
import { addItem, useGetBacklogs, useGetUsers } from 'api/taskboard';
import { openSnackbar } from 'api/snackbar';

// Utils
import { ImagePath, getImageUrl } from 'utils/getImageUrl';

// Assets
import { Add } from 'iconsax-react';

// Chance Instance
const chance = new Chance();

// Validation Schema
const validationSchema = yup.object({
  title: yup.string().required('Task title is required'),
  dueDate: yup.date().required('Due date is required').nullable(),
  image: yup.mixed().nullable(), // Optional image
  files: yup.array().of(yup.mixed())
});

// Function to Upload Images to Cloudinary
const uploadImageToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default'); // Replace with your actual upload preset
  // You can also add other parameters like tags, folder, etc., if needed

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dnde4xq0y/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url; // The URL of the uploaded image
};

// ==============================|| KANBAN BACKLOGS - ADD ITEM ||============================== //
export default function AddItem({ open, handleDrawerOpen, storyId }) {
  // Fetching backlogs and users
  const { backlogs } = useGetBacklogs();
  const { users, usersLoading, usersError } = useGetUsers();

  // State for Image Preview
  const [imagePreview, setImagePreview] = useState(null);

  // Initialize Formik
  const formik = useFormik({
    initialValues: {
      id: '',
      title: '',
      assign: null,
      priority: 'low',
      dueDate: null,
      description: '',
      commentIds: '',
      image: null, // Changed from false to null
      storyId: storyId || '',
      columnId: backlogs?.columns[0]?.id || '',
      files: []
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        // Generate an ID if one isn't provided
        const newId = values.id || `${chance.integer({ min: 1000, max: 9999 })}`;
        values.id = newId;

        // Upload Image if present
        let imageUrl = null;
        if (values.image && values.image instanceof File) {
          imageUrl = await uploadImageToCloudinary(values.image);
        } else if (typeof values.image === 'string') {
          // If image is already a URL (e.g., existing image), keep it
          imageUrl = values.image;
        }

        // Upload Attachments to Cloudinary
        const uploadedFiles = [];
        for (const file of values.files) {
          if (file instanceof File) {
            const url = await uploadImageToCloudinary(file);
            uploadedFiles.push(url);
          } else if (typeof file === 'string') {
            // If it's already a URL, keep it
            uploadedFiles.push(file);
          }
        }
        // Update the values.files with the uploaded URL list
        values.files = uploadedFiles;

        // Construct the item object to send to your API
        const item = {
          id: newId,
          title: values.title,
          assign: values.assign,
          priority: values.priority,
          dueDate: values.dueDate ? new Date(values.dueDate) : new Date(),
          description: values.description,
          commentIds: values.commentIds,
          image: imageUrl, // Set the image URL
          files: values.files
        };

        // Add the item to the backlog/column
        await addItem(values.columnId, item, storyId);

        // Show success message
        openSnackbar({
          open: true,
          message: 'Task added successfully',
          variant: 'alert',
          alert: { color: 'success' }
        });

        // Close drawer & reset form
        handleDrawerOpen();
        resetForm();
        setImagePreview(null);
      } catch (error) {
        console.error(error);
        // Show error message
        openSnackbar({
          open: true,
          message: 'Something went wrong while uploading files or submitting data',
          variant: 'alert',
          alert: { color: 'error' }
        });
      }
    }
  });

  // Handle Image Upload and Preview
  const handleImageUpload = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      formik.setFieldValue('image', file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Drawer
      sx={{
        ml: open ? 3 : 0,
        flexShrink: 0,
        zIndex: 1200,
        overflowX: 'hidden',
        width: { xs: 320, md: 450 },
        '& .MuiDrawer-paper': {
          width: { xs: 320, md: 450 },
          border: 'none',
          borderRadius: '0px'
        }
      }}
      variant="temporary"
      anchor="right"
      open={open}
      ModalProps={{ keepMounted: true }}
      onClose={handleDrawerOpen}
    >
      {open && (
        <SimpleBar sx={{ overflowX: 'hidden', height: '100vh' }}>
          <Box sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h4">Add Task</Typography>
              <Tooltip title="Close">
                <IconButton
                  color="secondary"
                  onClick={handleDrawerOpen}
                  size="small"
                  sx={{ fontSize: '0.875rem' }}
                >
                  {/* Rotate 45deg to get the close effect */}
                  <Add style={{ transform: 'rotate(45deg)' }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
          <Divider />
          <Box sx={{ p: 3 }}>
            <form onSubmit={formik.handleSubmit}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container spacing={2.5}>
                  {/* Title Field */}
                  <Grid item xs={12}>
                    <Stack spacing={1}>
                      <InputLabel>Title</InputLabel>
                      <TextField
                        fullWidth
                        id="title"
                        name="title"
                        placeholder="Title"
                        value={formik.values.title}
                        onChange={formik.handleChange}
                        error={formik.touched.title && Boolean(formik.errors.title)}
                        helperText={formik.touched.title && formik.errors.title}
                      />
                    </Stack>
                  </Grid>

                  {/* Assign to Field */}
                  <Grid item xs={12}>
                    <Stack spacing={1}>
                      <InputLabel>Assign to</InputLabel>
                      {usersError ? (
                        <Typography color="error">Failed to load users</Typography>
                      ) : (
                        <Autocomplete
                          id="assign"
                          value={users.find((user) => user._id === formik.values.assign) || null}
                          onChange={(event, value) => {
                            // Set only the id of the selected user in the formik state
                            formik.setFieldValue('assign', value ? value._id : null);
                          }}
                          options={users}
                          loading={usersLoading}
                          fullWidth
                          autoHighlight
                          getOptionLabel={(option) => option.name || ''}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          renderOption={(props, option) => (
                            <Box
                              component="li"
                              sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                              {...props}
                            >
                              <img
                                loading="lazy"
                                width="20"
                                src={getImageUrl(`${option.avatar}`, ImagePath.USERS)}
                                alt={option.name}
                              />
                              {option.name}
                            </Box>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Choose an assignee"
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {usersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                )
                              }}
                              inputProps={{
                                ...params.inputProps,
                                autoComplete: 'new-password' // Disable autocomplete and autofill
                              }}
                            />
                          )}
                        />
                      )}
                    </Stack>
                    {formik.touched.assign && formik.errors.assign && (
                      <FormHelperText error>{formik.errors.assign}</FormHelperText>
                    )}
                  </Grid>

                  {/* Priority Field */}
                  <Grid item xs={12}>
                    <Stack spacing={1}>
                      <InputLabel>Prioritize</InputLabel>
                      <FormControl>
                        <RadioGroup
                          row
                          aria-label="priority"
                          value={formik.values.priority}
                          onChange={formik.handleChange}
                          name="priority"
                          id="priority"
                        >
                          <FormControlLabel
                            value="low"
                            control={<Radio color="primary" sx={{ color: 'primary.main' }} />}
                            label="Low"
                          />
                          <FormControlLabel
                            value="medium"
                            control={<Radio color="warning" sx={{ color: 'warning.main' }} />}
                            label="Medium"
                          />
                          <FormControlLabel
                            value="high"
                            control={<Radio color="error" sx={{ color: 'error.main' }} />}
                            label="High"
                          />
                        </RadioGroup>
                      </FormControl>
                    </Stack>
                  </Grid>

                  {/* Due Date Field */}
                  <Grid item xs={12}>
                    <Stack spacing={1}>
                      <InputLabel>Due date</InputLabel>
                      <DesktopDatePicker
                        value={formik.values.dueDate}
                        inputFormat="dd/MM/yyyy"
                        onChange={(date) => {
                          formik.setFieldValue('dueDate', date);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            error={formik.touched.dueDate && Boolean(formik.errors.dueDate)}
                            helperText={formik.touched.dueDate && formik.errors.dueDate}
                          />
                        )}
                      />
                    </Stack>
                  </Grid>

                  {/* Description Field */}
                  <Grid item xs={12}>
                    <Stack spacing={1}>
                      <InputLabel>Description</InputLabel>
                      <TextField
                        fullWidth
                        id="description"
                        name="description"
                        multiline
                        rows={3}
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        error={formik.touched.description && Boolean(formik.errors.description)}
                        helperText={formik.touched.description && formik.errors.description}
                      />
                    </Stack>
                  </Grid>

                  {/* State (Column) Field */}
                  <Grid item xs={12}>
                    <Stack spacing={1}>
                      <InputLabel>State</InputLabel>
                      <FormControl fullWidth>
                        <Select
                          id="columnId"
                          name="columnId"
                          displayEmpty
                          value={formik.values.columnId}
                          onChange={formik.handleChange}
                          inputProps={{ 'aria-label': 'Without label' }}
                        >
                          {backlogs?.columns?.map((column, index) => (
                            <MenuItem key={index} value={column.id}>
                              {column.title}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  </Grid>

                  {/* Attachments Field */}
                  <Grid item xs={12}>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <InputLabel sx={{ mt: 0.5 }}>Attachments:</InputLabel>
                      </Grid>
                      <Grid item xs={12}>
                        <UploadMultiFile
                          type={DropzopType.STANDARD}
                          showList={true}
                          setFieldValue={formik.setFieldValue}
                          files={formik.values.files}
                          error={formik.touched.files && !!formik.errors.files}
                        />
                      </Grid>
                      {formik.touched.files && formik.errors.files && (
                        <Grid item xs={12}>
                          <FormHelperText error>
                            {formik.errors.files}
                          </FormHelperText>
                        </Grid>
                      )}
                    </Grid>
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <AnimateButton>
                      <Button fullWidth variant="outlined" type="submit">
                        Save
                      </Button>
                    </AnimateButton>
                  </Grid>
                </Grid>
              </LocalizationProvider>
            </form>
          </Box>
        </SimpleBar>
      )}
    </Drawer>
  );
}

AddItem.propTypes = {
  open: PropTypes.bool.isRequired,
  handleDrawerOpen: PropTypes.func.isRequired,
  storyId: PropTypes.string
};
