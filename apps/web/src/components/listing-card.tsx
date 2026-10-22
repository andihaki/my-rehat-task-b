import { Button } from "@myrehat-task-b/ui/components/button";

import { formatRM } from "@/lib/format";
import { LISTING_TYPES } from "@/lib/constants";

export type Listing = {
  id: string;
  title: string;
  price: number;
  location: string;
  type: string;
  whatsapp: string;
  userId: string;
  createdAt: Date;
};

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const typeLabel = LISTING_TYPES.find((t) => t.value === listing.type)?.label || listing.type;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold">{listing.title}</h3>
        <span className="px-2 py-1 bg-gray-100 text-sm rounded-full">
          {typeLabel}
        </span>
      </div>
      <p className="text-xl font-bold text-green-600">{formatRM(listing.price)}</p>
      <p className="text-gray-600">{listing.location}</p>
      <a
        href={`https://wa.me/${listing.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Button variant="outline" className="w-full">
          Contact via WhatsApp
        </Button>
      </a>
    </div>
  );
}
