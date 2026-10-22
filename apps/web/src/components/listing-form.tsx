"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@myrehat-task-b/ui/components/button";
import { Input } from "@myrehat-task-b/ui/components/input";
import { Label } from "@myrehat-task-b/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@myrehat-task-b/ui/components/select";
import { toast } from "sonner";

import { LISTING_TYPES, LISTING_TYPE_VALUES } from "@/lib/constants";
import { orpcClient } from "@/lib/orpc-client";

export default function ListingForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [type, setType] = useState<string>("");

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      price: Number(formData.get("price")),
      location: formData.get("location") as string,
      type: type as typeof LISTING_TYPE_VALUES[number],
      whatsapp: formData.get("whatsapp") as string,
    };

    try {
      await orpcClient.listings.create(data);
      toast.success("Listing created successfully!");
      setType("");
      router.push("/buy-homestay");
    } catch (error: any) {
      console.error("Error creating listing:", error);
      if (error.data && typeof error.data === 'object') {
        const fieldErrors: Record<string, string> = {};
        error.data.issues.forEach((issue: any) => {
          if (issue.path && issue.path.length > 0) {
            const [fieldName] = issue.path;
            fieldErrors[fieldName] = issue.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error(error.message || "Failed to create listing");
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      <div>
        <Label htmlFor="price">Price (RM)</Label>
        <Input id="price" name="price" type="number" required />
        {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" required />
        {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
      </div>

      <div>
        <Label htmlFor="type">Type</Label>
        <Select value={type} onValueChange={(value) => setType(value ?? "")} required>
          <SelectTrigger id="type">
            <SelectValue placeholder="Select a type">
              {type ? LISTING_TYPES.find((t) => t.value === type)?.label : ""}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LISTING_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="type" value={type} />
        {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
      </div>

      <div>
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          name="whatsapp"
          placeholder="012-345 6789"
          required
        />
        {errors.whatsapp && <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Submitting..." : "Submit Listing"}
      </Button>
    </form>
  );
}
