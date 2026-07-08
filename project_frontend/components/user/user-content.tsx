
// "use client";

// import { useState, useEffect } from "react";
// import { Info, Trash2, X, Edit2 } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { useAllUsersQuery, useDeleteUserMutation, useUpdateUsersMutation } from "@/redux/feature/userSlice";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { toast } from "@/components/ui/use-toast";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useAreaListQuery } from "@/redux/feature/areaSlice";

// interface User {
//   id: string;
//   userName: string;
//   joiningDate: string;
//   emailId: string;
//   phoneNum: string;
//   shopName: string;
//   area: string;
//   address: string;
//   status: "Pending" | "Inactive" | "Active";
//   image: string | null;
//   isStaff: boolean;
//   isSuperuser: boolean;
// }

// export default function UserManagement() {
//   const [users, setUsers] = useState<User[]>([]);
//   const [selectedUser, setSelectedUser] = useState<User | null>(null);
//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [userToDelete, setUserToDelete] = useState<User | null>(null);
//   const [editForm, setEditForm] = useState({
//     userName: "",
//     emailId: "",
//     phoneNum: "",
//     shopName: "",
//     area: "",
//     address: "",
//     status: "Pending" as "Pending" | "Inactive" | "Active",
//     isStaff: false,
//     isSuperuser: false,
//   });

//   const { data, error, isLoading } = useAllUsersQuery(undefined);
//   const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
//   const [updateUsers, { isLoading: isUpdating }] = useUpdateUsersMutation();


//   const {data: area} = useAreaListQuery(undefined);

//   useEffect(() => {
//     if (data?.results?.data) {
//       const mappedUsers = data.results.data.map((user: any) => ({
//         id: user.user_id.toString(),
//         userName: user.full_name,
//         joiningDate: new Date(user.date_joined).toLocaleDateString(),
//         emailId: user.email,
//         phoneNum: user.phone,
//         shopName: user.shop_name || "N/A",
//         area: user.area_name || "N/A",
//         address: user.shop_address || "N/A",
//         status: user.is_active
//           ? "Active"
//           : user.is_approved
//           ? "Pending"
//           : "Inactive",
//         image: user.image ? `https://api.bdmpharmacy.store${user.image}` : null,
//         isStaff: user.is_staff,
//         isSuperuser: user.is_superuser,
//       }));
//       setUsers(mappedUsers);
//     }
//   }, [data]);

//   const handleDetailsClick = (userId: string) => {
//     const user = users.find((user) => user.id === userId);
//     if (user) {
//       setSelectedUser(user);
//       setIsDetailsModalOpen(true);
//     }
//   };

//   const handleEditClick = (user: User) => {
//     setSelectedUser(user);
//     setEditForm({
//       userName: user.userName,
//       emailId: user.emailId,
//       phoneNum: user.phoneNum,
//       shopName: user.shopName,
//       area: user.area,
//       address: user.address,
//       status: user.status,
//       isStaff: user.isStaff,
//       isSuperuser: user.isSuperuser,
//     });
//     setIsEditModalOpen(true);
//   };

//   const handleEditSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (selectedUser) {
//       try {
//         const formData = new FormData();
//         formData.append("full_name", editForm.userName);
//         formData.append("email", editForm.emailId);
//         formData.append("phone", editForm.phoneNum);
//         formData.append("shop_name", editForm.shopName);
//         formData.append("area_name", editForm.area);
//         formData.append("shop_address", editForm.address);
//         formData.append("is_active", editForm.status === "Active" ? "true" : "false");
//         formData.append("is_approved", editForm.status === "Pending" ? "true" : "false");
//         formData.append("is_staff", editForm.isStaff.toString());
//         formData.append("is_superuser", editForm.isSuperuser.toString());

//         await updateUsers({ id: selectedUser.id, data: formData }).unwrap();
//         toast({
//           title: "Success",
//           description: `User ${editForm.userName} updated successfully.`,
//         });

//         // Update local state
//         setUsers(users.map((user) =>
//           user.id === selectedUser.id
//             ? { ...user, ...editForm }
//             : user
//         ));
//         setIsEditModalOpen(false);
//         setSelectedUser(null);
//       } catch (error) {
//         toast({
//           title: "Error",
//           description: "Failed to update user. Please try again.",
//           variant: "destructive",
//         });
//       }
//     }
//   };

