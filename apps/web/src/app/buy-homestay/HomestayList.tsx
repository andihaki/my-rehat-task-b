import { EmptyDescription } from "@myrehat-task-b/ui/components/empty";
import { Skeleton } from "@myrehat-task-b/ui/components/skeleton";

import { type Listing } from "@/components/listing-card";
import ListingCard from "@/components/listing-card";

export default function HomestayList({ isLoading, listings }: { isLoading: boolean; listings: Listing[] }) {
  if (isLoading) {
    return <Skeleton className="text-center text-lg py-12">Loading...</Skeleton>;
  }

  if (listings.length === 0) {
    return (
      <EmptyDescription className="text-center text-lg py-12">
        No listings yet. Be the first to post!
      </EmptyDescription>
    );
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((item) => (
        <ListingCard key={item.id} listing={item} />
      ))}
    </ul>
  );
}