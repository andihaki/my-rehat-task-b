"use client";

import { Button } from "@myrehat-task-b/ui/components/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function PostListingCTA() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  if (session?.user) {
    return (
      <Button onClick={() => router.push("/buy-homestay/create")}>
        Post Listing
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => router.push("/login?redirect=/buy-homestay")}
    >
      Post Listing
    </Button>
  );
}
