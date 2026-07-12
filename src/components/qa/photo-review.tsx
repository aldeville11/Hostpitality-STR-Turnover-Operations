"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, DetailSection, EmptyState, Textarea } from "@/components/ui";
import { reviewQaPhotoAction } from "@/lib/qa-actions";

type Photo = {
  id: string;
  label: string;
  required: boolean;
  uploaded: boolean;
  result: string;
  comment: string | null;
};

export function PhotoReview({
  turnoverId,
  photos,
  readOnly,
}: {
  turnoverId: string;
  photos: Photo[];
  readOnly?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [comments, setComments] = useState<Record<string, string>>({});
  const router = useRouter();

  function review(photoId: string, result: string) {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("photoId", photoId);
      fd.set("result", result);
      fd.set("turnoverId", turnoverId);
      fd.set("comment", comments[photoId] ?? "");
      const res = await reviewQaPhotoAction(fd);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <DetailSection
      title="Photo review"
      description="Verify SOW / property photo proof slots. Missing required shots block approval unless overridden."
    >
      {photos.length === 0 ? (
        <EmptyState
          title="No photo requirements"
          description="No photo requirements on this template."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {photos.map((photo) => (
            <div key={photo.id} className="rounded-xl border border-[var(--border)] p-3">
              <div
                className={`mb-3 flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed ${
                  photo.uploaded
                    ? "border-[var(--accent)]/40 bg-[var(--accent)]/5"
                    : "border-[var(--border)] bg-[var(--surface-2)]/50"
                }`}
              >
                <div className="px-3 text-center">
                  <p className="text-sm font-medium">{photo.label}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {photo.uploaded ? "Uploaded evidence slot" : "Missing upload"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge tone={photo.required ? "info" : "neutral"}>
                  {photo.required ? "Required" : "Optional"}
                </Badge>
                <Badge tone={photo.uploaded ? "success" : "warning"}>
                  {photo.uploaded ? "Uploaded" : "Missing"}
                </Badge>
                <Badge
                  tone={
                    photo.result === "PASS"
                      ? "success"
                      : photo.result === "FAIL"
                        ? "danger"
                        : "warning"
                  }
                >
                  {photo.result}
                </Badge>
              </div>
              {photo.comment ? (
                <p className="mt-2 text-xs text-[var(--muted)]">{photo.comment}</p>
              ) : null}
              {!readOnly ? (
                <div className="mt-3 space-y-2">
                  <Textarea
                    rows={2}
                    placeholder="Comment (required on fail)"
                    value={comments[photo.id] ?? photo.comment ?? ""}
                    onChange={(e) =>
                      setComments((prev) => ({ ...prev, [photo.id]: e.target.value }))
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending || !photo.uploaded}
                      onClick={() => review(photo.id, "PASS")}
                    >
                      Pass
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      disabled={pending}
                      onClick={() => review(photo.id, "FAIL")}
                    >
                      Fail
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => review(photo.id, "NA")}
                    >
                      N/A
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </DetailSection>
  );
}
