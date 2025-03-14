// ListContacts.jsx

import React, { useEffect, useState, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import api from 'pages/api';

// MUI Components
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Slide, IconButton
} from '@mui/material';

// MUI Icons
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';

// A transition for our bottom-sheet style Dialog
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ListContacts() {
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState('');

  // For location modal
  const [selectedContact, setSelectedContact] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Fetch all contacts
  const fetchContacts = async () => {
    try {
      const response = await api.get('/api/contacts');
      setContacts(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch contacts');
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Handle delete
  const handleDelete = async (id) => {
    try {
      if (!window.confirm('Are you sure you want to delete this contact?')) return;

      await api.delete(`/api/contacts/${id}`);
      // Remove from local state
      setContacts((prev) => prev.filter((contact) => contact._id !== id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete contact');
    }
  };

  // Handle showing location in a modal
  const handleShowLocation = (contact) => {
    setSelectedContact(contact);
    setShowLocationModal(true);
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4">
      <h2 className="text-xl font-bold mb-4 text-gray-700">Contacts List</h2>

      {error && (
        <div className="mb-4 text-red-500 border border-red-200 p-2 rounded bg-red-50">
          {error}
        </div>
      )}

      <TableContainer component={Paper} className="shadow-sm rounded border border-gray-200">
        <Table>
          <TableHead className="bg-gray-100">
            <TableRow>
              <TableCell className="font-semibold text-gray-700">Name</TableCell>
              <TableCell className="font-semibold text-gray-700">Phone</TableCell>
              <TableCell className="font-semibold text-gray-700">Address</TableCell>
              <TableCell className="font-semibold text-gray-700">Submitted By</TableCell>
              <TableCell className="font-semibold text-gray-700">Bills</TableCell>
              <TableCell className="font-semibold text-gray-700">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {contacts.map((contact) => (
              <TableRow
                key={contact._id}
                hover
                className="hover:bg-gray-50"
              >
                {/* Name */}
                <TableCell className="text-sm text-gray-800">
                  {contact.name}
                </TableCell>

                {/* Phone with phone icon link */}
                <TableCell className="text-sm text-gray-800">
                  <a
                    href={`tel:${contact.phoneNumber}`}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                  >
                    <PhoneIcon fontSize="small" />
                    <span>{contact.phoneNumber}</span>
                  </a>
                </TableCell>

                {/* Address */}
                <TableCell className="text-sm text-gray-800">
                  {contact.address || '-'}
                </TableCell>

                {/* Submitted By */}
                <TableCell className="text-sm text-gray-800">
                  {contact.submittedBy || '-'}
                </TableCell>

                {/* Bills */}
                <TableCell className="text-sm text-gray-800">
                  {contact.bills?.length
                    ? contact.bills.join(', ')
                    : '-'}
                </TableCell>

                {/* Actions (Edit, Delete, Location) */}
                <TableCell className="text-sm text-gray-800 space-x-2">
                  <Link to={`/contacts/edit/${contact._id}`}>
                    <Button
                      variant="outlined"
                      size="small"
                      className="normal-case mr-2"
                    >
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    className="normal-case mr-2"
                    onClick={() => handleDelete(contact._id)}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    endIcon={<LocationOnIcon />}
                    onClick={() => handleShowLocation(contact)}
                    className="normal-case"
                  >
                    Location
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Bottom-sheet style Dialog to show location info */}
      <Dialog
        fullScreen
        open={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        TransitionComponent={Transition}
      >
        <DialogTitle className="bg-gray-100 border-b border-gray-300 text-gray-700">
          Contact Location
        </DialogTitle>

        <DialogContent className="text-gray-800">
          {selectedContact && selectedContact.location && selectedContact.location.coordinates ? (
            selectedContact.location.coordinates[0] === 0 && selectedContact.location.coordinates[1] === 0 ? (
              <p className="mt-2">Location not available.</p>
            ) : (
              <div className="space-y-2 mt-2">
                <p>
                  <strong>Longitude:</strong> {selectedContact.location.coordinates[0]}
                </p>
                <p>
                  <strong>Latitude:</strong> {selectedContact.location.coordinates[1]}
                </p>
              </div>
            )
          ) : (
            <p className="mt-2">Location not available.</p>
          )}
        </DialogContent>

        <DialogActions className="border-t border-gray-300">
          <Button onClick={() => setShowLocationModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
