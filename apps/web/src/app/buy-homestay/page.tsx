"use client";

import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";
import ListingCard, { type Listing } from "@/components/listing-card";
import PostListingCTA from "@/components/post-listing-cta";

export default function BuyHomestayPage() {
  const listingsQuery = useQuery(orpc.listings.getAll.queryOptions());
  const listings = listingsQuery.data ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Buy Homestay Listings</h1>
        <PostListingCTA />
      </div>

      {listingsQuery.isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Loading...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No listings yet. Be the first to post!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item: Listing) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      )}
    </div>
  );
}
