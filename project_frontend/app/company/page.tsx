
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAllCompaniesQuery, useDeleteCompanyMutation, useUpdateCompanyMutation } from "@/redux/feature/companySlice";
import Link from "next/link";

interface Company {
    company_id: number;
    company_name: string;
    logo: string;
    is_active: boolean;
    created_on: string;
    updated_on: string;
}

export default function Company() {
    const { data, refetch } = useAllCompaniesQuery(undefined);
    const [updateCompany] = useUpdateCompanyMutation();
    const [deleteCompany] = useDeleteCompanyMutation();

    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [newStatus, setNewStatus] = useState<"Active" | "Inactive">("Active");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const handleEditClick = (company: Company) => {
        setSelectedCompany(company);
        setNewStatus(company.is_active ? "Active" : "Inactive");
        setIsModalOpen(true);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setLogoFile(event.target.files[0]);
        }
    };

    const handleStatusUpdate = async () => {
        if (selectedCompany) {
            const formData = new FormData();
            formData.append("company_name", selectedCompany.company_name || "SUN PHARMACEUTICAL2");
            if (logoFile) {
                formData.append("logo", logoFile);
            }
            formData.append("is_active", newStatus === "Active" ? "true" : "false");

            try {
                await updateCompany({
                    id: selectedCompany.company_id,
                    data: formData,
                }).unwrap();
                toast.success("Company updated successfully!", {
                    position: "top-right",
                });
                refetch();
                setIsModalOpen(false);
                setSelectedCompany(null);
                setLogoFile(null);
            } catch (error) {
                console.error("Error updating company:", error);
                toast.error("Failed to update company!", {
                    position: "top-right",
                });
            }
        }
    };

    const handleDeleteClick = (company: Company) => {
        setCompanyToDelete(company);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (companyToDelete) {
            try {
                await deleteCompany({ id: companyToDelete.company_id }).unwrap();
                toast.success("Company deleted successfully!", {
                    position: "top-right",
                });
                refetch();
            } catch (error) {
                toast.error("Failed to delete company!", {
                    position: "top-right",
                });
            }
            setIsDeleteModalOpen(false);
            setCompanyToDelete(null);
        }
    };

    return (
        <div className="pt-4 p-3 sm:p-4 lg:p-6 w-full">
            <div className="">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-medium">Company</h1>
                    <Link href={'company/create_company'}>
                        <Button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">Add New</Button>
                    </Link>
                </div>

                {/* Table */}
                <div className="bg-gray-800 rounded-lg overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="text-left py-4 px-6 font-medium text-gray-300">Company ID</th>
                                <th className="text-left py-4 px-6 font-medium text-gray-300">Company Name</th>
                                <th className="text-left py-4 px-6 font-medium text-gray-300">Status</th>
                                <th className="text-left py-4 px-6 font-medium text-gray-300">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.data.map((company: any, index: number) => (
                                <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                                    <td className="py-4 px-6 text-gray-300">{index +1}</td>
                                    <td className="py-4 px-6 text-white">{company.company_name}</td>
                                    <td className="py-4 px-6">
                                        <span className={`text-sm ${company.is_active ? "text-green-400" : "text-red-400"}`}>
                                            {company.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="bg-green-600 hover:bg-green-700 border-green-600 text-white p-2 h-8 w-8"
                                                onClick={() => handleEditClick(company)}
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                onClick={() => handleDeleteClick(company)}
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
                            <DialogTitle>Update Company Status</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-2 block">Company Name</label>
                                <input
                                    type="text"
                                    value={selectedCompany?.company_name || ""}
                                    onChange={(e) => setSelectedCompany(prev => prev ? { ...prev, company_name: e.target.value } : null)}
                                    className="w-full bg-gray-700 px-3 py-2 rounded-md text-white"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-2 block">Logo</label>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
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
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleStatusUpdate} className="bg-green-600 hover:bg-green-700 text-white">
                                    Update Status
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
                                Are you sure you want to delete the company "{companyToDelete?.company_name}"? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                            >
                                Cancel
                            </Button>
                            <Button
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
