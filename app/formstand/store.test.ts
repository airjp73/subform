import { expect, it } from "vitest";
import { defaultMeta, makeFormStore } from "./store";

it("should set values", () => {
  const store = makeFormStore({
    name: "test",
    age: 10,
  });
  expect(store.getState().getValue("name")).toBe("test");
  store.getState().setValue("name", "bob");
  expect(store.getState().values.name).toBe("bob");
  expect(store.getState().getValue("name")).toBe("bob");
});

it("should set nested values", () => {
  const store = makeFormStore({
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
  });
  store.getState().setValue("bob.ross.name", "bob");
  expect(store.getState().values.bob.ross.name).toBe("bob");
});

it("should update meta", () => {
  const store = makeFormStore({
    bob: {
      ross: {
        name: "test",
        age: 10,
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