//   const handleDeleteClick = (user: User) => {
//     setUserToDelete(user);
//     setIsDeleteModalOpen(true);
//   };

//   const handleDeleteConfirm = async () => {
//     if (userToDelete) {
//       try {
//         await deleteUser(userToDelete.id).unwrap();
//         toast({
//           title: "Success",
//           description: `User ${userToDelete.userName} has been deleted successfully.`,
//           variant: "default",
//         });
//         setUsers(users.filter((user) => user.id !== userToDelete.id));
//         setIsDeleteModalOpen(false);
//         setUserToDelete(null);
//       } catch (error) {
//         toast({
//           title: "Error",
//           description: "Failed to delete user. Please try again.",
//           variant: "destructive",
//         });
//       }
//     }
//   };

//   const closeDetailsModal = () => {
//     setIsDetailsModalOpen(false);
//     setSelectedUser(null);
//   };

//   const closeEditModal = () => {
//     setIsEditModalOpen(false);
//     setSelectedUser(null);
//   };

//   const closeDeleteModal = () => {
//     setIsDeleteModalOpen(false);
//     setUserToDelete(null);
//   };

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "Active":
//         return <Badge className="bg-green-500/20 text-green-400">{status}</Badge>;
//       case "Pending":
//         return <Badge className="bg-yellow-500/20 text-yellow-400">{status}</Badge>;
//       case "Inactive":
//         return <Badge className="bg-red-500/20 text-red-400">{status}</Badge>;
//       default:
//         return <Badge className="bg-gray-500/20 text-gray-400">{status}</Badge>;
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center h-64 text-white">
//         Loading users...
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex justify-center items-center h-64 text-red-400">
//         Error loading user data
//       </div>
//     );
//   }

//   return (
//     <div className="text-white p-4 sm:p-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
//         <h1 className="text-2xl font-bold">User Management</h1>
//       </div>

//       {/* Users Table */}
//       <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
//         {/* Table Header */}
//         <div className="grid grid-cols-8 gap-4 p-4 border-b border-gray-700 text-sm font-medium text-gray-300 bg-gray-900">
//           <div>User Name</div>
//           <div>Joining Date</div>
//           <div>Email</div>
//           <div>Phone</div>
//           <div>Shop</div>
//           <div>Area</div>
//           <div>Status</div>
//           <div>Actions</div>
//         </div>

//         {/* Table Body */}
//         <div className="divide-y divide-gray-700">
//           {users.length === 0 ? (
//             <div className="p-4 text-center text-gray-400">
//               No users found
//             </div>
//           ) : (
//             users.map((user) => (
//               <div
//                 key={user.id}
//                 className="grid grid-cols-8 gap-4 p-4 items-center hover:bg-gray-700/50 transition-colors"
//               >
//                 <div className="text-white font-medium">{user.userName}</div>
//                 <div className="text-gray-300 text-sm">{user.joiningDate}</div>
//                 <div className="text-gray-300 text-sm truncate">{user.emailId}</div>
//                 <div className="text-gray-300">{user.phoneNum}</div>
//                 <div className="text-gray-300 truncate">{user.shopName}</div>
//                 <div className="text-gray-300">{user.area}</div>
//                 <div>{getStatusBadge(user.status)}</div>
//                 <div className="flex items-center gap-2">
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     className="w-8 h-8 p-0 text-purple-400 hover:bg-purple-500/20"
//                     onClick={() => handleDetailsClick(user.id)}
//                   >
//                     <Info className="h-4 w-4" />
//                   </Button>
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     className="w-8 h-8 p-0 text-yellow-400 hover:bg-yellow-500/20"
//                     onClick={() => handleEditClick(user)}
//                   >
//                     <Edit2 className="h-4 w-4" />
//                   </Button>
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     className="w-8 h-8 p-0 text-red-400 hover:bg-red-500/20"
//                     onClick={() => handleDeleteClick(user)}
//                     disabled={isDeleting}
//                   >
//                     <Trash2 className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       {/* User Details Dialog */}
//       <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
//         <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl text-white">
//           <DialogHeader>
//             <DialogTitle>User Details</DialogTitle>
//           </DialogHeader>
//           {selectedUser && (
//             <div className="space-y-4">
//               <div className="flex items-center gap-4">
//                 {selectedUser.image ? (
//                   <img
//                     src={selectedUser.image}
//                     alt={selectedUser.userName}
//                     className="w-16 h-16 rounded-full object-cover"
//                   />
//                 ) : (
//                   <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
//                     <span className="text-xl">
//                       {selectedUser.userName.charAt(0).toUpperCase()}
//                     </span>
//                   </div>
//                 )}
//                 <div>
//                   <h3 className="text-lg font-bold">{selectedUser.userName}</h3>
//                   <div className="flex gap-2 mt-1">
//                     {getStatusBadge(selectedUser.status)}
//                     {selectedUser.isSuperuser && (
//                       <Badge className="bg-purple-500/20 text-purple-400">Admin</Badge>
//                     )}
//                     {selectedUser.isStaff && !selectedUser.isSuperuser && (
//                       <Badge className="bg-purple-500/20 text-purple-400">Staff</Badge>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-gray-400">Email</p>
//                   <p>{selectedUser.emailId}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-400">Phone</p>
//                   <p>{selectedUser.phoneNum}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-400">Shop Name</p>
//                   <p>{selectedUser.shopName}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-400">Area</p>
//                   <p>{selectedUser.area}</p>
//                 </div>
//                 <div className="md:col-span-2">
//                   <p className="text-sm text-gray-400">Address</p>
//                   <p>{selectedUser.address}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-400">Joining Date</p>
//                   <p>{selectedUser.joiningDate}</p>
//                 </div>
//               </div>

