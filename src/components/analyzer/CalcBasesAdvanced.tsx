"use client";
import * as React from "react";

type LoanBasis = "purchase" | "all_in";
type PercentBasis = "gross" | "egi";
type CapBasis = "purchase" | "all_in";
type InvestedBasis = "down" | "down_plus_rehab" | "down_plus_rehab_closing";

export interface Bases {
  loanBasis: LoanBasis;
  percentBasis: PercentBasis;
  capBasis: CapBasis;
  investedBasis: InvestedBasis;
}

interface Props {
  value: Bases;
  onChange: (b: Bases) => void;
  className?: string;
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 py-2">
    <div className="text-sm font-medium">{label}</div>
    <div className="flex gap-3">{children}</div>
  </div>
);

function Radio<T extends string>({
  name, options, value, onChange,
}: {
  name: string;
  options: { label: string; val: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <label key={o.val} className="inline-flex items-center gap-1 text-sm">
          <input type="radio" name={name} value={o.val} checked={value === o.val} onChange={() => onChange(o.val)} />
          {o.label}
        </label>
      ))}
    </div>
  );
}

export function CalcBasesAdvanced({ value, onChange, className }: Props) {
  return (
    <div className={`rounded-xl border p-3 ${className ?? ""}`}>
      <div className="text-sm font-semibold mb-2">Advanced math options</div>

      <Row label="Loan basis">
        <Radio
          name="loanBasis"
          options={[{ label: "Purchase", val: "purchase" }, { label: "All-In", val: "all_in" }]}
          value={value.loanBasis}
          onChange={(loanBasis) => onChange({ ...value, loanBasis })}
        />
      </Row>

      <Row label="% expense basis">
        <Radio
          name="percentBasis"
          options={[{ label: "Gross", val: "gross" }, { label: "EGI (Rent − Vacancy)", val: "egi" }]}
          value={value.percentBasis}
          onChange={(percentBasis) => onChange({ ...value, percentBasis })}
        />
      </Row>

      <Row label="Cap/GRM basis">
        <Radio
          name="capBasis"
          options={[{ label: "Purchase", val: "purchase" }, { label: "All-In", val: "all_in" }]}
          value={value.capBasis}
          onChange={(capBasis) => onChange({ ...value, capBasis })}
        />
      </Row>

      <Row label="CoC invested">
        <Radio
          name="investedBasis"
          options={[
            { label: "Down", val: "down" },
            { label: "Down + Rehab", val: "down_plus_rehab" },
            { label: "Down + Rehab + Closing", val: "down_plus_rehab_closing" },
          ]}
          value={value.investedBasis}
          onChange={(investedBasis) => onChange({ ...value, investedBasis })}
        />
      </Row>
    </div>
  );
}
