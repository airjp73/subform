import { describe, expect, expectTypeOf, it } from "vitest";

import type { DataAtPath, Paths } from "../store";
import { defaultMeta, makeFormStore } from "../store";
import { zodAdapter } from "../zod-validator";
import { z } from "zod";
import type { Subform } from "../subform";
import { createSubform } from "../subform";

const dummyValidator = (data: unknown) => ({ errors: {} });

it("type tests", () => {
  expectTypeOf<DataAtPath<{ a: string }, "a">>().toMatchTypeOf<string>();
  expectTypeOf<
    DataAtPath<{ a: { b: { c: number } } }, "a.b.c">
  >().toMatchTypeOf<number>();
  expectTypeOf<DataAtPath<{ a: number[] }, "a.0">>().toMatchTypeOf<number>();
  expectTypeOf<DataAtPath<{ a: { b: string }[] }, "a.0">>().toMatchTypeOf<{
    b: string;
  }>();
  expectTypeOf<Paths<{ a: { b: string }[] }>>(
    "a.0.b"
  ).not.toMatchTypeOf<"a.b">();

  // @ts-expect-error
  expectTypeOf<Paths<{ a: { b: string }[] }>>("a.0.c");

  const data = {
    comments: [
      {
        content: "",
      },
    ],
    tuple: ["", { b: new Date() }] as [string, { b: Date }],
  };
  const subform = createSubform({
    initialValues: data,
    validator: dummyValidator,
  });
  const firstComment = subform("comments.0");
  expectTypeOf(firstComment).toMatchTypeOf<Subform<{ content: string }>>();

  expectTypeOf(subform("tuple.1.b")).toMatchTypeOf<Subform<{ c: Date }>>();
});

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

it("should set array values", () => {
  const store = makeFormStore({
    initialValues: {
      names: ["bob", "ross"],
      info: [
        {
          name: "bob",
          age: 10,
        },
        {
          name: "ross",
          age: 20,
        },
      ],
    },
    validator: dummyValidator,
  });
  store.getState().setValue("names.0", "jim");
  expect(store.getState().values.names[0]).toBe("jim");

  store.getState().setValue("info.1.age", 30);
  expect(store.getState().values.info[1]?.age).toBe(30);
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

describe("arrays", () => {
  it("should pop", () => {
    const store = makeFormStore({
      validator: dummyValidator,
      initialValues: {
        names: ["bob", "ross"],
      },
    });
    const value = store.getState().array.pop("names");
    expect(store.getState().values.names).toEqual(["bob"]);
    expect(value).toEqual("ross");
  });

  it("should insert", () => {
    const store = makeFormStore({
      validator: dummyValidator,
      initialValues: {
        names: ["bob", "ross"],
      },
    });
    store.getState().array.insert("names", 1, "jim");
    expect(store.getState().values.names).toEqual(["bob", "jim", "ross"]);
  });

  it("should move", () => {
    const store = makeFormStore({
      validator: dummyValidator,
      initialValues: {
        names: ["foo", "bar", "baz", "qux"],
      },
    });
    store.getState().array.move("names", 1, 2);
    expect(store.getState().values.names).toEqual(["foo", "baz", "bar", "qux"]);
  });

  it("should push", () => {
    const store = makeFormStore({
      validator: dummyValidator,
      initialValues: {
        names: ["bob", "ross"],
      },
    });
    store.getState().array.push("names", "jim");
    expect(store.getState().values.names).toEqual(["bob", "ross", "jim"]);
  });

  it("should remove", () => {
    const store = makeFormStore({
      validator: dummyValidator,
      initialValues: {
        names: ["bob", "ross", "jim"],
      },
    });
    const item = store.getState().array.remove("names", 1);
    expect(store.getState().values.names).toEqual(["bob", "jim"]);
    expect(item).toEqual("ross");
  });

  it("should replace", () => {
    const store = makeFormStore({
      validator: dummyValidator,
      initialValues: {
        names: ["bob", "ross"],
      },
    });
    const item = store.getState().array.replace("names", 1, "jim");
    expect(store.getState().values.names).toEqual(["bob", "jim"]);
    expect(item).toEqual("ross");
  });

  it("should shift", () => {
    const store = makeFormStore({
      validator: dummyValidator,
      initialValues: {
        names: ["bob", "ross"],
      },
    });
    const value = store.getState().array.shift("names");
    expect(store.getState().values.names).toEqual(["ross"]);
    expect(value).toEqual("bob");
  });

  it("should unshift", () => {
    const store = makeFormStore({
      validator: dummyValidator,
      initialValues: {
        names: ["bob", "ross"],
      },
    });
    store.getState().array.unshift("names", "jim");
    expect(store.getState().values.names).toEqual(["jim", "bob", "ross"]);
  });

  it("should swap", () => {
    const store = makeFormStore({
      validator: dummyValidator,
      initialValues: {
        names: ["bob", "ross"],
      },
    });
    store.getState().array.swap("names", 0, 1);
    expect(store.getState().values.names).toEqual(["ross", "bob"]);
  });
});
