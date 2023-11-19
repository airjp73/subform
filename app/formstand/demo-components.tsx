import type { ComponentProps } from "react";
import type { Formstand } from "./form";

export function Input({
  formstand,
  type,
  ...rest
}: ComponentProps<"input"> & {
  formstand: Formstand<string>;
}) {
  const { getInputProps, meta } = formstand.useField();
  return (
    <div>
      <input type={type} {...getInputProps()} {...rest} />
      {meta.touched && meta.error && (
        <p style={{ color: "red" }}>{meta.error}</p>
      )}
    </div>
  );
}

export function ControlledInput({
  formstand,
  ...rest
}: ComponentProps<"input"> & {
  formstand: Formstand<string>;
}) {
  const { onChange, onBlur, meta, value } = formstand.useField();
  return (
    <div>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onBlur={onBlur}
        {...rest}
      />
      {meta.touched && meta.error && (
        <p style={{ color: "red" }}>{meta.error}</p>
      )}
    </div>
  );
}

export function NumberInput({
  formstand,
  ...rest
}: ComponentProps<"input"> & {
  formstand: Formstand<number>;
}) {
  const { getInputProps, meta } = formstand.useField();
  return (
    <div>
      <input
        {...getInputProps({
          format: (value) => value.toString(),
          parse: (value) => Number(value),
        })}
        {...rest}
      />
      {meta.touched && meta.error && (
        <p style={{ color: "red" }}>{meta.error}</p>
      )}
    </div>
  );
}

export const SubmitButton = ({
  formstand,
  ...rest
}: ComponentProps<"button"> & { formstand: Formstand<any> }) => {
  const isSubmitting = formstand.useIsSubmitting();
  return <button {...rest}>{isSubmitting ? "Submitting..." : "Submit"}</button>;
};
