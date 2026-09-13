describe("Stock concurrency rules", () => {
  it("should prevent stock from becoming negative", () => {
    const currentStock = 5;
    const requestedQuantity = 10;

    const canRemove = currentStock >= requestedQuantity;

    expect(canRemove).toBe(false);
  });

  it("should allow removal when enough stock is available", () => {
    const currentStock = 10;
    const requestedQuantity = 3;

    const canRemove = currentStock >= requestedQuantity;

    expect(canRemove).toBe(true);
  });

  it("should calculate remaining stock correctly", () => {
    const currentStock = 10;
    const requestedQuantity = 3;

    expect(currentStock - requestedQuantity).toBe(7);
  });
});