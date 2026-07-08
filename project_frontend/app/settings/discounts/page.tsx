// 'use client';
// import { useConditionalDiscountsQuery, useUpdateConditionalDiscountsMutation } from '@/redux/feature/userSlice';
// import React, { useState } from 'react';
// import { toast } from 'react-hot-toast';

// interface DiscountData {
//   id: number;
//   name: string;
//   minimum_purchase_amount: string;
//   bonus_percentage: string;
//   is_active: boolean;
//   created_on: string;
//   updated_on: string;
// }

// interface UpdateDiscountData {
//   name: string;
//   minimum_purchase_amount: number;
//   bonus_percentage: number;
//   is_active: boolean;
// }

// export default function Discount() {
//   const { data: response, isLoading, error, refetch } = useConditionalDiscountsQuery(undefined);
//   const [updateConditionalDiscounts, { isLoading: isUpdating }] = useUpdateConditionalDiscountsMutation();
  
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedDiscount, setSelectedDiscount] = useState<DiscountData | null>(null);
//   const [editFormData, setEditFormData] = useState<UpdateDiscountData>({
//     name: '',
//     minimum_purchase_amount: 0,
//     bonus_percentage: 0,
//     is_active: true
//   });

//   const discounts: DiscountData[] = response?.data || [];

//   const handleEdit = (discount: DiscountData) => {
//     setSelectedDiscount(discount);
//     setEditFormData({
//       name: discount.name,
//       minimum_purchase_amount: parseFloat(discount.minimum_purchase_amount),
//       bonus_percentage: parseFloat(discount.bonus_percentage),
//       is_active: discount.is_active
//     });
//     setIsModalOpen(true);
//   };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setSelectedDiscount(null);
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value, type } = e.target;
//     setEditFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
//               type === 'number' ? parseFloat(value) : value
//     }));
//   };

//   const handleUpdate = async () => {
//     if (!selectedDiscount) return;
    
//     try {
//       await updateConditionalDiscounts({ 
//         editFormData 
//       }).unwrap();
//       toast.success('Discount updated successfully!');
//       handleCloseModal();
//       refetch();
//     } catch (error) {
//       console.error('Update failed:', error);
//       toast.error('Failed to update discount');
//     }
//   };

