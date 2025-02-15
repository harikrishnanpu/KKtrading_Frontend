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
import AddIcon from '@mui/icons-material/Add';

import useConfig from 'hooks/useConfig';
import { ThemeMode } from 'config';

export default function TabBar() {
  const {
    tabs,
    activeTab,
    switchTab,
    closeTab,
    refreshTab,
    renameTab,
    duplicateTab
  } = useTabs();

  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));
  const { mode } = useConfig() || {};

  const textColor = mode === ThemeMode.DARK ? 'secondary.400' : 'secondary.main';
  const iconSelectedColor = 'primary.main';

  const [openSidebar, setOpenSidebar] = useState(false);
  const [editingTab, setEditingTab] = useState(null);
  const [editingText, setEditingText] = useState('');

  const sidebarWidthOpen = 240;
  const sidebarWidthClosed = 56;

  const handleToggleSidebar = () => {
    setOpenSidebar((prev) => !prev);
  };

  // Inline editing
  const handleDoubleClick = (tab) => {
    setEditingTab(tab.path);
    setEditingText(tab.label);
  };

  const handleRename = (tabPath) => {
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
        top: { xs: '56px', sm: '64px' },
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
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.standard,
        }),
      }}
    >
      {/* Toggle Sidebar */}
      <Box sx={{ display: 'flex', justifyContent: openSidebar ? 'flex-start' : 'center', p: 1 }}>
        <IconButton onClick={handleToggleSidebar} size="small">
          {openSidebar ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Sidebar Title */}
      {openSidebar && (
        <Box
          sx={{
            px: 2,
            py: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            transition: 'opacity 0.3s',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            My Tabs
          </Typography>
        </Box>
      )}

      {/* Tab List */}
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
                  p: 0.8,
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
                  transition: 'background-color 0.3s, color 0.3s',
                }}
              >
                {openSidebar ? (
                  <>
                    {/* Inline Editing */}
                    {editingTab === tab.path ? (
                      <TextField
                        variant="standard"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={() => handleRename(tab.path)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(tab.path);
                          if (e.key === 'Escape') handleCancelEditing();
                        }}
                        autoFocus
                        sx={{
                          '& .MuiInputBase-input': {
                            fontSize: '0.8rem',
                            fontWeight: isActive ? 500 : 400,
                          },
                        }}
                      />
                    ) : (
                      <ListItemText
                        primary={
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: isActive ? 500 : 400,
                              fontSize: '0.8rem',
                              transition: 'none', // Disabling animation on label
                            }}
                          onDoubleClick={() => handleDoubleClick(tab)}
                          >
                            {tab.label}
                          </Typography>
                        }
                      />
                    )}

                    {/* Actions: Refresh, Duplicate, Close */}
                    <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                      {/* Refresh */}
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

                      {/* Duplicate */}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateTab(tab.path);
                        }}
                        sx={{
                          color: 'inherit',
                          mr: 0.5,
                          p: 0.3,
                          border: '1px solid transparent',
                          '&:hover': { borderColor: theme.palette.divider },
                        }}
                      >
                        <AddIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>

                      {/* Close */}
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
                  // Collapsed: Only the first letter of label
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: isActive ? 600 : 700,
                      fontSize: '0.8rem',
                      textAlign: 'center',
                    }}
                  >
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
  tabs: PropTypes.array,
  activeTab: PropTypes.string,
  switchTab: PropTypes.func,
  closeTab: PropTypes.func,
  refreshTab: PropTypes.func,
  renameTab: PropTypes.func,
  duplicateTab: PropTypes.func,
};
