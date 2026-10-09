import { useEffect, useState } from 'react';
import { getMeta } from '../api/itemApi.js';

let cached = null;

/** Server capabilities from GET /meta (fetched once per page load). */
export default function useMeta() {
  const [meta, setMeta] = useState(cached);

  useEffect(() => {
    if (cached) return;
    getMeta()
      .then((data) => {
        cached = data;
        setMeta(data);
      })
      .catch(() => setMeta({ uploadsEnabled: false, allowedEmailDomains: [] }));
  }, []);

  return meta;
}
