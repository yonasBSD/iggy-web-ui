import { PUBLIC_API_KEY } from '$env/static/public';
import { streamMapper, type Stream } from '$lib/domain/Stream';
import { createQuery } from '@tanstack/svelte-query';

export function getStreamsQuery() {
  return createQuery({
    queryKey: ['streams'],
    queryFn: async () => {
      const res = await fetch(`${PUBLIC_API_KEY}/streams`);
      const data = await res.json();
      return data.map(streamMapper) as Stream[];
    }
  });
}