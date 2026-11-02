import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import CategoryPanel from './CategoryPanel';

describe('CategoryPanel', () => {
  it('renders category name and blurb', () => {
    render(
      <CategoryPanel
        categoryId="cloud"
        onSelect={() => {}}
        onJump={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Cloud');
    expect(screen.getByText(/virtual machines/i)).toBeInTheDocument();
  });

  it('renders product rows', () => {
    render(
      <CategoryPanel
        categoryId="cloud"
        onSelect={() => {}}
        onJump={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('AWS')).toBeInTheDocument();
    expect(screen.getByText('Google Cloud')).toBeInTheDocument();
  });

  it('calls onClose when Close is clicked', () => {
    const onClose = vi.fn();
    render(
      <CategoryPanel
        categoryId="cloud"
        onSelect={() => {}}
        onJump={() => {}}
        onClose={onClose}
      />,
    );
    screen.getByRole('button', { name: /Close/i }).click();
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onJump with domain id when domain jump is clicked', () => {
    const onJump = vi.fn();
    render(
      <CategoryPanel
        categoryId="cloud"
        onSelect={() => {}}
        onJump={onJump}
        onClose={() => {}}
      />,
    );
    screen.getByRole('button', { name: 'Foundation' }).click();
    expect(onJump).toHaveBeenCalledWith('foundation');
  });
});
