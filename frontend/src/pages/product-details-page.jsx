"use client";

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "react-query";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingBag,
  ShoppingCart,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { getItemById } from "../api/items";
import { buyItem } from "../api/shop";
import { useAuth } from "../context/auth-context";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Loader } from "../components/ui/loader";
import { Badge } from "../components/ui/badge";

export const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);

  const isAdmin = user?.role === "Admin";
  const canBuy =
    user?.permissions?.includes("create_sale_transaction") && !isAdmin;

  const {
    data: item,
    isLoading,
    isError,
    refetch,
  } = useQuery(["item", id], () => getItemById(id), {
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to load product details"
      );
    },
  });

  const buyMutation = useMutation((data) => buyItem(data), {
    onSuccess: () => {
      toast.success("Purchase successful!");
      refetch();
      navigate("/my-transactions");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to complete purchase"
      );
    },
  });

  const handleBuy = () => {
    if (!canBuy) {
      toast.error("You don't have permission to make purchases");
      return;
    }

    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    if (quantity > item.current_stock) {
      toast.error("Not enough stock available");
      return;
    }

    buyMutation.mutate({
      item_id: item.id,
      quantity: Number.parseInt(quantity),
    });
  };

  const handleQuantityChange = (e) => {
    const value = Number.parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (value > item?.current_stock) {
      setQuantity(item.current_stock);
    } else {
      setQuantity(value);
    }
  };

  if (isLoading) return <Loader />;

  if (isError || !item) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">
          Error loading product details. Please try again.
        </p>
        <Button onClick={() => navigate("/shop")} className="mt-4">
          Back to Shop
        </Button>
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
      <Button
        variant="ghost"
        onClick={() => navigate("/shop")}
        className="mb-6 hover:bg-gray-100"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Shop
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="overflow-hidden">
          <div className="h-[400px] bg-gray-100 flex items-center justify-center">
            {item.image_url ? (
              <img
                src={item.image_url || "/placeholder.svg"}
                alt={item.item_name}
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <ShoppingBag size={100} className="text-gray-300" />
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {item.item_name}
            </h1>
            {isAdmin && (
              <Button
                onClick={() => navigate(`/items/${item.id}/edit`)}
                variant="outline"
                className="flex items-center w-1/2 text-white bg-blue-600 hover:bg-blue-700"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          <div className="flex items-center mt-2">
            <span className="text-2xl font-bold text-primary">
              ${Number.parseFloat(item.sale_price).toFixed(2)}
            </span>
            {item.sale_price < item.unit_price && (
              <span className="ml-2 text-sm text-gray-500 line-through">
                ${Number.parseFloat(item.unit_price).toFixed(2)}
              </span>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-600">
              {item.description || "No description available."}
            </p>
          </div>

          <div className="border-t border-b py-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">SKU:</span>
              <span className="font-medium">{item.SKU}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-600">Availability:</span>
              {item.current_stock > 0 ? (
                <Badge className="bg-green-100 text-green-800">
                  In Stock ({item.current_stock} available)
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>
              )}
            </div>
          </div>

          {canBuy && item.current_stock > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <div className="flex mt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        -
                      </Button>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={item.current_stock}
                        value={quantity}
                        onChange={handleQuantityChange}
                        className="w-20 mx-2 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setQuantity(
                            Math.min(item.current_stock, quantity + 1)
                          )
                        }
                        disabled={quantity >= item.current_stock}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between font-medium">
                    <span>Total:</span>
                    <span className="text-lg">
                      ${(item.sale_price * quantity).toFixed(2)}
                    </span>
                  </div>

                  <Button
                    onClick={handleBuy}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                    disabled={buyMutation.isLoading || item.current_stock <= 0}
                  >
                    {buyMutation.isLoading ? (
                      <>
                        <Loader className="mr-2 h-4 w-4" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Buy Now
                      </>
                    )}
                  </Button>

                  {item.current_stock <= 5 && (
                    <div className="flex items-center text-amber-600 text-sm mt-2">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span>Low stock - only {item.current_stock} left!</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {!canBuy && !isAdmin && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-600">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                  <p>
                    You need to be logged in with buyer permissions to make
                    purchases.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {item.current_stock <= 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-red-600">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                  <p>This item is currently out of stock.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};
