import type { ComponentProps } from "react";
import { z } from "zod";
import { useField, useForm, useIsSubmitting } from "~/formstand/form";
import { zodAdapter } from "~/formstand/zod-validator";

const Input = ({
  name,
  ...rest
}: ComponentProps<"input"> & { name: string }) => {
  const field = useField({ name });
  return (
    <div>
      <input {...field.getInputProps()} {...rest} />
      <p style={{ color: "red" }}>{field.meta.error}</p>
    </div>
  );
};

const SubmitButton = (props: ComponentProps<"button">) => {
  const isSubmitting = useIsSubmitting();
  return (
    <button {...props}>{isSubmitting ? "Submitting..." : "Submit"}</button>
  );
};

export default function FormPage() {
  const form = useForm({
    validator: zodAdapter(
      z.object({
        name: z.object({
          first: z.string().min(2).max(10),
          last: z.string().min(2).max(10),
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
    <form.Provider>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          await new Promise((r) => setTimeout(r, 1000));
          alert(JSON.stringify(data));
        })}
      >
        <Input name="name.first" />
        <Input name="name.last" />
        <SubmitButton />
      </form>
    </form.Provider>
  );
}
