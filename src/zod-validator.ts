import type { z } from "zod";
import type { FieldErrors, Validator } from "./store";

const getIssuesForError = (err: z.ZodError<any>): z.ZodIssue[] => {
  return err.issues.flatMap((issue) => {
    if ("unionErrors" in issue) {
      return issue.unionErrors.flatMap((err) => getIssuesForError(err));
    } else {
      return [issue];
    }
  });
};

export const zodAdapter =
  <T, U extends z.ZodTypeDef>(schema: z.Schema<T, U, unknown>): Validator<T> =>
  async (data) => {
    const result = await schema.safeParseAsync(data);
    if (result.success) return { data: result.data };

    const fieldErrors: FieldErrors = {};
    getIssuesForError(result.error).forEach((issue) => {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    });
    return { errors: fieldErrors };
  };
