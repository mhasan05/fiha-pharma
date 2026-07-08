

// "use client";

// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";
// import {
//   useAllNoticesQuery,
//   useCreateNoticeMutation,
//   useDeleteNoticeMutation,
//   useUpdateNoticeMutation,
// } from "@/redux/feature/noticeSlice";
// import { toast } from "sonner";
// import { Edit, Trash2 } from "lucide-react";

// interface Notice {
//   id: number;
//   title: string;
//   message: string;
//   created_at: string;
//   updated_at: string;
//   is_active: boolean;
//   created_by: number;
// }

// export default function Component() {
//   const { data, refetch } = useAllNoticesQuery(undefined);
//   const [updateNotice] = useUpdateNoticeMutation();
//   const [deleteNotice] = useDeleteNoticeMutation();
//   const [createNotice] = useCreateNoticeMutation();

//   const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
//   const [editNotice, setEditNotice] = useState<Notice | null>(null);
//   const [newNotice, setNewNotice] = useState({ title: "", message: "" });
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
//   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

//   // Load notices on mount
//   useEffect(() => {
//     if (data?.data) {
//       // No need to set a single notice; we'll display all
//     }
//   }, [data]);

//   const handleEditNotice = (noticeToEdit: Notice) => {
//     setEditNotice(noticeToEdit);
//     setIsEditDialogOpen(true);
//   };

//   const handleSaveEdit = async () => {
//     if (editNotice) {
//       try {
//         await updateNotice({
//           id: editNotice.id,
//           data: {
//             title: editNotice.title,
//             message: editNotice.message,
//             is_active: editNotice.is_active,
//           },
//         }).unwrap();
//         toast.success("Notice updated successfully!", { position: "top-right" });
//         refetch();
//         setIsEditDialogOpen(false);
//         setEditNotice(null);
//       } catch (error) {
//         console.error("Error updating notice:", error);
//         toast.error("Failed to update notice!", { position: "top-right" });
//       }
//     }
//   };

//   const handleCancelEdit = () => {
//     setIsEditDialogOpen(false);
//     setEditNotice(null);
//   };

//   const handleDeleteNotice = async (id: number) => {
//     try {
//       await deleteNotice(id).unwrap();
//       toast.success("Notice deleted successfully!", { position: "top-right" });
//       refetch();
//     } catch (error) {
//       console.error("Error deleting notice:", error);
//       toast.error("Failed to delete notice!", { position: "top-right" });
//     }
//   };

//   const handleAddNotice = () => {
//     setIsAddDialogOpen(true);
//   };

//   const handleSaveNewNotice = async () => {
//     if (newNotice.title.trim() && newNotice.message.trim()) {
//       try {
//         await createNotice({
//           title: newNotice.title,
//           message: newNotice.message,
//           is_active: true,
//         }).unwrap();
//         toast.success("Notice created successfully!", { position: "top-right" });
//         refetch();
//         setIsAddDialogOpen(false);
//         setNewNotice({ title: "", message: "" });
//       } catch (error) {
//         console.error("Error creating notice:", error);
//         toast.error("Failed to create notice!", { position: "top-right" });
//       }
//     }
//   };

//   const handleCancelAdd = () => {
//     setIsAddDialogOpen(false);
//     setNewNotice({ title: "", message: "" });
//   };

//   return (
//     <div className="text-white p-6">
//       {/* Header */}
//       <div className="mb-8 flex justify-between items-center">
//         <h1 className="text-2xl font-medium">Your Notices</h1>
//         <Button
//           onClick={handleAddNotice}
//           className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md"
//         >
//           Add New Notice
//         </Button>
//       </div>

