'use client';
import React from 'react';
import { CalcBases, CalcModePreset } from '@/lib/calc/types';
import { CalcPresets } from '@/lib/calc/presets';

interface Props {
  value: CalcModePreset['id'];
  onChange: (id: CalcModePreset['id'], bases: CalcBases) => void;
}

export function CalcModeToggle({ value, onChange }: Props) {
  return (
    <select
      className="input border rounded px-2 py-1"
      value={value}
      onChange={(e) => {
        const preset = CalcPresets.find((p) => p.id === e.target.value as any)!;
        onChange(preset.id, preset.bases);
      }}
    >
      {CalcPresets.map((p) => (
        <option key={p.id} value={p.id}>
          {p.id}
        </option>
      ))}
    </select>
  );
}
