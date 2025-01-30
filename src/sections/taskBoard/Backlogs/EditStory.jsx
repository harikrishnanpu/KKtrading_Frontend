import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

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
import Link from '@mui/material/Link';

// Date Pickers
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';

// Third-party Libraries
import * as yup from 'yup';
import { useFormik } from 'formik';

// Project Imports
import AddStoryComment from './AddStoryComment';
import StoryComment from './StoryComment';
import AlertStoryDelete from './AlertStoryDelete';

import IconButton from 'components/@extended/IconButton';
import SimpleBar from 'components/third-party/SimpleBar';
import AnimateButton from 'components/@extended/AnimateButton';
import UploadMultiFile from 'components/third-party/dropzone/MultiFile';

import { DropzopType } from 'config';
import { deleteStory, editStory, useGetBacklogs } from 'api/taskboard';
import { openSnackbar } from 'api/snackbar';
import { ImagePath, getImageUrl } from 'utils/getImageUrl';
import { useGetUsers } from 'api/taskboard';

// Assets
import { Add, Trash } from 'iconsax-react';

// Chance Instance
import Chance from 'chance';
const chance = new Chance();

// ===========================|| VALIDATION SCHEMA ||=========================== //
const validationSchema = yup.object({
  title: yup.string().required('User story title is required'),
  dueDate: yup.date().required('Due date is required').nullable(),
  assign: yup.string().required('Assignee is required'),
  columnId: yup.string().required('State is required'),
  priority: yup.string().oneOf(['low', 'medium', 'high']).required('Priority is required'),
  acceptance: yup.string(),
  description: yup.string(),
  image: yup.mixed().nullable(), // Optional image
  files: yup.array().of(yup.mixed()) // Only the URLs will be sent to backend eventually
});

