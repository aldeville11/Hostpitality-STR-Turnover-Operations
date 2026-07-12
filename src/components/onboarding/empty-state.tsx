import { EmptyState } from "@/components/ui";

export function OnboardingEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return <EmptyState title={title} description={description} />;
}