//       {/* Notices List */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {data?.data && data.data.length > 0 ? (
//           data.data.map((notice: Notice) => (
//             <div
//               key={notice.id}
//               className="bg-[#2a2a2a] rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
//             >
//               <h2 className="text-lg font-semibold text-green-400 mb-2">{notice.title}</h2>
//               <p className="text-gray-300 text-sm mb-4 line-clamp-3">{notice.message}</p>
//               <div className="text-xs text-gray-500 mb-4">
//                 Created: {new Date(notice.created_at).toLocaleDateString()}
//                 <br />
//                 Updated: {new Date(notice.updated_at).toLocaleDateString()}
//               </div>
//               <div className="flex justify-between items-center">
//                 <span
//                   className={`text-sm ${notice.is_active ? "text-green-400" : "text-red-400"}`}
//                 >
//                   {notice.is_active ? "Active" : "Inactive"}
//                 </span>
//                 <div className="flex gap-2">
//                   <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
//                     <DialogTrigger asChild>
//                       <Button
//                         variant="outline"
//                         onClick={() => handleEditNotice(notice)}
//                         className="bg-transparent border-gray-600 text-white hover:bg-gray-700 h-8 w-8 p-1"
//                       >
//                         <Edit className="h-4 w-4" />
//                       </Button>
//                     </DialogTrigger>
//                     <DialogContent className="bg-[#2a2a2a] border-gray-600 text-white">
//                       <DialogHeader>
//                         <DialogTitle>Edit Notice</DialogTitle>
//                       </DialogHeader>
//                       <div className="space-y-4">
//                         <div>
//                           <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
//                           <input
//                             type="text"
//                             value={editNotice?.title || ""}
//                             onChange={(e) =>
//                               setEditNotice((prev) =>
//                                 prev ? { ...prev, title: e.target.value } : null
//                               )
//                             }
//                             className="w-full p-2 bg-[#1a1a1a] border-gray-600 text-white rounded-md"
//                           />
//                         </div>
//                         <Textarea
//                           value={editNotice?.message || ""}
//                           onChange={(e) =>
//                             setEditNotice((prev) =>
//                               prev ? { ...prev, message: e.target.value } : null
//                             )
//                           }
//                           placeholder="Enter your notice..."
//                           className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 min-h-[100px]"
//                         />
//                         <div className="flex gap-2 justify-end">
//                           <Button
//                             variant="outline"
//                             onClick={handleCancelEdit}
//                             className="border-gray-600 text-black hover:bg-gray-700"
//                           >
//                             Cancel
//                           </Button>
//                           <Button onClick={handleSaveEdit} className="bg-green-500 hover:bg-green-600 text-white">
//                             Save Changes
//                           </Button>
//                         </div>
//                       </div>
//                     </DialogContent>
//                   </Dialog>
//                   <AlertDialog>
//                     <AlertDialogTrigger asChild>
//                       <Button
//                         variant="outline"
//                         className="bg-transparent border-gray-600 text-white hover:bg-gray-700 h-8 w-8 p-1"
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </AlertDialogTrigger>
//                     <AlertDialogContent className="bg-[#2a2a2a] border-gray-600 text-white">
//                       <AlertDialogHeader>
//                         <AlertDialogTitle>Delete Notice</AlertDialogTitle>
//                         <AlertDialogDescription className="text-gray-300">
//                           Are you sure you want to delete this notice? This action cannot be undone.
//                         </AlertDialogDescription>
//                       </AlertDialogHeader>
//                       <AlertDialogFooter>
//                         <AlertDialogCancel className="border-gray-600 text-black hover:bg-gray-700">
//                           Cancel
//                         </AlertDialogCancel>
//                         <AlertDialogAction
//                           onClick={() => handleDeleteNotice(notice.id)}
//                           className="bg-red-500 hover:bg-red-600 text-black"
//                         >
//                           Delete
//                         </AlertDialogAction>
//                       </AlertDialogFooter>
//                     </AlertDialogContent>
//                   </AlertDialog>
//                 </div>
//               </div>
//             </div>
//           ))
//         ) : (
//           <div className="bg-[#2a2a2a] rounded-lg p-8 mb-8 max-w-md w-full text-center col-span-full">
//             <p className="text-gray-400 text-lg">No notices available</p>
//           </div>
//         )}
//       </div>

