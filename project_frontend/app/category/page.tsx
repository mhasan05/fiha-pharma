
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAllCategoriesQuery, useDeleteCategoryMutation, useUpdateCategoryMutation } from "@/redux/feature/categorieSlice";
import { toast } from "sonner";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  description: string;
  status: "Active" | "Inactive";
}

export default function Component() {
  const { data, refetch } = useAllCategoriesQuery(undefined);
  console.log(data?.data, 'data');
  const [deleteCategory] = useDeleteCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState<"Active" | "Inactive">("Active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const handleEditClick = (category: any) => {
    setSelectedCategory({
      id: category.category_id,
      name: category.name,
      description: category.description || "",
      status: category.is_active ? "Active" : "Inactive",
    });
    setNewName(category.name);
    setNewDescription(category.description || "");
    setNewStatus(category.is_active ? "Active" : "Inactive");
    setIsModalOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (selectedCategory) {
      const formData = new FormData();
      formData.append("name", newName);
      formData.append("description", newDescription);
      formData.append("is_active", newStatus === "Active" ? "true" : "false");

      try {
        const res = await updateCategory({
          id: selectedCategory.id,
          data: formData,
        }).unwrap();
        console.log(res, 'ressss');
        toast.success("Category updated successfully!", {
          position: "top-right",
        });
        refetch();
        setIsModalOpen(false);
        setSelectedCategory(null);
        setNewName("");
        setNewDescription("");
        setNewStatus("Active");
      } catch (error) {
        console.error("Error updating category:", error);
        toast.error("Failed to update category!", {
          position: "top-right",
        });
      }
    }
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete({
      id: category.category_id,
      name: category.name,
      description: category.description || "",
      status: category.is_active ? "Active" : "Inactive",
    });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete) {
      try {
        await deleteCategory({ id: categoryToDelete.id }).unwrap();
        toast.success("Category deleted successfully!", {
          position: "top-right",
        });
        refetch();
      } catch (error) {
        toast.error("Failed to delete category!", {
          position: "top-right",
        });
      }
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="pt-4 p-3 sm:p-4 lg:p-6 w-full">
      <div className=" ">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-medium">Categories</h1>
          <Link href="/category/create_categorie">
            <Button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">Add New</Button>
          </Link>
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-lg overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-6 font-medium text-gray-300">Category ID</th>
                <th className="text-left py-4 px-6 font-medium text-gray-300">Name</th>
                <th className="text-left py-4 px-6 font-medium text-gray-300">Description</th>
                <th className="text-left py-4 px-6 font-medium text-gray-300">Status</th>
                <th className="text-left py-4 px-6 font-medium text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((category: any, index: number) => (
                <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="py-4 px-6 text-gray-300">{index + 1}</td>
                  <td className="py-4 px-6 text-white">{category.name}</td>
                  <td className="py-4 px-6 text-white">{category.description || "N/A"}</td>
                  <td className="py-4 px-6">
                    <span className={`text-sm ${category.is_active ? "text-green-400" : "text-red-400"}`}>
                      {category.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-600 hover:bg-green-700 border-green-600 text-white p-2 h-8 w-8"
                        onClick={() => handleEditClick(category)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteClick(category)}
                        size="sm"
                        variant="outline"
                        className="bg-red-600 hover:bg-red-700 border-red-600 text-white p-2 h-8 w-8"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

     

        {/* Status Update Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Update Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-gray-700 px-3 py-2 rounded-md text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-gray-700 px-3 py-2 rounded-md text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Status</label>
                <Select value={newStatus} onValueChange={(value: "Active" | "Inactive") => setNewStatus(value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="Active" className="text-white hover:bg-gray-600">
                      Active
                    </SelectItem>
                    <SelectItem value="Inactive" className="text-white hover:bg-gray-600">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button type="button" onClick={handleStatusUpdate} className="bg-green-600 hover:bg-green-700 text-white">
                  Update Category
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription className="text-gray-300">
                Are you sure you want to delete the category "{categoryToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
