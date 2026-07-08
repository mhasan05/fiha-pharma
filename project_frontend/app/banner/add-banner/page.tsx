'use client';
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useCreateBannerMutation } from '@/redux/feature/bannerSlice';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Define TypeScript interface for form data
interface FormDataState {
  name: string;
  image: File | null;
  imagePreview: string | null;
}

const AddBanner: React.FC = () => {

    const navigate = useRouter();
  const [createBanner] = useCreateBannerMutation();
  const [formData, setFormData] = useState<FormDataState>({ name: '', image: null, imagePreview: null });

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const bannerFormData = new FormData();
    bannerFormData.append('name', formData.name);
    if (formData.image) {
      bannerFormData.append('image', formData.image);
    }

    try {
      await createBanner(bannerFormData).unwrap();
      toast.success('Banner created successfully');
      navigate.back(); // Navigate back to the banner list page
      setFormData({ name: '', image: null, imagePreview: null });
      if (formData.imagePreview) {
        URL.revokeObjectURL(formData.imagePreview); // Clean up to prevent memory leaks
      }
    } catch (err) {
      toast.error('Error creating banner');
    }
  };

  // Clean up object URL when component unmounts or form is reset
  const handleReset = () => {
    if (formData.imagePreview) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    setFormData({ name: '', image: null, imagePreview: null });
  };

  return (
    <div className="container mx-auto p-6  min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Add New Banner</h1>
        <Link href="/banner">
          <Button className="bg-purple-400 hover:bg-purple-500 text-black">Back to Banner List</Button>
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-md p-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300">Banner Name</label>
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
            <label className="block text-sm font-medium text-gray-300">Banner Image</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleInputChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              required
            />
          </div>
          {formData.imagePreview && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300">Image Preview</label>
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
              onClick={handleReset}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
            >
              Create Banner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBanner;