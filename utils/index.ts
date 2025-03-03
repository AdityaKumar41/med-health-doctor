export const avarageRating = (ratings: number[]): number => {
    if (!ratings || ratings.length === 0) {
        return 0;
    }
    const total = ratings.reduce((acc, curr) => acc + curr, 0);
    return total / ratings.length;
}