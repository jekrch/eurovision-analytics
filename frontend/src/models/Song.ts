export interface Song {
    id: string;
    name: string;
    year: { year: number };
    artist: { name: string };
    finalPlace: { place: number };
    totalPoints: number;
}