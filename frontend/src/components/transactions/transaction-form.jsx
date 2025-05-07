"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { createTransaction } from "../../api/transactions";
import { getAllItems } from "../../api/items";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Loader } from "../ui/loader";
import { useAuth } from "../../context/auth-context";

// Validation schema
const transactionSchema = z.object({
  item_id: z.string().min(1, "Item is required"),
  transaction_type: z.enum(
    ["initial_stock", "adjustment_increase", "adjustment_decrease"],
    {
      errorMap: () => ({ message: "Transaction type is required" }),
    }
  ),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((val) => !isNaN(Number.parseInt(val)) && Number.parseInt(val) > 0, {
      message: "Quantity must be a positive number",
    }),
  notes: z.string().optional(),
  transaction_date: z.string().optional(),
});

export const TransactionForm = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    item_id: "",
    transaction_type: "",
    quantity: "",
    notes: "",
    transaction_date: new Date().toISOString().split("T")[0], // Default to today
  });
  const { user } = useAuth();
  
  const [errors, setErrors] = useState({});

  // Fetch items for dropdown
  const { data: items = [], isLoading: isLoadingItems } = useQuery(
    "items-for-transaction",
    () => getAllItems(),
    {
      select: (response) =>
        response.data.sort((a, b) => a.item_name.localeCompare(b.item_name)),
    }
  );

  // Create transaction mutation
  const createTransactionMutation = useMutation(createTransaction, {
    onSuccess: () => {
      toast.success("Transaction recorded successfully");
      queryClient.invalidateQueries("transactions");
      queryClient.invalidateQueries("items");
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to record transaction"
      );
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

  // Handle select change
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      item_id: "",
      transaction_type: "",
      quantity: "",
      notes: "",
      transaction_date: new Date().toISOString().split("T")[0],
    });
    setErrors({});
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    try {
      // Validate form data
      transactionSchema.parse(formData);
      setErrors({});

      // Submit form
      createTransactionMutation.mutate({
        user_id: Number.parseInt(user.id),
        item_id: Number.parseInt(formData.item_id),
        transaction_type: formData.transaction_type,
        quantity: Number.parseInt(formData.quantity),
        notes: formData.notes || undefined,
        transaction_date: formData.transaction_date || undefined,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Transaction</DialogTitle>
          <DialogDescription>
            Record a new inventory transaction (initial stock or adjustment).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item_id">Item *</Label>
              {isLoadingItems ? (
                <div className="flex items-center space-x-2">
                  <Loader size="sm" />
                  <span className="text-sm text-gray-500">
                    Loading items...
                  </span>
                </div>
              ) : (
                <Select
                  value={formData.item_id}
                  onValueChange={(value) =>
                    handleSelectChange("item_id", value)
                  }
                >
                  <SelectTrigger
                    id="item_id"
                    className={errors.item_id ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.item_name} (SKU: {item.SKU}) - Stock:{" "}
                        {item.current_stock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.item_id && (
                <p className="text-sm text-red-500">{errors.item_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction_type">Transaction Type *</Label>
              <Select
                value={formData.transaction_type}
                onValueChange={(value) =>
                  handleSelectChange("transaction_type", value)
                }
              >
                <SelectTrigger
                  id="transaction_type"
                  className={errors.transaction_type ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="initial_stock">Initial Stock</SelectItem>
                  <SelectItem value="adjustment_increase">
                    Adjustment (Increase)
                  </SelectItem>
                  <SelectItem value="adjustment_decrease">
                    Adjustment (Decrease)
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.transaction_type && (
                <p className="text-sm text-red-500">
                  {errors.transaction_type}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500">{errors.quantity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction_date">Transaction Date</Label>
              <Input
                id="transaction_date"
                name="transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={handleChange}
                className={errors.transaction_date ? "border-red-500" : ""}
              />
              {errors.transaction_date && (
                <p className="text-sm text-red-500">
                  {errors.transaction_date}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Optional notes about this transaction"
                className={errors.notes ? "border-red-500" : ""}
              />
              {errors.notes && (
                <p className="text-sm text-red-500">{errors.notes}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className=" bg-blue-600 hover:bg-blue-700"
              disabled={createTransactionMutation.isLoading}
            >
              {createTransactionMutation.isLoading
                ? "Recording..."
                : "Record Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
