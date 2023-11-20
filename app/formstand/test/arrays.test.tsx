import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { z } from "zod";
import { useFieldArray, useForm } from "../form";
import { zodAdapter } from "../zod-validator";
import userEvent from "@testing-library/user-event";
import { Input, SubmitButton } from "./test-components";
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
        names: z
          .array(
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
          )
          .max(2, "too many names"),
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

  const names = useFieldArray({ formstand: form("names") });

  return (
    <form
      onSubmit={handleSubmit(form, (data) => {
        onSubmit(data);
      })}
    >
      {names.map((name, key, index) => {
        return (
          <div key={key} data-testid="name-fields">
            <label>
              First name
              <Input formstand={name("first")} />
            </label>
            <label>
              Last name
              <Input formstand={name("last")} />
            </label>
            <button type="button" onClick={() => names.remove(index)}>
              Remove
            </button>
          </div>
        );
      })}
      {names.error && <p>{names.error}</p>}
      <button type="button" onClick={() => names.push({ first: "", last: "" })}>
        Push
      </button>
      <button
        type="button"
        onClick={() => names.unshift({ first: "", last: "" })}
      >
        Unshift
      </button>
      <button type="button" onClick={() => names.shift()}>
        Shift
      </button>
      <button type="button" onClick={() => names.pop()}>
        Pop
      </button>
      <button type="button" onClick={() => names.swap(0, 1)}>
        Swap
      </button>
      <button type="button" onClick={() => names.move(0, 2)}>
        Move
      </button>
      <button
        type="button"
        onClick={() => names.insert(1, { first: "", last: "" })}
      >
        Insert
      </button>
      <SubmitButton formstand={form} />
    </form>
  );
}

it("should submit a form with arrays", async () => {
  const cb = vi.fn();
  render(<ArrayForm onSubmit={cb} />);

  const firstName = () =>
    screen.getAllByRole("textbox", { name: /first name/i });
  const lastName = () => screen.getAllByRole("textbox", { name: /last name/i });

  expect(screen.getAllByTestId("name-fields")).toHaveLength(1);
  await userEvent.type(firstName()[0], "John");
  await userEvent.type(lastName()[0], "Doe");

  await userEvent.click(screen.getByText("Push"));
  expect(screen.getAllByTestId("name-fields")).toHaveLength(2);
  await userEvent.type(firstName()[1], "Bob");
  await userEvent.type(lastName()[1], "Ross");
  expect(screen.queryByText("too many names")).not.toBeInTheDocument();

  await userEvent.click(screen.getByText("Unshift"));
  expect(screen.getAllByTestId("name-fields")).toHaveLength(3);
  await userEvent.type(firstName()[0], "Luke");
  await userEvent.type(lastName()[0], "Skywalker");
  expect(screen.getByText("too many names")).toBeInTheDocument();

  expect(firstName().map((el) => (el as any).value)).toEqual([
    "Luke",
    "John",
    "Bob",
  ]);

  await userEvent.click(screen.getByText("Swap"));
  expect(firstName().map((el) => (el as any).value)).toEqual([
    "John",
    "Luke",
    "Bob",
  ]);

  await userEvent.click(screen.getByText("Move"));
  expect(firstName().map((el) => (el as any).value)).toEqual([
    "Luke",
    "Bob",
    "John",
  ]);

  await userEvent.click(screen.getByText("Insert"));
  expect(firstName().map((el) => (el as any).value)).toEqual([
    "Luke",
    "",
    "Bob",
    "John",
  ]);
  await userEvent.type(firstName()[1], "Han");
  await userEvent.type(lastName()[1], "Solo");
  expect(firstName().map((el) => (el as any).value)).toEqual([
    "Luke",
    "Han",
    "Bob",
    "John",
  ]);

  await userEvent.click(screen.getAllByText("Remove")[1]);
  expect(firstName().map((el) => (el as any).value)).toEqual([
    "Luke",
    "Bob",
    "John",
  ]);

  await userEvent.click(screen.getByText("Shift"));
  expect(firstName().map((el) => (el as any).value)).toEqual(["Bob", "John"]);
  expect(screen.queryByText("too many names")).not.toBeInTheDocument();

  await userEvent.click(screen.getByText("Pop"));
  expect(firstName().map((el) => (el as any).value)).toEqual(["Bob"]);

  await userEvent.click(screen.getByText("Submit"));
  expect(cb).toBeCalledTimes(1);
  expect(cb).toHaveBeenCalledWith({
    names: [{ first: "Bob", last: "Ross" }],
  });
});
