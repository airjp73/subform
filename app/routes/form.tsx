import { z } from "zod";
import { Input, SubmitButton } from "~/formstand/demo-components";
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
