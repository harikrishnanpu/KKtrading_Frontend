import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import * as yup from 'yup';

// Material UI Components
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

// Date Pickers
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';

// Project Imports
import AnimateButton from 'components/@extended/AnimateButton';
import UploadMultiFile from 'components/third-party/dropzone/MultiFile';

// API Imports
import { editItem, useGetUsers } from 'api/taskboard';
import { openSnackbar } from 'api/snackbar';

// Utility Imports
import { getImageUrl, ImagePath } from 'utils/getImageUrl';
import { DropzopType } from 'config';

// =============================|| VALIDATION SCHEMA ||============================= //

const validationSchema = yup.object({
  title: yup.string().required('Task title is required'),
  assign: yup.string().nullable(),
  priority: yup.string().nullable(),
  dueDate: yup.date().nullable(),
  description: yup.string().nullable(),
  storyId: yup.string().nullable(),
  columnId: yup.string().nullable(),
  // Each item in "files" can be a URL (string) or a File object
  files: yup.array().of(yup.mixed())
});

// =============================|| HELPER: UPLOAD FILES TO CLOUDINARY ||============================= //

const uploadFileToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  // Replace 'ml_default' with your actual Cloudinary upload preset
  formData.append('upload_preset', 'ml_default');

  const response = await fetch('https://api.cloudinary.com/v1_1/dnde4xq0y/image/upload', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to upload file to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url; // The URL of the uploaded file
};

// =============================|| EDIT ITEM COMPONENT ||============================= //

