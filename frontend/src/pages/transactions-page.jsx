"use client";

import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  ExternalLink,
  FileText,
} from "lucide-react";
import { getAllTransactions } from "../api/transactions";
import { useAuth } from "../context/auth-context";
import { TransactionForm } from "../components/transactions/transaction-form";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../components/ui/select";
import { Loader } from "../components/ui/loader";
import { Badge } from "../components/ui/badge";
import { Pagination } from "../components/ui/pagination";
import { EmptyState } from "../components/ui/empty-state";

export const TransactionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("transaction_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Check permissions
  const canCreateTransaction =
    user?.permissions?.includes("create_transaction");

  // Fetch transactions with pagination
  const { data, isLoading, isError, refetch } = useQuery(
    [
      "transactions",
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
      getAllTransactions({
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

  // Get transaction type badge color
  const getTransactionTypeBadge = (type) => {
    switch (type) {
      case "sale":
        return <Badge className="bg-blue-100 text-blue-800">Sale</Badge>;
      case "initial_stock":
        return (
          <Badge className="bg-green-100 text-green-800">Initial Stock</Badge>
        );
      case "adjustment_increase":
        return (
          <Badge className="bg-purple-100 text-purple-800">
            Adjustment (Increase)
          </Badge>
        );
      case "adjustment_decrease":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            Adjustment (Decrease)
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

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">
          Error loading transactions. Please try again.
        </p>
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
          <CardTitle>Transactions</CardTitle>
          {canCreateTransaction && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 "
              onClick={() => setIsFormOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Record Transaction
            </Button>
          )}
        </CardHeader>
        <CardContent>
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
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="initial_stock">Initial Stock</SelectItem>
                    <SelectItem value="adjustment_increase">
                      Adjustment (Increase)
                    </SelectItem>
                    <SelectItem value="adjustment_decrease">
                      Adjustment (Decrease)
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

          {transactions.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No transactions found"
              description="There are no transactions matching your search criteria."
              action={
                canCreateTransaction && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 "
                    onClick={() => setIsFormOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Record Transaction
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
                      <TableHead>Recorded By</TableHead>
                      <TableHead>Blockchain</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <TableCell
                          onClick={() =>
                            navigate(`/transactions/${transaction.id}`)
                          }
                        >
                          {new Date(
                            transaction.transaction_date
                          ).toLocaleDateString()}
                          <div className="text-xs text-gray-500">
                            {new Date(
                              transaction.transaction_date
                            ).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell
                          onClick={() =>
                            navigate(`/transactions/${transaction.id}`)
                          }
                        >
                          {getTransactionTypeBadge(
                            transaction.transaction_type
                          )}
                        </TableCell>
                        <TableCell
                          onClick={() =>
                            navigate(`/transactions/${transaction.id}`)
                          }
                        >
                          <div className="font-medium">
                            {transaction.item.item_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            SKU: {transaction.item.SKU}
                          </div>
                        </TableCell>
                        <TableCell
                          onClick={() =>
                            navigate(`/transactions/${transaction.id}`)
                          }
                        >
                          {transaction.quantity}
                        </TableCell>
                        <TableCell
                          onClick={() =>
                            navigate(`/transactions/${transaction.id}`)
                          }
                        >
                          <div>{transaction.recorded_by.username}</div>
                          <div className="text-xs text-gray-500">
                            {transaction.recorded_by.role.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {transaction.blockchain_tx_hash ? (
                            <Badge className="bg-green-100 text-green-800">
                              Recorded
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Recorded</Badge>
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

      {/* Transaction Form Dialog */}
      <TransactionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={refetch}
      />
    </motion.div>
  );
};
