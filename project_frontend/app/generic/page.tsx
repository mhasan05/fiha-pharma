
"use client";
import { useEffect, useState } from "react";
import { ChevronDownIcon, Edit2, Info, Trash2, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    useAllGenericsQuery,
    useCreateGenericMutation,
    useDeleteGenericMutation,
    useUpdateGenericMutation,
} from "@/redux/feature/genericSlice";
import { toast } from "sonner";
import Link from "next/link";

interface Generic {
    generic_id: number;
    name: string;
    description: string;
    created_on: string;
    updated_on: string;
}

export default function GenericName() {
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;
    const [selectedGeneric, setSelectedGeneric] = useState<Generic | null>(null);
    const [editGeneric, setEditGeneric] = useState<Generic | null>(null);
    const [deleteGenericId, setDeleteGenericId] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const {
        data: genericsData,
        isLoading,
        isError,
        refetch,
    } = useAllGenericsQuery({ page, pageSize: itemsPerPage });
    const [updateGeneric] = useUpdateGenericMutation();
    const [deleteGeneric] = useDeleteGenericMutation();

    const generics = genericsData?.data || [];
    const totalGenerics = genericsData?.total_name || 0;

    useEffect(() => {
        refetch();
    }, [page, refetch]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editGeneric) return;
        const formData = new FormData();
        formData.append("name", editGeneric.name);
        formData.append("description", editGeneric.description);

        try {
            await updateGeneric({ id: editGeneric.generic_id, data: formData }).unwrap();
            toast.success("Generic updated successfully!", { position: "top-right" });
            setEditGeneric(null);
            refetch();
        } catch (error) {
            toast.error("Failed to update generic!", { position: "top-right" });
        }
    };

    const handleDeleteClick = (id: number) => {
        setDeleteGenericId(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (deleteGenericId !== null) {
            try {
                await deleteGeneric(deleteGenericId).unwrap();
                toast.success("Generic deleted successfully!", { position: "top-right" });
                refetch();
            } catch (error) {
                toast.error("Failed to delete generic!", { position: "top-right" });
            }
            setIsDeleteModalOpen(false);
            setDeleteGenericId(null);
        }
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };



    if (isLoading) return <div className="text-white">Loading...</div>;
    if (isError) return <div className="text-red-400">Error loading generics</div>;

    return (
        <div className="text-white pt-6 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-6 ">
                <h1 className="text-2xl font-semibold mb-6">Generic Management</h1>
                <Link href="/generic/add-generic">
                    <Button className="bg-purple-500 hover:bg-purple-600">
                        Create Generic
                    </Button>
                </Link>
            </div>

            {/* Generics Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-600 text-sm bg-[#2c2e33] font-medium text-gray-300">
                    <div>ID</div>
                    <div>Name</div>
                    <div>Description</div>
                    <div>Actions</div>
                </div>
                <div className="divide-y divide-gray-600">
                    {generics.map((generic: Generic, index) => (
                        <div
                            key={generic.generic_id}
                            className="grid grid-cols-4 gap-4 p-4 items-center hover:bg-gray-700/50 transition-colors"
                        >
                            <div className="text-white font-medium">{index + 1}</div>
                            <div className="text-gray-300">{generic.name}</div>
                            <div className="text-gray-300">{generic.description || "N/A"}</div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => setSelectedGeneric(generic)}
                                    className="bg-purple-500 hover:bg-purple-600 rounded-full w-8 h-8 p-0"
                                >
                                    <Info className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setEditGeneric(generic)}
                                    className="rounded-full w-8 h-8 p-0"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleDeleteClick(generic.generic_id)}
                                    className="bg-red-500 hover:bg-red-600 rounded-full w-8 h-8 p-0"
                                >
                                    <Trash2Icon className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

          

            {/* Modal for Single Generic */}
            <Dialog open={!!selectedGeneric} onOpenChange={() => setSelectedGeneric(null)}>
                <DialogContent className="bg-[#23252b] text-white border-gray-600 max-w-md">
                    <DialogHeader>
                        <DialogTitle>Generic Details - ID: #{selectedGeneric?.generic_id}</DialogTitle>
                    </DialogHeader>
                    {selectedGeneric && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-400">Name</p>
                                <p>{selectedGeneric.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Description</p>
                                <p>{selectedGeneric.description || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Created On</p>
                                <p>{new Date(selectedGeneric.created_on).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Updated On</p>
                                <p>{new Date(selectedGeneric.updated_on).toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                    <DialogClose asChild>
                        <Button className="mt-4 bg-gray-700 hover:bg-gray-600">Close</Button>
                    </DialogClose>
                </DialogContent>
            </Dialog>

            {/* Modal for Edit Generic */}
            <Dialog open={!!editGeneric} onOpenChange={() => setEditGeneric(null)}>
                <DialogContent className="bg-[#23252b] text-white border-gray-600 max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Generic - ID: #{editGeneric?.generic_id}</DialogTitle>
                    </DialogHeader>
                    {editGeneric && (
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Name</label>
                                <input
                                    type="text"
                                    value={editGeneric.name}
                                    onChange={(e) => setEditGeneric({ ...editGeneric, name: e.target.value })}
                                    className="mt-1 p-2 w-full bg-gray-800 text-white border border-gray-600 rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Description</label>
                                <input
                                    type="text"
                                    value={editGeneric.description}
                                    onChange={(e) => setEditGeneric({ ...editGeneric, description: e.target.value })}
                                    className="mt-1 p-2 w-full bg-gray-800 text-white border border-gray-600 rounded"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => setEditGeneric(null)}
                                    className="bg-gray-700 hover:bg-gray-600"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-green-500 hover:bg-green-600">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={() => setIsDeleteModalOpen(false)}>
                <DialogContent className="bg-[#23252b] text-white border-gray-600 max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription className="text-gray-300">
                            Are you sure you want to delete this generic? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="bg-gray-700 hover:bg-gray-600"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmDelete}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}