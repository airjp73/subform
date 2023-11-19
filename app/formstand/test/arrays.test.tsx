import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { z } from "zod";
import { useForm } from "../form";
import { zodAdapter } from "../zod-validator";
import userEvent from "@testing-library/user-event";
import { Input, SubmitButton } from "../demo-components";
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
    validator: zodAdapter(
      z.object({
        name: z.object({
          first: z
            .string()
            .min(2, "first name too short")
            .max(10, "first name too long"),
          last: z
            .string()
            .min(2, "last name too short")
            .max(10, "last name too long"),
        }),
      })
    ),
    initialValues: {
      name: {
        first: "",
        last: "",
      },
    },
    validationBehavior,
  });

  return (
    <form
      onSubmit={handleSubmit(form, (data) => {
        onSubmit(data);
      })}
    >
      <label>
        First name
        <Input formstand={form("name.first")} />
      </label>
      <label>
        Last name
        <Input formstand={form("name.last")} />
      </label>
      <SubmitButton formstand={form} />
    </form>
  );
}

it("should submit a basic form", async () => {
  const cb = vi.fn();
  render(<SimpleForm onSubmit={cb} />);
  await userEvent.click(screen.getByText("Submit"));
  expect(screen.getByText("first name too short")).toBeInTheDocument();
  expect(screen.getByText("last name too short")).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText(/first name/i), "John");
  await userEvent.type(screen.getByLabelText(/last name/i), "John");
  await userEvent.click(screen.getByText("Submit"));
  expect(cb).toHaveBeenCalledWith({
    name: {
      first: "John",
      last: "John",
    },
  });
});
