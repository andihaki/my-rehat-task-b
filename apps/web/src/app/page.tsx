"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { orpc } from "@/utils/orpc";
import HomestayList from "./buy-homestay/HomestayList";

export default function Home() {
  const healthCheck = useQuery(orpc.healthCheck.queryOptions());
  const latestListings = useQuery(orpc.listings.getLatest.queryOptions());

  return (
    <div className="container mx-auto max-w-5xl px-4 py-2">
      <section className="py-16 text-center">
        <h1 className="text-xl font-bold tracking-tight sm:text-4xl">
          Book homestays directly with hosts
        </h1>
      </section>
      <div className="grid gap-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">API Status</h2>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-sm text-muted-foreground">
              {healthCheck.isLoading
                ? "Checking..."
                : healthCheck.data
                  ? "Connected"
                  : "Disconnected"}
            </span>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-2xl">Latest Listings</h2>
            <Link href="/buy-homestay" className="text-sm underline">
              View all
            </Link>
          </div>
          <HomestayList
            isLoading={latestListings.isLoading}
            listings={latestListings.data ?? []}
          />
        </section>
      </div>
    </div>
  );
}