// ======================|| UPLOAD IMAGE TO CLOUDINARY ||====================== //
const uploadImageToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default'); // Replace with your actual preset

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dqniuczkg/image/upload`,
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

// ==============================|| EDIT STORY DRAWER ||============================== //

export default function EditStory({ story, open, handleDrawerOpen }) {
  const { backlogs } = useGetBacklogs();
  const { users, usersLoading, usersError } = useGetUsers();

  // State for optional image preview (when uploading a new image).
  const [imagePreview, setImagePreview] = useState(null);

  // Modal for confirming story deletion
  const [openModal, setOpenModal] = useState(false);

  const handleModalClose = async (status) => {
    setOpenModal(false);
    if (status) {
      try {
        await deleteStory(story.id);
        openSnackbar({
          open: true,
          message: 'Story deleted successfully',
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
          variant: 'alert',
          alert: { color: 'success' }
        });
        handleDrawerOpen();
      } catch (error) {
        openSnackbar({
          open: true,
          message: 'Failed to delete story',
          variant: 'alert',
          alert: { color: 'error' }
        });
      }
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: story.id,
      title: story.title,
      assign: story.assign,
      columnId: story.columnId,
      priority: story.priority,
      dueDate: story.dueDate ? new Date(story.dueDate) : new Date(),
      acceptance: story.acceptance,
      description: story.description,
      commentIds: story.commentIds || [],
      image: story.image || null,
      itemIds: story.itemIds || [],
      files: story.files || []
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        // Upload new image if present and it's a File
        let imageUrl = null;
        if (values.image && values.image instanceof File) {
          imageUrl = await uploadImageToCloudinary(values.image);
        } else if (typeof values.image === 'string') {
          // Keep existing image URL if it's already a string
          imageUrl = values.image;
        }

        // Upload all new attachments (Files) to Cloudinary
        const uploadPromises = values.files.map((file) => {
          // If it's a File object, upload it
          if (file instanceof File) {
            return uploadImageToCloudinary(file);
          }
          // If it's already a string (URL), keep it
          if (typeof file === 'string') {
            return Promise.resolve(file);
          }
          return Promise.resolve(null);
        });

        const uploadedFiles = await Promise.all(uploadPromises);
        // Filter out any null in case something unexpected happens
        const filteredUploadedFiles = uploadedFiles.filter((url) => url !== null);

        // Construct updated story object
        const updatedStory = {
          id: values.id,
          title: values.title,
          assign: values.assign,
          columnId: values.columnId,
          priority: values.priority,
          dueDate: values.dueDate || new Date(),
          acceptance: values.acceptance,
          description: values.description,
          commentIds: values.commentIds,
          image: imageUrl,
          files: filteredUploadedFiles
        };

        // Call API to edit the story
        await editStory(updatedStory);

        // Notify success
        openSnackbar({
          open: true,
          message: 'Story updated successfully',
          variant: 'alert',
          alert: { color: 'success' }
        });

        // Close drawer & reset form
        handleDrawerOpen();
        resetForm();
        setImagePreview(null);
      } catch (error) {
        console.error(error);
        // Notify error
        openSnackbar({
          open: true,
          message: 'Failed to update story',
          variant: 'alert',
          alert: { color: 'error' }
        });
      } finally {
        setSubmitting(false);
      }
    }
  });

  // Reset form on drawer close
  useEffect(() => {
    if (!open) {
      formik.resetForm();
      setImagePreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Handle new image file selection
  const handleImageUpload = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      formik.setFieldValue('image', file);
      // Create preview
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
          borderRadius: 0
        }
      }}
      variant="temporary"
      anchor="right"
      open={open}
      ModalProps={{ keepMounted: true }}
      onClose={() => {
        handleDrawerOpen();
        formik.resetForm();
        setImagePreview(null);
      }}
    >
      {open && (
        <SimpleBar sx={{ overflowX: 'hidden', height: '100vh' }}>
          {/* Top Section */}
          <Box sx={{ p: 3 }}>
            <Grid container alignItems="center" spacing={0.5} justifyContent="space-between">
              <Grid item sx={{ width: 'calc(100% - 64px)' }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography
                    variant="h4"
                    sx={{
                      display: 'inline-block',
                      width: 'calc(100% - 34px)',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      verticalAlign: 'middle'
                    }}
                  >
                    {story.title}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item>
                <Stack direction="row" alignItems="center">
                  <Tooltip title="Delete Story">
                    <IconButton
                      color="error"
                      onClick={() => setOpenModal(true)}
                      size="small"
                      sx={{ fontSize: '0.875rem' }}
                    >
                      <Trash variant="Bold" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Close">
                    <IconButton
                      color="secondary"
                      onClick={handleDrawerOpen}
                      size="small"
                      sx={{ fontSize: '0.875rem' }}
                    >
                      <Add style={{ transform: 'rotate(45deg)' }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <AlertStoryDelete title={story.title} open={openModal} handleClose={handleModalClose} />
              </Grid>
            </Grid>
          </Box>
          <Divider />

          {/* Content Section */}
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <form onSubmit={formik.handleSubmit}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Grid container spacing={2.5}>
                      {/* Title Field */}
                      <Grid item xs={12}>
                        <Stack spacing={1}>
                          <InputLabel htmlFor="title">Title</InputLabel>
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

                      {/* Assign To Field */}
                      <Grid item xs={12}>
                        <Stack spacing={1}>
                          <InputLabel htmlFor="assign">Assign to</InputLabel>
                          {usersError ? (
                            <Typography color="error">Failed to load users</Typography>
                          ) : (
                            <Autocomplete
                              id="assign"
                              value={
                                users?.find((user) => user._id === formik.values.assign) || null
                              }
                              onChange={(event, value) => {
                                formik.setFieldValue('assign', value ? value._id : '');
                              }}
                              options={users || []}
                              loading={usersLoading}
                              fullWidth
                              autoHighlight
                              getOptionLabel={(option) => option.name || ''}
                              // Important: match on `_id`
                              isOptionEqualToValue={(option, value) => option._id === value._id}
                              renderOption={(props, option) => (
                                <Box
                                  component="li"
                                  sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                                  {...props}
                                >
                                  {option.avatar && (
                                    <img
                                      loading="lazy"
                                      width="20"
                                      src={getImageUrl(`${option.avatar}`, ImagePath.USERS)}
                                      alt={option.name}
                                    />
                                  )}
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
                                        {usersLoading ? (
                                          <CircularProgress color="inherit" size={20} />
                                        ) : null}
                                        {params.InputProps.endAdornment}
                                      </>
                                    )
                                  }}
                                  inputProps={{
                                    ...params.inputProps,
                                    autoComplete: 'new-password'
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
                          <InputLabel>Priority</InputLabel>
                          <FormControl component="fieldset">
                            <RadioGroup
                              row
                              aria-label="priority"
                              name="priority"
                              value={formik.values.priority}
                              onChange={formik.handleChange}
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
                            {formik.touched.priority && formik.errors.priority && (
                              <FormHelperText error>{formik.errors.priority}</FormHelperText>
                            )}
                          </FormControl>
                        </Stack>
                      </Grid>

                      {/* Due Date Field */}
                      <Grid item xs={12}>
                        <Stack spacing={1}>
                          <InputLabel>Due date</InputLabel>
                          <DesktopDatePicker
                            label="Select due date"
                            inputFormat="dd/MM/yyyy"
                            value={formik.values.dueDate}
                            onChange={(date) => {
                              formik.setFieldValue('dueDate', date);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                fullWidth
                                error={formik.touched.dueDate && Boolean(formik.errors.dueDate)}
                                helperText={formik.touched.dueDate && formik.errors.dueDate}
                              />
                            )}
                          />
                        </Stack>
                      </Grid>

                      {/* Acceptance Criteria */}
                      <Grid item xs={12}>
                        <Stack spacing={1}>
                          <InputLabel htmlFor="acceptance">Acceptance Criteria</InputLabel>
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
                          <InputLabel htmlFor="description">Description</InputLabel>
                          <TextField
                            fullWidth
                            id="description"
                            name="description"
                            multiline
                            rows={3}
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            error={
                              formik.touched.description && Boolean(formik.errors.description)
                            }
                            helperText={formik.touched.description && formik.errors.description}
                          />
                        </Stack>
                      </Grid>

                      {/* State (Column) Field */}
                      <Grid item xs={12}>
                        <Stack spacing={1}>
                          <InputLabel htmlFor="columnId">State</InputLabel>
                          <FormControl fullWidth>
                            <Select
                              id="columnId"
                              name="columnId"
                              displayEmpty
                              value={formik.values.columnId}
                              onChange={formik.handleChange}
                              error={formik.touched.columnId && Boolean(formik.errors.columnId)}
                            >
                              {backlogs?.columns?.map((column) => (
                                <MenuItem key={column.id} value={column.id}>
                                  {column.title}
                                </MenuItem>
                              ))}
                            </Select>
                            {formik.touched.columnId && formik.errors.columnId && (
                              <FormHelperText error>{formik.errors.columnId}</FormHelperText>
                            )}
                          </FormControl>
                        </Stack>
                      </Grid>

                      {/* Attachments Field */}
                      <Grid item xs={12}>
                        <Grid container spacing={1}>
                          <Grid item xs={12}>
                            <InputLabel sx={{ mt: 0.5 }}>Attachments:</InputLabel>
                          </Grid>

                          {/* Existing File URLs */}
                          {formik.values.files.map((file, idx) => {
                            if (typeof file === 'string') {
                              return (
                                <Grid item xs={12} key={`existing-file-${idx}`}>
                                  <Link
                                    href={file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    underline="hover"
                                    color="primary"
                                  >
                                    {file.split('/').pop()}
                                  </Link>
                                </Grid>
                              );
                            }
                            return null;
                          })}

                          {/* Dropzone for New Attachments */}
                          <Grid item xs={12}>
                            <UploadMultiFile
                              type={DropzopType.STANDARD}
                              showList
                              setFieldValue={formik.setFieldValue}
                              files={formik.values.files}
                              error={formik.touched.files && !!formik.errors.files}
                            />
                          </Grid>

                          {formik.touched.files && formik.errors.files && (
                            <Grid item xs={12}>
                              <FormHelperText error>{formik.errors.files}</FormHelperText>
                            </Grid>
                          )}
                        </Grid>
                      </Grid>

                      {/* Submit Button */}
                      <Grid item xs={12}>
                        <AnimateButton>
                          <Button
                            fullWidth
                            variant="outlined"
                            type="submit"
                            disabled={formik.isSubmitting}
                          >
                            {formik.isSubmitting ? 'Saving...' : 'Save'}
                          </Button>
                        </AnimateButton>
                      </Grid>
                    </Grid>
                  </LocalizationProvider>
                </form>
              </Grid>

              {/* Comments Section */}
              <Grid item xs={12}>
                {story.commentIds && story.commentIds.length > 0 ? (
                  [...story.commentIds].reverse().map((commentId) => {
                    const commentData = backlogs?.comments?.find(
                      (comment) => comment.id === commentId
                    );
                    if (!commentData) return null;
                    else{
                    const profile = users?.find((user) => user._id === commentData.author) || null;
                    return <StoryComment key={commentData.id} comment={commentData} profile={profile}     storyId={story.id}  />;
                    }
                  })
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No comments yet.
                  </Typography>
                )}
              </Grid>

              {/* Add New Comment */}
              <Grid item xs={12}>
                <AddStoryComment storyId={story.id} />
              </Grid>
            </Grid>
          </Box>
        </SimpleBar>
      )}
    </Drawer>
  );
}

EditStory.propTypes = {
  story: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    assign: PropTypes.string.isRequired,
    columnId: PropTypes.string.isRequired,
    priority: PropTypes.oneOf(['low', 'medium', 'high']).isRequired,
    dueDate: PropTypes.string,
    acceptance: PropTypes.string,
    description: PropTypes.string,
    commentIds: PropTypes.arrayOf(PropTypes.string),
    image: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(File)]),
    itemIds: PropTypes.arrayOf(PropTypes.string),
    files: PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(File)])
    )
  }).isRequired,
  open: PropTypes.bool.isRequired,
  handleDrawerOpen: PropTypes.func.isRequired
};