export default function EditItem({ item, userStory, columns, handleDrawerOpen }) {
  // 1. Identify the user story/column for this item
  const itemUserStory = userStory?.find((story) => story.itemIds.includes(item.id));
  const itemColumn = columns?.find((column) => column.itemIds.includes(item.id));

  // 2. Fetch all users (assignees)
  const { users, usersLoading, usersError } = useGetUsers();

  // 3. Initialize Formik
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: item.id,
      title: item.title || '',
      assign: item.assign || '',
      priority: item.priority || 'medium',
      dueDate: item.dueDate ? new Date(item.dueDate) : null,
      description: item.description || '',
      commentIds: item.commentIds || [],
      storyId: itemUserStory ? itemUserStory.id : '',
      columnId: itemColumn ? itemColumn.id : '',
      // Pre-load existing attachments as strings
      files: item.attachments || []
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // 1) Upload new File objects; keep existing URLs
        const uploadedFiles = [];
        for (const f of values.files) {
          if (f instanceof File) {
            const url = await uploadFileToCloudinary(f);
            uploadedFiles.push(url);
          } else if (typeof f === 'string') {
            // Already a URL
            uploadedFiles.push(f);
          }
        }

        // 2) Prepare item data
        const itemToEdit = {
          id: values.id,
          title: values.title,
          assign: values.assign,
          priority: values.priority,
          dueDate: values.dueDate ? values.dueDate.toISOString() : null,
          description: values.description,
          commentIds: values.commentIds,
          attachments: uploadedFiles
        };

        // 3) Edit the item in backend
        await editItem(values.columnId, itemToEdit, values.storyId);

        // 4) Notify success + close drawer
        openSnackbar({
          open: true,
          message: 'Item updated successfully',
          variant: 'alert',
          alert: { color: 'success' }
        });
        handleDrawerOpen();
      } catch (error) {
        console.error(error);
        openSnackbar({
          open: true,
          message: 'Failed to update item. Please try again.',
          variant: 'alert',
          alert: { color: 'error' }
        });
      } finally {
        setSubmitting(false);
      }
    }
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Grid container spacing={2.5}>
          {/* Title */}
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
                onBlur={formik.handleBlur}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
              />
            </Stack>
          </Grid>

          {/* Assign to */}
          <Grid item xs={12}>
            <Stack spacing={1}>
              <InputLabel htmlFor="assign">Assign to</InputLabel>
              {usersError ? (
                <Typography color="error">Failed to load users</Typography>
              ) : (
                <Autocomplete
                  id="assign"
                  value={users.find((u) => u._id === formik.values.assign) || null}
                  onChange={(event, newValue) => {
                    formik.setFieldValue('assign', newValue ? newValue._id : '');
                  }}
                  options={users}
                  loading={usersLoading}
                  fullWidth
                  autoHighlight
                  getOptionLabel={(option) => option.name || ''}
                  isOptionEqualToValue={(option, value) => option._id === value?._id}
                  renderOption={(props, option) => (
                    <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                      <img
                        loading="lazy"
                        width="20"
                        src={getImageUrl(option.avatar, ImagePath.USERS)}
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
                            {usersLoading ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                      inputProps={{
                        ...params.inputProps,
                        autoComplete: 'new-password' // Disable autofill
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

          {/* Priority */}
          <Grid item xs={12}>
            <Stack spacing={1}>
              <InputLabel>Prioritize</InputLabel>
              <FormControl component="fieldset" variant="standard">
                <RadioGroup
                  row
                  aria-label="priority"
                  value={formik.values.priority}
                  onChange={formik.handleChange}
                  name="priority"
                  id="priority"
                >
                  <FormControlLabel value="low" control={<Radio color="primary" />} label="Low" />
                  <FormControlLabel value="medium" control={<Radio color="warning" />} label="Medium" />
                  <FormControlLabel value="high" control={<Radio color="error" />} label="High" />
                </RadioGroup>
              </FormControl>
            </Stack>
            {formik.touched.priority && formik.errors.priority && (
              <FormHelperText error>{formik.errors.priority}</FormHelperText>
            )}
          </Grid>

          {/* Due date */}
          <Grid item xs={12}>
            <Stack spacing={1}>
              <InputLabel htmlFor="dueDate">Due date</InputLabel>
              <DesktopDatePicker
                id="dueDate"
                name="dueDate"
                label="Due Date"
                inputFormat="dd/MM/yyyy"
                value={formik.values.dueDate}
                onChange={(date) => formik.setFieldValue('dueDate', date)}
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

          {/* Description */}
          <Grid item xs={12}>
            <Stack spacing={1}>
              <InputLabel htmlFor="description">Description</InputLabel>
              <TextField
                fullWidth
                id="description"
                name="description"
                multiline
                rows={3}
                placeholder="Description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
              />
            </Stack>
          </Grid>

          {/* User story */}
          <Grid item xs={12}>
            <Stack spacing={1}>
              <InputLabel htmlFor="storyId">User Story</InputLabel>
              <FormControl fullWidth>
                <Select
                  id="storyId"
                  name="storyId"
                  displayEmpty
                  value={formik.values.storyId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {userStory?.length ? (
                    userStory.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.id} - {s.title}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No User Stories Available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Stack>
            {formik.touched.storyId && formik.errors.storyId && (
              <FormHelperText error>{formik.errors.storyId}</FormHelperText>
            )}
          </Grid>

          {/* Column/State */}
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
                  onBlur={formik.handleBlur}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {columns?.length ? (
                    columns.map((col) => (
                      <MenuItem key={col.id} value={col.id}>
                        {col.title}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No Columns Available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Stack>
            {formik.touched.columnId && formik.errors.columnId && (
              <FormHelperText error>{formik.errors.columnId}</FormHelperText>
            )}
          </Grid>

          {/* Attachments */}
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

          {/* Submit button */}
          <Grid item xs={12}>
            <AnimateButton>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                type="submit"
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save'}
              </Button>
            </AnimateButton>
          </Grid>
          
        </Grid>
      </LocalizationProvider>
    </form>
  );
}

EditItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    assign: PropTypes.string,
    priority: PropTypes.string,
    dueDate: PropTypes.string,
    description: PropTypes.string,
    commentIds: PropTypes.arrayOf(PropTypes.string),
    attachments: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  userStory: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      itemIds: PropTypes.arrayOf(PropTypes.string).isRequired
    })
  ).isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      itemIds: PropTypes.arrayOf(PropTypes.string).isRequired
    })
  ).isRequired,
  handleDrawerOpen: PropTypes.func.isRequired
};
