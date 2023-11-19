import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { z } from "zod";
import { useField, useForm } from "../form";
import { zodAdapter } from "../zod-validator";
import userEvent from "@testing-library/user-event";
import { Input, SubmitButton } from "../demo-components";
import type { ValidationBehaviorConfig } from "../store";
import { handleSubmit } from "../react";

function ArrayForm({
  onSubmit,
  validationBehavior,
}: {
  onSubmit: (data: any) => void;
  validationBehavior?: ValidationBehaviorConfig;
}) {
  const form = useForm({
    validator: zodAdapter(
      z.object({
        names: z.array(
          z.object({
            first: z
              .string()
              .min(2, "first name too short")
              .max(10, "first name too long"),
            last: z
              .string()
              .min(2, "last name too short")
              .max(10, "last name too long"),
          })
        ),
      })
    ),
    initialValues: {
      names: [
        {
          first: "",
          last: "",
        },
      ],
    },
    validationBehavior,
  });

  const names = form("names");
  const namesArray = useField({ formstand: names });

  return (
    <form
      onSubmit={handleSubmit(form, (data) => {
        onSubmit(data);
      })}
    >
      {namesArray.value.map((name, index) => (
        <div key={index}>
          <label>
            First name
            <Input formstand={names("0.first")} />
          </label>
          <label>
            Last name
            <Input formstand={names("0.last")} />
          </label>
        </div>
      ))}
      <SubmitButton formstand={form} />
    </form>
  );
}

it("should submit a basic form", async () => {
  const cb = vi.fn();
  render(<ArrayForm onSubmit={cb} />);
  await userEvent.click(screen.getByText("Submit"));
  expect(screen.getByText("first name too short")).toBeInTheDocument();
  expect(screen.getByText("last name too short")).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText(/first name/i), "John");
  await userEvent.type(screen.getByLabelText(/last name/i), "John");
  await userEvent.click(screen.getByText("Submit"));
  expect(cb).toHaveBeenCalledWith({
    names: [
      {
        first: "John",
        last: "John",
      },
    ],
  });
});
