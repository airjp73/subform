import { expect, it } from "vitest";

import { defaultMeta, makeFormStore } from "./store";
import { zodAdapter } from "./zod-validator";
import { z } from "zod";

const dummyValidator = (data: unknown) => ({ errors: {} });

it("should set values", () => {
  const store = makeFormStore({
    initialValues: {
      name: "test",
      age: 10,
    },
    validator: dummyValidator,
  });
  expect(store.getState().getValue("name")).toBe("test");
  store.getState().setValue("name", "bob");
  expect(store.getState().values.name).toBe("bob");
  expect(store.getState().getValue("name")).toBe("bob");
});

it("should set nested values", () => {
  const store = makeFormStore({
    initialValues: {
      bob: {
        ross: {
          name: "test",
          age: 10,
        },
      },
      jim: {
        ross: {
          name: "test",
          age: 10,
        },
      },
    },
    validator: dummyValidator,
  });
  store.getState().setValue("bob.ross.name", "bob");
  expect(store.getState().values.bob.ross.name).toBe("bob");
});

it("should update meta", () => {
  const store = makeFormStore({
    validator: dummyValidator,
    initialValues: {
      bob: {
        ross: {
          name: "test",
          age: 10,
        },
      },
    },
  });
  expect(store.getState().getMeta("bob.ross.name")).toEqual(defaultMeta);
  expect(store.getState().getMeta("bob.ross")).toEqual(defaultMeta);
  store.getState().setTouched("bob.ross.name", true);
  store.getState().setDirty("bob.ross", true);
  store.getState().setError("bob.ross", "Some error");

  expect(store.getState().getMeta("bob.ross.name")).toEqual({
    ...defaultMeta,
    touched: true,
  });
  expect(store.getState().getMeta("bob.ross")).toEqual({
    ...defaultMeta,
    dirty: true,
    error: "Some error",
  });
});

it("should handle change and blur events", () => {
  const store = makeFormStore({
    validator: dummyValidator,
    initialValues: {
      name: "test",
      age: 10,
    },
  });
  store.getState().onChange("name", "bob");
  expect(store.getState().values.name).toBe("bob");
  expect(store.getState().getMeta("name")).toEqual({
    ...defaultMeta,
    dirty: true,
  });

  store.getState().onBlur("name");
  expect(store.getState().getMeta("name")).toEqual({
    ...defaultMeta,
    dirty: true,
    touched: true,
  });
});

it("should validate", async () => {
  const store = makeFormStore({
    validator: zodAdapter(
      z.object({
        name: z.string().min(5, { message: "Name too short" }),
        age: z.number().min(18, { message: "Must be 18 or older" }),
      })
    ),
    initialValues: {
      name: "test",
      age: 10,
    },
  });
  await store.getState().validate();
  expect(store.getState().getMeta("name")).toEqual({
    ...defaultMeta,
    error: "Name too short",
  });
  expect(store.getState().getMeta("age")).toEqual({
    ...defaultMeta,
    error: "Must be 18 or older",
  });
});
