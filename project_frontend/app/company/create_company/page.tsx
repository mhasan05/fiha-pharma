"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAddCompanyMutation } from "@/redux/feature/companySlice";
import { useRouter } from "next/navigation";

export default function CompanyForm() {
    const router = useRouter();
  const [addCompany] = useAddCompanyMutation();
  const [companyName, setCompanyName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setLogoFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("company_name", companyName || "SUN PHARMACEUTICAL 2");
    if (logoFile) {
      formData.append("logo", logoFile);
    } else {
      // Optionally handle a default file or skip if not provided
      console.warn("No logo file selected");
    }
    formData.append("is_active", isActive.toString());

    try {
      const response = await addCompany(formData).unwrap();
      console.log("Company added:", response);
      toast.success("Company added successfully!", {
        position: "top-right",
      });
      router.push("/company");
    } catch (error) {
      console.error("Error adding company:", error);
      toast.error("Failed to add company!", {
        position: "top-right",
      });
    }
  };

  return (
    <div className="w-full p-6">
      <div className="space-y-4 max-w-5xl mx-auto">
        <div>
          <label htmlFor="companyName" className="text-white">
            Company Name
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter company name"
            className="w-full p-2 bg-gray-800 text-white rounded"
          />
        </div>
        <div>
          <label htmlFor="logo" className="text-white">
            Logo
          </label>
          <input
            id="logo"
            type="file"
            onChange={handleFileChange}
            className="w-full p-2 bg-gray-800 text-white rounded"
          />
        </div>
        <div>
          <label htmlFor="isActive" className="text-white">
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
          onClick={handleSubmit}
          className="bg-[#44B46E] hover:bg-green-700 text-white px-6 py-2 rounded-full"
        >
          Add Company
        </Button>
      </div>
    </div>
  );
}