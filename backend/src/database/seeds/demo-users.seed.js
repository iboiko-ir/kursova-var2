import { hashPassword } from '../../auth/password';

export const DEMO_USERS = [
  { username: 'admin', password: 'admin-demo-123', role: 'admin' },
  { username: 'operator', password: 'operator-demo-123', role: 'operator' },
];

export const demoUsersSeed = {
  name: 'demo-users',
  async run(manager) {
    for (const user of DEMO_USERS) {
      const passwordHash = await hashPassword(user.password);
      await manager.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
        [user.username, passwordHash, user.role],
      );
    }
  },
};
