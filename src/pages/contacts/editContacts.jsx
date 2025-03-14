// EditContactForm.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from 'pages/api';

// MUI Components
import {
  TextField,
  Button,
  Paper
} from '@mui/material';

export default function EditContactForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [location, setLocation] = useState({
    type: 'Point',
    coordinates: [0, 0],
  });
  const [bills, setBills] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch existing contact data
  const fetchContact = async () => {
    try {
      const response = await api.get(`/api/contacts/${id}`);
      const contact = response.data;
      if (contact) {
        setName(contact.name);
        setPhoneNumber(contact.phoneNumber);
        setAddress(contact.address || '');
        setSubmittedBy(contact.submittedBy || '');
        setLocation(contact.location || { type: 'Point', coordinates: [0, 0] });
        setBills(contact.bills || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch contact details');
    }
  };

  useEffect(() => {
    fetchContact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // If you want to re-fetch location
  const handleRefetchLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          type: 'Point',
          coordinates: [position.coords.longitude, position.coords.latitude],
        });
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Failed to fetch location. Please allow location access.');
      }
    );
  };

  // Add or remove Bill
  const addBill = () => {
    setBills([...bills, '']);
  };
  const handleBillChange = (index, value) => {
    const updated = [...bills];
    updated[index] = value;
    setBills(updated);
  };
  const removeBill = (index) => {
    setBills(bills.filter((_, i) => i !== index));
  };

  // Submit updated contact
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !phoneNumber) {
      setError('Name and Phone Number are required.');
      return;
    }

    try {
      await api.put(`/api/contacts/${id}`, {
        name,
        phoneNumber,
        address,
        submittedBy,
        location,
        bills,
      });

      setSuccess('Contact updated successfully!');
      setTimeout(() => {
        navigate('/contacts/all');
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error updating contact');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8 px-4">
      <Paper className="p-5 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          Edit Contact
        </h2>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 text-red-600 border border-red-200 p-2 rounded bg-red-50 text-sm">
            {error}
          </div>
        )}
        {/* Success Alert */}
        {success && (
          <div className="mb-4 text-green-700 border border-green-200 p-2 rounded bg-green-50 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          {/* Name */}
          <TextField
            label="Name *"
            variant="outlined"
            size="small"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />

          {/* Phone Number */}
          <TextField
            label="Phone Number *"
            variant="outlined"
            size="small"
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            fullWidth
          />

          {/* Address */}
          <TextField
            label="Address"
            variant="outlined"
            size="small"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            fullWidth
          />

          {/* Submitted By */}
          <TextField
            label="Submitted By"
            variant="outlined"
            size="small"
            value={submittedBy}
            onChange={(e) => setSubmittedBy(e.target.value)}
            fullWidth
          />

          {/* Location Display */}
          <div className="border rounded p-3 bg-gray-50">
            <p className="text-sm text-gray-700 font-semibold mb-2">Location</p>
            <p className="text-xs text-gray-600 mb-1">
              <strong>Longitude:</strong> {location.coordinates[0]}
            </p>
            <p className="text-xs text-gray-600 mb-2">
              <strong>Latitude:</strong> {location.coordinates[1]}
            </p>
            <Button
              variant="outlined"
              size="small"
              onClick={handleRefetchLocation}
            >
              Re-fetch Location
            </Button>
          </div>

          {/* Bills */}
          <div className="border rounded p-3 bg-gray-50">
            <p className="text-sm text-gray-700 font-semibold mb-2">Bills</p>
            {bills.map((bill, i) => (
              <div key={i} className="flex items-center mb-2 space-x-2">
                <TextField
                  variant="outlined"
                  size="small"
                  value={bill}
                  onChange={(e) => handleBillChange(i, e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => removeBill(i)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button variant="outlined" size="small" onClick={addBill}>
              Add Bill
            </Button>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="outlined"
              color="primary"
              className="normal-case"
            >
              Update Contact
            </Button>
          </div>
        </form>
      </Paper>
    </div>
  );
}
