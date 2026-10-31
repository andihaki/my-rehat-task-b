"use client";

import { Button } from "@myrehat-task-b/ui/components/button";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function PostListingCTA() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  if (session?.user) {
    return (
      <Button onClick={() => router.push("/listings/create")}>
        Post Listing
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => router.push("/login?redirect=/listings")}
    >
      Post Listing
    </Button>
  );
}