//   const handleToggleStatus = async (discount: DiscountData) => {
//     try {
//       await updateConditionalDiscounts({
//         id: discount.id,
//         data: {
//           name: discount.name,
//           minimum_purchase_amount: parseFloat(discount.minimum_purchase_amount),
//           bonus_percentage: parseFloat(discount.bonus_percentage),
//           is_active: !discount.is_active
//         }
//       }).unwrap();
//       toast.success(`Discount ${!discount.is_active ? 'activated' : 'deactivated'} successfully!`);
//       refetch();
//     } catch (error) {
//       console.error('Status update failed:', error);
//       toast.error('Failed to update discount status');
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center min-h-screen bg-[#2c2e34]">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex justify-center items-center min-h-screen bg-[#2c2e34]">
//         <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md max-w-md">
//           <h3 className="font-semibold mb-2">Error Loading Discounts</h3>
//           <p>Failed to load discount data. Please try again later.</p>
//           <button 
//             onClick={() => refetch()}
//             className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#2c2e34]">
//       <div className="container mx-auto px-4 py-8 max-w-7xl">
//         {/* Header Section */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-white mb-2">Conditional Discounts</h1>
//           <p className="text-gray-300">Manage your order-based discount rules</p>
//         </div>

//         {discounts.length === 0 ? (
//           <div className="text-center py-12 bg-[#3a3c44] rounded-lg">
//             <p className="text-gray-300 text-lg">No discounts configured yet</p>
//           </div>
//         ) : (
//           <>
//             {/* Discount Cards Grid */}
//             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//               {discounts.map((discount) => (
//                 <div
//                   key={discount.id}
//                   className={`bg-[#3a3c44] rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
//                     !discount.is_active ? 'opacity-75' : ''
//                   } hover:shadow-xl hover:transform hover:scale-105`}
//                 >
//                   <div className="p-6">
//                     <div className="flex justify-between items-start mb-4">
//                       <div>
//                         <h3 className="text-xl font-semibold text-white mb-1">
//                           {discount.name}
//                         </h3>
//                         <p className="text-sm text-gray-400">
//                           ID: #{discount.id}
//                         </p>
//                       </div>
//                       <span
//                         className={`px-3 py-1 rounded-full text-sm font-medium ${
//                           discount.is_active
//                             ? 'bg-green-500/20 text-green-400 border border-green-500/50'
//                             : 'bg-red-500/20 text-red-400 border border-red-500/50'
//                         }`}
//                       >
//                         {discount.is_active ? 'Active' : 'Inactive'}
//                       </span>
//                     </div>

//                     <div className="space-y-3 mb-6">
//                       <div className="flex justify-between items-center">
//                         <span className="text-gray-300">Minimum Purchase:</span>
//                         <span className="font-semibold text-white">
//                           ${parseFloat(discount.minimum_purchase_amount).toFixed(2)}
//                         </span>
//                       </div>
//                       <div className="flex justify-between items-center">
//                         <span className="text-gray-300">Bonus Percentage:</span>
//                         <span className="font-semibold text-green-400">
//                           {parseFloat(discount.bonus_percentage).toFixed(2)}%
//                         </span>
//                       </div>
//                       <div className="flex justify-between items-center text-xs text-gray-400">
//                         <span>Created:</span>
//                         <span>{new Date(discount.created_on).toLocaleDateString()}</span>
//                       </div>
//                       <div className="flex justify-between items-center text-xs text-gray-400">
//                         <span>Last Updated:</span>
//                         <span>{new Date(discount.updated_on).toLocaleDateString()}</span>
//                       </div>
//                     </div>

//                     <div className="flex gap-3">
//                       <button
//                         onClick={() => handleEdit(discount)}
//                         className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
//                       >
//                         Edit
//                       </button>
//                       <button
//                         onClick={() => handleToggleStatus(discount)}
//                         className={`flex-1 px-4 py-2 rounded-lg transition ${
//                           discount.is_active
//                             ? 'bg-red-600 text-white hover:bg-red-700'
//                             : 'bg-green-600 text-white hover:bg-green-700'
//                         }`}
//                       >
//                         {discount.is_active ? 'Deactivate' : 'Activate'}
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Summary Section */}
//             <div className="mt-8 p-6 bg-[#3a3c44] rounded-xl">
//               <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div className="bg-[#2c2e34] p-4 rounded-lg shadow-sm">
//                   <p className="text-sm text-gray-300 mb-1">Total Discounts</p>
//                   <p className="text-2xl font-bold text-white">{discounts.length}</p>
//                 </div>
//                 <div className="bg-[#2c2e34] p-4 rounded-lg shadow-sm">
//                   <p className="text-sm text-gray-300 mb-1">Active Discounts</p>
//                   <p className="text-2xl font-bold text-green-400">
//                     {discounts.filter(d => d.is_active).length}
//                   </p>
//                 </div>
//                 <div className="bg-[#2c2e34] p-4 rounded-lg shadow-sm">
//                   <p className="text-sm text-gray-300 mb-1">Inactive Discounts</p>
//                   <p className="text-2xl font-bold text-red-400">
//                     {discounts.filter(d => !d.is_active).length}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </>
//         )}
//       </div>

//       {/* Edit Modal */}
//       {isModalOpen && selectedDiscount && (
//         <div className="fixed inset-0 z-50 overflow-y-auto">
//           <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
//             {/* Background overlay */}
//             <div className="fixed inset-0 transition-opacity bg-black bg-opacity-75" onClick={handleCloseModal}></div>

//             {/* Modal panel */}
//             <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-[#3a3c44] rounded-xl shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
//               <div className="px-6 pt-6 pb-4">
//                 <div className="flex justify-between items-center mb-4">
//                   <h3 className="text-2xl font-semibold text-white">
//                     Edit Discount
//                   </h3>
//                   <button
//                     onClick={handleCloseModal}
//                     className="text-gray-400 hover:text-white transition"
//                   >
//                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                     </svg>
//                   </button>
//                 </div>

//                 <div className="space-y-4">
//                   {/* Discount ID Display */}
//                   <div className="bg-[#2c2e34] p-3 rounded-lg">
//                     <p className="text-sm text-gray-400">Discount ID</p>
//                     <p className="text-white font-medium">#{selectedDiscount.id}</p>
//                   </div>

