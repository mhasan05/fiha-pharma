"use client";
import { useState } from "react";
import { useCreateCategoryMutation } from "@/redux/feature/categorieSlice";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function page() {
    const router = useRouter();
  const [createCategory] = useCreateCategoryMutation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleCreateCategory = async () => {
    const formData = new FormData();
    formData.append("name", name || "Best Selling Products5");
    formData.append("description", description || "Best Selling Products2");
    formData.append("is_active", isActive.toString());

    try {
      const response = await createCategory(formData).unwrap();
      console.log("Category created:", response);
      toast.success("Category created successfully!", {
        position: "top-right",
      });
      router.push("/category");
      // Reset form fields
      setName("");
      setDescription("");
      setIsActive(true);
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category!", {
        position: "top-right",
      });
    }
  };

  return (
    <div className="w-full p-6">
      <div className="space-y-4 max-w-4xl mx-auto">
        <h1 className="text-xl font-medium text-white">Create Category</h1>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter category name"
            className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-700"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
            className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-700"
          />
        </div>
        <div>
          <label htmlFor="isActive" className="block text-sm font-medium text-gray-300 mb-1">
            Is Active
          </label>
          <input
            id="isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="ml-2"
          />
        </div>
        <Button
          onClick={handleCreateCategory}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
        >
          Create Category
        </Button>
      </div>
    </div>
  );
}