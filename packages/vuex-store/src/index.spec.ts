import Store, { includesFields, buildRegisterStoreUpdateFunc } from "./index";

describe("Exported Values", () => {
  it("Does not break the exported signature", () => {
    expect(Store).toBeTruthy();
    expect(includesFields).toBeTruthy();
    expect(buildRegisterStoreUpdateFunc).toBeTruthy();
  });
});
