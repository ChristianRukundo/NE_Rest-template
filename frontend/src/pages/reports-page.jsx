import React, { useState } from "react";
import { useQuery } from "react-query";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  FileSpreadsheet,
  ImageIcon,
  Calendar,
} from "lucide-react";
import {
  getInventorySummary,
  getTransactionsReport,
  downloadInventorySummaryDocument,
  downloadInventorySummaryCSV,
} from "../api/reports";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Loader } from "../components/ui/loader";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Pagination } from "../components/ui/pagination";

export const ReportsPage = () => {
  // Inventory Summary state
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventorySortBy, setInventorySortBy] = useState("item_name");
  const [inventorySortOrder, setInventorySortOrder] = useState("asc");
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryLimit, setInventoryLimit] = useState(10);

  // Transactions state
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [transactionSortBy, setTransactionSortBy] =
    useState("transaction_date");
  const [transactionSortOrder, setTransactionSortOrder] = useState("desc");
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionLimit, setTransactionLimit] = useState(10);

  // Fetch inventory summary with pagination
  const {
    data: inventoryData,
    isLoading: isLoadingInventory,
    isError: isInventoryError,
    refetch: refetchInventory,
  } = useQuery(
    [
      "inventory-summary",
      inventorySearch,
      inventorySortBy,
      inventorySortOrder,
      inventoryPage,
      inventoryLimit,
    ],
    () =>
      getInventorySummary({
        search: inventorySearch,
        sortBy: inventorySortBy,
        order: inventorySortOrder,
        page: inventoryPage,
        limit: inventoryLimit,
      }),
    {
      keepPreviousData: true,
    }
  );

  // Get inventory data and pagination info
  const inventorySummary = inventoryData?.data || [];
  const inventoryPagination = inventoryData?.pagination || {
    total: 0,
    page: 1,
    totalPages: 1,
  };
  const inventoryTotals = inventoryData?.totals || {
    totalItems: 0,
    totalStock: 0,
    totalValue: 0,
    totalSaleValue: 0,
    totalPotentialProfit: 0,
  };

  // Fetch transactions report with pagination
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    isError: isTransactionsError,
    refetch: refetchTransactions,
  } = useQuery(
    [
      "transactions-report",
      transactionSearch,
      transactionType,
      startDate,
      endDate,
      transactionSortBy,
      transactionSortOrder,
      transactionPage,
      transactionLimit,
    ],
    () =>
      getTransactionsReport({
        search: transactionSearch,
        type: transactionType,
        startDate,
        endDate,
        sortBy: transactionSortBy,
        order: transactionSortOrder,
        page: transactionPage,
        limit: transactionLimit,
      }),
    {
      keepPreviousData: true,
    }
  );

  // Get transactions data and pagination info
  const transactionsReport = transactionsData?.data || [];
  const transactionPagination = transactionsData?.pagination || {
    total: 0,
    page: 1,
    totalPages: 1,
  };
  const transactionTotals = transactionsData?.totals || {
    totalTransactions: 0,
    totalQuantity: 0,
    totalValue: 0,
  };

  // Handle inventory sort
  const handleInventorySort = (column) => {
    if (inventorySortBy === column) {
      setInventorySortOrder(inventorySortOrder === "asc" ? "desc" : "asc");
    } else {
      setInventorySortBy(column);
      setInventorySortOrder("asc");
    }
    setInventoryPage(1); // Reset to first page when sorting changes
  };

  // Handle transaction sort
  const handleTransactionSort = (column) => {
    if (transactionSortBy === column) {
      setTransactionSortOrder(transactionSortOrder === "asc" ? "desc" : "asc");
    } else {
      setTransactionSortBy(column);
      setTransactionSortOrder("asc");
    }
    setTransactionPage(1); // Reset to first page when sorting changes
  };

  // Handle inventory pagination change
  const handleInventoryPageChange = (newPage) => {
    setInventoryPage(newPage);
  };

  // Handle transaction pagination change
  const handleTransactionPageChange = (newPage) => {
    setTransactionPage(newPage);
  };

  // Handle inventory limit change
  const handleInventoryLimitChange = (value) => {
    setInventoryLimit(Number(value));
    setInventoryPage(1); // Reset to first page when limit changes
  };

  // Handle transaction limit change
  const handleTransactionLimitChange = (value) => {
    setTransactionLimit(Number(value));
    setTransactionPage(1); // Reset to first page when limit changes
  };

  // Get transaction type badge
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

  // Handle document download
  const handleDocumentDownload = () => {
    try {
      downloadInventorySummaryDocument();
      toast.success("Generating document...");
    } catch (error) {
      toast.error("Failed to generate document");
    }
  };

  // Handle CSV download
  const handleCSVDownload = () => {
    try {
      downloadInventorySummaryCSV();
      toast.success("Generating CSV...");
    } catch (error) {
      toast.error("Failed to generate CSV");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inventory">
            <TabsList className="mb-4">
              <TabsTrigger value="inventory">Inventory Summary</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>

            {/* Inventory Summary Tab */}
            <TabsContent value="inventory">
              <div className="mb-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <Input
                      placeholder="Search inventory..."
                      value={inventorySearch}
                      onChange={(e) => {
                        setInventorySearch(e.target.value);
                        setInventoryPage(1); // Reset to first page on search
                      }}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-28">
                      <Select
                        value={String(inventoryLimit)}
                        onValueChange={handleInventoryLimitChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="10 per page" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 per page</SelectItem>
                          <SelectItem value="10">10 per page</SelectItem>
                          <SelectItem value="25">25 per page</SelectItem>
                          <SelectItem value="50">50 per page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" onClick={handleDocumentDownload}>
                      <FileText className="mr-2 h-4 w-4" />
                      HTML
                    </Button>
                    <Button variant="outline" onClick={handleCSVDownload}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                  </div>
                </div>
              </div>

              {isLoadingInventory ? (
                <Loader />
              ) : isInventoryError ? (
                <div className="text-center py-10">
                  <p className="text-red-500">
                    Error loading inventory summary. Please try again.
                  </p>
                  <Button onClick={refetchInventory} className="mt-4">
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Image</TableHead>
                          <TableHead
                            className="cursor-pointer"
                            onClick={() => handleInventorySort("item_name")}
                          >
                            <div className="flex items-center">
                              Item Name
                              {inventorySortBy === "item_name" && (
                                <ArrowUpDown
                                  className={`ml-2 h-4 w-4 ${
                                    inventorySortOrder === "desc"
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              )}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer"
                            onClick={() => handleInventorySort("SKU")}
                          >
                            <div className="flex items-center">
                              SKU
                              {inventorySortBy === "SKU" && (
                                <ArrowUpDown
                                  className={`ml-2 h-4 w-4 ${
                                    inventorySortOrder === "desc"
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              )}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer"
                            onClick={() => handleInventorySort("current_stock")}
                          >
                            <div className="flex items-center">
                              Stock
                              {inventorySortBy === "current_stock" && (
                                <ArrowUpDown
                                  className={`ml-2 h-4 w-4 ${
                                    inventorySortOrder === "desc"
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              )}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer"
                            onClick={() => handleInventorySort("unit_price")}
                          >
                            <div className="flex items-center">
                              Unit Price
                              {inventorySortBy === "unit_price" && (
                                <ArrowUpDown
                                  className={`ml-2 h-4 w-4 ${
                                    inventorySortOrder === "desc"
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              )}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer"
                            onClick={() => handleInventorySort("sale_price")}
                          >
                            <div className="flex items-center">
                              Sale Price
                              {inventorySortBy === "sale_price" && (
                                <ArrowUpDown
                                  className={`ml-2 h-4 w-4 ${
                                    inventorySortOrder === "desc"
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              )}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer"
                            onClick={() => handleInventorySort("total_value")}
                          >
                            <div className="flex items-center">
                              Total Value
                              {inventorySortBy === "total_value" && (
                                <ArrowUpDown
                                  className={`ml-2 h-4 w-4 ${
                                    inventorySortOrder === "desc"
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              )}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer"
                            onClick={() =>
                              handleInventorySort("total_sale_value")
                            }
                          >
                            <div className="flex items-center">
                              Total Sale Value
                              {inventorySortBy === "total_sale_value" && (
                                <ArrowUpDown
                                  className={`ml-2 h-4 w-4 ${
                                    inventorySortOrder === "desc"
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              )}
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventorySummary.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4">
                              No inventory items found
                            </TableCell>
                          </TableRow>
                        ) : (
                          inventorySummary.map((item) => (
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
                                    <ImageIcon
                                      size={20}
                                      className="text-gray-400"
                                    />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {item.item_name}
                              </TableCell>
                              <TableCell>{item.SKU}</TableCell>
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
                              <TableCell>
                                ${Number.parseFloat(item.unit_price).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                ${Number.parseFloat(item.sale_price).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                $
                                {Number.parseFloat(item.total_value).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                $
                                {Number.parseFloat(
                                  item.total_sale_value
                                ).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Inventory Pagination */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing{" "}
                      {inventorySummary.length > 0
                        ? (inventoryPage - 1) * inventoryLimit + 1
                        : 0}{" "}
                      to{" "}
                      {Math.min(
                        inventoryPage * inventoryLimit,
                        inventoryPagination.total
                      )}{" "}
                      of {inventoryPagination.total} items
                    </div>
                    <Pagination
                      currentPage={inventoryPage}
                      totalPages={inventoryPagination.totalPages}
                      onPageChange={handleInventoryPageChange}
                    />
                  </div>

                  {inventoryPagination.total > 0 && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-md">
                      <h3 className="font-medium mb-2">Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Total Items</p>
                          <p className="text-lg font-medium">
                            {inventoryTotals.totalItems}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Stock</p>
                          <p className="text-lg font-medium">
                            {inventoryTotals.totalStock} units
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Total Inventory Value
                          </p>
                          <p className="text-lg font-medium">
                            ${inventoryTotals.totalValue.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Total Sale Value
                          </p>
                          <p className="text-lg font-medium">
                            ${inventoryTotals.totalSaleValue.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Total Potential Profit
                          </p>
                          <p className="text-lg font-medium">
                            ${inventoryTotals.totalPotentialProfit.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <div className="mb-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <Input
                      placeholder="Search transactions..."
                      value={transactionSearch}
                      onChange={(e) => {
                        setTransactionSearch(e.target.value);
                        setTransactionPage(1); // Reset to first page on search
                      }}
                      className="pl-10"
                    />
                  </div>
                  <div className="w-full md:w-64">
                    <Select
                      value={transactionType}
                      onValueChange={(value) => {
                        // If the selected value is "all", set state to empty string, otherwise use the value
                        setTransactionType(value === "all" ? "" : value);
                        setTransactionPage(1); // Reset to first page when filter changes
                      }}
                    >
                      <SelectTrigger>
                        <div className="flex items-center">
                          <Filter className="mr-2 h-4 w-4" />
                          <span>
                            {transactionType || "All Transaction Types"}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="sale">Sale</SelectItem>
                        <SelectItem value="initial_stock">
                          Initial Stock
                        </SelectItem>
                        <SelectItem value="adjustment_increase">
                          Adjustment (Increase)
                        </SelectItem>
                        <SelectItem value="adjustment_decrease">
                          Adjustment (Decrease)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-28">
                    <Select
                      value={String(transactionLimit)}
                      onValueChange={handleTransactionLimitChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="10 per page" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 per page</SelectItem>
                        <SelectItem value="10">10 per page</SelectItem>
                        <SelectItem value="25">25 per page</SelectItem>
                        <SelectItem value="50">50 per page</SelectItem>
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
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setTransactionPage(1); // Reset to first page when date changes
                      }}
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
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setTransactionPage(1); // Reset to first page when date changes
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {isLoadingTransactions ? (
                <Loader />
              ) : isTransactionsError ? (
                <div className="text-center py-10">
                  <p className="text-red-500">
                    Error loading transactions report. Please try again.
                  </p>
                  <Button onClick={refetchTransactions} className="mt-4">
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead
                            className="cursor-pointer"
                            onClick={() =>
                              handleTransactionSort("transaction_date")
                            }
                          >
                            <div className="flex items-center">
                              Date
                              {transactionSortBy === "transaction_date" && (
                                <ArrowUpDown
                                  className={`ml-2 h-4 w-4 ${
                                    transactionSortOrder === "desc"
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              )}
                            </div>
                          </TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead
                            className="cursor-pointer"
                            onClick={() => handleTransactionSort("item_name")}
                          >
                            <div className="flex items-center">
                              Item
                              {transactionSortBy === "item_name" && (
                                <ArrowUpDown
                                  className={`ml-2 h-4 w-4 ${
                                    transactionSortOrder === "desc"
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              )}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer"
                            onClick={() => handleTransactionSort("quantity")}
                          >
                            <div className="flex items-center">
                              Quantity
                              {transactionSortBy === "quantity" && (
                                <ArrowUpDown
                                  className={`ml-2 h-4 w-4 ${
                                    transactionSortOrder === "desc"
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              )}
                            </div>
                          </TableHead>
                          <TableHead>Recorded By</TableHead>
                          <TableHead
                            className="cursor-pointer"
                            onClick={() => handleTransactionSort("total_value")}
                          >
                            <div className="flex items-center">
                              Value
                              {transactionSortBy === "total_value" && (
                                <ArrowUpDown
                                  className={`ml-2 h-4 w-4 ${
                                    transactionSortOrder === "desc"
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              )}
                            </div>
                          </TableHead>
                          <TableHead>Blockchain</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactionsReport.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">
                              No transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactionsReport.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                {new Date(
                                  transaction.transaction_date
                                ).toLocaleDateString()}
                                <div className="text-xs text-gray-500">
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
                                  {transaction.item_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  SKU: {transaction.SKU}
                                </div>
                              </TableCell>
                              <TableCell>{transaction.quantity}</TableCell>
                              <TableCell>
                                <div>{transaction.recorded_by}</div>
                                <div className="text-xs text-gray-500">
                                  {transaction.role}
                                </div>
                              </TableCell>
                              <TableCell>
                                ${transaction.total_value.toFixed(2)}
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
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Transaction Pagination */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing{" "}
                      {transactionsReport.length > 0
                        ? (transactionPage - 1) * transactionLimit + 1
                        : 0}{" "}
                      to{" "}
                      {Math.min(
                        transactionPage * transactionLimit,
                        transactionPagination.total
                      )}{" "}
                      of {transactionPagination.total} transactions
                    </div>
                    <Pagination
                      currentPage={transactionPage}
                      totalPages={transactionPagination.totalPages}
                      onPageChange={handleTransactionPageChange}
                    />
                  </div>

                  {transactionPagination.total > 0 && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-md">
                      <h3 className="font-medium mb-2">Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Total Transactions
                          </p>
                          <p className="text-lg font-medium">
                            {transactionTotals.totalTransactions}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Total Quantity
                          </p>
                          <p className="text-lg font-medium">
                            {transactionTotals.totalQuantity} units
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Value</p>
                          <p className="text-lg font-medium">
                            ${transactionTotals.totalValue.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};
