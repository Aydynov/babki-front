// Synthetic edge cases for refine-expense-entry-behavior; used only by local simulation.
const identity = '000000000000000000000001';
const otherId = '000000000000000000000002';
const id = (n) => String(n).padStart(24, '0');
module.exports = (scenario) => {
  const stamp = new Date().toISOString();
  const permissions = {
    manageAccounts: false, manageCategories: false, manageLimits: false, manageTransactions: false,
  };
  const restricted = scenario === 'restricted';
  const spaceId = id(10);
  const actor = {
    userId: identity, firstName: 'Анна', lastName: 'Тестовая', isAnonymized: false,
  };
  const otherActor = {
    userId: otherId, firstName: 'Мария', lastName: 'Участница', isAnonymized: false,
  };
  const account = {
    _id: id(20),
    spaceId,
    name: 'Проверочный счёт',
    currency: 'RUB',
    type: scenario === 'saving' ? 'saving' : 'balance',
    archivedAt: null,
    amount: 10000,
    initialAmount: 10000,
    openedAt: '2026-01-01',
    timeline: [],
  };
  const categories = [false, true].map((isArchived, index) => ({
    _id: id(30 + index),
    spaceId,
    name: isArchived ? 'Архивная категория' : 'Активная категория',
    isArchived,
    color: isArchived ? '#A855F7' : '#22C55E',
    createdAt: stamp,
    updatedAt: stamp,
  }));
  const historical = scenario === 'historical';
  const expense = {
    _id: id(40),
    spaceId,
    accountId: account._id,
    type: 'expense',
    amount: 400,
    currency: 'RUB',
    createdBy: restricted ? otherId : identity,
    createdByActor: restricted ? otherActor : actor,
    participantId: historical || scenario === 'other' ? otherId : identity,
    participantActor: historical ? { ...otherActor, lastName: 'Бывшая' }
      : scenario === 'other' ? otherActor : actor,
    category: scenario === 'archived' ? categories[1]._id : categories[0]._id,
    description: 'Проверочный расход',
    merchant: 'Тестовый магазин',
    transactionDate: stamp,
    items: Array.from({ length: 4 }, (_, index) => ({ name: `Позиция ${index + 1}`, quantity: 1, price: 100 })),
  };
  const members = [{
    ...actor, role: restricted ? 'member' : 'owner', joinedAt: stamp, permissions,
  }];
  if (scenario === 'other') {
    members.push({
      ...otherActor, role: 'member', joinedAt: stamp, permissions,
    });
  }
  return {
    next: 100,
    spaces: [{
      id: spaceId,
      name: `Проверка ${scenario}`,
      ownerId: restricted ? otherId : identity,
      role: restricted ? 'member' : 'owner',
      permissions,
      createdAt: stamp,
      updatedAt: stamp,
    }],
    records: {
      [spaceId]: {
        accounts: scenario === 'empty' ? [] : [account],
        'expense-categories': categories,
        expenses: ['saving', 'empty'].includes(scenario) ? [] : [expense],
        transactions: ['saving', 'empty'].includes(scenario) ? [] : [expense],
      },
    },
    requests: [],
    flags: { fixtureMembers: members },
  };
};
