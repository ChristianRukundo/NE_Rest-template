"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
  ImageIcon,
  Package,
} from "lucide-react";
import { getAllItems, deleteItem } from "../api/items";
import { useAuth } from "../context/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Loader } from "../components/ui/loader";
import { Pagination } from "../components/ui/pagination";
import { EmptyState } from "../components/ui/empty-state";

export const ItemsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("item_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Check permissions
  const canCreateItem = user?.permissions?.includes("create_item");
  const canUpdateItem = user?.permissions?.includes("update_item");
  const canDeleteItem = user?.permissions?.includes("delete_item");

  // Fetch items with pagination
  const { data, isLoading, isError, refetch } = useQuery(
    ["items", searchQuery, sortBy, sortOrder, currentPage, pageSize],
    () =>
      getAllItems({
        search: searchQuery,
        sortBy,
        order: sortOrder,
        page: currentPage,
        limit: pageSize,
      }),
    {
      keepPreviousData: true,
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to load items");
      },
    }
  );

  const items = data?.data || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteItem(selectedItem.id);
      toast.success("Item deleted successfully");
      refetch();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete item");
    }
  };

  // Open delete dialog
  const openDeleteDialog = (item) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Error loading items. Please try again.</p>
        <Button onClick={refetch} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <CardTitle>Inventory Items</CardTitle>
          {canCreateItem && (
            <Button className= "bg-blue-600 hover:bg-blue-700 " onClick={() => navigate("/items/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon={<Package className="h-12 w-12" />}
              title="No items found"
              description="There are no items matching your search criteria."
              action={
                canCreateItem && (
                  <Button className="bg-blue-600 hover:bg-blue-700 " onClick={() => navigate("/items/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                )
              }
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Image</TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("item_name")}
                      >
                        <div className="flex items-center">
                          Name
                          {sortBy === "item_name" && (
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 ${
                                sortOrder === "desc" ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("SKU")}
                      >
                        <div className="flex items-center">
                          SKU
                          {sortBy === "SKU" && (
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 ${
                                sortOrder === "desc" ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("unit_price")}
                      >
                        <div className="flex items-center">
                          Unit Price
                          {sortBy === "unit_price" && (
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 ${
                                sortOrder === "desc" ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("sale_price")}
                      >
                        <div className="flex items-center">
                          Sale Price
                          {sortBy === "sale_price" && (
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 ${
                                sortOrder === "desc" ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("current_stock")}
                      >
                        <div className="flex items-center">
                          Stock
                          {sortBy === "current_stock" && (
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 ${
                                sortOrder === "desc" ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.image_url ? (
                            <img
                              src={item.image_url || "/placeholder.svg"}
                              alt={item.item_name}
                              className="w-12 h-12 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                              <ImageIcon size={20} className="text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.item_name}
                        </TableCell>
                        <TableCell>{item.SKU}</TableCell>
                        <TableCell>
                          ${Number.parseFloat(item.unit_price).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          ${Number.parseFloat(item.sale_price).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              item.current_stock <= 0
                                ? "bg-red-100 text-red-800"
                                : item.current_stock <=
                                  (item.reorder_point || 5)
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {item.current_stock}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => navigate(`/items/${item.id}`)}
                              >
                                View Details
                              </DropdownMenuItem>
                              {canUpdateItem && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(`/items/${item.id}/edit`)
                                  }
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canDeleteItem && (
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(item)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedItem && (
              <p>
                You are about to delete{" "}
                <strong>{selectedItem.item_name}</strong> (SKU:{" "}
                {selectedItem.SKU})
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
