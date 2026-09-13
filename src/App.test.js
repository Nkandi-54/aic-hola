import { render, screen } from '@testing-library/react';

jest.mock(
  'react-router-dom',
  () => ({
    Link: ({ to, children, ...props }) => {
      const React = require('react');
      return React.createElement('a', { href: to, ...props }, children);
    },
  }),
  { virtual: true }
);

const Home = require('./pages/Home').default;

test('renders the AIC Hola editorial welcome experience', () => {
  render(<Home />);
  expect(screen.getByRole('heading', { name: /where the bible speaks, grace abounds/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /watch services/i })).toHaveAttribute('href', '/live');
});
