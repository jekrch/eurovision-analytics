// export interface Song {
//     id: string;
//     name: string;
//     year: { year: number };
//     artist: { name: string };
//     finalPlace: { place: number };
//     totalPoints: number;
// }

export interface Song {
    id: string;
    name: string;
    youtubeUrl: string | null;
    finalPlace: {
        place: number;
    };
    country: {
        name: string;
    };
    year: {
        year: number;
    };
    artist: {
        name: string;
    };
    totalPoints?: number;
}