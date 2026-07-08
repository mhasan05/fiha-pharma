// "use client";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { ArrowLeft } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useAddAreaMutation } from "@/redux/feature/areaSlice"; // Assuming useAddAreaMutation is an RTK query hook for POST request

// export default function AddAreaForm() {
//   const [areaNames, setAreaNames] = useState([
//     "Mohammadpur",
//     "Gulshan",
//     "",
//     "",
//     "",
//   ]);
//   const router = useRouter();

//   const [addArea] = useAddAreaMutation(); // Add mutation hook from RTK

//   const handleInputChange = (index: number, value: string) => {
//     const updatedAreas = [...areaNames];
//     updatedAreas[index] = value;
//     setAreaNames(updatedAreas);
//   };

//   const handleSave = async () => {
//     // Filter out empty area names
//     const filledAreas = areaNames.filter((name) => name.trim() !== "");

//     try {
//       // POST request for each area (you can also batch them if needed)
//       const savePromises = filledAreas.map((areaName) =>
//         addArea({
//           area_name: areaName, // Send area_name to the backend
//           is_active: true, // Assuming you want to set the area as active by default
//         }).unwrap() // unwrap to handle resolved or rejected promise
//       );

//       await Promise.all(savePromises); // Wait for all the promises to resolve

//       alert(`${filledAreas.length} areas saved successfully!`);
//       router.back(); // Go back to the previous page after saving

//     } catch (error) {
//       console.error("Error saving areas:", error);
//       alert("Failed to save areas.");
//     }
//   };

//   const handleBack = () => {
//     router.back();
//     console.log("Going back to area list");
//   };

//   return (
//     <div className=" p-6">
//       <div className="max-w-2xl">
//         {/* Header */}
//         <div className="flex items-center mb-8">
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={handleBack}
//             className="text-white hover:bg-gray-700 p-2 mr-3"
//           >
//             <ArrowLeft className="w-5 h-5" />
//           </Button>
//           <h1 className="text-white text-xl font-medium">Add Area</h1>
//         </div>

//         {/* Form */}
//         <div className="space-y-6">
//           <div>
//             <label className="block text-white text-sm font-medium mb-4">
//               Area Name
//             </label>

//             <div className="space-y-4">
//               {areaNames.map((name, index) => (
//                 <Input
//                   key={index}
//                   type="text"
//                   value={name}
//                   onChange={(e) => handleInputChange(index, e.target.value)}
//                   placeholder="Write here"
//                   className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500 focus:ring-gray-500 h-12 px-4 rounded-md"
//                 />
//               ))}
//             </div>
//           </div>

//           {/* Save Button */}
//           <div className="flex justify-center pt-8">
//             <Button
//               onClick={handleSave}
//               className="bg-green-600 hover:bg-green-700 text-white px-12 py-3 rounded-full text-base font-medium"
//             >
//               Save Now
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAddAreaMutation } from "@/redux/feature/areaSlice"; // Assuming useAddAreaMutation is an RTK query hook for POST request
import { toast } from "sonner";

export default function AddAreaForm() {
  const [areaNames, setAreaNames] = useState([""]); // Track area input fields
  const [addArea] = useAddAreaMutation(); // API hook for adding area
  const router = useRouter();

  // Function to handle input change
  const handleInputChange = (index: number, value: string) => {
    const updatedAreas = [...areaNames];
    updatedAreas[index] = value;
    setAreaNames(updatedAreas);
  };

  // Function to add a new input field
  const handleAddInput = () => {
    setAreaNames([...areaNames, ""]); // Adds a new empty input
  };

  // Function to close an input field (remove it)
  const handleCloseInput = (index: number) => {
    const updatedAreas = areaNames.filter((_, i) => i !== index); // Remove input at the specified index
    setAreaNames(updatedAreas);
  };

  // Function to handle form submission and post data to API
  const handleSave = async () => {
    const filledAreas = areaNames.filter((name) => name.trim() !== "");

    try {
      // POST request for each area (you can also batch them if needed)
      const savePromises = filledAreas.map(
        (areaName) =>
          addArea({
            area_name: areaName,
            is_active: true,
          }).unwrap() // unwrap to handle resolved or rejected promise
      );

      await Promise.all(savePromises); // Wait for all the promises to resolve
      toast.success(`${filledAreas.length} areas saved successfully!`);
      router.back(); // Go back to the previous page after saving
    } catch (error) {
      console.error("Error saving areas:", error);
      toast.error("Failed to save areas.");
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <h1 className="text-white text-xl font-medium">Add Area</h1>
        </div>

        {/* Form */}
        <div className="space-y-6 max-w-5xl ">
          <div>
            <label className="block text-white text-sm font-medium mb-4">
              Area Name
            </label>

            <div className="space-y-4">
              {areaNames.map((name, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    placeholder="Write here"
                    className=" bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500 focus:ring-gray-500 h-12 px-4 rounded-md"
                  />
                  {/* Close button for removing input field */}
                  {areaNames.length > 1 && (
                    <Button
                      onClick={() => handleCloseInput(index)}
                      className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Add input button */}
            <div className="flex justify-start mt-4">
              <Button
                onClick={handleAddInput}
                className="bg-green-600 hover:bg-green-700 text-white w-full rounded-full flex justify-center items-center"
              >
                <Plus className="w-6 h-6" />
                <span>add more area</span>
              </Button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-8">
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white px-12 py-3 rounded-full text-base font-medium"
            >
              Save Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
