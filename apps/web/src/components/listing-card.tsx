import { Button } from "@myrehat-task-b/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@myrehat-task-b/ui/components/card";

import { LISTING_TYPES } from "@/lib/constants";
import { formatRM } from "@/lib/format";

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
  const typeLabel =
    LISTING_TYPES.find((t) => t.value === listing.type)?.label || listing.type;

  return (
    <li className="h-full">
      <Card className="h-full rounded-md">
        <CardHeader>
          <CardTitle className="font-semibold text-base">
            {listing.title}
          </CardTitle>
          <CardAction>
            <span className="bg-secondary px-2 py-1 text-xs">{typeLabel}</span>
          </CardAction>
        </CardHeader>

        <CardContent className="flex-1 space-y-1">
          <p className="font-bold text-green-600 text-xl">
            {formatRM(listing.price)}
          </p>
          <p className="text-muted-foreground">{listing.location}</p>
        </CardContent>

        <CardFooter>
          <a
            href={`https://wa.me/${listing.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
          >
            <Button variant="outline" className="w-full">
              Contact via WhatsApp
            </Button>
          </a>
        </CardFooter>
      </Card>
    </li>
  );
}
