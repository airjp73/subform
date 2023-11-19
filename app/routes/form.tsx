import type { ComponentProps } from "react";
import { useField, useForm } from "~/formstand/form";

const Input = ({
  name,
  ...rest
}: ComponentProps<"input"> & { name: string }) => {
  const field = useField(name);
  return (
    <div>
      <input {...field.getInputProps()} {...rest} />
      <p style={{ color: "red" }}>{field.meta.error}</p>
    </div>
  );
};

export default function FormPage() {
  const form = useForm({
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
