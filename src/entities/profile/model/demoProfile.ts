import { isDemoMode, readDemoState, writeDemoState } from '../../../shared/demo';

export interface DemoProfile {
  name: string;
  grade: number;
  classNumber: number;
  studentNumber: number;
  major: string;
  email: string;
  userId: string;
  joinedAt: string;
  teamName: string;
  teamRole: string;
  photoDataUrl: string | null;
  github: string | null;
  discordConnected: boolean;
  cliDevices: Array<{ id: string; name: string; lastUsed: string }>;
  accountDeleted: boolean;
};

const seedProfile: DemoProfile = {
  name: '김지민',
  grade: 2,
  classNumber: 1,
  studentNumber: 7,
  major: '소프트웨어개발과',
  email: 'jimin@example.com',
  userId: 'user-8hq2m5v7c3kx',
  joinedAt: '2026-03-02',
  teamName: 'GSM Connect',
  teamRole: '팀장',
  photoDataUrl: null,
  github: '@gsm-jimin',
  discordConnected: false,
  cliDevices: [
    { id: 'device-macbook', name: 'MacBook-Air', lastUsed: '마지막 사용 2시간 전' },
    { id: 'device-lab', name: 'lab-pc-12', lastUsed: '마지막 사용 어제' },
  ],
  accountDeleted: false,
};

export function getDemoProfile(): DemoProfile | null {
  return isDemoMode() ? readDemoState('profile', seedProfile) : null;
}

export function saveDemoProfile(profile: DemoProfile): boolean {
  return isDemoMode() && writeDemoState('profile', profile);
}
