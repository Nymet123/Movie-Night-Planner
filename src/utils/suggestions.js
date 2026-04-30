export function buildGenreProfile(watchHistory, movies) {
  const scores = {};

  for (const record of watchHistory) {
    const movie = movies[record.movieId?.toString()];
    if (!movie) continue;

    const ratings = Object.values(record.ratings || {}).filter(Boolean);
    const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 3;
    const weight = avg - 2.5;

    for (const g of movie.genres || []) {
      scores[g.id] = (scores[g.id] || 0) + weight;
    }
  }

  return Object.entries(scores)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({ id: parseInt(id), score }));
}

export function getWishlistGenreProfile(members, movies) {
  const scores = {};

  for (const member of members) {
    for (const movieId of member.wishlist || []) {
      const movie = movies[movieId];
      if (!movie) continue;
      for (const g of movie.genres || []) {
        scores[g.id] = (scores[g.id] || 0) + 1;
      }
    }
  }

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => parseInt(id));
}

export function getWatchedIds(watchHistory) {
  return new Set(watchHistory.map(r => r.movieId?.toString()));
}

export function getWishlistedIds(members) {
  const ids = new Set();
  members.forEach(m => m.wishlist?.forEach(id => ids.add(id)));
  return ids;
}

export function filterAndScore(candidates, watchedIds, wishlistedIds, genreProfile) {
  const topGenres = genreProfile.slice(0, 5).map(g => g.id);

  return candidates
    .filter(m => !watchedIds.has(m.id.toString()) && !wishlistedIds.has(m.id.toString()))
    .map(m => {
      let score = (m.vote_average || 0) * 10;
      const genres = (m.genres || []).map(g => g.id);
      genres.forEach(gid => {
        const idx = topGenres.indexOf(gid);
        if (idx === 0) score += 30;
        else if (idx === 1) score += 20;
        else if (idx === 2) score += 15;
        else if (idx === 3) score += 10;
        else if (idx === 4) score += 5;
      });
      return { ...m, _score: score };
    })
    .sort((a, b) => b._score - a._score);
}
