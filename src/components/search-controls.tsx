import type { Route } from "next";
import { getSearchHref, getTagLabel, type SearchCriteria, type SearchTagOption } from "@/lib/search-filters";

type SearchControlsProps = {
  criteria: SearchCriteria;
  tagOptions: SearchTagOption[];
};

type Chip = {
  key: string;
  label: string;
  href: Route;
};

const storeLabels: Record<SearchCriteria["store"], string> = {
  "": "전체 스토어",
  steam: "Steam",
  epic: "Epic Games"
};

function getSortLabel(criteria: SearchCriteria) {
  if (criteria.sort === "price") return "낮은 원화 가격순";
  if (criteria.sort === "discount") return "할인율순";
  if (criteria.sort === "title") return "가나다순";
  return criteria.q.trim() ? "관련도순" : "기본순";
}

function getCriteriaWithout(criteria: SearchCriteria, key: keyof SearchCriteria): SearchCriteria {
  if (key === "discounted") return { ...criteria, discounted: false };
  if (key === "store") return { ...criteria, store: "" };
  if (key === "sort") return { ...criteria, sort: "relevance" };
  if (key === "maxPrice") return { ...criteria, maxPrice: undefined };
  return { ...criteria, [key]: "" };
}

function getAppliedChips(criteria: SearchCriteria): Chip[] {
  const chips: Chip[] = [];
  const title = criteria.q.trim();

  if (title) {
    chips.push({ key: "q", label: `제목: ${title}`, href: getSearchHref(getCriteriaWithout(criteria, "q")) });
  }

  if (criteria.tag) {
    chips.push({ key: "tag", label: `태그: ${getTagLabel(criteria.tag)}`, href: getSearchHref(getCriteriaWithout(criteria, "tag")) });
  }

  if (criteria.store) {
    chips.push({ key: "store", label: `스토어: ${storeLabels[criteria.store]}`, href: getSearchHref(getCriteriaWithout(criteria, "store")) });
  }

  if (criteria.maxPrice !== undefined) {
    chips.push({ key: "maxPrice", label: `최대 ${criteria.maxPrice.toLocaleString("ko-KR")}원`, href: getSearchHref(getCriteriaWithout(criteria, "maxPrice")) });
  }

  if (criteria.discounted) {
    chips.push({ key: "discounted", label: "할인 중", href: getSearchHref(getCriteriaWithout(criteria, "discounted")) });
  }

  if (criteria.sort !== "relevance") {
    chips.push({ key: "sort", label: getSortLabel(criteria), href: getSearchHref(getCriteriaWithout(criteria, "sort")) });
  }

  return chips;
}

export function SearchControls({ criteria, tagOptions }: SearchControlsProps) {
  const chips = getAppliedChips(criteria);
  const hasSelectedTag = !criteria.tag || tagOptions.some((option) => option.value === criteria.tag);
  const filterClearHref = getSearchHref({
    q: criteria.q,
    tag: "",
    store: "",
    maxPrice: undefined,
    discounted: false,
    sort: "relevance"
  });

  return (
    <section className="search-controls" aria-labelledby="search-controls-title">
      <div className="search-controls__header">
        <div>
          <h2 id="search-controls-title">검색 조건</h2>
          <p>{criteria.q.trim() ? "게임 제목을 먼저 찾고, 태그와 가격으로 결과를 좁혀요." : "제목을 비워두면 현재 할인 중인 게임을 조건으로 둘러봐요."}</p>
        </div>
        <div className="search-controls__links" aria-label="검색 조건 관리">
          <a href={filterClearHref}>필터만 지우기</a>
          <a href="/search">초기화</a>
        </div>
      </div>

      <form className="search-controls__form" action="/search" method="get" role="search" aria-label="검색 필터">
        <label className="search-field search-field--title">
          <span>게임 제목</span>
          <input aria-label="게임 검색" name="q" type="search" defaultValue={criteria.q} placeholder="게임 제목으로 검색" autoComplete="off" />
        </label>

        <div className="search-controls__grid">
          <label className="search-field">
            <span>태그·장르</span>
            <select name="tag" defaultValue={criteria.tag}>
              <option value="">전체 태그</option>
              {!hasSelectedTag ? <option value={criteria.tag}>{getTagLabel(criteria.tag)}</option> : null}
              {tagOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.count === undefined ? option.label : `${option.label} (${option.count})`}
                </option>
              ))}
            </select>
          </label>

          <label className="search-field">
            <span>스토어</span>
            <select name="store" defaultValue={criteria.store}>
              <option value="">전체 스토어</option>
              <option value="steam">Steam</option>
              <option value="epic">Epic Games</option>
            </select>
          </label>

          <label className="search-field">
            <span>최대 가격 (원)</span>
            <input name="maxPrice" type="number" min="0" max="10000000" step="1" inputMode="numeric" defaultValue={criteria.maxPrice ?? ""} />
          </label>

          <label className="search-field">
            <span>정렬</span>
            <select name="sort" defaultValue={criteria.sort}>
              <option value="relevance">{criteria.q.trim() ? "관련도순" : "기본순"}</option>
              <option value="price">낮은 원화 가격순</option>
              <option value="discount">할인율순</option>
              <option value="title">가나다순</option>
            </select>
          </label>
        </div>

        <div className="search-controls__actions">
          <label className="search-checkbox">
            <input name="discounted" type="checkbox" value="1" defaultChecked={criteria.discounted} />
            <span>할인 중만 보기</span>
          </label>
          <button className="button button--primary" type="submit" aria-label="게임 검색 실행">
            검색하기
          </button>
        </div>
      </form>

      {chips.length ? (
        <div className="search-applied" aria-label="적용된 검색 조건">
          {chips.map((chip) => (
            <a className="search-chip" href={chip.href} key={chip.key} aria-label={`${chip.label} 제거`}>
              <span>{chip.label}</span>
              <span aria-hidden="true">×</span>
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}