//                   {/* Name Field */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-200 mb-2">
//                       Discount Name
//                     </label>
//                     <input
//                       type="text"
//                       name="name"
//                       value={editFormData.name}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 bg-[#2c2e34] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                       placeholder="Enter discount name"
//                     />
//                   </div>

//                   {/* Minimum Purchase Amount */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-200 mb-2">
//                       Minimum Purchase Amount ($)
//                     </label>
//                     <input
//                       type="number"
//                       name="minimum_purchase_amount"
//                       value={editFormData.minimum_purchase_amount}
//                       onChange={handleInputChange}
//                       step="0.01"
//                       className="w-full px-3 py-2 bg-[#2c2e34] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                     />
//                   </div>

//                   {/* Bonus Percentage */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-200 mb-2">
//                       Bonus Percentage (%)
//                     </label>
//                     <input
//                       type="number"
//                       name="bonus_percentage"
//                       value={editFormData.bonus_percentage}
//                       onChange={handleInputChange}
//                       step="0.01"
//                       className="w-full px-3 py-2 bg-[#2c2e34] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                     />
//                   </div>

//                   {/* Active Status Toggle */}
//                   <div className="flex items-center justify-between py-2">
//                     <label className="text-sm font-medium text-gray-200">
//                       Active Status
//                     </label>
//                     <label className="relative inline-flex items-center cursor-pointer">
//                       <input
//                         type="checkbox"
//                         name="is_active"
//                         checked={editFormData.is_active}
//                         onChange={handleInputChange}
//                         className="sr-only peer"
//                       />
//                       <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
//                       <span className="ml-3 text-sm text-gray-300">
//                         {editFormData.is_active ? 'Active' : 'Inactive'}
//                       </span>
//                     </label>
//                   </div>

//                   {/* Creation Info */}
//                   <div className="pt-3 border-t border-gray-700">
//                     <div className="flex justify-between text-xs text-gray-400">
//                       <span>Created:</span>
//                       <span>{new Date(selectedDiscount.created_on).toLocaleString()}</span>
//                     </div>
//                     <div className="flex justify-between text-xs text-gray-400 mt-1">
//                       <span>Last Updated:</span>
//                       <span>{new Date(selectedDiscount.updated_on).toLocaleString()}</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="px-6 py-4 bg-[#2c2e34] flex gap-3">
//                 <button
//                   onClick={handleUpdate}
//                   disabled={isUpdating}
//                   className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {isUpdating ? (
//                     <span className="flex items-center justify-center">
//                       <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                       </svg>
//                       Updating...
//                     </span>
//                   ) : (
//                     'Update Discount'
//                   )}
//                 </button>
//                 <button
//                   onClick={handleCloseModal}
//                   className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

'use client';
import { useConditionalDiscountsQuery, useUpdateConditionalDiscountsMutation } from '@/redux/feature/userSlice';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface DiscountData {
  id: number;
  name: string;
  minimum_purchase_amount: string;
  bonus_percentage: string;
  is_active: boolean;
  created_on: string;
  updated_on: string;
}

interface UpdateDiscountData {
  name: string;
  minimum_purchase_amount: number;
  bonus_percentage: number;
  is_active: boolean;
}

