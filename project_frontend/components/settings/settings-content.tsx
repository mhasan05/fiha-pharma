'use client';
import { useUpdateProfileMutation, useUserProfileQuery } from '@/redux/feature/userSlice';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import Info from '../info';
import { IMAGE_BASE_URL } from '@/lib/config';

export default function MyProfile() {
  const { data: profileData, isLoading, isError, refetch } = useUserProfileQuery(undefined);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    shop_name: "",
    shop_address: "",
    image: "",
    is_active: true,
    is_staff: false,
    is_superuser: false
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (profileData) {
      setProfile({
        full_name: profileData.full_name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        shop_name: profileData.shop_name || "",
        shop_address: profileData.shop_address || "",
        image: profileData.image || "",
        is_active: profileData.is_active || false,
        is_staff: profileData.is_staff || false,
        is_superuser: profileData.is_superuser || false
      });
    }
  }, [profileData]);

  const handleProfileChange = (key: string, value: any) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("full_name", profile.full_name);
      formData.append("email", profile.email);
      formData.append("phone", profile.phone);
      formData.append("shop_name", profile.shop_name);
      formData.append("shop_address", profile.shop_address);

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      await updateProfile(formData).unwrap();
      toast.success("Profile updated successfully!");
      setEditMode(false);
      setSelectedImage(null);
      setPreviewImage(null);
      refetch();
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500 text-lg">Error loading profile data</p>
      </div>
    );
  }

  const DetailItem = ({ label, value }: { label: string; value: string }) => (
    <div>
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</h3>
      <p className="mt-1 text-base font-medium text-white break-words">{value || '—'}</p>
    </div>
  );

  return (
    <div className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
            <p className="text-gray-300 mt-1">Your account and shop information</p>
          </div>
          <button
            onClick={() => setEditMode(true)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Edit Profile
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Profile Image Section */}
            <div className="md:w-1/3 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-700 bg-gray-800/50">
              <div className="relative w-36 h-36 rounded-full overflow-hidden ring-4 ring-purple-500/30 mb-4">
                {profile.image || previewImage ? (
                  <Image
                    src={previewImage || `${IMAGE_BASE_URL}${profile.image}`}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-400">
                      {(profile.full_name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-xl font-semibold text-white text-center">{profile.full_name}</h2>
              <p className="text-sm text-gray-400 mt-1 text-center break-all">{profile.email}</p>
            </div>

            {/* Profile Details Section */}
            <div className="md:w-2/3 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <DetailItem label="Full Name" value={profile.full_name} />
                <DetailItem label="Shop Name" value={profile.shop_name} />
                <DetailItem label="Email" value={profile.email} />
                <DetailItem label="Shop Address" value={profile.shop_address} />
                <DetailItem label="Phone" value={profile.phone} />
                <div>
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Status</h3>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${profile.is_active ? 'bg-green-500/15 text-green-300 border-green-500/30' : 'bg-red-500/15 text-red-300 border-red-500/30'}`}>
                      {profile.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {profile.is_staff && (
                      <span className="px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-semibold">
                        Staff
                      </span>
                    )}
                    {profile.is_superuser && (
                      <span className="px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-semibold">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editMode && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="border-b border-gray-700 px-6 py-4 sticky top-0 bg-gray-800 z-10">
                <h2 className="text-xl font-bold text-white">Edit Profile</h2>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                <div className="flex flex-col items-center">
                  <div className="relative w-28 h-28 rounded-full overflow-hidden ring-4 ring-purple-500/30 mb-3">
                    {previewImage || profile.image ? (
                      <Image
                        src={previewImage || `${IMAGE_BASE_URL}${profile.image}`}
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-400">
                          {(profile.full_name || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    id="profile-image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="profile-image"
                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md cursor-pointer hover:bg-purple-700 transition-colors"
                  >
                    Change Image
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="full_name"
                      type="text"
                      value={profile.full_name}
                      onChange={(e) => handleProfileChange('full_name', e.target.value)}
                      className="w-full px-4 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      className="w-full px-4 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="text"
                      value={profile.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      className="w-full px-4 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="shop_name" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Shop Name
                    </label>
                    <input
                      id="shop_name"
                      type="text"
                      value={profile.shop_name}
                      onChange={(e) => handleProfileChange('shop_name', e.target.value)}
                      className="w-full px-4 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="shop_address" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Shop Address
                  </label>
                  <textarea
                    id="shop_address"
                    value={profile.shop_address}
                    onChange={(e) => handleProfileChange('shop_address', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-700 px-6 py-4 flex justify-end space-x-3 sticky bottom-0 bg-gray-800">
                <button
                  onClick={() => {
                    setEditMode(false);
                    setPreviewImage(null);
                    setSelectedImage(null);
                  }}
                  className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Info />
    </div>
  );
}