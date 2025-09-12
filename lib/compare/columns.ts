export interface KPIColumn {
  key: string;
  label: string;
  formatter?: (value: number) => string;
  align?: "left" | "right" | "center";
  tooltip?: (value: number) => string;
}

export const DEFAULT_KPI_COLUMNS: KPIColumn[] = [
  {
    key: "capRate",
    label: "Cap Rate",
    formatter: (v) => `${(v * 100).toFixed(2)}%`,
    align: "right",
  },
  {
    key: "dscr",
    label: "DSCR",
    formatter: (v) => v.toFixed(2),
    align: "right",
  },
  {
    key: "annualCF",
    label: "Annual CF",
    formatter: (v) => v.toLocaleString(),
    align: "right",
  },
  {
    key: "profit",
    label: "Profit",
    formatter: (v) => v.toLocaleString(),
    align: "right",
  },
];
