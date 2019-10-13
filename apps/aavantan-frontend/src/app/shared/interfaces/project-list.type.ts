import { User } from '@aavantan-app/models';

export interface ProjectList {
    project: string;
    avatar: string;
    status: string;
    tasks: string;
    desc: string;
    progress: number;
    member: User[];
}
