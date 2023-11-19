import { z } from "zod";
import {
  ControlledInput,
  Input,
  SubmitButton,
} from "~/formstand/demo-components";
import { useField, useForm } from "~/formstand/form";
import { handleSubmit } from "~/formstand/react";
import { zodAdapter } from "~/formstand/zod-validator";

function ArrayForm() {
  const form = useForm({
    validator: zodAdapter(
      z.object({
        names: z.array(
          z.object({
            first: z
              .string()
              .min(2, "first name too short")
              .max(10, "first name too long"),
            last: z
              .string()
              .min(2, "last name too short")
              .max(10, "last name too long"),
          })
        ),
      })
    ),
    initialValues: {
      names: [
        {
          first: "",
          last: "",
        },
      ],
    },
  });

  const names = form("names");
  const namesArray = useField({ formstand: names });

  return (
    <form
      onSubmit={handleSubmit(form, (data) => {
        alert(data);
      })}
    >
      {namesArray.value.map((name, index) => (
        <div key={index}>
          <label>
            First name
            <Input formstand={names(`${index}.first`)} />
          </label>
          <label>
            Last name
            <Input formstand={names(`${index}.last`)} />
          </label>
        </div>
      ))}
      <SubmitButton formstand={form} />
    </form>
  );
}

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
    <>
      <form
        onSubmit={handleSubmit(form, async (data) => {
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
      <hr />
      <ArrayForm />
    </>
  );
}
