import PropTypes from 'prop-types';
import { useState } from 'react';

// Material-UI
import { useTheme, alpha } from '@mui/material/styles';
import Menu from '@mui/material/Menu';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';

// Third-party
import { Draggable } from '@hello-pangea/dnd';

// Project Imports
import EditStory from '../Backlogs/EditStory';
import AlertItemDelete from './AlertItemDelete';
import IconButton from 'components/@extended/IconButton';
import MoreIcon from 'components/@extended/MoreIcon';

import { openSnackbar } from 'api/snackbar';
import { deleteItem, handleTaskboardDialog, useGetBacklogs } from 'api/taskboard';
import { getImageUrl } from 'utils/getImageUrl';

// Assets
import { Hierarchy } from 'iconsax-react';

// Helper Function for Drag Styling
const getDragWrapper = (isDragging, draggableStyle, theme, radius) => {
  const bgcolor = alpha(theme.palette.background.paper, 0.99);
  return {
    userSelect: 'none',
    margin: `0 0 8px 0`,
    padding: 16,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: isDragging ? bgcolor : theme.palette.background.paper,
    borderRadius: radius,
    ...draggableStyle,
  };
};

// PropTypes Definitions Based on Mongoose Schemas
const ItemPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  commentIds: PropTypes.arrayOf(PropTypes.string),
  assign: PropTypes.string,
  priority: PropTypes.oneOf(['low', 'medium', 'high']),
  dueDate: PropTypes.instanceOf(Date),
  status: PropTypes.oneOf(['To Do', 'In Progress', 'Done']),
  createdAt: PropTypes.instanceOf(Date),
  updatedAt: PropTypes.instanceOf(Date),
  image: PropTypes.bool,
  userStory: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    files: PropTypes.arrayOf(PropTypes.string),
  }),
});

export default function Items({ item, index }) {
  const theme = useTheme();
  const { backlogs } = useGetBacklogs();

  // Determine if the item has an associated user story
  const itemStory = backlogs?.userStory.find((story) =>
    story.itemIds.includes(item.id)
  );

  // Handlers for Menu
  const [anchorEl, setAnchorEl] = useState(null);
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handlers for Delete Confirmation Modal
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const handleDelete = () => {
    setDeleteModalOpen(true);
  };
  const handleDeleteModalClose = async (confirmed) => {
    setDeleteModalOpen(false);
    if (confirmed) {
      try {
        await deleteItem(item.id);
        openSnackbar({
          open: true,
          message: 'Task deleted successfully',
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
          variant: 'alert',
          alert: { color: 'success' },
        });
      } catch (error) {
        openSnackbar({
          open: true,
          message: 'Failed to delete the task',
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
          variant: 'alert',
          alert: { color: 'error' },
        });
        console.error('Delete Item Error:', error);
      }
    }
  };

  // Handlers for Edit Story Drawer
  const [openStoryDrawer, setOpenStoryDrawer] = useState(false);
  const handleStoryDrawerOpen = () => {
    setOpenStoryDrawer((prevState) => !prevState);
  };

  // Handler for Editing Item Details
  const handleEdit = () => {
    handleTaskboardDialog(item.id);
    handleMenuClose();
  };

  return (
    <Draggable key={item.id} draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={getDragWrapper(
            snapshot.isDragging,
            provided.draggableProps.style,
            theme,
            '12px'
          )}
        >
          {/* Item Header */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: itemStory ? -0.75 : 0 }}
          >
            {/* Item Title */}
            <Typography
              onClick={() => handleTaskboardDialog(item.id)}
              variant="subtitle1"
              sx={{
                display: 'inline-block',
                width: 'calc(100% - 34px)',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                verticalAlign: 'middle',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {item.title}
            </Typography>

            {/* More Options Button */}
            <IconButton
              size="small"
              color="secondary"
              onClick={handleMenuOpen}
              aria-controls="menu-comment"
              aria-haspopup="true"
            >
              <MoreIcon />
            </IconButton>

            {/* More Options Menu */}
            <Menu
              id="menu-comment"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleEdit}>Edit</MenuItem>
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  handleDelete();
                }}
              >
                Delete
              </MenuItem>
            </Menu>

            {/* Delete Confirmation Modal */}
            <AlertItemDelete
              title={item.title}
              open={isDeleteModalOpen}
              handleClose={handleDeleteModalClose}
            />
          </Stack>

          {/* User Story Link */}
          {itemStory && (
            <>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Tooltip title="User Story">
                  <Hierarchy
                    size={16}
                    style={{ color: theme.palette.primary.dark }}
                  />
                </Tooltip>
                <Tooltip title={itemStory.title}>
                  <Link
                    variant="caption"
                    color="primary.dark"
                    underline="hover"
                    onClick={handleStoryDrawerOpen}
                    sx={{ cursor: 'pointer', pt: 0.5 }}
                  >
                    User Story #{itemStory.id}
                  </Link>
                </Tooltip>
              </Stack>
              {/* Edit Story Drawer */}
      <EditStory story={itemStory} open={openStoryDrawer} handleDrawerOpen={handleStoryDrawerOpen} />
            </>
          )}

          {/* Item Image */}
          {itemStory?.files?.length > 0 && (
            <CardMedia
              component="img"
              image={itemStory.files[0]}
              sx={{ width: '100%', borderRadius: 1, mt: 1.5 }}
              alt={`${item.title} image`}
            />
          )}
        </div>
      )}
    </Draggable>
  );
}

Items.propTypes = {
  item: ItemPropType.isRequired,
  index: PropTypes.number.isRequired,
};
