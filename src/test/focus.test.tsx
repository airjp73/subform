import { render, screen } from "@testing-library/react";
import { handleSubmit } from "src/react";
import { createSubform } from "src/subform";
import { zodAdapter } from "src/zod-validator";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { Input } from "./test-components";
import userEvent from "@testing-library/user-event";

it("should focus first invalid field on submit", async () => {
  const form = createSubform({
    validator: zodAdapter(
      z.object({
        first: z.string().min(2, "first name too short"),
        middle: z.string().min(2, "middle name too short"),
        last: z.string().min(2, "last name too short"),
      })
    ),
    initialValues: {
      first: "",
      middle: "",
      last: "",
    },
  });

  const submit = vi.fn();
  render(
    <>
      {/* Random extra inputs to mess with the focus logic */}
      <input name="first" />
      <input name="middle" />
      <input name="last" />
      <form onSubmit={handleSubmit(form, submit)}>
        <label>
          First
          <Input subform={form("first")} />
        </label>
        <label>
          Middle
          <Input subform={form("middle")} />
        </label>
        <label>
          Last
          <Input subform={form("last")} />
        </label>
        <button type="submit">Submit</button>
      </form>
    </>
  );

  await userEvent.click(screen.getByText("Submit"));
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByLabelText("First")).toHaveFocus();

  await userEvent.type(screen.getByLabelText("First"), "ab");
  await userEvent.click(screen.getByText("Submit"));
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Middle")).toHaveFocus();

  await userEvent.type(screen.getByLabelText("Middle"), "cd");
  await userEvent.click(screen.getByText("Submit"));
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Last")).toHaveFocus();

  await userEvent.type(screen.getByLabelText("Last"), "ef");
  await userEvent.click(screen.getByText("Submit"));
  expect(submit).toHaveBeenCalledWith({
    first: "ab",
    middle: "cd",
    last: "ef",
  });
});
