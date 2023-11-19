import { expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { z } from "zod";
import type { Formstand } from "../formstand";
import { useForm } from "../form";
import { zodAdapter } from "../zod-validator";
import userEvent from "@testing-library/user-event";
import { Input, SubmitButton } from "../demo-components";
import type { ValidationBehaviorConfig } from "../store";
import { handleSubmit } from "../react";

const nameSchema = z.object({
  first: z
    .string()
    .min(2, "first name too short")
    .max(10, "first name too long"),
  last: z.string().min(2, "last name too short").max(10, "last name too long"),
});

function WithSubforms({
  onSubmit,
  validationBehavior,
}: {
  onSubmit: (data: any) => void;
  validationBehavior?: ValidationBehaviorConfig;
}) {
  const form = useForm({
    validator: zodAdapter(
      z.object({
        contactA: nameSchema,
        contactB: nameSchema,
      })
    ),
    initialValues: {
      contactA: { first: "", last: "" },
      contactB: { first: "", last: "" },
    },
    validationBehavior,
  });

  return (
    <form
      onSubmit={handleSubmit(form, (data) => {
        onSubmit(data);
      })}
    >
      <NameForm label="Contact A" field={form("contactA")} />
      <NameForm label="Contact B" field={form("contactB")} />
      <SubmitButton formstand={form} />
    </form>
  );
}

function NameForm({
  field,
  label,
}: {
  field: Formstand<{ first: string; last: string }>;
  label: string;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <label>
        First name
        <Input formstand={field("first")} />
      </label>
      <label>
        Last name
        <Input formstand={field("last")} />
      </label>
    </fieldset>
  );
}

it("should submit a basic form", async () => {
  const cb = vi.fn();
  render(<WithSubforms onSubmit={cb} />);

  const contactA = within(screen.getByRole("group", { name: /contact a/i }));
  await userEvent.type(contactA.getByLabelText(/first name/i), "John");
  await userEvent.type(contactA.getByLabelText(/last name/i), "Smith");

  await userEvent.click(screen.getByText("Submit"));
  expect(screen.getByText("first name too short")).toBeInTheDocument();
  expect(screen.getByText("last name too short")).toBeInTheDocument();
  expect(cb).not.toBeCalled();

  const contactB = within(screen.getByRole("group", { name: /contact b/i }));
  await userEvent.type(contactB.getByLabelText(/first name/i), "Bob");
  await userEvent.type(contactB.getByLabelText(/last name/i), "Ross");

  await userEvent.click(screen.getByText("Submit"));

  expect(cb).toHaveBeenCalledWith({
    contactA: { first: "John", last: "Smith" },
    contactB: { first: "Bob", last: "Ross" },
  });
});
