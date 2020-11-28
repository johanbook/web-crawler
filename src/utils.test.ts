jest.mock("uuid", () => ({
  v4: () => "uuid",
}));

import * as utils from "./utils";

describe("utils", () => {
  it("generates file name", () => {
    const name = utils.createImageName("file.png");
    expect(name).toBe("uuid.png");
  });
});
