import React from 'react';
import { Drawer, List, ListItem, ListItemText, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';

const ItemSuggestionsSidebar = ({ open, suggestions, selectedIndex, onSelect, onClose }) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent" // Use persistent so the main page remains clickable
      TransitionComponent={Slide} // Slide animation
      transitionDuration={300}
    >
      <div style={{ width: 300, padding: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <h3 style={{ fontSize: '0.9rem', fontWeight: '400', margin: 0 }}>
            Item Suggestions
          </h3>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
        <List>
          {suggestions.map((suggestion, index) => (
            <ListItem
              button
              key={suggestion.item_id}
              selected={index === selectedIndex}
              onClick={() => onSelect(suggestion)}
              divider
            >
              <ListItemText
                primary={`${suggestion.name} - ${suggestion.item_id}`}
                primaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          ))}
        </List>
      </div>
    </Drawer>
  );
};

export default ItemSuggestionsSidebar;
