jest.mock("uuid", () => ({
  v4: () => "uuid",
}));

const utils = require("./utils");

describe("utils", () => {
  it("generates file name", () => {
    const name = utils.createImageName("file.png");
    expect(name).toBe("uuid.png");
  });
});