//               <div className="flex justify-end pt-4">
//                 <Button
//                   variant="outline"
//                   className="border-gray-600 text-black hover:bg-gray-700"
//                   onClick={closeDetailsModal}
//                 >
//                   Close
//                 </Button>
//               </div>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>

//       {/* Edit User Dialog */}
//       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
//         <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl text-white">
//           <DialogHeader>
//             <DialogTitle>Edit User</DialogTitle>
//           </DialogHeader>
//           <form onSubmit={handleEditSubmit} className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <Label htmlFor="userName">User Name</Label>
//                 <Input
//                   id="userName"
//                   value={editForm.userName}
//                   onChange={(e) => setEditForm({ ...editForm, userName: e.target.value })}
//                   className="bg-gray-700 text-white border-gray-600"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="emailId">Email</Label>
//                 <Input
//                   id="emailId"
//                   type="email"
//                   value={editForm.emailId}
//                   onChange={(e) => setEditForm({ ...editForm, emailId: e.target.value })}
//                   className="bg-gray-700 text-white border-gray-600"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="phoneNum">Phone</Label>
//                 <Input
//                   id="phoneNum"
//                   value={editForm.phoneNum}
//                   onChange={(e) => setEditForm({ ...editForm, phoneNum: e.target.value })}
//                   className="bg-gray-700 text-white border-gray-600"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="shopName">Shop Name</Label>
//                 <Input
//                   id="shopName"
//                   value={editForm.shopName}
//                   onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })}
//                   className="bg-gray-700 text-white border-gray-600"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="area">Area</Label>
//                 <Input
//                   id="area"
//                   value={editForm.area}
//                   onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
//                   className="bg-gray-700 text-white border-gray-600"
//                 />
//               </div>
//               <div className="md:col-span-2">
//                 <Label htmlFor="address">Address</Label>
//                 <Input
//                   id="address"
//                   value={editForm.address}
//                   onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
//                   className="bg-gray-700 text-white border-gray-600"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="status">Status</Label>
//                 <Select
//                   value={editForm.status}
//                   onValueChange={(value: "Pending" | "Inactive" | "Active") =>
//                     setEditForm({ ...editForm, status: value })
//                   }
//                 >
//                   <SelectTrigger className="bg-gray-700 text-white border-gray-600">
//                     <SelectValue placeholder="Select status" />
//                   </SelectTrigger>
//                   <SelectContent className="bg-gray-700 text-white border-gray-600">
//                     <SelectItem value="Active">Active</SelectItem>
//                     <SelectItem value="Pending">Pending</SelectItem>
//                     <SelectItem value="Inactive">Inactive</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="flex items-center gap-4">
//                 <div className="flex items-center">
//                   <input
//                     type="checkbox"
//                     id="isStaff"
//                     checked={editForm.isStaff}
//                     onChange={(e) => setEditForm({ ...editForm, isStaff: e.target.checked })}
//                     className="mr-2"
//                   />
//                   <Label htmlFor="isStaff">Staff</Label>
//                 </div>
//                 <div className="flex items-center">
//                   <input
//                     type="checkbox"
//                     id="isSuperuser"
//                     checked={editForm.isSuperuser}
//                     onChange={(e) => setEditForm({ ...editForm, isSuperuser: e.target.checked })}
//                     className="mr-2"
//                   />
//                   <Label htmlFor="isSuperuser">Superuser</Label>
//                 </div>
//               </div>
//             </div>
//             <DialogFooter>
//               <Button
//                 variant="outline"
//                 className="border-gray-600 text-black hover:bg-gray-700"
//                 onClick={closeEditModal}
//                 disabled={isUpdating}
//               >
//                 Cancel
//               </Button>
//               <Button type="submit" disabled={isUpdating}>
//                 {isUpdating ? "Updating..." : "Update"}
//               </Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>

