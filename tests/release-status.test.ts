import { describe, expect, it } from "vitest";
import { getDateAwareReleaseStatus } from "@/lib/release-status";

const JUNE_4_2026 = new Date("2026-06-04T00:00:00+09:00").getTime();

describe("release status normalization", () => {
  it("marks past release dates as released even when the source says upcoming", () => {
    expect(getDateAwareReleaseStatus({
      releaseDate: "2025-02-28",
      releaseStatus: "upcoming"
    }, JUNE_4_2026)).toBe("released");
  });

  it("keeps future release dates as upcoming", () => {
    expect(getDateAwareReleaseStatus({
      releaseDate: "2027-02-28",
      releaseStatus: "released"
    }, JUNE_4_2026)).toBe("upcoming");
  });

  it("keeps unknown status when there is no release date", () => {
    expect(getDateAwareReleaseStatus({
      releaseStatus: "unknown"
    }, JUNE_4_2026)).toBe("unknown");
  });
});
