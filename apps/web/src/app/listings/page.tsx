"use client";

import { useQuery } from "@tanstack/react-query";
import PostListingCTA from "@/components/post-listing-cta";
import { orpc } from "@/utils/orpc";
import HomestayList from "./HomestayList";

export default function ListingsPage() {
	const { data, isLoading } = useQuery(orpc.listings.getAll.queryOptions());
	const listings = data ?? [];

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="font-bold text-xl md:text-3xl">Buy Homestay Listings</h1>
				<PostListingCTA />
			</div>

			<HomestayList isLoading={isLoading} listings={listings} />
		</div>
	);
}
