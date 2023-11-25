import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { useRef } from "react";
import type { Subform } from "src";
import {
  handleSubmit,
  useField,
  useFieldArray,
  useForm,
  useIsSubmitting,
} from "../react";
import { zodAdapter } from "../zod";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import userEvent from "@testing-library/user-event";

const RenderCounter = ({ name }: { name: string }) => {
  const renderCount = useRef(0);
  renderCount.current++;
  return <div data-testid={name}>{renderCount.current}</div>;
};

export function Input({
  subform,
  type,
  ...rest
}: ComponentProps<"input"> & {
  subform: Subform<string>;
}) {
  const { getInputProps, meta } = useField(subform);
  return (
    <div>
      <RenderCounter name={`${subform.path}-render-count`} />
      <input type={type} {...getInputProps()} {...rest} />
      {meta.touched && meta.error && (
        <p style={{ color: "red" }}>{meta.error}</p>
      )}
    </div>
  );
}

const SubmitButton = ({ sf }: { sf: Subform<any> }) => {
  const isSubmitting = useIsSubmitting(sf);
  return (
    <>
      <RenderCounter name="submit-render-count" />
      <button type="submit">{isSubmitting ? "Submitting..." : "Submit"}</button>
    </>
  );
};

const Names = ({ sf }: { sf: Subform<Array<{ name: string }>> }) => {
  const array = useFieldArray(sf);
  return (
    <ul>
      <RenderCounter name="names-render-count" />
      {array.map((item, key) => (
        <li key={key}>
          <Input data-testid={item("name").path} subform={item("name")} />
        </li>
      ))}
      <button
        type="button"
        onClick={() => {
          array.push({ name: "" });
        }}
      >
        Add contact
      </button>
    </ul>
  );
};

const TestComponent = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const sf = useForm({
    initialValues: {
      name: "",
      contacts: [
        {
          name: "",
        },
      ],
    },
    validator: zodAdapter(
      z.object({
        name: z.string(),
        contacts: z.array(
          z.object({
            name: z.string().max(6, "Too long"),
          })
        ),
      })
    ),
  });

  return (
    <form onSubmit={handleSubmit(sf, onSubmit)}>
      <RenderCounter name="form-render-count" />
      <Input subform={sf("name")} />
      <Names sf={sf("contacts")} />
      <SubmitButton sf={sf} />
    </form>
  );
};

const expectRenderCounts = (counts: Record<string, number>) => {
  Object.entries(counts).forEach(([name, count]) => {
    expect(screen.getByTestId(`${name}-render-count`)).toHaveTextContent(
      String(count)
    );
  });
};

it("shouldn't render more than necessary", async () => {
  const submit = vi.fn();
  render(<TestComponent onSubmit={submit} />);

  expectRenderCounts({
    form: 1,
    names: 1,
    "contacts.0.name": 1,
  });

  await userEvent.type(screen.getByTestId("contacts.0.name"), "jimbob");
  expectRenderCounts({
    form: 1,
    names: 1,
    "contacts.0.name": 7,
  });

  // Bluring the field should incur an additional render
  await userEvent.click(screen.getByTestId("form-render-count"));
  expectRenderCounts({
    form: 1,
    names: 1,
    submit: 1,
    "contacts.0.name": 8,
  });

  await userEvent.click(screen.getByText("Add contact"));
  expectRenderCounts({
    form: 1,
    submit: 1,
    names: 2,
    "contacts.0.name": 9,
    "contacts.1.name": 1,
  });

  await userEvent.type(screen.getByTestId("contacts.1.name"), "bobjim");
  expectRenderCounts({
    form: 1,
    submit: 1,
    names: 2,
    "contacts.0.name": 9,
    "contacts.1.name": 7,
  });

  await userEvent.click(screen.getByTestId("form-render-count"));
  expectRenderCounts({
    form: 1,
    submit: 1,
    names: 2,
    "contacts.0.name": 9,
    "contacts.1.name": 8,
  });

  // Typeing here causes a validation error.
  // So we get one update for the change, then one for the validation error.
  // This is unavoidable because validation is async
  await userEvent.type(screen.getByTestId("contacts.1.name"), "m");
  expectRenderCounts({
    form: 1,
    submit: 1,
    names: 2,
    "contacts.0.name": 9,
    "contacts.1.name": 10,
  });

  // One render to clear error, one to update value
  await userEvent.type(screen.getByTestId("contacts.1.name"), "{Backspace}");
  expectRenderCounts({
    form: 1,
    submit: 1,
    names: 2,
    "contacts.0.name": 9,
    "contacts.1.name": 12,
  });

  await userEvent.click(screen.getByText("Submit"));
  expectRenderCounts({
    form: 1,
    submit: 3,
    names: 3,
    "contacts.0.name": 10,
    "contacts.1.name": 13,
  });
});
