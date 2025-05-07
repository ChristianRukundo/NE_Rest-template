"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { motion } from "framer-motion";
import { Upload, X, ImageIcon } from "lucide-react";
import {
  createItem,
  getItemById,
  updateItem,
  uploadImage,
} from "../../api/items";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Loader } from "../ui/loader";

// Validation schema
const itemSchema = z.object({
  item_name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  SKU: z.string().min(1, "SKU is required"),
  unit_price: z
    .string()
    .refine(
      (val) => !isNaN(Number.parseFloat(val)) && Number.parseFloat(val) >= 0,
      {
        message: "Unit price must be a positive number",
      }
    ),
  sale_price: z
    .string()
    .refine(
      (val) => !isNaN(Number.parseFloat(val)) && Number.parseFloat(val) >= 0,
      {
        message: "Sale price must be a positive number",
      }
    ),
  current_stock: z
    .string()
    .refine(
      (val) => !isNaN(Number.parseInt(val)) && Number.parseInt(val) >= 0,
      {
        message: "Current stock must be a non-negative integer",
      }
    ),
  reorder_point: z
    .string()
    .refine(
      (val) =>
        val === "" ||
        (!isNaN(Number.parseInt(val)) && Number.parseInt(val) >= 0),
      {
        message: "Reorder point must be a non-negative integer",
      }
    )
    .optional(),
  image_url: z.string().optional(),
});

export const ItemForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState({
    item_name: "",
    description: "",
    SKU: "",
    unit_price: "",
    sale_price: "",
    current_stock: "0",
    reorder_point: "",
    image_url: "",
  });
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Fetch item data if in edit mode
  const { data: itemData, isLoading: isLoadingItem } = useQuery(
    ["item", id],
    () => getItemById(id),
    {
      enabled: isEditMode,
      onSuccess: (data) => {
        setFormData({
          item_name: data.item_name,
          description: data.description || "",
          SKU: data.SKU,
          unit_price: data.unit_price.toString(),
          sale_price: data.sale_price.toString(),
          current_stock: data.current_stock.toString(),
          reorder_point: data.reorder_point
            ? data.reorder_point.toString()
            : "",
          image_url: data.image_url || "",
        });
        if (data.image_url) {
          setImagePreview(data.image_url);
        }
      },
    }
  );

  // Create item mutation
  const createItemMutation = useMutation(createItem, {
    onSuccess: () => {
      toast.success("Item created successfully");
      queryClient.invalidateQueries("items");
      navigate("/items");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create item");
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation((data) => updateItem(id, data), {
    onSuccess: () => {
      toast.success("Item updated successfully");
      queryClient.invalidateQueries(["items"]);
      queryClient.invalidateQueries(["item", id]);
      navigate("/items");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update item");
    },
  });

  // Upload image mutation
  const uploadImageMutation = useMutation(uploadImage, {
    onSuccess: (data) => {
      setFormData((prev) => ({
        ...prev,
        image_url: data.data.image_url,
      }));
      setImagePreview(data.data.image_url);
      setIsUploading(false);
      toast.success("Image uploaded successfully");
    },
    onError: (error) => {
      setIsUploading(false);
      toast.error(error.response?.data?.message || "Failed to upload image");
    },
  });

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    validateAndSetImage(file);
  };

  // Validate and set image
  const validateAndSetImage = (file) => {
    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF)");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetImage(e.dataTransfer.files[0]);
    }
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!imageFile) return;

    setIsUploading(true);
    uploadImageMutation.mutate(imageFile);
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData((prev) => ({
      ...prev,
      image_url: "",
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate form data
      itemSchema.parse(formData);
      setErrors({});

      // If there's an image file but it hasn't been uploaded yet
      if (imageFile && !formData.image_url) {
        await handleImageUpload();
        return; // Will submit after image upload completes
      }

      // Submit form
      if (isEditMode) {
        updateItemMutation.mutate(formData);
      } else {
        createItemMutation.mutate(formData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);

        // Scroll to first error
        const firstErrorField = document.querySelector(
          `[name="${error.errors[0].path[0]}"]`
        );
        if (firstErrorField) {
          firstErrorField.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          firstErrorField.focus();
        }
      }
    }
  };

  // Effect to submit form after image upload
  useEffect(() => {
    if (isUploading === false && imageFile && formData.image_url) {
      // Submit form after successful image upload
      if (isEditMode) {
        updateItemMutation.mutate(formData);
      } else {
        createItemMutation.mutate(formData);
      }
    }
  }, [formData.image_url, isUploading, imageFile]);

  if (isLoadingItem) {
    return <Loader />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Item" : "Add New Item"}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item_name">Item Name *</Label>
                <Input
                  id="item_name"
                  name="item_name"
                  value={formData.item_name}
                  onChange={handleChange}
                  className={errors.item_name ? "border-red-500" : ""}
                />
                {errors.item_name && (
                  <p className="text-sm text-red-500">{errors.item_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="SKU">SKU *</Label>
                <Input
                  id="SKU"
                  name="SKU"
                  value={formData.SKU}
                  onChange={handleChange}
                  className={errors.SKU ? "border-red-500" : ""}
                />
                {errors.SKU && (
                  <p className="text-sm text-red-500">{errors.SKU}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price *</Label>
                <Input
                  id="unit_price"
                  name="unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={handleChange}
                  className={errors.unit_price ? "border-red-500" : ""}
                />
                {errors.unit_price && (
                  <p className="text-sm text-red-500">{errors.unit_price}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sale_price">Sale Price *</Label>
                <Input
                  id="sale_price"
                  name="sale_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sale_price}
                  onChange={handleChange}
                  className={errors.sale_price ? "border-red-500" : ""}
                />
                {errors.sale_price && (
                  <p className="text-sm text-red-500">{errors.sale_price}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_stock">Current Stock *</Label>
                <Input
                  id="current_stock"
                  name="current_stock"
                  type="number"
                  min="0"
                  value={formData.current_stock}
                  onChange={handleChange}
                  className={errors.current_stock ? "border-red-500" : ""}
                />
                {errors.current_stock && (
                  <p className="text-sm text-red-500">{errors.current_stock}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_point">Reorder Point</Label>
              <Input
                id="reorder_point"
                name="reorder_point"
                type="number"
                min="0"
                value={formData.reorder_point}
                onChange={handleChange}
                className={errors.reorder_point ? "border-red-500" : ""}
              />
              {errors.reorder_point && (
                <p className="text-sm text-red-500">{errors.reorder_point}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Item Image</Label>
              <div className="border rounded-md p-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Item preview"
                      className="w-full max-h-64 object-contain rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-md transition-colors ${
                      isDragOver
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <ImageIcon size={48} className="text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 mb-4">
                      Drag and drop an image here, or click to select
                    </p>
                    <input
                      type="file"
                      id="image"
                      accept="image/jpeg,image/png,image/gif,image/jpg"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("image").click()}
                    >
                      <Upload size={16} className="mr-2" />
                      Select Image
                    </Button>
                  </div>
                )}

                {imageFile && !formData.image_url && (
                  <div className="mt-4">
                    <Button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={isUploading}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isUploading ? (
                        <div className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Uploading...
                        </div>
                      ) : (
                        <>
                          <Upload size={16} className="mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/items")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createItemMutation.isLoading ||
                updateItemMutation.isLoading ||
                isUploading
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createItemMutation.isLoading || updateItemMutation.isLoading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {isEditMode ? "Updating..." : "Creating..."}
                </div>
              ) : (
                <>{isEditMode ? "Update Item" : "Create Item"}</>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};
