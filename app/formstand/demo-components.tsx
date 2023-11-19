import type { ComponentProps } from "react";
import { useField, useIsSubmitting } from "./form";

export const Input = ({
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

export const SubmitButton = (props: ComponentProps<"button">) => {
  const isSubmitting = useIsSubmitting();
  return (
    <button {...props}>{isSubmitting ? "Submitting..." : "Submit"}</button>
  );
};
