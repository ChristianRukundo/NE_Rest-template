"use client";

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  FileText,
  Clock,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
  Check,
} from "lucide-react";
import {
  getTransactionById,
  verifyBlockchainTransaction,
} from "../api/transactions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Loader } from "../components/ui/loader";
import { useAuth } from "../context/auth-context";

export const TransactionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);

  // Fetch transaction details
  const {
    data: transaction,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(["transaction", id], () => getTransactionById(id), {
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to fetch transaction details"
      );
    },
  });

  // Fetch blockchain verification
  const {
    data: verificationData,
    isLoading: isLoadingVerification,
    refetch: refetchVerification,
  } = useQuery(
    ["transaction-verification", id],
    () => verifyBlockchainTransaction(id),
    {
      enabled: !!transaction?.blockchain_tx_hash,
      onError: (error) => {
        toast.error(
          error.response?.data?.message ||
            "Failed to verify blockchain transaction"
        );
      },
    }
  );

  // Handle blockchain verification
  const handleVerify = async () => {
    if (!transaction?.blockchain_tx_hash) {
      toast.error("No blockchain hash available for this transaction");
      return;
    }

    setIsVerifying(true);
    try {
      await refetchVerification();
      toast.success("Transaction verified successfully");
    } catch (error) {
      toast.error("Failed to verify transaction");
    } finally {
      setIsVerifying(false);
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-primary" />
        <span className="ml-2 text-lg">Loading transaction details...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Error Loading Transaction
        </h2>
        <p className="text-gray-600 mb-4">
          {error?.response?.data?.message ||
            "Failed to load transaction details"}
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Transaction Not Found
        </h2>
        <p className="text-gray-600 mb-4">
          The transaction you're looking for doesn't exist or has been removed.
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  // Check if this is the user's own transaction
  const isOwnTransaction = user?.id === transaction.recorded_by?.id;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto py-6"
    >
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main transaction details */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-secondary-50 border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold text-primary-700">
                  Transaction Details
                </CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  Transaction ID: {transaction.id}
                </CardDescription>
              </div>
              <div>{getTransactionTypeBadge(transaction.transaction_type)}</div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Item Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center text-gray-900">
                  <Package className="mr-2 h-5 w-5 text-primary-500" />
                  Item Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Item Name</p>
                    <p className="font-medium">{transaction.item.item_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">SKU</p>
                    <p className="font-medium">{transaction.item.SKU}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="font-medium">{transaction.quantity}</p>
                  </div>
                  {transaction.transaction_type === "sale" && (
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium">
                        $
                        {Number.parseFloat(transaction.item.sale_price).toFixed(
                          2
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center text-gray-900">
                  <Clock className="mr-2 h-5 w-5 text-primary-500" />
                  Transaction Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Transaction Date</p>
                    <p className="font-medium">
                      {formatDate(transaction.transaction_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Recorded By</p>
                    <p className="font-medium">
                      {transaction.recorded_by.first_name}{" "}
                      {transaction.recorded_by.last_name}
                      {isOwnTransaction && (
                        <span className="ml-2 text-xs text-primary-600">
                          (You)
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">User Role</p>
                    <p className="font-medium">
                      {transaction.recorded_by.role.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {transaction.notes && (
              <div className="mt-6">
                <Separator className="my-4" />
                <h3 className="text-lg font-medium flex items-center text-gray-900 mb-3">
                  <FileText className="mr-2 h-5 w-5 text-primary-500" />
                  Notes
                </h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-700">{transaction.notes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blockchain Verification */}
        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-accent-50 to-accent-100 border-b">
            <CardTitle className="text-xl font-bold text-accent-700 flex items-center">
              <ShieldCheck className="mr-2 h-5 w-5" />
              Blockchain Verification
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Verify the authenticity of this transaction
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {transaction.blockchain_tx_hash ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Blockchain Hash</p>
                  <div className="bg-gray-50 p-2 rounded-md overflow-x-auto">
                    <code className="text-xs break-all">
                      {transaction.blockchain_tx_hash}
                    </code>
                  </div>
                </div>

                {isLoadingVerification || isVerifying ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader className="w-6 h-6 text-primary mr-2" />
                    <span>Verifying transaction...</span>
                  </div>
                ) : verificationData ? (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div
                        className={`p-2 rounded-full ${
                          verificationData.data.is_valid
                            ? "bg-green-100"
                            : "bg-red-100"
                        }`}
                      >
                        {verificationData.data.is_valid ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">
                          {verificationData.data.is_valid
                            ? "Transaction Verified"
                            : "Verification Failed"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {verificationData.data.is_valid
                            ? "This transaction has been verified on the blockchain."
                            : "This transaction could not be verified."}
                        </p>
                      </div>
                    </div>

                    {verificationData.data.block_explorer_url && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Block Explorer
                        </p>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            window.open(
                              verificationData.data.block_explorer_url,
                              "_blank"
                            )
                          }
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View on Block Explorer
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">
                      Click the button below to verify this transaction on the
                      blockchain.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                <p className="text-gray-700 mb-2">
                  No blockchain record available
                </p>
                <p className="text-sm text-gray-500">
                  This transaction has not been recorded on the blockchain yet.
                </p>
              </div>
            )}
          </CardContent>
          {transaction.blockchain_tx_hash && (
            <CardFooter className="bg-gray-50 px-6 py-4 border-t">
              <Button
                className="w-full"
                onClick={handleVerify}
                disabled={isLoadingVerification || isVerifying}
              >
                {isLoadingVerification || isVerifying ? (
                  <>
                    <Loader className="mr-2 h-4 w-4" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Verify Transaction
                  </>
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </motion.div>
  );
};
