import React, { Profiler } from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SearchControls } from "@/components/search-controls";
import { getSearchHref, getTagLabel, normalizeSearchCriteria, type SearchCriteria } from "@/lib/search-filters";

afterEach(cleanup);

const criteria = normalizeSearchCriteria({
  q: "Hades",
  tag: "Rogue-like",
  store: "steam",
  maxPrice: 0,
  discounted: true,
  sort: "price"
});

const tagOptions = [{ value: criteria.tag, label: getTagLabel(criteria.tag), count: 7 }];

function renderControls(input: SearchCriteria = criteria) {
  return render(<SearchControls criteria={input} tagOptions={tagOptions} />);
}

describe("SearchControls", () => {
  it("submits the expected native GET form fields", () => {
    expect(criteria.tag).toBe("Roguelike");
    renderControls();

    const form = screen.getByRole("search", { name: "검색 필터" }) as HTMLFormElement;
    fireEvent.change(screen.getByRole("searchbox", { name: "게임 검색" }), { target: { value: "Portal 2" } });
    fireEvent.change(screen.getByLabelText("태그·장르"), { target: { value: criteria.tag } });
    fireEvent.change(screen.getByLabelText("스토어"), { target: { value: "epic" } });
    fireEvent.change(screen.getByLabelText("최대 가격 (원)"), { target: { value: "15000" } });

    const submitted = new FormData(form);
    expect(screen.getByRole("button", { name: "게임 검색 실행" })).toHaveTextContent("검색하기");
    expect(form).toHaveAttribute("action", "/search");
    expect(screen.getByLabelText("최대 가격 (원)")).toHaveAttribute("step", "1");
    expect(screen.getByLabelText("최대 가격 (원)")).toHaveAttribute("max", "10000000");
    expect(submitted.get("q")).toBe("Portal 2");
    expect(submitted.get("tag")).toBe("Roguelike");
    expect(submitted.get("store")).toBe("epic");
    expect(submitted.get("maxPrice")).toBe("15000");
    expect(submitted.get("discounted")).toBe("1");
    expect(submitted.get("sort")).toBe("price");
  });

  it("removes a specific chip while retaining the other applied criteria", () => {
    renderControls();

    expect(screen.getByRole("link", { name: `태그: ${getTagLabel(criteria.tag)} 제거` })).toHaveAttribute(
      "href",
      getSearchHref({ ...criteria, tag: "" })
    );
  });

  it("renders zero max price as a removable applied chip", () => {
    renderControls();

    expect(screen.getByRole("link", { name: "최대 0원 제거" })).toHaveAttribute("href", getSearchHref({ ...criteria, maxPrice: undefined }));
  });

  it("clears filters while retaining the title query", () => {
    renderControls();

    expect(screen.getByRole("link", { name: "필터만 지우기" })).toHaveAttribute("href", "/search?q=Hades");
    expect(screen.getByRole("link", { name: "초기화" })).toHaveAttribute("href", "/search");
  });

  it("uses the empty-query relevance option as the default order label", () => {
    renderControls(normalizeSearchCriteria({ sort: "relevance" }));

    expect(screen.getByRole("option", { name: "기본순" })).toBeInTheDocument();
  });

  it("does not create React update commits while typing in uncontrolled fields", () => {
    const commits: string[] = [];
    render(
      <Profiler id="search-controls" onRender={(_id, phase) => commits.push(phase)}>
        <SearchControls criteria={criteria} tagOptions={tagOptions} />
      </Profiler>
    );
    commits.length = 0;

    const input = screen.getByRole("searchbox", { name: "게임 검색" });
    for (let index = 0; index < 20; index += 1) {
      fireEvent.change(input, { target: { value: `Portal ${index}` } });
    }

    expect(commits).toEqual([]);
  });
});