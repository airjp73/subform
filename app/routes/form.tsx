import { z } from "zod";
import {
  ControlledInput,
  Input,
  SubmitButton,
} from "~/formstand/demo-components";
import { useForm } from "~/formstand/form";
import { zodAdapter } from "~/formstand/zod-validator";

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
    <form
      onSubmit={form.handleSubmit(async (data) => {
        await new Promise((r) => setTimeout(r, 1000));
        alert(JSON.stringify(data));
      })}
    >
      <Input formstand={form("name.first")} />
      <Input formstand={form("name.last")} />
      <Input formstand={form("name.first")} />
      <ControlledInput formstand={form("name.first")} />
      <SubmitButton formstand={form} />
    </form>
  );
}
