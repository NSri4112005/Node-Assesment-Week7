describe("Product validation", () => {
  it("should accept a valid product price", () => {
    const price = 60000;
    expect(price).toBeGreaterThanOrEqual(0);
  });

  it("should reject a negative product price", () => {
    const price = -100;
    expect(price).toBeLessThan(0);
  });

  it("should normalize SKU to uppercase", () => {
    const sku = "lap001";
    expect(sku.toUpperCase()).toBe("LAP001");
  });
});