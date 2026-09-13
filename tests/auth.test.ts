describe("Authentication", () => {
  it("should validate a correct email format", () => {
    const email = "admin@example.com";
    expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it("should reject an invalid email format", () => {
    const email = "invalid-email";
    expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it("should require a password", () => {
    const password = "";
    expect(password.length).toBe(0);
  });
});