import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { z } from "zod";
import { useForm } from "./form";
import { zodAdapter } from "./zod-validator";
import userEvent from "@testing-library/user-event";
import { Input, SubmitButton } from "./demo-components";

function FormPage({ onSubmit }: { onSubmit: (data: any) => void }) {
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
  });

  return (
    <form
      onSubmit={form.handleSubmit((data) => {
        onSubmit(data);
      })}
    >
      <label>
        First name
        <Input field={form.field("name.first")} />
      </label>
      <label>
        Last name
        <Input field={form.field("name.last")} />
      </label>
      <SubmitButton formstand={form} />
    </form>
  );
}

it("should submit a basic form", async () => {
  const cb = vi.fn();
  render(<FormPage onSubmit={cb} />);
  await userEvent.click(screen.getByText("Submit"));
  expect(screen.getByText("first name too short")).toBeInTheDocument();
  expect(screen.getByText("last name too short")).toBeInTheDocument();
  await userEvent.type(screen.getByText("First name"), "John");
  await userEvent.type(screen.getByText("Last name"), "John");
  await userEvent.click(screen.getByText("Submit"));
  expect(cb).toHaveBeenCalledWith({
    name: {
      first: "John",
      last: "John",
    },
  });
});
