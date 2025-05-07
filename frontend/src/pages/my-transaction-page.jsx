"use client";

import { useState } from "react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Search,
  Filter,
  Calendar,
  ArrowUpDown,
  ExternalLink,
  ShoppingBag,
  Clock,
  RefreshCw,
} from "lucide-react";
import { getUserTransactions } from "../api/transactions";
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
  CardDescription,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Loader } from "../components/ui/loader";
import { Pagination } from "../components/ui/pagination";
import { EmptyState } from "../components/ui/empty-state";

export const MyTransactionsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("transaction_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch user's transactions
  const { data, isLoading, isError, refetch } = useQuery(
    [
      "user-transactions",
      searchQuery,
      transactionType,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      currentPage,
      pageSize,
    ],
    () =>
      getUserTransactions({
        search: searchQuery,
        type: transactionType,
        startDate,
        endDate,
        sortBy,
        order: sortOrder,
        page: currentPage,
        limit: pageSize,
      }),
    {
      keepPreviousData: true,
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to fetch transactions"
        );
      },
    }
  );

  const transactions = data?.data || [];
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

  // Get transaction type badge
  const getTransactionTypeBadge = (type) => {
    switch (type) {
      case "sale":
        return <Badge className="bg-blue-100 text-blue-800">Purchase</Badge>;
      case "initial_stock":
        return (
          <Badge className="bg-green-100 text-green-800">Initial Stock</Badge>
        );
      case "adjustment_increase":
        return (
          <Badge className="bg-purple-100 text-purple-800">
            Stock Increase
          </Badge>
        );
      case "adjustment_decrease":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            Stock Decrease
          </Badge>
        );
      default:
        return <Badge>{type}</Badge>;
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-primary" />
        <span className="ml-2 text-lg">Loading your transactions...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto py-6"
    >
      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary-50 to-secondary-50 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-primary-700">
                My Purchases
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                View and track all your purchase transactions
              </CardDescription>
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="mt-4 md:mt-0 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full md:w-64">
                <Select
                  value={transactionType}
                  onValueChange={setTransactionType}
                >
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      <span>{transactionType || "All Transaction Types"}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="sale">Purchases</SelectItem>
                    <SelectItem value="initial_stock">Initial Stock</SelectItem>
                    <SelectItem value="adjustment_increase">
                      Stock Increase
                    </SelectItem>
                    <SelectItem value="adjustment_decrease">
                      Stock Decrease
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <Label htmlFor="startDate">Start Date</Label>
                </div>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="w-full md:w-1/2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <Label htmlFor="endDate">End Date</Label>
                </div>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {isError ? (
            <div className="text-center py-10">
              <p className="text-red-500">
                Error loading transactions. Please try again.
              </p>
              <Button onClick={() => refetch()} className="mt-4">
                Retry
              </Button>
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="h-12 w-12 text-gray-400" />}
              title="No transactions found"
              description="You haven't made any purchases yet. Visit the shop to buy items."
              action={
                <Button onClick={() => navigate("/shop")}>Go to Shop</Button>
              }
            />
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("transaction_date")}
                      >
                        <div className="flex items-center">
                          Date
                          {sortBy === "transaction_date" && (
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 ${
                                sortOrder === "desc" ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("item_id")}
                      >
                        <div className="flex items-center">
                          Item
                          {sortBy === "item_id" && (
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
                        onClick={() => handleSort("quantity")}
                      >
                        <div className="flex items-center">
                          Quantity
                          {sortBy === "quantity" && (
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 ${
                                sortOrder === "desc" ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className="hover:bg-gray-50"
                      >
                        <TableCell>
                          <div className="font-medium">
                            {formatDate(transaction.transaction_date)}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(
                              transaction.transaction_date
                            ).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTransactionTypeBadge(
                            transaction.transaction_type
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {transaction.item.item_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            SKU: {transaction.item.SKU}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {transaction.quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          {transaction.blockchain_tx_hash ? (
                            <Badge className="bg-green-100 text-green-800">
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline">Processing</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/transactions/${transaction.id}`)
                            }
                            className="flex items-center"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Details
                          </Button>
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
    </motion.div>
  );
};
