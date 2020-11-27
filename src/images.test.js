jest.mock("uuid", () => ({
  v4: () => "uuid",
}));

const imageTools = require("./images");

describe("images", () => {
  it("generates file name", () => {
    const name = imageTools.createImageName("file.png");
    expect(name).toBe("uuid.png");
  });
});
