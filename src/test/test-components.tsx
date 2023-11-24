import type { ComponentProps } from "react";
import { useField } from "../form";
import type { Subform } from "../subform";
import { useIsSubmitting } from "../react";

export function Input({
  subform,
  type,
  ...rest
}: ComponentProps<"input"> & {
  subform: Subform<string>;
}) {
  const { getInputProps, meta } = useField({ subform });
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
  subform,
  ...rest
}: ComponentProps<"input"> & {
  subform: Subform<string>;
}) {
  const { onChange, onBlur, meta, value } = useField({ subform });
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
  subform,
  ...rest
}: ComponentProps<"input"> & {
  subform: Subform<number>;
}) {
  const { getInputProps, meta } = useField({ subform });
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
  subform,
  ...rest
}: ComponentProps<"button"> & { subform: Subform<any> }) => {
  const isSubmitting = useIsSubmitting(subform);
  return <button {...rest}>{isSubmitting ? "Submitting..." : "Submit"}</button>;
};
