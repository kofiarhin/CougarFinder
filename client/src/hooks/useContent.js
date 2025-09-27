import { useMemo } from 'react';
import content from '../content.json';

const useContent = (section) => {
  return useMemo(() => content[section], [section]);
};

export default useContent;
