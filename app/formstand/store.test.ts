import { expect, it } from "vitest";

import { defaultMeta, makeFormStore } from "./store";

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
