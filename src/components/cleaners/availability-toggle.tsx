"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  DetailSection,
  Input,
  Label,
  Select,
  StatusBadge,
  Textarea,
} from "@/components/ui";
import { updateAvailabilityAction } from "@/lib/cleaner-actions";
import {
  AVAILABILITY_LABELS,
  AVAILABILITY_STATUSES,
  type AvailabilityStatus,
} from "@/lib/cleaners";
import { mapAvailability } from "@/lib/status-map";

export function AvailabilityToggle({
  vendorId,
  status,
  unavailableUntil,
  unavailableReason,
}: {
  vendorId: string;
  status: string;
  unavailableUntil: Date | string | null;
  unavailableReason: string | null;
}) {
  const [availabilityStatus, setAvailabilityStatus] = useState(status);
  const [until, setUntil] = useState(
    unavailableUntil
      ? new Date(unavailableUntil).toISOString().slice(0, 16)
      : ""
  );
  const [reason, setReason] = useState(unavailableReason ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <DetailSection
      title="Availability"
      actions={
        <StatusBadge status={mapAvailability(availabilityStatus)}>
          {AVAILABILITY_LABELS[availabilityStatus as AvailabilityStatus] ?? status}
        </StatusBadge>
      }
    >
      <form
        className="space-y-3"
        action={(fd) => {
          setError(null);
          setMessage(null);
          startTransition(async () => {
            const res = await updateAvailabilityAction(fd);
            if (res?.error) setError(res.error);
            else {
              setMessage("Availability updated");
              router.refresh();
            }
          });
        }}
      >
        <input type="hidden" name="vendorId" value={vendorId} />
        <div>
          <Label htmlFor="availabilityStatus">Status</Label>
          <Select
            id="availabilityStatus"
            name="availabilityStatus"
            value={availabilityStatus}
            onChange={(e) => setAvailabilityStatus(e.target.value)}
          >
            {AVAILABILITY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {AVAILABILITY_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        {availabilityStatus !== "AVAILABLE" ? (
          <>
            <div>
              <Label htmlFor="unavailableUntil">Unavailable until</Label>
              <Input
                id="unavailableUntil"
                name="unavailableUntil"
                type="datetime-local"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="unavailableReason">Reason</Label>
              <Textarea
                id="unavailableReason"
                name="unavailableReason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="PTO, vehicle down, out of service…"
              />
            </div>
          </>
        ) : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Update availability"}
        </Button>
      </form>
    </DetailSection>
  );
}
