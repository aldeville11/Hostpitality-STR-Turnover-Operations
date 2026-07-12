import { PageHeader, PlaceholderPanel } from "@/components/ui";

export default function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <PlaceholderPanel
        title={`${title} is scaffolded`}
        description="Phase 1 provides the app shell and navigation only. This section will be implemented in a later phase."
      />
    </div>
  );
}
