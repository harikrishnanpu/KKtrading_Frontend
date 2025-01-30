import React from 'react';
import Button from '@mui/material/Button';
import { ArrowCircleLeft } from 'iconsax-react'; // Ensure you have the correct icon imported

const SubmitButton = ({
  onSubmit,
  isSubmitting,
  userInfo,
}) => {
  return (
    <Button
      variant="outlined"
      size="small"
      onClick={onSubmit}
      disabled={isSubmitting}
      className={`
        font-bold text-xs py-2 px-4 rounded-lg 
        ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : userInfo.isAdmin ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'}
        transition duration-300 ease-in-out
        flex items-center justify-center
      `}
      sx={{
        // Override MUI styles that conflict with Tailwind
        backgroundColor: 'transparent',
        color: '#fff',
        boxShadow: 'none',
        '&:hover': {
          backgroundColor: 'transparent',
        },
        textTransform: 'none', // Prevent uppercase transformation
        fontSize: '0.875rem', // Set explicit font size
      }}
    >
      {isSubmitting ? (
        <>
          <ArrowCircleLeft size="20" color="#ffffff" className="mr-2" />
          Submitting...
        </>
      ) : userInfo.isAdmin ? (
        'Submit Billing'
      ) : (
        'Submit Estimate'
      )}
    </Button>
  );
};

export default SubmitButton;
