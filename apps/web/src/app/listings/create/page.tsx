import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ListingForm from "@/components/listing-form";
import { authClient } from "@/lib/auth-client";

export default async function CreateListingPage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
		},
	});

	if (!session.data?.user) {
		redirect("/login?redirect=/listings/create");
	}

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<h1 className="mb-6 font-bold text-3xl">Create Listing</h1>
			<ListingForm />
		</div>
	);
}
