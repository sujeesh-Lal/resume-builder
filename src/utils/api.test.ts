import { fetchUser } from "./api";
import { delayedCallback } from "./utils";

jest.mock("./api"); // Mocks the entire module

describe("Api", () => {
  it("fetchUser returns mock data", async () => {
    (fetchUser as jest.Mock).mockResolvedValue({ id: 1, name: "Alice" });
    const result = await fetchUser();
    expect(result).toEqual({ id: 1, name: "Alice" });
  });

  test("calls callback with message", (done) => {
    delayedCallback((message) => {
      expect(message).toBe("hello");
      done(); // ✅ test will only finish here
    });
  });
});
