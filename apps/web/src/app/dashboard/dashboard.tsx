"use client";

import { useQuery } from "@tanstack/react-query";

import HomestayList from "@/app/buy-homestay/HomestayList";
import { orpc } from "@/utils/orpc";

export default function Dashboard() {
  const privateData = useQuery(orpc.privateData.queryOptions());
  const myListings = useQuery(orpc.listings.getMine.queryOptions());

  return (
    <>
      <p>API: {privateData.data?.message}</p>

      <section className="mt-8">
        <h2 className="mb-4 font-bold text-2xl">My Listings</h2>
        <HomestayList
          isLoading={myListings.isLoading}
          listings={myListings.data ?? []}
        />
      </section>
    </>
  );
}
