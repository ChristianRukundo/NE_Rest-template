"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Search, ArrowUpDown, ShoppingBag, Package } from "lucide-react";
import { getAllItems } from "../api/items";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../components/ui/select";
import { Loader } from "../components/ui/loader";
import { Pagination } from "../components/ui/pagination";
import { EmptyState } from "../components/ui/empty-state";

export const ShopPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("item_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12); // Show more items per page in shop view

  // Fetch items with pagination
  const { data, isLoading, isError, refetch } = useQuery(
    ["shop-items", searchQuery, sortBy, sortOrder, currentPage, pageSize],
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
        toast.error(error.response?.data?.message || "Failed to load products");
      },
    }
  );

  const items = data?.data || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  };

  // Filter out items with no stock
  const availableItems = items.filter((item) => item.current_stock > 0);

  // Item card animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
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
        <p className="text-red-500">
          Error loading products. Please try again.
        </p>
        <Button onClick={refetch} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Shop Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-64">
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [field, order] = value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                }}
              >
                <SelectTrigger>
                  <div className="flex items-center">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <span>Sort by</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="item_name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="item_name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="sale_price-asc">
                    Price (Low to High)
                  </SelectItem>
                  <SelectItem value="sale_price-desc">
                    Price (High to Low)
                  </SelectItem>
                  <SelectItem value="current_stock-desc">
                    Stock (High to Low)
                  </SelectItem>
                  <SelectItem value="created_at-desc">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {availableItems.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="No products available"
          description="There are no products matching your search criteria or all products are out of stock."
        />
      ) : (
        <>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {availableItems.map((item) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="cursor-pointer"
                onClick={() => navigate(`/shop/${item.id}`)}
              >
                <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-gray-100">
                    {item.image_url ? (
                      <img
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.item_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={48} className="text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.current_stock <= (item.reorder_point || 5)
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {item.current_stock <= (item.reorder_point || 5)
                          ? "Low Stock"
                          : "In Stock"}
                      </span>
                    </div>
                  </div>
                  <CardContent className="flex-1 flex flex-col p-4">
                    <h3 className="font-medium text-lg mb-1 line-clamp-1">
                      {item.item_name}
                    </h3>
                    <p className="text-gray-500 text-sm mb-2 line-clamp-2">
                      {item.description || "No description available"}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="font-bold text-lg">
                        ${Number.parseFloat(item.sale_price).toFixed(2)}
                      </span>
                      <Button variant="outline" size="sm" className="ml-auto">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
