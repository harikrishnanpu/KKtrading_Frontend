import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from 'pages/api';

// Optional: If you have your own loading and message components, import them
// import LoadingBox from '../components/LoadingBox';
// import MessageBox from '../components/MessageBox';

export default function UserEditScreen() {
  const navigate = useNavigate();
  const { id: userId } = useParams();

  // Example: If you store token locally after signin:
  // const userInfo = JSON.parse(localStorage.getItem('userInfo')) || null;

  // Form States (mapping to your user schema)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // if you want to allow password reset here
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [isSuper, setIsSuper] = useState(false);
  const [role, setRole] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [faceDescriptor, setFaceDescriptor] = useState(''); // your schema says Array, might store JSON
  const [workEmail, setWorkEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');
  const [location, setLocation] = useState('');
  const [avatar, setAvatar] = useState('');
  const [status, setStatus] = useState('');
  const [birthdayText, setBirthdayText] = useState('');
  const [onlineStatus, setOnlineStatus] = useState('offline');

  // UI States
  const [loading, setLoading] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [error, setError] = useState('');
  const [errorUpdate, setErrorUpdate] = useState('');
  const [successUpdate, setSuccessUpdate] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        setError('');

        // If you need auth header:
        // const config = {
        //   headers: {
        //     Authorization: `Bearer ${userInfo.token}`,
        //   },
        // };

        const { data } = await api.get(`/api/users/${userId}`);
        setName(data.name || '');
        setEmail(data.email || '');
        setPassword(''); // blank by default
        setIsAdmin(data.isAdmin || false);
        setIsEmployee(data.isEmployee || false);
        setIsSuper(data.isSuper || false);
        setRole(data.role || '');
        setContactNumber(data.contactNumber || '');
        setFaceDescriptor(
          Array.isArray(data.faceDescriptor)
            ? JSON.stringify(data.faceDescriptor)
            : data.faceDescriptor || ''
        );
        setWorkEmail(data.work_email || '');
        setPersonalEmail(data.personal_email || '');
        setWorkPhone(data.work_phone || '');
        setPersonalPhone(data.personal_phone || '');
        setLocation(data.location || '');
        setAvatar(data.avatar || '');
        setStatus(data.status || '');
        setBirthdayText(data.birthdayText || '');
        setOnlineStatus(data.online_status || 'offline');
      } catch (err) {
        setError(
          err.response?.data?.message
            ? err.response.data.message
            : err.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setErrorUpdate('');
    setSuccessUpdate(false);
    setLoadingUpdate(true);

    try {
      // Convert faceDescriptor if it's JSON

      await api.put(
        `/api/users/user/edit/${userId}`,
        {
          name,
          email,
          password,
          isAdmin,
          isEmployee,
          isSuper,
          role,
          contactNumber,
          work_email: workEmail,
          personal_email: personalEmail,
          work_phone: workPhone,
          personal_phone: personalPhone,
          location,
          avatar,
          status,
          birthdayText,
          online_status: onlineStatus,
        }
        // config
      );
      setSuccessUpdate(true);
      setErrorUpdate('');
    } catch (err) {
      setErrorUpdate(
        err.response?.data?.message
          ? err.response.data.message
          : err.message
      );
    } finally {
      setLoadingUpdate(false);
    }
  };

  const deleteHandler = async () => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    try {
      setLoading(true);
      setError('');
      // const config = {
      //   headers: { Authorization: `Bearer ${userInfo.token}` },
      // };
      await api.delete(`/api/users/${userId}`);
      alert('User deleted successfully');
      navigate('/userlist');
    } catch (err) {
      setError(
        err.response?.data?.message
          ? err.response.data.message
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelHandler = () => {
    navigate('/admin/allusers');
  };

  return (
    <div className="mt-6 p-4 md:p-6 shadow-lg rounded-lg bg-white">

      <div className="border-b border-gray-200 pb-3 mb-3">
        <h1 className="text-xl font-semibold text-gray-700 ">
          Edit User: <span className="text-red-500">{name || ''}</span>
        </h1>
      </div>

      {/* Loading & Error Messages */}
      {loading && (
        <div className="mb-4 p-2 text-blue-700 border border-blue-300 rounded">
          Loading user details...
        </div>
      )}
      {error && (
        <div className="mb-4 p-2 text-red-700 border border-red-300 rounded">
          {error}
        </div>
      )}
      {loadingUpdate && (
        <div className="mb-4 p-2 text-blue-700 border border-blue-300 rounded">
          Updating user...
        </div>
      )}
      {errorUpdate && (
        <div className="mb-4 p-2 text-red-700 border border-red-300 rounded">
          {errorUpdate}
        </div>
      )}
      {successUpdate && (
        <div className="mb-4 p-2 text-green-700 border border-green-300 rounded">
          User updated successfully!
        </div>
      )}

      {/* Form */}
      <form onSubmit={submitHandler} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block font-medium text-gray-700" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            placeholder="Enter name"
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block font-medium text-gray-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            placeholder="Enter email"
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Password (optional reset) */}
        <div>
          <label className="block font-medium text-gray-700" htmlFor="password">
            Password (leave empty if no change)
          </label>
          <input
            id="password"
            type="password"
            value={password}
            placeholder="Reset password?"
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* isEmployee */}
        <div className="flex items-center">
          <input
            id="isEmployee"
            type="checkbox"
            checked={isEmployee}
            onChange={(e) => setIsEmployee(e.target.checked)}
            className="h-4 w-4 text-red-600 border-gray-300 rounded"
          />
          <label htmlFor="isEmployee" className="ml-2 text-sm text-gray-700">
            Is Employee
          </label>
        </div>

        {/* isAdmin */}
        <div className="flex items-center">
          <input
            id="isAdmin"
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
            className="h-4 w-4 text-red-600 border-gray-300 rounded"
          />
          <label htmlFor="isAdmin" className="ml-2 text-sm text-gray-700">
            Is Admin
          </label>
        </div>

        {/* isSuper */}
        <div className="flex items-center">
          <input
            id="isSuper"
            type="checkbox"
            checked={isSuper}
            onChange={(e) => setIsSuper(e.target.checked)}
            className="h-4 w-4 text-red-600 border-gray-300 rounded"
          />
          <label htmlFor="isSuper" className="ml-2 text-sm text-gray-700">
            Is Super
          </label>
        </div>

        {/* role */}
        <div>
          <label className="block font-medium text-gray-700" htmlFor="role">
            Role
          </label>
          <input
            id="role"
            type="text"
            value={role}
            placeholder="Role"
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* contactNumber */}
        <div>
          <label className="block font-medium text-gray-700" htmlFor="contactNumber">
            Contact Number
          </label>
          <input
            id="contactNumber"
            type="text"
            value={contactNumber}
            placeholder="Contact Number"
            onChange={(e) => setContactNumber(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>


        {/* work_email */}
        <div>
          <label className="block font-medium text-gray-700" htmlFor="workEmail">
            Work Email
          </label>
          <input
            id="workEmail"
            type="email"
            value={workEmail}
            placeholder="Enter work email"
            onChange={(e) => setWorkEmail(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* personal_email */}
        <div>
          <label className="block font-medium text-gray-700" htmlFor="personalEmail">
            Personal Email
          </label>
          <input
            id="personalEmail"
            type="email"
            value={personalEmail}
            placeholder="Enter personal email"
            onChange={(e) => setPersonalEmail(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* work_phone */}
        <div>
          <label className="block font-medium text-gray-700" htmlFor="workPhone">
            Work Phone
          </label>
          <input
            id="workPhone"
            type="text"
            value={workPhone}
            placeholder="Enter work phone"
            onChange={(e) => setWorkPhone(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* personal_phone */}
        <div>
          <label className="block font-medium text-gray-700" htmlFor="personalPhone">
            Personal Phone
          </label>
          <input
            id="personalPhone"
            type="text"
            value={personalPhone}
            placeholder="Enter personal phone"
            onChange={(e) => setPersonalPhone(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* location */}
        <div>
          <label className="block font-medium text-gray-700" htmlFor="location">
            Location
          </label>
          <input
            id="location"
            type="text"
            value={location}
            placeholder="Enter location"
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* avatar */}
        <div>
          <label className="block font-medium text-gray-700" htmlFor="avatar">
            Avatar URL
          </label>
          <input
            id="avatar"
            type="text"
            value={avatar}
            placeholder="User avatar link"
            onChange={(e) => setAvatar(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* status */}
        <div>
          <label className="block font-medium text-gray-700" htmlFor="status">
            Status
          </label>
          <input
            id="status"
            type="text"
            value={status}
            placeholder="Current status (Active, Inactive, etc.)"
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* birthdayText */}
        <div>
          <label className="block font-medium text-gray-700" htmlFor="birthdayText">
            Birthday
          </label>
          <input
            id="birthdayText"
            type="text"
            value={birthdayText}
            placeholder="MM/DD/YYYY"
            onChange={(e) => setBirthdayText(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* online_status */}
        <div>
          <label className="block font-medium text-gray-700" htmlFor="onlineStatus">
            Online Status
          </label>
          <select
            id="onlineStatus"
            value={onlineStatus}
            onChange={(e) => setOnlineStatus(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="offline">Offline</option>
            <option value="online">Online</option>
            <option value="busy">Busy</option>
            <option value="idle">Idle</option>
          </select>
        </div>

        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={cancelHandler}
            className="px-4 py-2 rounded-md border border-gray-400 text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={deleteHandler}
            className="px-4 py-2 rounded-md bg-red-50 border border-red-500 text-red-600 hover:bg-red-100"
          >
            Delete User
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-red-600 text-white font-bold hover:bg-red-700"
          >
            Update
          </button>
        </div>
      </form>
    </div>
  );
}
