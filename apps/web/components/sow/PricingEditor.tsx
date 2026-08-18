"use client";

import { Plus, Trash2 } from "lucide-react";
import type { PaymentMilestone, Pricing } from "@sowflow/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PricingEditorProps {
  pricing: Pricing;
  onChange: (pricing: Pricing) => void;
}

function toNumberOrUndefined(value: string): number | undefined {
  return value === "" ? undefined : Number(value);
}

export function PricingEditor({ pricing, onChange }: PricingEditorProps) {
  function patch(fields: Partial<Pricing>) {
    onChange({ ...pricing, ...fields });
  }

  function updateMilestone(index: number, fields: Partial<PaymentMilestone>) {
    const next = [...pricing.paymentSchedule];
    next[index] = { ...next[index], ...fields };
    patch({ paymentSchedule: next });
  }

  function removeMilestone(index: number) {
    patch({ paymentSchedule: pricing.paymentSchedule.filter((_, i) => i !== index) });
  }

  function addMilestone() {
    patch({
      paymentSchedule: [
        ...pricing.paymentSchedule,
        { description: "", amount: 0, trigger: "" },
      ],
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Pricing model</Label>
          <Select
            value={pricing.model}
            onValueChange={(value) => patch({ model: value as Pricing["model"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed fee</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="retainer">Retainer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Currency</Label>
          <Input value={pricing.currency} onChange={(event) => patch({ currency: event.target.value })} />
        </div>
      </div>

      {pricing.model === "fixed" && (
        <div className="flex flex-col gap-1.5">
          <Label>Total amount</Label>
          <Input
            type="number"
            value={pricing.totalAmount ?? ""}
            onChange={(event) => patch({ totalAmount: toNumberOrUndefined(event.target.value) })}
          />
        </div>
      )}

      {pricing.model === "hourly" && (
        <div className="flex flex-col gap-1.5">
          <Label>Hourly rate</Label>
          <Input
            type="number"
            value={pricing.hourlyRate ?? ""}
            onChange={(event) => patch({ hourlyRate: toNumberOrUndefined(event.target.value) })}
          />
        </div>
      )}

      {pricing.model === "retainer" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Retainer amount</Label>
            <Input
              type="number"
              value={pricing.retainerAmount ?? ""}
              onChange={(event) =>
                patch({ retainerAmount: toNumberOrUndefined(event.target.value) })
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Retainer period</Label>
            <Select
              value={pricing.retainerPeriod}
              onValueChange={(value) =>
                patch({ retainerPeriod: value as Pricing["retainerPeriod"] })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div>
        <Label>Payment schedule</Label>
        <div className="mt-2 flex flex-col gap-2">
          {pricing.paymentSchedule.length === 0 && (
            <p className="text-sm text-muted-foreground">No payment milestones yet.</p>
          )}
          {pricing.paymentSchedule.map((milestone, index) => (
            <div key={index} className="grid grid-cols-[2fr_1fr_2fr_auto] gap-2">
              <Input
                value={milestone.description}
                onChange={(event) => updateMilestone(index, { description: event.target.value })}
                placeholder="Description"
              />
              <Input
                type="number"
                value={milestone.amount}
                onChange={(event) =>
                  updateMilestone(index, { amount: Number(event.target.value) })
                }
                placeholder="Amount"
              />
              <Input
                value={milestone.trigger}
                onChange={(event) => updateMilestone(index, { trigger: event.target.value })}
                placeholder="Trigger (e.g. Upon signing)"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeMilestone(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addMilestone} className="self-start">
            <Plus className="h-4 w-4" />
            Add payment milestone
          </Button>
        </div>
      </div>
    </div>
  );
}
