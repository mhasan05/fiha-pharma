'use client';
import { useCreateGenericMutation } from '@/redux/feature/genericSlice';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';

export default function CreateGenericPage() {
  const router = useRouter();
  const [newGeneric, setNewGeneric] = useState({ name: '', description: '' });
  const [createGeneric, { isLoading }] = useCreateGenericMutation();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newGeneric.name);
    formData.append('description', newGeneric.description);

    try {
      await createGeneric(formData).unwrap();
      toast.success('Generic created successfully!', {
        position: 'top-right',
        style: { background: '#10B981', color: '#fff' },
      });
      setNewGeneric({ name: '', description: '' });
      router.push('/generic');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create generic!', {
        position: 'top-right',
        style: { background: '#EF4444', color: '#fff' },
      });
    }
  };

  return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Create New Generic
        </h2>
        <form onSubmit={handleCreate} className="space-y-6">
          {/* Name Input */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={newGeneric.name}
              onChange={(e) =>
                setNewGeneric({ ...newGeneric, name: e.target.value })
              }
              className="mt-1 p-3 w-full bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
              placeholder="Enter name"
              required
              aria-required="true"
              aria-describedby="name-error"
            />
            {!newGeneric.name && (
              <p id="name-error" className="text-red-500 text-sm mt-1">
                Name is required
              </p>
            )}
          </div>

          {/* Description Input */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300"
            >
              Description
            </label>
            <textarea
              id="description"
              value={newGeneric.description}
              onChange={(e) =>
                setNewGeneric({ ...newGeneric, description: e.target.value })
              }
              className="mt-1 p-3 w-full bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
              placeholder="Enter description (optional)"
              rows={4}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/generic')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition duration-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition duration-200 flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
                    ></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Generic'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}