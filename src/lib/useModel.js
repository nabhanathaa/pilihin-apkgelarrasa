import { useEffect, useState } from 'react';
import { muatModel, infoModel } from './classifier';

/** Status model yang ikut berubah setelah pemuatan selesai. */
export function useModel() {
  const [m, setM] = useState(infoModel());
  useEffect(() => { let hidup = true; muatModel().then((x) => hidup && setM(x)); return () => { hidup = false; }; }, []);
  return m;
}
