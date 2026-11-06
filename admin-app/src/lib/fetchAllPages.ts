type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

/** Fetches a complete result set in bounded pages, avoiding PostgREST's row cap. */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize = 500,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const result = await fetchPage(from, from + pageSize - 1);
    if (result.error) return { data: rows, error: result.error };

    const page = result.data || [];
    rows.push(...page);
    if (page.length < pageSize) return { data: rows, error: null };
  }
}
