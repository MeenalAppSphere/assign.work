import { getGreeting } from '../support/app.po';

describe('aavantan-frontend', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {
    getGreeting().contains('Welcome to aavantan-frontend!');
  });
});
