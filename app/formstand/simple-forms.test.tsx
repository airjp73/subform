import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { z } from "zod";
import { useForm } from "./form";
import { zodAdapter } from "./zod-validator";
import userEvent from "@testing-library/user-event";
import { Input, SubmitButton } from "./demo-components";
import type { ValidationBehaviorConfig } from "./store";

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

it("shoud validate on blur and change", async () => {
  const cb = vi.fn();
  render(<SimpleForm onSubmit={cb} />);

  expect(screen.queryByText("first name too short")).not.toBeInTheDocument();
  expect(screen.queryByText("last name too short")).not.toBeInTheDocument();
  expect(screen.queryByText("first name too long")).not.toBeInTheDocument();
  expect(screen.queryByText("last name too long")).not.toBeInTheDocument();

  await userEvent.type(screen.getByLabelText(/first name/i), "J");
  await userEvent.type(screen.getByLabelText(/last name/i), "S");
  await userEvent.tab();

  expect(screen.getByText("first name too short")).toBeInTheDocument();
  expect(screen.getByText("last name too short")).toBeInTheDocument();
  expect(screen.queryByText("first name too long")).not.toBeInTheDocument();
  expect(screen.queryByText("last name too long")).not.toBeInTheDocument();

  await userEvent.type(screen.getByLabelText(/first name/i), "ohn");
  await userEvent.type(screen.getByLabelText(/last name/i), "mith");

  expect(screen.queryByText("first name too short")).not.toBeInTheDocument();
  expect(screen.queryByText("last name too short")).not.toBeInTheDocument();
  expect(screen.queryByText("first name too long")).not.toBeInTheDocument();
  expect(screen.queryByText("last name too long")).not.toBeInTheDocument();

  await userEvent.type(screen.getByLabelText(/first name/i), "asdfasdfasdf");
  await userEvent.type(screen.getByLabelText(/last name/i), "asdfasdfasdf");

  expect(screen.queryByText("first name too short")).not.toBeInTheDocument();
  expect(screen.queryByText("last name too short")).not.toBeInTheDocument();
  expect(screen.getByText("first name too long")).toBeInTheDocument();
  expect(screen.getByText("last name too long")).toBeInTheDocument();

  await userEvent.clear(screen.getByLabelText(/first name/i));
  await userEvent.clear(screen.getByLabelText(/last name/i));
  await userEvent.type(screen.getByLabelText(/first name/i), "John");
  await userEvent.type(screen.getByLabelText(/last name/i), "Smith");
  await userEvent.click(screen.getByText("Submit"));

  expect(cb).toHaveBeenCalledWith({
    name: {
      first: "John",
      last: "Smith",
    },
  });
});

it("should customize validation behavior", async () => {
  render(
    <SimpleForm
      onSubmit={vi.fn()}
      validationBehavior={{
        initial: "onSubmit",
        whenTouched: "onSubmit",
        whenSubmitted: "onSubmit",
      }}
    />
  );

  await userEvent.type(screen.getByLabelText(/first name/i), "J");
  await userEvent.type(screen.getByLabelText(/last name/i), "S");
  await userEvent.tab();

  expect(screen.queryByText("first name too short")).not.toBeInTheDocument();
  expect(screen.queryByText("last name too short")).not.toBeInTheDocument();
  expect(screen.queryByText("first name too long")).not.toBeInTheDocument();
  expect(screen.queryByText("last name too long")).not.toBeInTheDocument();

  await userEvent.click(screen.getByText("Submit"));

  expect(screen.getByText("first name too short")).toBeInTheDocument();
  expect(screen.getByText("last name too short")).toBeInTheDocument();
  expect(screen.queryByText("first name too long")).not.toBeInTheDocument();
  expect(screen.queryByText("last name too long")).not.toBeInTheDocument();
});
