'use client';
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useBannerListQuery, useDeleteBannerMutation, useUpdateBannerMutation } from '@/redux/feature/bannerSlice';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { IMAGE_BASE_URL } from '@/lib/config';

// Define TypeScript interfaces for type safety
interface Banner {
  banner_id: number;
  name: string;
  image: string;
  created_on: string;
  updated_on?: string; // Optional field for update time
}

interface BannerResponse {
  status: string;
  data: Banner[];
}

interface FormDataState {
  name: string;
  image: File | null;
  imagePreview?: string; // For previewing uploaded image
}

const BannerSection: React.FC = () => {
  const { data, isLoading, error } = useBannerListQuery(undefined) as {
    data: BannerResponse | undefined;
    isLoading: boolean;
    error: any;
  };
  const [deleteBanner] = useDeleteBannerMutation();
  const [updateBanner] = useUpdateBannerMutation();
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormDataState>({ name: '', image: null, imagePreview: '' });

  const baseUrl = IMAGE_BASE_URL;

  const handleDeleteInitiate = (bannerId: number) => {
    setBannerToDelete(bannerId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (bannerToDelete) {
      try {
        await deleteBanner(bannerToDelete).unwrap();
        toast.success('Banner deleted successfully');
        setIsDeleteModalOpen(false);
        setBannerToDelete(null);
      } catch (err) {
        toast.error('Error deleting banner');
      }
    }
  };

  const handleEdit = (banner: Banner) => {
    setSelectedBanner(banner);
    setFormData({ name: banner.name, image: null, imagePreview: `${baseUrl}${banner.image}` });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const updateFormData = new FormData();
    updateFormData.append('name', formData.name);
    if (formData.image) {
      updateFormData.append('image', formData.image);
    }

    try {
      await updateBanner({ id: selectedBanner!.banner_id, data: updateFormData }).unwrap();
      setIsEditModalOpen(false);
      setFormData({ name: '', image: null, imagePreview: '' });
      toast.success('Banner updated successfully');
    } catch (err) {
      toast.error('Error updating banner');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === 'image' && files && files[0]) {
      const file = files[0];
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: previewUrl,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Clean up object URL to prevent memory leaks
  const handleModalClose = () => {
    if (formData.imagePreview && formData.imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    setIsEditModalOpen(false);
    setFormData({ name: '', image: null, imagePreview: '' });
  };

  if (isLoading) return <div className="text-center py-10 text-white">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Error loading banners</div>;

  return (
    <div className="p-3 sm:p-4 lg:p-6 w-full ">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Banner Management</h1>
        <Link href="/banner/add-banner">
          <Button className="bg-green-400 hover:bg-green-500 text-black">Add New Banner</Button>
        </Link>
      </div>

      {/* Banner List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.data?.map((banner: Banner) => (
          <div
            key={banner.banner_id}
            className="border rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow bg-gray-800"
          >
            <Image
              src={`${baseUrl}${banner.image}`}
              alt={banner.name}
              height={600}
              width={800}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.currentTarget.src = '/fallback-image.png'; // Fallback image if API image fails
              }}
            />
            <div className="p-4">
              <h2 className="text-xl font-semibold text-white">{banner.name}</h2>
              <p className="text-sm text-gray-300 pt-3">
                Created: {new Date(banner.created_on).toLocaleDateString()}
              </p>

              <div className="mt-4 flex gap-4">
                <button
                  onClick={() => handleEdit(banner)}
                  className="px-4 w-full py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteInitiate(banner.banner_id)}
                  className="px-4 w-full py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit Banner</h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Banner Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full py-3 px-2 text-black rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Banner Image</label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="mt-1 block w-full text-black text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>
              {formData.imagePreview && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Image Preview</label>
                  <Image
                    src={formData.imagePreview}
                    alt="Preview"
                    height={200}
                    width={300}
                    className="w-full h-32 object-cover rounded-md"
                  />
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Confirm Delete</h2>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this banner? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerSection;