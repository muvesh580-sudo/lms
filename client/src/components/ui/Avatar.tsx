import React, { useState } from 'react';
import { API_ORIGIN } from '../../services/config';

interface AvatarProps {
  name?: string;
  profilePic?: string;
  // A local preview shown instead of the saved photo
  previewUrl?: string;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ name, profilePic, previewUrl, className = 'h-8 w-8' }) => {
  // Uploaded photos can vanish on hosts without permanent storage, so remember
  // which one failed and show the initial instead of a broken image
  const [failedPic, setFailedPic] = useState('');

  const hasPhoto = !!profilePic && !profilePic.startsWith('default-') && profilePic !== failedPic;

  if (previewUrl || hasPhoto) {
    return (
      <img
        className={`rounded-full object-cover ${className}`}
        src={previewUrl || `${API_ORIGIN}/uploads/profile/${encodeURIComponent(profilePic!)}`}
        alt=""
        onError={() => setFailedPic(profilePic || '')}
      />
    );
  }

  return (
    <span className={`flex items-center justify-center rounded-full bg-primary-600 font-semibold text-white ${className}`}>
      {name?.charAt(0).toUpperCase()}
    </span>
  );
};

export default Avatar;
