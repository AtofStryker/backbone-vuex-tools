import hashFields from "./includes-fields";

describe("includes fields", () => {
  it("returns false when no fields are present in options object", () => {
    const containsFields = hashFields();
    expect(containsFields).toBe(false);

    const containsFields2 = hashFields({
      include: "kitty",
      filter: "dogs",
      "page[offset]": "",
    });
    expect(containsFields2).toBe(false);
  });
  it("returns true when fields are present in options object", () => {
    const containsFields = hashFields({
      include: "kitty",
      filter: "dogs",
      "page[offset]": "",
      "fields[kitty]": "paw,meow,lives",
    });
    expect(containsFields).toBe(true);
  });
});
