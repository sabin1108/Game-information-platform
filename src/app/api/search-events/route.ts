import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "gdw_search_terms";
const MAX_TERMS = 12;

function normalizeTerm(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 40) : "";
}

function parseTerms(value: string | undefined) {
  if (!value) {
    return [];
  }

  try {
    const terms = JSON.parse(value);

    return Array.isArray(terms)
      ? terms.map(normalizeTerm).filter(Boolean).slice(0, MAX_TERMS)
      : [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));
  const nextTerms = [normalizeTerm(payload.query), normalizeTerm(payload.tag)].filter(Boolean);
  const currentTerms = parseTerms(request.cookies.get(COOKIE_NAME)?.value);
  const deduped = [...nextTerms, ...currentTerms].filter((term, index, list) => list.indexOf(term) === index);
  const response = NextResponse.json({ ok: true, terms: deduped.slice(0, MAX_TERMS) });

  response.cookies.set(COOKIE_NAME, JSON.stringify(deduped.slice(0, MAX_TERMS)), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax"
  });

  return response;
}
