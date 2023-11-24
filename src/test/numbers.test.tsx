import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { z } from "zod";
import { useForm } from "../form";
import { zodAdapter } from "../adapters/zod";
import userEvent from "@testing-library/user-event";
import { NumberInput, SubmitButton } from "./test-components";
import type { ValidationBehaviorConfig } from "../store";
import { handleSubmit } from "../react";

function SimpleForm({
  onSubmit,
  validationBehavior,
}: {
  onSubmit: (data: any) => void;
  validationBehavior?: ValidationBehaviorConfig;
}) {
  const form = useForm({
    validator: zodAdapter(z.object({ age: z.number().min(2) })),
    initialValues: { age: 0 },
    validationBehavior,
  });

  return (
    <form
      onSubmit={handleSubmit(form, (data) => {
        onSubmit(data);
      })}
    >
      <label>
        Age
        <NumberInput type="number" subform={form("age")} />
      </label>
      <SubmitButton subform={form} />
    </form>
  );
}

it("should submit a basic form", async () => {
  const cb = vi.fn();
  render(<SimpleForm onSubmit={cb} />);
  await userEvent.click(screen.getByText("Submit"));
  await userEvent.type(screen.getByLabelText(/age/i), "5");
  await userEvent.click(screen.getByText("Submit"));
  expect(cb).toHaveBeenCalledWith({
    age: 5,
  });
});
