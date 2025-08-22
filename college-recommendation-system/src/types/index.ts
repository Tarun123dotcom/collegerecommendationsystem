export interface User {
    id: string;
    username: string;
    email: string;
    createdAt: Date;
}

export interface Query {
    id: string;
    userId: string;
    queryText: string;
    createdAt: Date;
}

export interface Recommendation {
    id: string;
    userId: string;
    criteria: string;
    recommendedColleges: string[];
    createdAt: Date;
}