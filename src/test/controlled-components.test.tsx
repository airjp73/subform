import { z } from "zod";
import { useForm } from "../react/form";
import { zodAdapter } from "../zod";
import { ControlledInput, SubmitButton } from "./test-components";
import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { handleSubmit } from "../react/react";

function Form({ onSubmit }: { onSubmit: (data: any) => void }) {
  const form = useForm({
    validator: zodAdapter(
      z.object({
        text: z.string(),
      })
    ),
    initialValues: {
      text: "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit(form, (data) => {
        onSubmit(data);
      })}
    >
      <label>
        Text
        <ControlledInput subform={form("text")} />
      </label>
      <SubmitButton subform={form} />
    </form>
  );
}

it("should submit a basic form", async () => {
  const cb = vi.fn();
  render(<Form onSubmit={cb} />);
  await userEvent.type(screen.getByLabelText(/text/i), "Hello");
  await userEvent.click(screen.getByText("Submit"));
  expect(cb).toHaveBeenCalledWith({
    text: "Hello",
  });
});
