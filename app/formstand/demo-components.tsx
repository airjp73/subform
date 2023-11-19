import type { ComponentProps } from "react";
import type { Field, Formstand } from "./form";

export const Input = ({
  field,
  ...rest
}: ComponentProps<"input"> & { field: Field<string> }) => {
  const { getInputProps, meta } = field.useField();
  return (
    <div>
      <input {...getInputProps()} {...rest} />
      {meta.touched && meta.error && (
        <p style={{ color: "red" }}>{meta.error}</p>
      )}
    </div>
  );
};

export const SubmitButton = ({
  formstand,
  ...rest
}: ComponentProps<"button"> & { formstand: Formstand }) => {
  const isSubmitting = formstand.useIsSubmitting();
  return <button {...rest}>{isSubmitting ? "Submitting..." : "Submit"}</button>;
};
