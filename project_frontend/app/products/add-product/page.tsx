

"use client";

import React from "react";
import { useState } from "react";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAddPostMutation } from "@/redux/feature/productSlice";
import { useRouter } from "next/navigation";
import { useAllGenericsQuery } from "@/redux/feature/genericSlice";
import { useAllCategoriesQuery } from "@/redux/feature/categorieSlice";
import { useAllCompaniesQuery } from "@/redux/feature/companySlice";

interface Category {
  category_id: number;
  name: string;
}

interface Generic {
  generic_id: number;
  name: string;
}

interface Company {
  company_id: number;
  company_name: string;
  logo: string | null;
  is_active: boolean;
  created_on: string;
  updated_on: string;
}

interface FormData {
  mainCategory: string;
  companyName: string;
  productName: string;
  quantity: string;
  description: string;
  stock: string;
  netPrice: string;
  status: string;
  grossPrice: string;
  priceRegular: string;
  discount: string;
  company: string; // New field for company selection
  mrp: string;
}

export default function Component() {
  const [addPost] = useAddPostMutation();
  const router = useRouter();

  const { data: generics } = useAllGenericsQuery(undefined);
  const { data: categories } = useAllCategoriesQuery(undefined);
  const { data: companies } = useAllCompaniesQuery(undefined);

  const [formData, setFormData] = useState<FormData>({
    mainCategory: "",
    companyName: "",
    productName: "",
    quantity: "",
    description: "",
    stock: "",
    netPrice: "",
    status: "Active",
    grossPrice: "",
    priceRegular: "",
    discount: "",
    company: "", // Initialize new company field
    mrp: "",
  });

  const [isSmall, setIsSmall] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setUploadedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("Please upload at least one image!");
      return;
    }

    // Find category ID based on category name
    const selectedCategory = categories?.data?.find((cat: Category) => cat.name === formData.mainCategory);
    if (!selectedCategory && formData.mainCategory) {
      toast.error("Selected category is invalid!");
      return;
    }

    // Find generic ID based on generic name
    const selectedGeneric = generics?.data?.find((gen: Generic) => gen.name === formData.companyName);
    if (!selectedGeneric && formData.companyName) {
      toast.error("Selected generic name is invalid!");
      return;
    }

    // Find company ID based on company name
    const selectedCompany = companies?.data?.find((comp: Company) => comp.company_name === formData.company);
    if (!selectedCompany && formData.company) {
      toast.error("Selected company is invalid!");
      return;
    }

    // Validate and convert numeric fields
    const stock = parseInt(formData.stock);
    const quantity = parseInt(formData.quantity);
    const netPrice = parseFloat(formData.netPrice);
    const grossPrice = parseFloat(formData.grossPrice);
    const priceRegular = parseFloat(formData.priceRegular);
    const mrp = parseFloat(formData.mrp);

    // if (isNaN(stock) || isNaN(quantity) || isNaN(netPrice) || isNaN(grossPrice) || isNaN(priceRegular) || isNaN(mrp)) {
    //   toast.error("Please ensure all numeric fields are valid numbers!");
    //   return;
    // }

    const formDataToSend = new FormData();
    formDataToSend.append("product_name", formData.productName);
    formDataToSend.append("generic_name", selectedGeneric ? String(selectedGeneric.generic_id) : ""); // Assuming generic_name is still a string as per the image
    formDataToSend.append("product_description", formData.description || "");
    formDataToSend.append("category_id", selectedCategory ? String(selectedCategory.category_id) : "");
    formDataToSend.append("company_id", selectedCompany ? String(selectedCompany.company_id) : "");
    formDataToSend.append("quantity_per_box", String(stock));
    formDataToSend.append("cost_price", grossPrice.toFixed(2));
    formDataToSend.append("mrp", mrp.toFixed(2));
    formDataToSend.append("selling_price", netPrice.toFixed(2));
    formDataToSend.append("regular_price", priceRegular.toFixed(2));
    formDataToSend.append("is_active", formData.status === "Active" ? "true" : "false");
    formDataToSend.append("stock_quantity", String(quantity));
    formDataToSend.append("product_image", uploadedFiles[0]);

    try {
      const response = await addPost(formDataToSend).unwrap();
      toast.success("Product added successfully!");
      setFormData({
        mainCategory: "",
        companyName: "",
        productName: "",
        quantity: "",
        description: "",
        stock: "",
        netPrice: "",
        status: "",
        grossPrice: "",
        priceRegular: "",
        discount: "",
        company: "",
        mrp: "",
      });
      setUploadedFiles([]);
      router.push("/products");
    } catch (error: any) {
      const message = error?.data?.errors?.product_image?.[0] || "Failed to add product!";
      toast.error(message);
      console.error("Error:", error);
    }
  };



  return (
    <div className="text-white">
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        <div onClick={() => window.history.back()} className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">Add Product</h1>
        </div>

      </div>

      <div className="bg-[#23252b] p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-[#23252b]">
          <div className="space-y-6">

            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Product Name</Label>
              <Input
                value={formData.productName}
                onChange={(e) => handleInputChange("productName", e.target.value)}
                className="bg-[#2a2a2a] border-gray-600 text-white placeholder:text-gray-500"
                placeholder="Enter product name"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="bg-[#2a2a2a] border-gray-600 text-white placeholder:text-gray-500 min-h-[120px] resize-none"
                placeholder="Enter product description"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Main Category</Label>
              <Select value={formData.mainCategory} onValueChange={(value) => handleInputChange("mainCategory", value)}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-600 text-white">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-600">
                  {categories?.data?.map((category: Category) => (
                    <SelectItem className="text-white" key={category.category_id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Company</Label>
              <Select value={formData.company} onValueChange={(value) => handleInputChange("company", value)}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-600 text-white">
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-600">
                  {companies?.data?.map((company: Company) => (
                    <SelectItem className="text-white" key={company.company_id} value={company.company_name}>
                      {company.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Generic Name</Label>
              <Select value={formData.companyName} onValueChange={(value) => handleInputChange("companyName", value)}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-600 text-white">
                  <SelectValue placeholder="Select a generic name" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-600">
                  {generics?.data?.map((generic: Generic) => (
                    <SelectItem className="text-white" key={generic.generic_id} value={generic.name}>
                      {generic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Stock</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                className="bg-[#2a2a2a] border-gray-600 text-white placeholder:text-gray-500"
                placeholder="Enter quantity"
              />
            </div>


          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-300">Add New</Label>
                <Label className="text-sm text-gray-300">Add Photo</Label>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? "border-green-500 bg-green-500/10" : "border-gray-600 hover:border-gray-500"}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => document.getElementById("file-input")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add Photo
                  </Button>
                  <p className="text-sm text-gray-400">Or drag and drop files</p>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-[#2a2a2a] p-2 rounded">
                      <span className="text-sm text-gray-300">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-300"> Quantity per Box</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleInputChange("stock", e.target.value)}
                  className="bg-[#2a2a2a] border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-300">Cost Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.grossPrice}
                  onChange={(e) => handleInputChange("grossPrice", e.target.value)}
                  className="bg-[#2a2a2a] border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-300">MRP</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.mrp}
                  onChange={(e) => handleInputChange("mrp", e.target.value)}
                  className="bg-[#2a2a2a] border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-300">Selling Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.netPrice}
                  onChange={(e) => handleInputChange("netPrice", e.target.value)}
                  className="bg-[#2a2a2a] border-gray-600 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* <div className="space-y-2">
                <Label className="text-sm text-gray-300">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger className="bg-[#2a2a2a] border-gray-600 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2a2a] border-gray-600">
                    <SelectItem className="text-white" value="Active">Active</SelectItem>
                    <SelectItem className="text-white" value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
              <div className="space-y-2">
  <Label className="text-sm text-gray-300">Status</Label>
  <Select
    value={formData.status}
    onValueChange={(value) => handleInputChange("status", value)}
  >
    <SelectTrigger className="bg-[#2a2a2a] border-gray-600 text-white">
      <SelectValue placeholder="Select status" />
    </SelectTrigger>
    <SelectContent className="bg-[#2a2a2a] border-gray-600">
      <SelectItem className="text-white" value="Active">Active</SelectItem>
      <SelectItem className="text-white" value="Inactive">Inactive</SelectItem>
    </SelectContent>
  </Select>
</div>

            </div>



          </div>
        </div>

        <div className="flex justify-center gap-4 mt-8">

          <Button onClick={handleSubmit} className="px-8 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white">
            Add Now
          </Button>
        </div>
      </div>
    </div>
  );
}