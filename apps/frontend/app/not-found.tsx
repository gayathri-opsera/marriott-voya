import Link from "next/link";
import { Button } from "@travel/design-system";
import { ROUTES } from "../lib/routes";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-text-primary">404</h1>
      <p className="mt-2 text-text-secondary">
        We couldn&apos;t find the page you&apos;re looking for.
      </p>
      <Button asChild className="mt-6">
        <Link href={ROUTES.HOME}>Back to home</Link>
      </Button>
    </div>
  );
}
