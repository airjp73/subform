import type { ComponentProps } from "react";
import { z } from "zod";
import { useField, useForm } from "~/formstand/form";
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
        onSubmit={(e) => {
          e.preventDefault();
          alert(JSON.stringify(form.getValues()));
        }}
      >
        <Input name="name.first" />
        <Input name="name.last" />
        <button type="submit">Submit</button>
      </form>
    </form.Provider>
  );
}
