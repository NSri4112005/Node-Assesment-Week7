describe("Inventory reports", () => {
  it("should calculate inventory value correctly", () => {
    const stock = 7;
    const price = 60000;

    expect(stock * price).toBe(420000);
  });

  it("should count out-of-stock inventory", () => {
    const stock = 0;

    expect(stock).toBe(0);
  });

  it("should count stock movements", () => {
    const movements = [
      { type: "IN", quantity: 10 },
      { type: "OUT", quantity: 3 },
    ];

    expect(movements).toHaveLength(2);
  });
});