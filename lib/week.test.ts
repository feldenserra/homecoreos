import { aggregateNutrition } from "./recipe-nutrition";
import {
  addDays,
  formatDate,
  mondayOf,
  parseDate,
  shiftWeek,
  sundayOf,
  weekDates,
} from "./week";

describe("week", () => {
  it("formats and parses local calendar dates", () => {
    expect(formatDate(new Date(2026, 8, 3))).toBe("2026-09-03");
    const d = parseDate("2026-09-03");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(3);
  });

  it("returns Monday for mid-week and Sunday dates", () => {
    // Thursday Sep 3, 2026 → Monday Aug 31
    expect(mondayOf(new Date(2026, 8, 3))).toBe("2026-08-31");
    // Sunday Sep 6, 2026 → Monday Aug 31
    expect(mondayOf(new Date(2026, 8, 6))).toBe("2026-08-31");
    // Monday Aug 31 stays Monday
    expect(mondayOf(new Date(2026, 7, 31))).toBe("2026-08-31");
  });

  it("computes Sunday and shifts weeks", () => {
    expect(sundayOf("2026-08-31")).toBe("2026-09-06");
    expect(shiftWeek("2026-08-31", 1)).toBe("2026-09-07");
    expect(shiftWeek("2026-08-31", -1)).toBe("2026-08-24");
    expect(addDays("2026-08-31", 3)).toBe("2026-09-03");
  });

  it("lists Mon–Sun dates", () => {
    expect(weekDates("2026-08-31")).toEqual([
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
      "2026-09-06",
    ]);
  });
});

describe("recipe-nutrition", () => {
  it("sums macros × quantity and treats null as 0", () => {
    expect(
      aggregateNutrition([
        {
          quantity: 2,
          calories: 100,
          carbsGrams: 10,
          fatsGrams: null,
          proteinGrams: "5",
        },
        {
          quantity: 1,
          calories: null,
          carbsGrams: 3,
          fatsGrams: 1.5,
          proteinGrams: undefined,
        },
      ]),
    ).toEqual({
      calories: 200,
      carbsGrams: 23,
      fatsGrams: 1.5,
      proteinGrams: 10,
    });
  });

  it("returns zeros for an empty recipe", () => {
    expect(aggregateNutrition([])).toEqual({
      calories: 0,
      carbsGrams: 0,
      fatsGrams: 0,
      proteinGrams: 0,
    });
  });
});
