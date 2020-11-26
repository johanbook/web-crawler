jest.mock("uuid", () => ({
  v4: () => "file",
}));

const imageTools = require("./images");

describe("images", () => {
  it("leaves filename untouched", () => {
    const name = imageTools.createImageName("file.png");
    expect(name).toBe("file.png");
  });

  it("strips query", () => {
    const name = imageTools.createImageName("file.png?width=100%&height=100");
    expect(name).toBe("file.png");
  });
});
