"use client";

import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";
import PostListingCTA from "@/components/post-listing-cta";
import HomestayList from "./HomestayList";

export default function BuyHomestayPage() {
  const { data, isLoading } = useQuery(orpc.listings.getAll.queryOptions());
  const listings = data ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Buy Homestay Listings</h1>
        <PostListingCTA />
      </div>

      <HomestayList isLoading={isLoading} listings={listings} />
    </div>
  );
}
