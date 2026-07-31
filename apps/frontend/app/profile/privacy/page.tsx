"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, Modal } from "@travel/design-system";
import { apiDelete, apiGet } from "../../../lib/api/client";
import { useToast } from "../../../components/ui/Toast";
import { StateBoundary } from "../../../components/patterns/StateBoundary";

interface Document {
  id: string;
  type: string;
  maskedNumber: string;
}

function maskPassportNumber(number: string): string {
  const lastFour = number.slice(-4);
  return `••••••${lastFour}`;
}

export default function PrivacyPage(): React.JSX.Element {
  const { addToast } = useToast();
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    apiGet<{ documents: Document[] }>("/api/v1/users/documents")
      .then((data) => setDocuments(data.documents ?? []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async (): Promise<void> => {
    setExporting(true);
    try {
      await apiGet("/api/v1/gdpr/export");
      addToast({ title: "Data export started", description: "Check your email for the download link.", variant: "success" });
    } catch {
      addToast({ title: "Export failed", variant: "error" });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async (): Promise<void> => {
    setDeleting(true);
    try {
      await apiDelete("/api/v1/gdpr/erase");
      addToast({ title: "Account deletion requested", variant: "success" });
      setDeleteDialogOpen(false);
    } catch {
      addToast({ title: "Deletion failed", variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const screenState = loading ? "loading" : error ? "error" : "idle";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/profile" className="text-sm text-brand-primary hover:underline">
        ← Back to Profile
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold text-text-primary">Privacy Centre</h1>

      <StateBoundary state={screenState} error={error}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text-primary">My Data</h2>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-text-secondary">
                Download a copy of all personal data we hold about you.
              </p>
              <Button onClick={() => void handleExport()} loading={exporting}>
                Download my data
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text-primary">Passport &amp; Documents</h2>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-sm text-text-muted">No documents on file.</p>
              ) : (
                <ul className="space-y-2">
                  {documents.map((doc) => (
                    <li key={doc.id} className="flex justify-between text-sm">
                      <span className="text-text-primary">{doc.type}</span>
                      <span className="font-mono text-text-muted">
                        {doc.maskedNumber || maskPassportNumber("0000001234")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text-primary">Delete My Account</h2>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-text-secondary">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                Delete my account
              </Button>
            </CardContent>
          </Card>
        </div>
      </StateBoundary>

      <Modal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Confirm account deletion"
        description="Are you sure you want to permanently delete your account? All bookings and data will be erased."
      >
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" loading={deleting} onClick={() => void handleDeleteAccount()}>
            Confirm deletion
          </Button>
        </div>
      </Modal>
    </div>
  );
}
