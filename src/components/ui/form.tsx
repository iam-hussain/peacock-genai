"use client";

import * as React from "react";

import { Button } from "./button";

import { cn } from "@/lib/utils";
import { type FormData } from "@/types";

interface FormProps {
  data: FormData;
  className?: string;
  onSubmit?: (values: Record<string, string | number>) => void;
}

export function Form({ data, className, onSubmit }: FormProps): JSX.Element {
  const [values, setValues] = React.useState<Record<string, string | number>>(
    () => {
      const initial: Record<string, string | number> = {};
      data.fields.forEach((field) => {
        initial[field.name] = field.value ?? "";
      });
      return initial;
    }
  );

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(values);
    }
  };

  const handleChange = (name: string, value: string | number): void => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {data.title && (
        <h3 className="text-base font-semibold text-foreground">
          {data.title}
        </h3>
      )}
      <div className="space-y-3">
        {data.fields.map((field) => (
          <div key={field.name}>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </label>
            {field.type === "select" ? (
              <select
                value={String(values[field.name] ?? "")}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                value={values[field.name] ?? ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            )}
          </div>
        ))}
      </div>
      <Button type="submit" className="w-full">
        {data.submitLabel || "Submit"}
      </Button>
    </form>
  );
}
