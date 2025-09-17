import { db } from '../server/db.ts';
import { users, portfolios } from '../shared/schema.ts';

async function initDemoData() {
  try {
    console.log('Initializing demo data...');

    // Create demo user
    const [user] = await db.insert(users).values({
      username: 'demo-user',
      password: 'demo',
      email: 'demo@example.com'
    }).returning();

    console.log('Created demo user:', user.id);

    // Create demo portfolio
    const [portfolio] = await db.insert(portfolios).values({
      userId: user.id,
      totalValue: '100000.00',
      cashBalance: '100000.00'
    }).returning();

    console.log('Created demo portfolio:', portfolio.id);
    console.log('Demo data initialization complete!');

  } catch (error) {
    console.error('Error initializing demo data:', error);
  } finally {
    process.exit(0);
  }
}

initDemoData();
