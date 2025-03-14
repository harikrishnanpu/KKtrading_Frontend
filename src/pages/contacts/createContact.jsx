// CreateContactForm.jsx
import React, { useState } from 'react';
import api from 'pages/api'; // Adjust path as needed

export default function CreateContactForm() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [location, setLocation] = useState({
    type: 'Point',
    coordinates: [0, 0],
  });
  const [hasFetchedLocation, setHasFetchedLocation] = useState(false);

  const [bills, setBills] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Manually fetch location on button click
  const handleFetchLocation = () => {
    setError('');
    setSuccess('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          type: 'Point',
          coordinates: [position.coords.longitude, position.coords.latitude],
        });
        setHasFetchedLocation(true);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Failed to fetch location. Please allow location access.');
      }
    );
  };

  // Add a new blank bill
  const addBill = () => {
    setBills([...bills, '']);
  };

  // Handle changing a specific bill
  const handleBillChange = (index, value) => {
    const updated = [...bills];
    updated[index] = value;
    setBills(updated);
  };

  // Remove a specific bill
  const removeBill = (index) => {
    setBills(bills.filter((_, i) => i !== index));
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !phoneNumber) {
      setError('Name and Phone Number are required.');
      return;
    }

    // Optionally require the user to fetch location first
    if (!hasFetchedLocation) {
      setError('Please click "Fetch Location" to include coordinates.');
      return;
    }

    try {
      const response = await api.post('/api/contacts', {
        name,
        phoneNumber,
        address,
        submittedBy,
        location, // Only includes location if user clicked "Fetch Location"
        bills,
      });

      if (response.status === 201) {
        setSuccess('Contact created successfully!');

        // Clear form
        setName('');
        setPhoneNumber('');
        setAddress('');
        setSubmittedBy('');
        setBills([]);
        setLocation({
          type: 'Point',
          coordinates: [0, 0],
        });
        setHasFetchedLocation(false);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error creating contact');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 mb-6 bg-white shadow-lg rounded-lg p-4">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">
          Create Contact
        </h2>
        <button
          onClick={() => {
            // If you wanted a "cancel" or "back" logic, handle it here
            console.log('Cancel or Go Back');
          }}
          className="text-xs font-bold text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 bg-red-100 text-red-700 border border-red-200 p-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="mb-4 bg-green-100 text-green-800 border border-green-200 p-2 rounded text-sm">
          {success}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit}>
        {/* Section: Contact Information */}
        <div className="mb-6 border-b pb-4">
          <h3 className="text-sm font-bold text-gray-600 mb-2">
            Contact Information
          </h3>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-xs text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm
                         focus:border-red-200 focus:ring-red-500 focus:outline-none"
              placeholder="Enter name"
            />
          </div>

          {/* Phone Number */}
          <div className="mb-4">
            <label className="block text-xs text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm
                         focus:border-red-200 focus:ring-red-500 focus:outline-none"
              placeholder="Enter phone number"
            />
          </div>

          {/* Address */}
          <div className="mb-4">
            <label className="block text-xs text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm
                         focus:border-red-200 focus:ring-red-500 focus:outline-none"
              placeholder="Enter address"
            />
          </div>

          {/* Submitted By */}
          <div>
            <label className="block text-xs text-gray-700 mb-1">
              Submitted By
            </label>
            <input
              type="text"
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm
                         focus:border-red-200 focus:ring-red-500 focus:outline-none"
              placeholder="Enter your name or user ID"
            />
          </div>
        </div>

        {/* Section: Location */}
        <div className="mb-6 border-b pb-4">
          <h3 className="text-sm font-bold text-gray-600 mb-2">
            Location Information
          </h3>
          <button
            type="button"
            onClick={handleFetchLocation}
            className="bg-blue-500 text-white text-sm px-3 py-2 rounded-md hover:bg-blue-600"
          >
            Fetch Location
          </button>
          {hasFetchedLocation && (
            <div className="mt-2 text-xs text-gray-600">
              <p>
                <strong>Longitude:</strong> {location.coordinates[0]}
              </p>
              <p>
                <strong>Latitude:</strong> {location.coordinates[1]}
              </p>
            </div>
          )}
        </div>

        {/* Section: Bills */}
        <div className="mb-6 border-b pb-4">
          <h3 className="text-sm font-bold text-gray-600 mb-2">Bills</h3>
          {bills.map((bill, i) => (
            <div
              key={i}
              className="flex items-center mb-2 space-x-2"
            >
              <input
                type="text"
                value={bill}
                onChange={(e) => handleBillChange(i, e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm 
                           focus:border-red-200 focus:ring-red-500 focus:outline-none"
                placeholder="Bill Number"
              />
              <button
                type="button"
                onClick={() => removeBill(i)}
                className="bg-red-500 text-white text-xs px-2 py-2 rounded-md 
                           hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addBill}
            className="bg-green-500 text-white text-sm px-3 py-2 rounded-md hover:bg-green-600 mt-2"
          >
            Add Bill
          </button>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-red-500 text-white text-sm px-5 py-2 rounded-md 
                       hover:bg-red-600 font-semibold"
          >
            Create Contact
          </button>
        </div>
      </form>
    </div>
  );
}
