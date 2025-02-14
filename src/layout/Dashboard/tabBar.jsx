import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTabs } from 'contexts/TabsContext';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';

import useConfig from 'hooks/useConfig';
import { ThemeMode } from 'config';

export default function TabBar() {
  // Retrieve tabs and functions from your context.
  const { tabs, activeTab, switchTab, closeTab, refreshTab, renameTab } = useTabs();
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));
  const { mode } = useConfig() || {};

  // Define colors based on your theme/mode.
  const textColor = mode === ThemeMode.DARK ? 'secondary.400' : 'secondary.main';
  const iconSelectedColor = 'primary.main';

  // Local state for controlling the sidebar open/closed and inline editing.
  const [openSidebar, setOpenSidebar] = useState(false);
  const [editingTab, setEditingTab] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Sidebar widths for open and collapsed states.
  const sidebarWidthOpen = 240;
  const sidebarWidthClosed = 56;

  const handleToggleSidebar = () => {
    setOpenSidebar((prev) => !prev);
  };

  const handleDoubleClick = (tab) => {
    // Activate inline editing for the selected tab.
    setEditingTab(tab.path);
    setEditingText(tab.label);
  };

  const handleRename = (tabPath) => {
    // Call the rename function from context.
    if (renameTab) {
      renameTab(tabPath, editingText);
    }
    setEditingTab(null);
    setEditingText('');
  };

  const handleCancelEditing = () => {
    setEditingTab(null);
    setEditingText('');
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: { xs: '56px', sm: '64px' }, // adjust based on your header's height
        right: 0,
        bottom: 0,
        width: openSidebar ? sidebarWidthOpen : sidebarWidthClosed,
        backgroundColor: theme.palette.background.paper,
        borderLeft: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.customShadows?.z1 || 1,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1100,
        overflow: 'hidden',
      }}
    >
      {/* Toggle Button */}
      <Box sx={{ display: 'flex', justifyContent: openSidebar ? 'flex-start' : 'center', p: 1 }}>
        <IconButton onClick={handleToggleSidebar} size="small">
          {openSidebar ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Main Sidebar Title */}
      {openSidebar && (
        <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            My Tabs
          </Typography>
        </Box>
      )}

      {/* Tab Items */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {tabs.map((tab) => {
          const isActive = tab.path === activeTab;
          return (
            <Tooltip key={tab.path} title={!openSidebar ? tab.label : ''} placement="left">
              <ListItemButton
                selected={isActive}
                onClick={() => switchTab(tab.path)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  p: .8,
                  color: isActive ? iconSelectedColor : textColor,
                  '&:hover': {
                    bgcolor: mode === ThemeMode.DARK ? 'divider' : 'secondary.200',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'transparent',
                    color: iconSelectedColor,
                    '&:hover': {
                      bgcolor: 'transparent',
                    },
                  },
                }}
              >
                {openSidebar ? (
                  <>
                    {editingTab === tab.path ? (
                      <TextField
                        variant="standard"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={() => handleRename(tab.path)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRename(tab.path);
                          } else if (e.key === 'Escape') {
                            handleCancelEditing();
                          }
                        }}
                        autoFocus
                        sx={{
                          '& .MuiInputBase-input': { fontSize: '0.8rem', fontWeight: isActive ? 500 : 400 },
                        }}
                      />
                    ) : (
                      <ListItemText
                        primary={
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: isActive ? 500 : 400, fontSize: '0.8rem' }}
                            onDoubleClick={() => handleDoubleClick(tab)}
                          >
                            {tab.label}
                          </Typography>
                        }
                      />
                    )}
                    {/* Action Icons (Refresh & Close) */}
                    <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          refreshTab(tab.path);
                        }}
                        sx={{
                          color: 'inherit',
                          mr: 0.5,
                          p: 0.3,
                          border: '1px solid transparent',
                          '&:hover': { borderColor: theme.palette.divider },
                        }}
                      >
                        <RefreshIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTab(tab.path);
                        }}
                        sx={{
                          color: 'inherit',
                          p: 0.5,
                          border: '1px solid transparent',
                          '&:hover': { borderColor: theme.palette.divider },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Box>
                  </>
                ) : (
                  // When collapsed, show only the first character of the label.
                  <Typography variant="h6" sx={{ fontWeight: isActive ? 600 : 700, fontSize: '0.8rem' , textAlign: 'center'}}>
                    {tab.label.charAt(0)}
                  </Typography>
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}

TabBar.propTypes = {
  // These prop types describe the context functions; they're provided via useTabs.
  tabs: PropTypes.array,
  activeTab: PropTypes.string,
  switchTab: PropTypes.func,
  closeTab: PropTypes.func,
  refreshTab: PropTypes.func,
  renameTab: PropTypes.func,
};
