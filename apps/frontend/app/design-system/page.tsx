"use client";

import * as React from "react";
import {
  Button,
  Input,
  Badge,
  Card,
  CardHeader,
  CardContent,
  Modal,
  Toast,
} from "@travel/design-system";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-text-primary border-b border-border-default pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-text-muted mb-1">{children}</p>;
}

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [showToast, setShowToast] = React.useState(true);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Design System</h1>
        <p className="mt-2 text-text-secondary">
          Visual reference for primitives from <code>@travel/design-system</code>.
        </p>
      </div>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-4">
          <div>
            <Label>Default</Label>
            <Button>Default</Button>
          </div>
          <div>
            <Label>Secondary</Label>
            <Button variant="secondary">Secondary</Button>
          </div>
          <div>
            <Label>Outline</Label>
            <Button variant="outline">Outline</Button>
          </div>
          <div>
            <Label>Ghost</Label>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div>
            <Label>Destructive</Label>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div>
            <Label>Link</Label>
            <Button variant="link">Link</Button>
          </div>
          <div>
            <Label>Loading</Label>
            <Button loading>Loading</Button>
          </div>
        </div>
      </Section>

      <Section title="Inputs">
        <div className="grid gap-6 max-w-md">
          <div>
            <Label>Normal</Label>
            <Input label="Email" placeholder="you@example.com" />
          </div>
          <div>
            <Label>Error</Label>
            <Input label="Password" error="Password is required" defaultValue="short" />
          </div>
          <div>
            <Label>Disabled</Label>
            <Input label="Disabled field" disabled defaultValue="Cannot edit" />
          </div>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="provenance-amadeus">Amadeus</Badge>
          <Badge variant="provenance-rapidapi">RapidAPI</Badge>
          <Badge variant="provenance-illustrative">Illustrative</Badge>
        </div>
      </Section>

      <Section title="Cards">
        <Card className="max-w-md">
          <CardHeader>
            <h3 className="font-semibold text-text-primary">Card title</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">Card body content with border and shadow.</p>
          </CardContent>
        </Card>
      </Section>

      <Section title="Modals">
        <div>
          <Label>Click to open</Label>
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          <Modal
            open={modalOpen}
            onOpenChange={setModalOpen}
            title="Example modal"
            description="This modal uses the design-system Modal primitive."
          >
            <Button onClick={() => setModalOpen(false)}>Close</Button>
          </Modal>
        </div>
      </Section>

      <Section title="Toasts">
        <div>
          <Label>Toast variants</Label>
          {showToast && (
            <div className="space-y-3 max-w-sm">
              <Toast title="Default toast" onDismiss={() => setShowToast(false)} />
              <Toast title="Success" variant="success" />
              <Toast title="Warning" variant="warning" />
              <Toast title="Error" variant="error" description="Something went wrong." />
            </div>
          )}
          {!showToast && (
            <Button variant="outline" onClick={() => setShowToast(true)}>
              Show toasts again
            </Button>
          )}
        </div>
      </Section>
    </div>
  );
}
