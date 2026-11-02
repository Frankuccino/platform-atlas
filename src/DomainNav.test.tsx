import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import DomainNav from './DomainNav';

describe('DomainNav', () => {
  it('renders the browse heading and domains', () => {
    render(
      <DomainNav
        onJumpDomain={() => {}}
        onSelectCategory={() => {}}
        onSelectDomain={() => {}}
      />,
    );
    expect(screen.getByText('Browse')).toBeInTheDocument();
    expect(screen.getByText('Foundation')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
  });

  it('renders category rows', () => {
    render(
      <DomainNav
        onJumpDomain={() => {}}
        onSelectCategory={() => {}}
        onSelectDomain={() => {}}
      />,
    );
    expect(screen.getByText('Cloud infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Databases and data stores')).toBeInTheDocument();
  });

  it('calls onSelectDomain when a domain head is clicked', () => {
    const onSelectDomain = vi.fn();
    render(
      <DomainNav
        onJumpDomain={() => {}}
        onSelectCategory={() => {}}
        onSelectDomain={onSelectDomain}
      />,
    );
    screen.getByText('Foundation').click();
    expect(onSelectDomain).toHaveBeenCalledWith('foundation');
  });

  it('calls onJumpDomain when the jump button is clicked', () => {
    const onJumpDomain = vi.fn();
    render(
      <DomainNav
        onJumpDomain={onJumpDomain}
        onSelectCategory={() => {}}
        onSelectDomain={() => {}}
      />,
    );
    screen.getByLabelText('Jump to Foundation').click();
    expect(onJumpDomain).toHaveBeenCalledWith('foundation');
  });

  it('calls onSelectCategory when a category is clicked', () => {
    const onSelectCategory = vi.fn();
    render(
      <DomainNav
        onJumpDomain={() => {}}
        onSelectCategory={onSelectCategory}
        onSelectDomain={() => {}}
      />,
    );
    screen.getByText('Cloud infrastructure').click();
    expect(onSelectCategory).toHaveBeenCalledWith('cloud');
  });
});
