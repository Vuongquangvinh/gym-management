// import { useEffect, useState, useRef, useCallback } from 'react';
// import CheckinService from '../../../../firebase/lib/features/checkin/checkin.service.js';

// /**
//  * useCheckinsRealtime
//  * - subscribes to the latest `limit` checkins ordered by checkedAt desc
//  * - exposes items, loading, error and fetchMore() for pagination
//  */
// export default function useCheckinsRealtime({ limit = 50 } = {}) {
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const lastDocRef = useRef(null);
//   const unsubRef = useRef(null);

//   useEffect(() => {
//     setLoading(true);
//     unsubRef.current = CheckinService.subscribeRecentCheckins(limit, ({ docs, last }) => {
//       setItems(docs);
//       lastDocRef.current = last;
//       setLoading(false);
//     }, (err) => {
//       setError(err);
//       setLoading(false);
//     });

//     return () => {
//       if (unsubRef.current) unsubRef.current();
//     };
//   }, [limit]);

//   const fetchMore = useCallback(async () => {
//     if (!lastDocRef.current) return [];
//     try {
//       const { docs, last } = await CheckinService.fetchMoreCheckins(lastDocRef.current, limit);
//       if (docs.length) {
//         setItems(prev => [...prev, ...docs]);
//         lastDocRef.current = last;
//       }
//       return docs;
//     } catch (e) {
//       setError(e);
//       throw e;
//     }
//   }, [limit]);

//   return { items, loading, error, fetchMore };
// }
