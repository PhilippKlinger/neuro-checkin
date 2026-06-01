import { createPagedLoader, PAGE_SIZE } from '../lib/hooks/usePagedCheckIns';
import type { CheckIn } from '../lib/types/checkin';
import { EMPTY_BODY_SIGNALS } from '../lib/types/checkin';

function makeCheckIn(id: number, hoursAgo: number): CheckIn {
  const d = new Date();
  d.setHours(d.getHours() - hoursAgo);
  return {
    id,
    createdAt: d.toISOString().replace('T', ' ').slice(0, 19),
    energyLevel: 3,
    focusLevel: 3,
    energySkipped: false,
    focusSkipped: false,
    bodySignals: { ...EMPTY_BODY_SIGNALS },
    feelings: '',
    feelingsSkipped: false,
    distressLevel: null,
    distressNote: null,
    thoughtsType: null,
    thoughtsNote: null,
    selfCareNote: null,
    innerPart: null,
    note: null,
  };
}

function makePagedFetcher(pages: CheckIn[][]) {
  let callCount = 0;
  return jest.fn(async (_limit: number, _offset: number) => {
    const page = pages[callCount] ?? [];
    callCount++;
    return page;
  });
}

describe('createPagedLoader', () => {
  it('loads first page', async () => {
    const page1 = Array.from({ length: PAGE_SIZE }, (_, i) => makeCheckIn(i + 1, i));
    const fetcher = makePagedFetcher([page1]);
    const loader = createPagedLoader(fetcher);

    const result = await loader.loadFirst();

    expect(result.items).toHaveLength(PAGE_SIZE);
    expect(result.hasMore).toBe(true);
  });

  it('sets hasMore=false when fewer than PAGE_SIZE items returned', async () => {
    const page1 = Array.from({ length: 10 }, (_, i) => makeCheckIn(i + 1, i));
    const fetcher = makePagedFetcher([page1]);
    const loader = createPagedLoader(fetcher);

    const result = await loader.loadFirst();

    expect(result.items).toHaveLength(10);
    expect(result.hasMore).toBe(false);
  });

  it('loadNext appends items and increments offset', async () => {
    const page1 = Array.from({ length: PAGE_SIZE }, (_, i) => makeCheckIn(i + 1, i));
    const page2 = Array.from({ length: 15 }, (_, i) => makeCheckIn(i + PAGE_SIZE + 1, i + PAGE_SIZE));
    const fetcher = makePagedFetcher([page1, page2]);
    const loader = createPagedLoader(fetcher);

    await loader.loadFirst();
    const result = await loader.loadNext();

    expect(result.items).toHaveLength(PAGE_SIZE + 15);
    expect(result.hasMore).toBe(false);
  });

  it('loadNext does nothing when hasMore is false', async () => {
    const page1 = Array.from({ length: 10 }, (_, i) => makeCheckIn(i + 1, i));
    const fetcher = makePagedFetcher([page1]);
    const loader = createPagedLoader(fetcher);

    await loader.loadFirst();
    const result = await loader.loadNext();

    expect(result.items).toHaveLength(10);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('passes correct limit and offset to fetcher', async () => {
    const page1 = Array.from({ length: PAGE_SIZE }, (_, i) => makeCheckIn(i + 1, i));
    const page2 = Array.from({ length: PAGE_SIZE }, (_, i) => makeCheckIn(i + PAGE_SIZE + 1, i));
    const fetcher = makePagedFetcher([page1, page2]);
    const loader = createPagedLoader(fetcher);

    await loader.loadFirst();
    expect(fetcher).toHaveBeenCalledWith(PAGE_SIZE, 0);

    await loader.loadNext();
    expect(fetcher).toHaveBeenCalledWith(PAGE_SIZE, PAGE_SIZE);
  });

  it('reset clears state and reloads first page', async () => {
    const page1 = Array.from({ length: PAGE_SIZE }, (_, i) => makeCheckIn(i + 1, i));
    const freshPage = Array.from({ length: 5 }, (_, i) => makeCheckIn(i + 100, i));
    const fetcher = makePagedFetcher([page1, freshPage]);
    const loader = createPagedLoader(fetcher);

    await loader.loadFirst();
    const result = await loader.reset();

    expect(result.items).toHaveLength(5);
    expect(result.hasMore).toBe(false);
  });
});
