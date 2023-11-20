import * as R from "remeda";

export const simpleId = () => `${R.randomString(10)}${Date.now()}`;
