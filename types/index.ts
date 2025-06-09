export interface Avatar {
    src: string;
}

export interface User {
    id: string;
    name: string;

    email: string;
    avatar?: Avatar;
    role?: 'Admin' | 'Editor' | 'User';
    status?: 'active' | 'inactive' | 'pending';
} 