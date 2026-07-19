import data from './data/locations.json';

type RawCountry = { id: string; name: string };
type RawState = { id: string; name: string; type: 'state' | 'province'; countryId: string };
type RawCity = { id: string; name: string; stateId: string | null; countryId: string };

export type LocationNode = {
  id: string;
  name: string;
  type: 'city' | 'state' | 'province' | 'country';
  parentId: string | null;
  display(): string;
};

const byId = new Map<string, LocationNode>();
let memoized: LocationNode[] | null = null;

function buildNodes(): LocationNode[] {
  if (memoized) return memoized;

  // First pass: build country + state nodes.
  for (const c of data.countries as RawCountry[]) {
    byId.set(c.id, {
      id: c.id,
      name: c.name,
      type: 'country',
      parentId: null,
      display: () => c.name,
    });
  }
  for (const s of data.states as RawState[]) {
    byId.set(s.id, {
      id: s.id,
      name: s.name,
      type: s.type,
      parentId: s.countryId,
      display: () => {
        const country = byId.get(s.countryId);
        return country ? `${s.name}, ${country.name}` : s.name;
      },
    });
  }
  // Second pass: build city nodes — they need to read parent state.
  for (const c of data.cities as RawCity[]) {
    byId.set(c.id, {
      id: c.id,
      name: c.name,
      type: 'city',
      parentId: c.stateId,
      display: () => {
        const parts: string[] = [c.name];
        if (c.stateId) {
          const state = byId.get(c.stateId);
          if (state) {
            parts.push(state.name);
            const country = byId.get(state.parentId!);
            if (country) parts.push(country.name);
          } else {
            const country = byId.get(c.countryId);
            if (country) parts.push(country.name);
          }
        } else {
          const country = byId.get(c.countryId);
          if (country) parts.push(country.name);
        }
        return parts.join(', ');
      },
    });
  }

  memoized = Array.from(byId.values());
  return memoized;
}

export function getLocations(): LocationNode[] {
  return buildNodes();
}

export function getCountries(): string[] {
  return (data.countries as RawCountry[]).map((c) => c.name);
}

export function isRecognizedCountry(value: string): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return (data.countries as RawCountry[]).some((c) => c.name.toLowerCase() === v);
}

// In-memory index for fast prefix search. Built lazily on first call.
let byNameIndex: Map<string, LocationNode[]> | null = null;

function buildNameIndex(): Map<string, LocationNode[]> {
  if (byNameIndex) return byNameIndex;
  const idx = new Map<string, LocationNode[]>();
  for (const n of buildNodes()) {
    const key = n.name.toLowerCase();
    const arr = idx.get(key);
    if (arr) arr.push(n);
    else idx.set(key, [n]);
  }
  byNameIndex = idx;
  return idx;
}

export function findByPrefix(query: string, limit = 10): LocationNode[] {
  if (!query) return [];
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const idx = buildNameIndex();
  const out: LocationNode[] = [];

  // First pass: exact-prefix matches.
  for (const [name, nodes] of idx) {
    if (name.startsWith(q)) {
      for (const n of nodes) {
        out.push(n);
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}