//       {/* Delete Confirmation Dialog */}
//       <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
//         <DialogContent className="bg-gray-800 border-gray-700 text-white">
//           <DialogHeader>
//             <DialogTitle>Confirm Delete</DialogTitle>
//             <DialogDescription className="text-gray-300">
//               Are you sure you want to delete {userToDelete?.userName}? This action cannot be undone.
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button
//               variant="outline"
//               className="border-gray-600 text-black hover:bg-gray-700"
//               onClick={closeDeleteModal}
//               disabled={isDeleting}
//             >
//               Cancel
//             </Button>
//             <Button
//               variant="destructive"
//               onClick={handleDeleteConfirm}
//               disabled={isDeleting}
//             >
//               {isDeleting ? "Deleting..." : "Delete"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { Info, Edit2, Download, UserPlus } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { useAllUsersQuery, useCreateUserMutation, useUpdateUsersMutation } from "@/redux/feature/userSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAreaListQuery } from "@/redux/feature/areaSlice";
import { IMAGE_BASE_URL } from "@/lib/config";

interface Area {
  area_id: number;
  area_name: string;
  is_active: boolean;
}

interface User {
  id: string;
  userName: string;
  joiningDate: string;
  emailId: string;
  phoneNum: string;
  shopName: string;
  area: string;
  areaId: number | null;
  address: string;
  status: "Pending" | "Inactive" | "Active";
  image: string | null;
  role: string;
  orderCount: number;
  isStaff: boolean;
  isSuperuser: boolean;
  isApproved: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<"customer" | "staff">("customer");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    userName: "",
    emailId: "",
    phoneNum: "",
    password: "",
    area: "",
    role: "delivery_man",
  });
  const [editForm, setEditForm] = useState({
    userName: "",
    emailId: "",
    phoneNum: "",
    shopName: "",
    area: "",
    address: "",
    status: "Pending" as "Pending" | "Inactive" | "Active",
    role: "customer",
    isStaff: false,
    isSuperuser: false,
    isApproved: false,
    password: "",
  });

  const { data, error, isLoading } = useAllUsersQuery(undefined);
  console.log(data, 'user data')
  const [updateUsers, { isLoading: isUpdating }] = useUpdateUsersMutation();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const { data: areaData } = useAreaListQuery(undefined);
  const [areaFilter, setAreaFilter] = useState<string>("all");
  // Customer-tab only: filter by how many orders the customer has placed.
  const [ordersFilter, setOrdersFilter] = useState<"all" | "zero" | "has">("all");

  // Staff section includes admin/staff AND delivery-man accounts.
  const isStaffAccount = (u: User) => u.isStaff || u.role === "delivery_man";

  useEffect(() => {
    if (data?.results?.data) {
      const mappedUsers = data.results.data.map((user: any) => ({
        id: user.user_id.toString(),
        userName: user.full_name,
        joiningDate: new Date(user.date_joined).toLocaleDateString(),
        emailId: user.email,
        phoneNum: user.phone,
        shopName: user.shop_name || "N/A",
        area: user.area_name || "N/A",
        areaId: user.area || null,
        address: user.shop_address || "N/A",
        status: user.is_active
          ? "Active"
          : user.is_approved
            ? "Pending"
            : "Inactive",
        image: user.image ? `${IMAGE_BASE_URL}${user.image}` : null,
        role: user.role || "customer",
        orderCount: user.order_count ?? 0,
        isStaff: user.is_staff,
        isSuperuser: user.is_superuser,
        isApproved: user.is_approved,
      }));
      setUsers(mappedUsers);
    }
  }, [data]);

  const handleDetailsClick = (userId: string) => {
    const user = users.find((user) => user.id === userId);
    if (user) {
      setSelectedUser(user);
      setIsDetailsModalOpen(true);
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      userName: user.userName,
      emailId: user.emailId,
      phoneNum: user.phoneNum,
      shopName: user.shopName,
      area: user.areaId?.toString() || "",
      address: user.address,
      status: user.status,
      role: user.role || "customer",
      isStaff: user.isStaff,
      isSuperuser: user.isSuperuser,
      isApproved: user.isApproved,
      password: "",

    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      try {
        const formData = new FormData();
        formData.append("full_name", editForm.userName);
        formData.append("email", editForm.emailId);
        formData.append("phone", editForm.phoneNum);
        formData.append("shop_name", editForm.shopName);
        formData.append("area", editForm.area);
        formData.append("shop_address", editForm.address);
        formData.append("is_active", editForm.status === "Active" ? "true" : "false");
        formData.append("is_approved", editForm.isApproved.toString());
        formData.append("role", editForm.role);
        formData.append("is_staff", editForm.isStaff.toString());
        formData.append("is_superuser", editForm.isSuperuser.toString());
        formData.append('password', editForm.password.toString());


        await updateUsers({ id: selectedUser.id, data: formData }).unwrap();
        toast({
          title: "Success",
          description: `User ${editForm.userName} updated successfully.`,
        });

        setUsers(users.map((user) =>
          user.id === selectedUser.id
            ? { ...user, ...editForm }
            : user
        ));
        setIsEditModalOpen(false);
        setSelectedUser(null);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update user. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const openCreateModal = () => {
    setCreateForm({
      userName: "",
      emailId: "",
      phoneNum: "",
      password: "",
      area: "",
      role: "delivery_man",
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createForm.userName || !createForm.phoneNum || !createForm.password) {
      toast({
        title: "Missing fields",
        description: "Name, phone and password are required.",
        variant: "destructive",
      });
      return;
    }
    if (createForm.role === "delivery_man" && !createForm.area) {
      toast({
        title: "Area required",
        description: "Please assign an area for the delivery man.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("full_name", createForm.userName);
      formData.append("email", createForm.emailId);
      formData.append("phone", createForm.phoneNum);
      formData.append("password", createForm.password);
      formData.append("role", createForm.role);
      if (createForm.area) formData.append("area", createForm.area);

      const res = await createUser(formData).unwrap();
      toast({
        title: "Success",
        description: res?.message || `Account for ${createForm.userName} created successfully.`,
      });
      setIsCreateModalOpen(false);
      setActiveTab("staff");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.data?.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedUser(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500/20 text-green-400">{status}</Badge>;
      case "Pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400">{status}</Badge>;
      case "Inactive":
        return <Badge className="bg-red-500/20 text-red-400">{status}</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">{status}</Badge>;
    }
  };

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  const handleDownloadPDF = async () => {
    // Export exactly what's on screen: the active tab (Customer/Staff) + area filter.
    const exportUsers = users
      .filter((u) => (activeTab === "staff" ? isStaffAccount(u) : !isStaffAccount(u)))
      .filter((u) => areaFilter === "all" || String(u.areaId) === areaFilter)
      .filter(
        (u) =>
          activeTab !== "customer" ||
          ordersFilter === "all" ||
          (ordersFilter === "zero" ? u.orderCount === 0 : u.orderCount > 0)
      );

    const isStaffView = activeTab === "staff";
    const areaName =
      areaFilter === "all"
        ? "All Areas"
        : areaData?.data?.find((a: Area) => String(a.area_id) === areaFilter)?.area_name || "—";
    const reportTitle = isStaffView
      ? "Staff List"
      : ordersFilter === "zero"
        ? "Customers — No Orders"
        : ordersFilter === "has"
          ? "Customers — With Orders"
          : "Customer List";

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 40;
    const rightEdge = pageWidth - marginX;

    // ---- Left: report title ----
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 58, 82);
    doc.setFontSize(16);
    doc.text(reportTitle, marginX, 48);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(`Total: ${exportUsers.length}   ·   Area: ${areaName}`, marginX, 66);
    doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, 80);

    // ---- Right: company letterhead (logo + name + address) ----
    let ry = 28;
    const logo = await loadImage(`${window.location.origin}/invoicelogo.jpg`);
    if (logo) {
      const h = 34;
      const ratio = logo.naturalWidth / logo.naturalHeight || 1;
      let w = h * ratio;
      if (w > 100) w = 100;
      doc.addImage(logo, "JPEG", rightEdge - w, ry, w, w / ratio);
      ry += w / ratio + 8;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(26, 58, 82);
    doc.text("Fiha Pharma", rightEdge, ry, { align: "right" });
    ry += 13;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90);
    doc.text("Wholesale Pharmaceutical Supplier", rightEdge, ry, { align: "right" });
    ry += 11;
    const addrLines = doc.splitTextToSize(
      "Holding No-58, Word No-45, Helal Market, Uttar Khan, Uttara, Dhaka-1230",
      320
    );
    doc.text(addrLines, rightEdge, ry, { align: "right" });
    ry += addrLines.length * 10 + 1;
    doc.text("Phone: 01558920438", rightEdge, ry, { align: "right" });
    ry += 11;

    // ---- Divider + table ----
    const headerBottom = Math.max(86, ry);
    doc.setDrawColor(26, 58, 82);
    doc.setLineWidth(1.2);
    doc.line(marginX, headerBottom, rightEdge, headerBottom);

    const roleLabel = (u: User) =>
      u.role === "delivery_man" ? "Delivery Man" : u.isSuperuser ? "Admin" : "Staff";

    const head = isStaffView
      ? [["#", "Name", "Role", "Phone Number", "Email", "Area", "Address"]]
      : [["#", "Customer Name", "Shop Name", "Phone Number", "Area", "Address", "Orders"]];

    const body = exportUsers.map((u, i) =>
      isStaffView
        ? [i + 1, u.userName || "", roleLabel(u), u.phoneNum || "", u.emailId || "", u.area || "", u.address || ""]
        : [i + 1, u.userName || "", u.shopName || "", u.phoneNum || "", u.area || "", u.address || "", u.orderCount]
    );

    autoTable(doc, {
      startY: headerBottom + 14,
      head,
      body,
      styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak" },
      headStyles: { fillColor: [26, 58, 82], textColor: 255 },
      columnStyles: { 0: { halign: "right", cellWidth: 26 } },
    });

    doc.save(`${isStaffView ? "staff" : "customers"}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-white">
        Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-400">
        Error loading user data
      </div>
    );
  }

  // Customer tab = regular customers; Staff tab = staff + delivery-man accounts.
  const customerCount = users.filter((u) => !isStaffAccount(u)).length;
  const staffCount = users.filter((u) => isStaffAccount(u)).length;
  const tabUsers = users.filter((u) =>
    activeTab === "staff" ? isStaffAccount(u) : !isStaffAccount(u)
  );
  // Orders filter only applies to the Customer tab.
  const matchesOrders = (u: User) =>
    activeTab !== "customer" ||
    ordersFilter === "all" ||
    (ordersFilter === "zero" ? u.orderCount === 0 : u.orderCount > 0);
  const displayedUsers = tabUsers
    .filter((u) => areaFilter === "all" || String(u.areaId) === areaFilter)
    .filter(matchesOrders);
  const zeroOrderCount = users.filter((u) => !isStaffAccount(u) && u.orderCount === 0).length;

  return (
    <div className="text-white p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={openCreateModal}
            className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Create Delivery Man
          </Button>
          <Button
            onClick={handleDownloadPDF}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Customer / Staff toggle + Area filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="inline-flex rounded-lg border border-gray-700 bg-gray-800 p-1">
          {(["customer", "staff"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab} ({tab === "staff" ? staffCount : customerCount})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Area</label>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-3 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Areas</option>
            {areaData?.data?.map((a: Area) => (
              <option key={a.area_id} value={String(a.area_id)}>
                {a.area_name}
              </option>
            ))}
          </select>
        </div>

        {activeTab === "customer" && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Orders</label>
            <select
              value={ordersFilter}
              onChange={(e) => setOrdersFilter(e.target.value as "all" | "zero" | "has")}
              className="px-3 py-2 bg-[#23252b] border border-gray-600 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All customers</option>
              <option value="zero">No orders ({zeroOrderCount})</option>
              <option value="has">Has orders</option>
            </select>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg overflow-x-auto border border-gray-700">
        <div className="grid grid-cols-9 gap-4 p-4 border-b border-gray-700 text-sm font-medium text-gray-300 bg-gray-900 min-w-[900px]">
          <div>User Name</div>
          <div>Joining Date</div>
          <div>Email</div>
          <div>Phone</div>
          <div>Shop</div>
          <div>Area</div>
          {activeTab === "customer" && <div>Orders</div>}
          <div>Status</div>
          {activeTab === "staff" && <div>Admin Status</div>}
          <div>Actions</div>
        </div>

        <div className="divide-y divide-gray-700">
          {displayedUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              No {activeTab === "staff" ? "staff" : "customers"} found
            </div>
          ) : (
            displayedUsers.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-9 gap-4 p-4 items-center hover:bg-gray-700/50 transition-colors min-w-[900px]"
              >
                <div className="text-white font-medium">{user.userName}</div>
                <div className="text-gray-300 text-sm">{user.joiningDate}</div>
                <div className="text-gray-300 text-sm truncate">{user.emailId}</div>
                <div className="text-gray-300">{user.phoneNum}</div>
                <div className="text-gray-300 truncate">{user.shopName}</div>
                <div className="text-gray-300">{user.area}</div>
                {activeTab === "customer" && (
                  <div>
                    <Badge
                      className={
                        user.orderCount === 0
                          ? "bg-red-500/20 text-red-400"
                          : "bg-green-500/20 text-green-400"
                      }
                    >
                      {user.orderCount}
                    </Badge>
                  </div>
                )}
                <div>{getStatusBadge(user.status)}</div>
                {activeTab === "staff" && (
                  <div>
                    <Badge
                      className={
                        user.role === "delivery_man"
                          ? "bg-cyan-500/20 text-cyan-400"
                          : user.isSuperuser
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-gray-500/20 text-gray-400"
                      }
                    >
                      {user.role === "delivery_man" ? "Delivery Man" : user.isSuperuser ? "Admin" : "Staff"}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-8 h-8 p-0 text-purple-400 hover:bg-purple-500/20"
                    onClick={() => handleDetailsClick(user.id)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-8 h-8 p-0 text-yellow-400 hover:bg-yellow-500/20"
                    onClick={() => handleEditClick(user)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* User Details Dialog */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl text-white">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedUser.image ? (
                  <img
                    src={selectedUser.image}
                    alt={selectedUser.userName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-xl">
                      {selectedUser.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold">{selectedUser.userName}</h3>
                  <div className="flex gap-2 mt-1">
                    {getStatusBadge(selectedUser.status)}
                    {selectedUser.isSuperuser && (
                      <Badge className="bg-purple-500/20 text-purple-400">Admin</Badge>
                    )}
                    {selectedUser.isStaff && !selectedUser.isSuperuser && (
                      <Badge className="bg-purple-500/20 text-purple-400">Staff</Badge>
                    )}
                    <Badge className={selectedUser.isApproved ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {selectedUser.isApproved ? "Approved" : "Not Approved"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p>{selectedUser.emailId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Phone</p>
                  <p>{selectedUser.phoneNum}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Shop Name</p>
                  <p>{selectedUser.shopName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Area</p>
                  <p>{selectedUser.area}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-400">Address</p>
                  <p>{selectedUser.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Joining Date</p>
                  <p>{selectedUser.joiningDate}</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  className="border-gray-600 text-black hover:bg-gray-700"
                  onClick={closeDetailsModal}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl text-white">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userName">User Name</Label>
                <Input
                  id="userName"
                  value={editForm.userName}
                  onChange={(e) => setEditForm({ ...editForm, userName: e.target.value })}
                  className="bg-gray-700 text-white border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="emailId">Email</Label>
                <Input
                  id="emailId"
                  type="email"
                  value={editForm.emailId}
                  onChange={(e) => setEditForm({ ...editForm, emailId: e.target.value })}
                  className="bg-gray-700 text-white border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="phoneNum">Phone</Label>
                <Input
                  id="phoneNum"
                  value={editForm.phoneNum}
                  onChange={(e) => setEditForm({ ...editForm, phoneNum: e.target.value })}
                  className="bg-gray-700 text-white border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="shopName">Shop Name</Label>
                <Input
                  id="shopName"
                  value={editForm.shopName}
                  onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })}
                  className="bg-gray-700 text-white border-gray-600"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <div>
                  <Label htmlFor="area">Area</Label>
                  <Select
                    value={editForm.area}
                    onValueChange={(value) => setEditForm({ ...editForm, area: value })}
                  >
                    <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 text-white border-gray-600">
                      {areaData?.data?.map((area: Area) => (
                        <SelectItem key={area.area_id} value={area.area_id.toString()}>
                          {area.area_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* change password */}
                <div>
                  <label htmlFor="changePassword">Change Password</label>
                  <Input
                    id="password"
                    type="number"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="bg-gray-700 text-white border-gray-600"
                  />
                </div>

                <div>

                </div>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="bg-gray-700 text-white border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: "Pending" | "Inactive" | "Active") =>
                    setEditForm({ ...editForm, status: value })
                  }
                >
                  <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 text-white border-gray-600">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                >
                  <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 text-white border-gray-600">
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="delivery_man">Delivery Man</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="shop_owner">Shop Owner</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1">
                  Delivery agents also need an Area set (used for auto-assignment).
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isStaff"
                    checked={editForm.isStaff}
                    onChange={(e) => setEditForm({ ...editForm, isStaff: e.target.checked })}
                    className="mr-2"
                  />
                  <Label htmlFor="isStaff">Staff</Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isSuperuser"
                    checked={editForm.isSuperuser}
                    onChange={(e) => setEditForm({ ...editForm, isSuperuser: e.target.checked })}
                    className="mr-2"
                  />
                  <Label htmlFor="isSuperuser">Superuser</Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isApproved"
                    checked={editForm.isApproved}
                    onChange={(e) => setEditForm({ ...editForm, isApproved: e.target.checked })}
                    className="mr-2"
                  />
                  <Label htmlFor="isApproved">Approved</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-gray-600 text-black hover:bg-gray-700"
                onClick={closeEditModal}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Delivery Man Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl text-white">
          <DialogHeader>
            <DialogTitle>Create Delivery Man</DialogTitle>
            <DialogDescription className="text-gray-400">
              Creates an approved account. The agent can log in to the mobile app right away.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="createName">Full Name *</Label>
                <Input
                  id="createName"
                  value={createForm.userName}
                  onChange={(e) => setCreateForm({ ...createForm, userName: e.target.value })}
                  className="bg-gray-700 text-white border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="createPhone">Phone *</Label>
                <Input
                  id="createPhone"
                  value={createForm.phoneNum}
                  onChange={(e) => setCreateForm({ ...createForm, phoneNum: e.target.value })}
                  className="bg-gray-700 text-white border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="createEmail">Email</Label>
                <Input
                  id="createEmail"
                  type="email"
                  value={createForm.emailId}
                  onChange={(e) => setCreateForm({ ...createForm, emailId: e.target.value })}
                  className="bg-gray-700 text-white border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="createPassword">Password *</Label>
                <Input
                  id="createPassword"
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="bg-gray-700 text-white border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="createArea">Area *</Label>
                <Select
                  value={createForm.area}
                  onValueChange={(value) => setCreateForm({ ...createForm, area: value })}
                >
                  <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                    <SelectValue placeholder="Assign area" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 text-white border-gray-600">
                    {areaData?.data?.map((area: Area) => (
                      <SelectItem key={area.area_id} value={area.area_id.toString()}>
                        {area.area_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="createRole">Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value) => setCreateForm({ ...createForm, role: value })}
                >
                  <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 text-white border-gray-600">
                    <SelectItem value="delivery_man">Delivery Man</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="border-gray-600 text-black hover:bg-gray-700"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}