import PropTypes from 'prop-types';
import { useState } from 'react';

// material-ui
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

// date pickers
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';

// third-party
import * as yup from 'yup';
import { Chance } from 'chance';
import { useFormik } from 'formik';

// project imports
import IconButton from 'components/@extended/IconButton';
import SimpleBar from 'components/third-party/SimpleBar';
import AnimateButton from 'components/@extended/AnimateButton';
import UploadMultiFile from 'components/third-party/dropzone/MultiFile';

// config/types
import { DropzopType } from 'config';

// apis
import { addStory, useGetBacklogs, useGetUsers } from 'api/taskboard';
import { openSnackbar } from 'api/snackbar';

// utils
import { ImagePath, getImageUrl } from 'utils/getImageUrl';

// assets
import { Add } from 'iconsax-react';

const chance = new Chance();

// 1. Validation schema
const validationSchema = yup.object({
  title: yup.string().required('User story title is required'),
  dueDate: yup.date().required('Due date is required').nullable()
});

// 2. Function to upload a file to Cloudinary (you can adapt env vars as needed)
const uploadImageToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  // Replace these with your own environment variables or hardcoded strings
  formData.append('upload_preset', 'ml_default');
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dnde4xq0y/image/upload`, 
    {
      method: 'POST',
      body: formData
    }
  );
  const data = await response.json();
  // data.secure_url is typically the hosted image URL
  return data.secure_url;
};

// ==============================|| KANBAN BACKLOGS - ADD STORY ||============================== //
export default function AddStory({ open, handleDrawerOpen }) {
  // 3. Fetch data
  const { backlogs } = useGetBacklogs();
  const { users, usersLoading, usersError } = useGetUsers();

  // 4. Initialize formik
  const formik = useFormik({
    initialValues: {
      id: '',
      title: '',
      assign: null,
      columnId: '',
      priority: 'low',
      dueDate: null,
      acceptance: '',
      description: '',
      commentIds: '',
      image: false,
      itemIds: [],
      files: []
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        // Generate a random ID (example usage)
        values.id = `${chance.integer({ min: 1000, max: 9999 })}`;

        // Upload all attached files to Cloudinary
        const uploadedFiles = [];
        for (const file of values.files) {
          // If file is a File object, upload to Cloudinary
          if (file instanceof File) {
            const url = await uploadImageToCloudinary(file);
            uploadedFiles.push(url);
          } else {
            // If file is not a File instance (e.g., already has a URL), handle accordingly
            // (For example, if your dropzone or re-uploads are being processed differently)
            uploadedFiles.push(file);
          }
        }

        // Assign the uploaded URLs back into values (if your backend expects an array of URLs)
        values.files = uploadedFiles;

        // Call your API to add the new story
        await addStory(values);

        // Show success notification
        openSnackbar({
          open: true,
          message: 'Submit Success',
          variant: 'alert',
          alert: {
            color: 'success'
          }
        });

        // Close the drawer
        handleDrawerOpen();
        resetForm();
      } catch (error) {
        // Show error notification or handle error as needed
        openSnackbar({
          open: true,
          message: 'Something went wrong while uploading files or submitting data',
          variant: 'alert',
          alert: {
            color: 'error'
          }
        });
      }
    }
  });

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
        <SimpleBar
          sx={{
            overflowX: 'hidden',
            height: '100vh'
          }}
        >
          <Box sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h4">Add Story</Typography>
              <Tooltip title="Close">
                <IconButton color="secondary" onClick={handleDrawerOpen} size="small" sx={{ fontSize: '0.875rem' }}>
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
                        format="dd/MM/yyyy"
                        onChange={(date) => {
                          formik.setFieldValue('dueDate', date);
                        }}
                      />
                      {formik.touched.dueDate && formik.errors.dueDate && (
                        <FormHelperText error>{formik.errors.dueDate}</FormHelperText>
                      )}
                    </Stack>
                  </Grid>

                  {/* Acceptance Field */}
                  <Grid item xs={12}>
                    <Stack spacing={1}>
                      <InputLabel>Acceptance</InputLabel>
                      <TextField
                        fullWidth
                        id="acceptance"
                        name="acceptance"
                        multiline
                        rows={3}
                        value={formik.values.acceptance}
                        onChange={formik.handleChange}
                        error={formik.touched.acceptance && Boolean(formik.errors.acceptance)}
                        helperText={formik.touched.acceptance && formik.errors.acceptance}
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

                  {/* State (column) Field */}
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
                          {backlogs?.columns.map((column, index) => (
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

AddStory.propTypes = {
  open: PropTypes.bool,
  handleDrawerOpen: PropTypes.func
};