//       {/* Add Notice Dialog */}
//       <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
//         <DialogTrigger asChild>
//           {/* <Button
//             onClick={handleAddNotice}
//             className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all"
//           >
//             Add Notice
//           </Button> */}
//         </DialogTrigger>
//         <DialogContent className="bg-[#2a2a2a] border-gray-600 text-white">
//           <DialogHeader>
//             <DialogTitle>Add New Notice</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
//               <input
//                 type="text"
//                 value={newNotice.title}
//                 onChange={(e) => setNewNotice((prev) => ({ ...prev, title: e.target.value }))}
//                 className="w-full p-2 bg-[#1a1a1a] border-gray-600 text-white rounded-md"
//               />
//             </div>
//             <Textarea
//               value={newNotice.message}
//               onChange={(e) => setNewNotice((prev) => ({ ...prev, message: e.target.value }))}
//               placeholder="Enter your notice..."
//               className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 min-h-[100px]"
//             />
//             <div className="flex gap-2 justify-end">
//               <Button
//                 variant="outline"
//                 onClick={handleCancelAdd}
//                 className="border-gray-600 text-black hover:bg-gray-700"
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleSaveNewNotice}
//                 disabled={!newNotice.title.trim() || !newNotice.message.trim()}
//                 className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
//               >
//                 Add Notice
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useAllNoticesQuery,
  useCreateNoticeMutation,
  useDeleteNoticeMutation,
  useUpdateNoticeMutation,
} from "@/redux/feature/noticeSlice";
import { toast } from "sonner";
import { Edit, Trash2 } from "lucide-react";

interface Notice {
  id: number;
  title: string;
  message: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  created_by: number | null;
}