export default function Discount() {
  const { data: response, isLoading, error, refetch } = useConditionalDiscountsQuery(undefined);
  const [updateConditionalDiscounts, { isLoading: isUpdating }] = useUpdateConditionalDiscountsMutation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountData | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateDiscountData>({
    name: '',
    minimum_purchase_amount: 0,
    bonus_percentage: 0,
    is_active: true
  });

  const discounts: DiscountData[] = response?.data || [];

  const handleEdit = (discount: DiscountData) => {
    setSelectedDiscount(discount);
    setEditFormData({
      name: discount.name,
      minimum_purchase_amount: parseFloat(discount.minimum_purchase_amount),
      bonus_percentage: parseFloat(discount.bonus_percentage),
      is_active: discount.is_active
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDiscount(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleUpdate = async () => {
    if (!selectedDiscount) return;
    
    try {
      // Send only the update data without ID
      await updateConditionalDiscounts(editFormData).unwrap();
      toast.success('Discount updated successfully!');
      handleCloseModal();
      refetch();
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Failed to update discount');
    }
  };

  const handleToggleStatus = async (discount: DiscountData) => {
    try {
      // Send only the toggle data without ID
      await updateConditionalDiscounts({
        name: discount.name,
        minimum_purchase_amount: parseFloat(discount.minimum_purchase_amount),
        bonus_percentage: parseFloat(discount.bonus_percentage),
        is_active: !discount.is_active
      }).unwrap();
      toast.success(`Discount ${!discount.is_active ? 'activated' : 'deactivated'} successfully!`);
      refetch();
    } catch (error) {
      console.error('Status update failed:', error);
      toast.error('Failed to update discount status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#2c2e34]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#2c2e34]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md max-w-md">
          <h3 className="font-semibold mb-2">Error Loading Discounts</h3>
          <p>Failed to load discount data. Please try again later.</p>
          <button 
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 py-8 ">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Conditional Discounts</h1>
          <p className="text-gray-300">Manage your order-based discount rules</p>
        </div>

        {discounts.length === 0 ? (
          <div className="text-center py-12 bg-[#3a3c44] rounded-lg">
            <p className="text-gray-300 text-lg">No discounts configured yet</p>
          </div>
        ) : (
          <>
            {/* Discount Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {discounts.map((discount) => (
                <div
                  key={discount.id}
                  className={`bg-[#3a3c44] rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                    !discount.is_active ? 'opacity-75' : ''
                  } hover:shadow-xl hover:transform hover:scale-105`}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">
                          {discount.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          ID: #{discount.id}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          discount.is_active
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-red-500/20 text-red-400 border border-red-500/50'
                        }`}
                      >
                        {discount.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Minimum Purchase:</span>
                        <span className="font-semibold text-white">
                          ${parseFloat(discount.minimum_purchase_amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Bonus Percentage:</span>
                        <span className="font-semibold text-green-400">
                          {parseFloat(discount.bonus_percentage).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>Created:</span>
                        <span>{new Date(discount.created_on).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>Last Updated:</span>
                        <span>{new Date(discount.updated_on).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(discount)}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(discount)}
                        className={`flex-1 px-4 py-2 rounded-lg transition ${
                          discount.is_active
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {discount.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Section */}
            <div className="mt-8 p-6 bg-[#3a3c44] rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#2c2e34] p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-300 mb-1">Total Discounts</p>
                  <p className="text-2xl font-bold text-white">{discounts.length}</p>
                </div>
                <div className="bg-[#2c2e34] p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-300 mb-1">Active Discounts</p>
                  <p className="text-2xl font-bold text-green-400">
                    {discounts.filter(d => d.is_active).length}
                  </p>
                </div>
                <div className="bg-[#2c2e34] p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-300 mb-1">Inactive Discounts</p>
                  <p className="text-2xl font-bold text-red-400">
                    {discounts.filter(d => !d.is_active).length}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && selectedDiscount && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 transition-opacity bg-black bg-opacity-75" onClick={handleCloseModal}></div>

            {/* Modal panel */}
            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-[#3a3c44] rounded-xl shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-6 pt-6 pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-semibold text-white">
                    Edit Discount
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-white transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Discount ID Display */}
                  <div className="bg-[#2c2e34] p-3 rounded-lg">
                    <p className="text-sm text-gray-400">Discount ID</p>
                    <p className="text-white font-medium">#{selectedDiscount.id}</p>
                  </div>

                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Discount Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-[#2c2e34] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter discount name"
                    />
                  </div>

                  {/* Minimum Purchase Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Minimum Purchase Amount ($)
                    </label>
                    <input
                      type="number"
                      name="minimum_purchase_amount"
                      value={editFormData.minimum_purchase_amount}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full px-3 py-2 bg-[#2c2e34] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Bonus Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Bonus Percentage (%)
                    </label>
                    <input
                      type="number"
                      name="bonus_percentage"
                      value={editFormData.bonus_percentage}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full px-3 py-2 bg-[#2c2e34] border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Active Status Toggle */}
                  <div className="flex items-center justify-between py-2">
                    <label className="text-sm font-medium text-gray-200">
                      Active Status
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={editFormData.is_active}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      <span className="ml-3 text-sm text-gray-300">
                        {editFormData.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                  </div>

                  {/* Creation Info */}
                  <div className="pt-3 border-t border-gray-700">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Created:</span>
                      <span>{new Date(selectedDiscount.created_on).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Last Updated:</span>
                      <span>{new Date(selectedDiscount.updated_on).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-[#2c2e34] flex gap-3">
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    'Update Discount'
                  )}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}