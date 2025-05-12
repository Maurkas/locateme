import { useEffect, useState } from 'react';
import { getPersonalScore } from '../services/api/scoreService';

const usePersonalScore = (announcement, filters) => {
  const [additionalScore, setAdditionalScore] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchScore = async () => {
      if (!filters || !announcement?.coordinates || !announcement?.nearby_amenities) {
        return;
      }

      setLoading(true);
      try {
        const scoreData = await getPersonalScore({
          coordinates: announcement.coordinates,
          filters,
          infrastructure: announcement.nearby_amenities,
        });
        setAdditionalScore(scoreData);
      } catch (err) {
        console.error('Не удалось загрузить персональную оценку');
      } finally {
        setLoading(false);
      }
    };

    fetchScore();
  }, [announcement, filters]);

  return { additionalScore, loading };
};

export default usePersonalScore;