export default function Component() {
  const { data, refetch } = useAllNoticesQuery(undefined);
  const [updateNotice] = useUpdateNoticeMutation();
  const [deleteNotice] = useDeleteNoticeMutation();
  const [createNotice] = useCreateNoticeMutation();

  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [editNotice, setEditNotice] = useState<Notice | null>(null);
  const [newNotice, setNewNotice] = useState({ title: "", message: "" });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Load notices on mount
  useEffect(() => {
    if (data?.data) {
      // No need to set a single notice; we'll display all
    }
  }, [data]);

  const handleEditNotice = (noticeToEdit: Notice) => {
    setEditNotice(noticeToEdit);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editNotice) {
      try {
        await updateNotice({
          id: editNotice.id,
          data: {
            title: editNotice.title,
            message: editNotice.message,
            is_active: editNotice.is_active,
          },
        }).unwrap();
        toast.success("Notice updated successfully!", { position: "top-right" });
        refetch();
        setIsEditDialogOpen(false);
        setEditNotice(null);
      } catch (error) {
        console.error("Error updating notice:", error);
        toast.error("Failed to update notice!", { position: "top-right" });
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditNotice(null);
  };

  const handleDeleteNotice = async (id: number) => {
    try {
      await deleteNotice(id).unwrap();
      toast.success("Notice deleted successfully!", { position: "top-right" });
      refetch();
    } catch (error) {
      console.error("Error deleting notice:", error);
      toast.error("Failed to delete notice!", { position: "top-right" });
    }
  };

  const handleAddNotice = () => {
    setIsAddDialogOpen(true);
  };

  const handleSaveNewNotice = async () => {
    if (newNotice.title.trim() && newNotice.message.trim()) {
      try {
        await createNotice({
          title: newNotice.title,
          message: newNotice.message,
          is_active: true,
        }).unwrap();
        toast.success("Notice created successfully!", { position: "top-right" });
        refetch();
        setIsAddDialogOpen(false);
        setNewNotice({ title: "", message: "" });
      } catch (error) {
        console.error("Error creating notice:", error);
        toast.error("Failed to create notice!", { position: "top-right" });
      }
    }
  };

  const handleCancelAdd = () => {
    setIsAddDialogOpen(false);
    setNewNotice({ title: "", message: "" });
  };

  return (
    <div className="text-white p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-medium">Your Notices</h1>
        <Button
          onClick={handleAddNotice}
          className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md"
        >
          Add New Notice
        </Button>
      </div>

      {/* Notices List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.data && data.data.length > 0 ? (
          data.data.map((notice: Notice) => (
            <div
              key={notice.id}
              className="bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <h2 className="text-lg font-semibold text-green-400 mb-2">{notice.title}</h2>
              <p className="text-gray-300 text-sm mb-4 line-clamp-3">{notice.message}</p>
              <div className="text-xs text-gray-500 mb-4">
                Created: {new Date(notice.created_at).toLocaleDateString()}
                <br />
                Updated: {new Date(notice.updated_at).toLocaleDateString()}
              </div>
              <div className="flex justify-between items-center">
                <span
                  className={`text-sm ${notice.is_active ? "text-green-400" : "text-red-400"}`}
                >
                  {notice.is_active ? "Active" : "Inactive"}
                </span>
                <div className="flex gap-2">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => handleEditNotice(notice)}
                        className="bg-transparent border-gray-600 text-white hover:bg-gray-700 h-8 w-8 p-1"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#2a2a2a] border-gray-600 text-white">
                      <DialogHeader>
                        <DialogTitle>Edit Notice</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                          <input
                            type="text"
                            value={editNotice?.title || ""}
                            onChange={(e) =>
                              setEditNotice((prev) =>
                                prev ? { ...prev, title: e.target.value } : null
                              )
                            }
                            className="w-full p-2 bg-[#1a1a1a] border-gray-600 text-white rounded-md"
                          />
                        </div>
                        <Textarea
                          value={editNotice?.message || ""}
                          onChange={(e) =>
                            setEditNotice((prev) =>
                              prev ? { ...prev, message: e.target.value } : null
                            )
                          }
                          placeholder="Enter your notice..."
                          className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 min-h-[100px]"
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Active Status
                          </label>
                          <input
                            type="checkbox"
                            checked={editNotice?.is_active || false}
                            onChange={(e) =>
                              setEditNotice((prev) =>
                                prev ? { ...prev, is_active: e.target.checked } : null
                              )
                            }
                            className="h-4 w-4 text-green-500 bg-[#1a1a1a] border-gray-600 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-300">
                            {editNotice?.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="border-gray-600 text-black hover:bg-gray-700"
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleSaveEdit} className="bg-green-500 hover:bg-green-600 text-white">
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-transparent border-gray-600 text-white hover:bg-gray-700 h-8 w-8 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#2a2a2a] border-gray-600 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Notice</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                          Are you sure you want to delete this notice? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-600 text-black ">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteNotice(notice.id)}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-[#2a2a2a] rounded-lg p-8 mb-8 max-w-md w-full text-center col-span-full">
            <p className="text-gray-400 text-lg">No notices available</p>
          </div>
        )}
      </div>

      {/* Add Notice Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          {/* <Button
            onClick={handleAddNotice}
            className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Add Notice
          </Button> */}
        </DialogTrigger>
        <DialogContent className="bg-[#2a2a2a] border-gray-600 text-white">
          <DialogHeader>
            <DialogTitle>Add New Notice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={newNotice.title}
                onChange={(e) => setNewNotice((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 bg-[#1a1a1a] border-gray-600 text-white rounded-md"
              />
            </div>
            <Textarea
              value={newNotice.message}
              onChange={(e) => setNewNotice((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Enter your notice..."
              className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 min-h-[100px]"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleCancelAdd}
                className="border-gray-600 text-black hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveNewNotice}
                disabled={!newNotice.title.trim() || !newNotice.message.trim()}
                className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
              >
                Add Notice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}