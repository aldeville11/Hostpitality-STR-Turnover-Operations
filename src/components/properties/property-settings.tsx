"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, DetailSection, Input, Label, Select, Textarea } from "@/components/ui";
import {
  updatePropertyProfileAction,
  updatePropertySettingsAction,
} from "@/lib/property-actions";
import { UNIT_TYPES } from "@/lib/properties";

type Options = {
  sops: { id: string; name: string }[];
  sows: { id: string; name: string }[];
  vendors: { id: string; name: string; type: string }[];
};

type PropertySettingsModel = {
  id: string;
  name: string;
  unitCode: string;
  address: string;
  city: string;
  state: string;
  unitType: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  notes: string | null;
  active: boolean;
  sopId: string | null;
  sowId: string | null;
  defaultVendorId: string | null;
  accessNotes: string | null;
  turnoverBufferMins: number;
  sameDayTurnover: boolean;
  photoRequirements: { label: string; required: boolean }[];
  restockDefaults: { name: string; quantity: number; unit: string }[];
};

export function PropertySettings({
  property,
  options,
}: {
  property: PropertySettingsModel;
  options: Options;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const photoText = property.photoRequirements.map((p) => p.label).join("\n");
  const restockText = property.restockDefaults
    .map((r) => `${r.name}|${r.quantity}|${r.unit}`)
    .join("\n");

  return (
    <DetailSection
      title="Property settings"
      description="Edit profile, operational rules, photo proof requirements, restock defaults, and default cleaner."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-3 rounded-xl border border-[var(--border)] p-4"
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              const res = await updatePropertyProfileAction(fd);
              if (res?.error) setError(res.error);
              else router.refresh();
            });
          }}
        >
          <p className="text-sm font-semibold">Profile</p>
          <input type="hidden" name="id" value={property.id} />
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={property.name} />
          </div>
          <div>
            <Label htmlFor="unitCode">Unit code</Label>
            <Input id="unitCode" name="unitCode" required defaultValue={property.unitCode} />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" required defaultValue={property.address} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" required defaultValue={property.city} />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" required defaultValue={property.state} />
            </div>
          </div>
          <div>
            <Label htmlFor="unitType">Unit type</Label>
            <Select id="unitType" name="unitType" defaultValue={property.unitType}>
              {UNIT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="bedrooms">Beds</Label>
              <Input
                id="bedrooms"
                name="bedrooms"
                type="number"
                defaultValue={property.bedrooms}
              />
            </div>
            <div>
              <Label htmlFor="bathrooms">Baths</Label>
              <Input
                id="bathrooms"
                name="bathrooms"
                type="number"
                step="0.5"
                defaultValue={property.bathrooms}
              />
            </div>
            <div>
              <Label htmlFor="maxGuests">Guests</Label>
              <Input
                id="maxGuests"
                name="maxGuests"
                type="number"
                defaultValue={property.maxGuests}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={property.notes ?? ""} />
          </div>
          <div>
            <Label htmlFor="active">Status</Label>
            <Select id="active" name="active" defaultValue={property.active ? "true" : "false"}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </div>
          <Button type="submit" disabled={pending}>
            Save profile
          </Button>
        </form>

        <form
          className="space-y-3 rounded-xl border border-[var(--border)] p-4"
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              const res = await updatePropertySettingsAction(fd);
              if (res?.error) setError(res.error);
              else router.refresh();
            });
          }}
        >
          <p className="text-sm font-semibold">Operational rules</p>
          <input type="hidden" name="id" value={property.id} />
          <div>
            <Label htmlFor="sopId">Linked SOP</Label>
            <Select id="sopId" name="sopId" defaultValue={property.sopId ?? ""}>
              <option value="">None</option>
              {options.sops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="sowId">Linked SOW</Label>
            <Select id="sowId" name="sowId" defaultValue={property.sowId ?? ""}>
              <option value="">None</option>
              {options.sows.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="defaultVendorId">Default cleaner / vendor</Label>
            <Select
              id="defaultVendorId"
              name="defaultVendorId"
              defaultValue={property.defaultVendorId ?? ""}
            >
              <option value="">None</option>
              {options.vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.type})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="accessNotes">Access / entry notes</Label>
            <Textarea
              id="accessNotes"
              name="accessNotes"
              rows={2}
              defaultValue={property.accessNotes ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="turnoverBufferMins">Turnover buffer (min)</Label>
              <Input
                id="turnoverBufferMins"
                name="turnoverBufferMins"
                type="number"
                defaultValue={property.turnoverBufferMins}
              />
            </div>
            <div>
              <Label htmlFor="sameDayTurnover">Same-day turnover</Label>
              <Select
                id="sameDayTurnover"
                name="sameDayTurnover"
                defaultValue={property.sameDayTurnover ? "true" : "false"}
              >
                <option value="true">Allowed</option>
                <option value="false">Not allowed</option>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="photoRequirements">Photo requirements (one per line)</Label>
            <Textarea
              id="photoRequirements"
              name="photoRequirements"
              rows={4}
              defaultValue={photoText}
            />
          </div>
          <div>
            <Label htmlFor="restockDefaults">Restock defaults (name|qty|unit)</Label>
            <Textarea
              id="restockDefaults"
              name="restockDefaults"
              rows={4}
              defaultValue={restockText}
            />
          </div>
          <Button type="submit" disabled={pending}>
            Save operational settings
          </Button>
        </form>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </DetailSection>
  );
}
